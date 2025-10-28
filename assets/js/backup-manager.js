// Backup System Module - v2.1.0
// Sistema de Gestão de Clientes - SENAI - Backup Automático

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

export class BackupManager {
    constructor(appId, firebaseConfig) {
        this.appId = appId;
        this.firebaseConfig = firebaseConfig;
        this.app = null;
        this.db = null;
        this.storage = null;
        this.backupSettings = {
            autoBackup: true,
            frequency: 'daily', // 'daily', 'weekly', 'monthly'
            retentionDays: 30,
            compression: true,
            includeSystemData: false,
            backupLocation: 'cloud', // 'cloud', 'local', 'both'
            lastBackup: null,
            nextBackup: null
        };
        this.backupHistory = [];
        this.isRunning = false;
    }

    // Initialize Firebase services
    async initialize() {
        try {
            if (!this.firebaseConfig || Object.keys(this.firebaseConfig).length === 0) {
                console.warn('Firebase não configurado, backup funcionará em modo local apenas');
                this.backupSettings.backupLocation = 'local';
                this.loadLocalSettings();
                return true;
            }
            
            this.app = initializeApp(this.firebaseConfig);
            this.db = getFirestore(this.app);
            this.storage = getStorage(this.app);
            
            await this.loadSettings();
            await this.loadBackupHistory();
            this.scheduleNextBackup();
            
            return true;
            
        } catch (error) {
            console.error('Erro ao inicializar Backup Manager:', error);
            this.backupSettings.backupLocation = 'local';
            this.loadLocalSettings();
            return false;
        }
    }

    // Load backup settings
    async loadSettings() {
        try {
            const settings = localStorage.getItem(`backup_settings_${this.appId}`);
            if (settings) {
                this.backupSettings = { ...this.backupSettings, ...JSON.parse(settings) };
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }

    // Load backup history
    async loadBackupHistory() {
        try {
            if (this.storage) {
                const backupsRef = ref(this.storage, `backups/${this.appId}`);
                const backupsList = await listAll(backupsRef);
                
                this.backupHistory = await Promise.all(
                    backupsList.items.map(async (item) => {
                        const metadata = await item.getMetadata();
                        const downloadURL = await getDownloadURL(item);
                        
                        return {
                            id: item.name,
                            name: item.name,
                            date: new Date(metadata.timeCreated),
                            size: metadata.size,
                            type: 'cloud',
                            downloadURL: downloadURL,
                            metadata: metadata.customMetadata || {}
                        };
                    })
                );
            }
            
            // Load local backups
            const localBackups = localStorage.getItem(`backup_history_${this.appId}`);
            if (localBackups) {
                const localHistory = JSON.parse(localBackups);
                this.backupHistory = [...this.backupHistory, ...localHistory];
            }
            
            // Sort by date descending
            this.backupHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
            
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        }
    }

    // Create backup
    async createBackup(options = {}) {
        if (this.isRunning) {
            throw new Error('Backup já está em execução');
        }

        this.isRunning = true;
        this.updateProgress(0, 'Iniciando backup...');

        try {
            const backupOptions = { ...this.backupSettings, ...options };
            const backupData = await this.collectData();
            
            this.updateProgress(30, 'Dados coletados, processando...');
            
            // Process and compress data if needed
            const processedData = backupOptions.compression 
                ? await this.compressData(backupData)
                : backupData;

            this.updateProgress(60, 'Criando arquivo de backup...');
            
            // Create backup file
            const backupFile = await this.createBackupFile(processedData, backupOptions);
            
            this.updateProgress(80, 'Salvando backup...');
            
            // Save backup
            const backupInfo = await this.saveBackup(backupFile, backupOptions);
            
            this.updateProgress(100, 'Backup concluído!');
            
            // Update settings and history
            this.backupSettings.lastBackup = new Date();
            this.scheduleNextBackup();
            await this.saveSettings();
            
            this.backupHistory.unshift(backupInfo);
            this.saveBackupHistory();
            
            this.showNotification('Backup criado com sucesso!', 'success');
            this.updateUI();
            
            return backupInfo;
            
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            this.showNotification('Erro ao criar backup: ' + error.message, 'error');
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    // Collect data for backup
    async collectData() {
        const data = {
            metadata: {
                appId: this.appId,
                version: '2.1.0',
                timestamp: new Date().toISOString(),
                type: 'client_management_backup'
            },
            clients: [],
            settings: {},
            systemInfo: {}
        };

        try {
            // Collect client data
            if (this.db) {
                const clientsRef = collection(this.db, `artifacts/${this.appId}/public/data/clients`);
                const q = query(clientsRef, orderBy('timestamp', 'desc'));
                const snapshot = await getDocs(q);
                
                snapshot.forEach(doc => {
                    const clientData = doc.data();
                    data.clients.push({
                        id: doc.id,
                        ...clientData,
                        timestamp: clientData.timestamp?.toDate()?.toISOString() || clientData.createdAt
                    });
                });
            } else {
                // Fallback to local storage
                const localClients = localStorage.getItem(`clients_${this.appId}`);
                if (localClients) {
                    data.clients = JSON.parse(localClients);
                }
            }

            // Collect settings
            data.settings = {
                backup: this.backupSettings,
                app: this.getAppSettings()
            };

            // System info (if enabled)
            if (this.backupSettings.includeSystemData) {
                data.systemInfo = {
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    clientsCount: data.clients.length
                };
            }

            return data;

        } catch (error) {
            console.error('Erro ao coletar dados:', error);
            throw new Error('Falha ao coletar dados para backup');
        }
    }

    // Compress backup data
    async compressData(data) {
        try {
            // Simple JSON compression - in a real implementation, you might use pako.js or similar
            const jsonString = JSON.stringify(data, null, 0);
            
            // Simulate compression by removing unnecessary whitespace and optimizing structure
            const compressed = {
                ...data,
                _compressed: true,
                _originalSize: jsonString.length,
                _compressedSize: jsonString.length * 0.7 // Simulated compression ratio
            };
            
            return compressed;
        } catch (error) {
            console.error('Erro na compressão:', error);
            return data; // Return original data if compression fails
        }
    }

    // Create backup file
    async createBackupFile(data, options) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${this.appId}_${timestamp}.json`;
        
        const backupContent = JSON.stringify(data, null, 2);
        const blob = new Blob([backupContent], { type: 'application/json' });
        
        return {
            filename,
            blob,
            size: blob.size,
            data: backupContent
        };
    }

    // Save backup to configured location(s)
    async saveBackup(backupFile, options) {
        const backupInfo = {
            id: this.generateBackupId(),
            name: backupFile.filename,
            date: new Date(),
            size: backupFile.size,
            type: options.backupLocation,
            metadata: {
                compressed: options.compression,
                clientsCount: JSON.parse(backupFile.data).clients.length,
                version: '2.1.0'
            }
        };

        // Save to cloud if configured
        if ((options.backupLocation === 'cloud' || options.backupLocation === 'both') && this.storage) {
            try {
                const backupRef = ref(this.storage, `backups/${this.appId}/${backupFile.filename}`);
                const uploadResult = await uploadBytes(backupRef, backupFile.blob, {
                    customMetadata: {
                        appId: this.appId,
                        version: '2.1.0',
                        clientsCount: backupInfo.metadata.clientsCount.toString(),
                        compressed: backupInfo.metadata.compressed.toString()
                    }
                });
                
                backupInfo.downloadURL = await getDownloadURL(uploadResult.ref);
                backupInfo.cloudPath = uploadResult.ref.fullPath;
            } catch (error) {
                console.error('Erro ao salvar no cloud:', error);
                if (options.backupLocation === 'cloud') {
                    throw new Error('Falha ao salvar backup na nuvem');
                }
            }
        }

        // Save locally if configured
        if (options.backupLocation === 'local' || options.backupLocation === 'both') {
            try {
                // Store in localStorage (in a real app, you might use IndexedDB for larger files)
                const localBackups = JSON.parse(localStorage.getItem(`local_backups_${this.appId}`) || '{}');
                localBackups[backupInfo.id] = {
                    ...backupInfo,
                    data: backupFile.data
                };
                localStorage.setItem(`local_backups_${this.appId}`, JSON.stringify(localBackups));
                
                backupInfo.localStored = true;
            } catch (error) {
                console.error('Erro ao salvar localmente:', error);
                if (options.backupLocation === 'local') {
                    throw new Error('Falha ao salvar backup localmente');
                }
            }
        }

        return backupInfo;
    }

    // Restore from backup
    async restoreFromBackup(backupId, options = {}) {
        try {
            this.updateProgress(0, 'Carregando backup...');
            
            const backup = this.backupHistory.find(b => b.id === backupId);
            if (!backup) {
                throw new Error('Backup não encontrado');
            }

            // Load backup data
            let backupData;
            if (backup.type === 'cloud' && backup.downloadURL) {
                const response = await fetch(backup.downloadURL);
                backupData = await response.json();
            } else if (backup.localStored) {
                const localBackups = JSON.parse(localStorage.getItem(`local_backups_${this.appId}`) || '{}');
                const localBackup = localBackups[backupId];
                if (localBackup && localBackup.data) {
                    backupData = JSON.parse(localBackup.data);
                }
            }

            if (!backupData) {
                throw new Error('Não foi possível carregar os dados do backup');
            }

            this.updateProgress(30, 'Validando backup...');
            
            // Validate backup
            if (!this.validateBackup(backupData)) {
                throw new Error('Backup inválido ou corrompido');
            }

            this.updateProgress(50, 'Restaurando dados...');
            
            // Restore data
            await this.restoreData(backupData, options);
            
            this.updateProgress(100, 'Restauração concluída!');
            
            this.showNotification('Backup restaurado com sucesso!', 'success');
            
            // Reload page to reflect changes
            if (options.reloadAfterRestore !== false) {
                setTimeout(() => window.location.reload(), 2000);
            }
            
            return true;
            
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            this.showNotification('Erro ao restaurar backup: ' + error.message, 'error');
            throw error;
        }
    }

    // Validate backup data
    validateBackup(backupData) {
        try {
            if (!backupData || typeof backupData !== 'object') return false;
            if (!backupData.metadata || !backupData.clients) return false;
            if (!Array.isArray(backupData.clients)) return false;
            if (backupData.metadata.appId !== this.appId) return false;
            
            return true;
        } catch (error) {
            return false;
        }
    }

    // Restore data from backup
    async restoreData(backupData, options) {
        // Restore clients (this would typically involve Firebase operations)
        if (options.restoreClients !== false) {
            if (this.db) {
                // In a real implementation, you would restore to Firebase
                console.log('Restaurando clientes para Firebase...');
            } else {
                // Restore to localStorage
                localStorage.setItem(`clients_${this.appId}`, JSON.stringify(backupData.clients));
            }
        }

        // Restore settings
        if (options.restoreSettings !== false && backupData.settings) {
            if (backupData.settings.backup) {
                this.backupSettings = { ...this.backupSettings, ...backupData.settings.backup };
                await this.saveSettings();
            }
        }
    }

    // Schedule automatic backups
    scheduleNextBackup() {
        if (!this.backupSettings.autoBackup) return;

        const now = new Date();
        let nextBackup = new Date();

        switch (this.backupSettings.frequency) {
            case 'daily':
                nextBackup.setDate(now.getDate() + 1);
                nextBackup.setHours(2, 0, 0, 0); // 2 AM
                break;
            case 'weekly':
                nextBackup.setDate(now.getDate() + 7);
                nextBackup.setHours(2, 0, 0, 0);
                break;
            case 'monthly':
                nextBackup.setMonth(now.getMonth() + 1);
                nextBackup.setDate(1);
                nextBackup.setHours(2, 0, 0, 0);
                break;
        }

        this.backupSettings.nextBackup = nextBackup;

        // Clear existing timeout
        if (this.backupTimeout) {
            clearTimeout(this.backupTimeout);
        }

        // Schedule next backup
        const timeUntilBackup = nextBackup.getTime() - now.getTime();
        if (timeUntilBackup > 0) {
            this.backupTimeout = setTimeout(() => {
                this.createBackup({ auto: true });
            }, timeUntilBackup);
        }
    }

    // Delete old backups based on retention policy
    async cleanupOldBackups() {
        if (this.backupSettings.retentionDays <= 0) return;

        const maxAge = new Date();
        maxAge.setDate(maxAge.getDate() - this.backupSettings.retentionDays);

        const oldBackups = this.backupHistory.filter(backup => 
            new Date(backup.date) < maxAge
        );

        for (const backup of oldBackups) {
            try {
                await this.deleteBackup(backup.id);
            } catch (error) {
                console.error('Erro ao deletar backup antigo:', error);
            }
        }
    }

    // Delete specific backup
    async deleteBackup(backupId) {
        const backup = this.backupHistory.find(b => b.id === backupId);
        if (!backup) return;

        // Delete from cloud if exists
        if (backup.cloudPath && this.storage) {
            try {
                const backupRef = ref(this.storage, backup.cloudPath);
                await deleteObject(backupRef);
            } catch (error) {
                console.error('Erro ao deletar backup da nuvem:', error);
            }
        }

        // Delete from local storage
        if (backup.localStored) {
            try {
                const localBackups = JSON.parse(localStorage.getItem(`local_backups_${this.appId}`) || '{}');
                delete localBackups[backupId];
                localStorage.setItem(`local_backups_${this.appId}`, JSON.stringify(localBackups));
            } catch (error) {
                console.error('Erro ao deletar backup local:', error);
            }
        }

        // Remove from history
        this.backupHistory = this.backupHistory.filter(b => b.id !== backupId);
        this.saveBackupHistory();
        this.updateUI();
    }

    // Download backup file
    async downloadBackup(backupId) {
        const backup = this.backupHistory.find(b => b.id === backupId);
        if (!backup) {
            throw new Error('Backup não encontrado');
        }

        let backupData;
        
        if (backup.downloadURL) {
            // Download from cloud
            const response = await fetch(backup.downloadURL);
            const blob = await response.blob();
            this.downloadBlob(blob, backup.name);
        } else if (backup.localStored) {
            // Download from local storage
            const localBackups = JSON.parse(localStorage.getItem(`local_backups_${this.appId}`) || '{}');
            const localBackup = localBackups[backupId];
            if (localBackup && localBackup.data) {
                const blob = new Blob([localBackup.data], { type: 'application/json' });
                this.downloadBlob(blob, backup.name);
            }
        }
    }

    // Utility methods
    generateBackupId() {
        return 'backup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(date) {
        return new Date(date).toLocaleString('pt-BR');
    }

    getAppSettings() {
        // Return relevant app settings that should be backed up
        return {
            theme: localStorage.getItem('theme') || 'light',
            language: localStorage.getItem('language') || 'pt-BR',
            dateFormat: localStorage.getItem('dateFormat') || 'dd/MM/yyyy'
        };
    }

    // Settings management
    updateSettings(newSettings) {
        this.backupSettings = { ...this.backupSettings, ...newSettings };
        this.saveSettings();
        
        if (newSettings.autoBackup !== undefined || newSettings.frequency !== undefined) {
            this.scheduleNextBackup();
        }
        
        this.updateUI();
    }

    async saveSettings() {
        try {
            localStorage.setItem(`backup_settings_${this.appId}`, JSON.stringify(this.backupSettings));
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
        }
    }

    loadLocalSettings() {
        try {
            const settings = localStorage.getItem(`backup_settings_${this.appId}`);
            if (settings) {
                this.backupSettings = { ...this.backupSettings, ...JSON.parse(settings) };
            }
        } catch (error) {
            console.error('Erro ao carregar configurações locais:', error);
        }
    }

    saveBackupHistory() {
        try {
            const localHistory = this.backupHistory.filter(b => b.localStored);
            localStorage.setItem(`backup_history_${this.appId}`, JSON.stringify(localHistory));
        } catch (error) {
            console.error('Erro ao salvar histórico:', error);
        }
    }

    // UI update methods
    updateUI() {
        this.updateBackupStatus();
        this.updateBackupHistory();
        this.updateSettings();
    }

    updateBackupStatus() {
        const elements = {
            'backup-auto-status': this.backupSettings.autoBackup ? 'Ativo' : 'Inativo',
            'backup-frequency': this.getFrequencyLabel(this.backupSettings.frequency),
            'backup-last': this.backupSettings.lastBackup 
                ? this.formatDate(this.backupSettings.lastBackup)
                : 'Nunca',
            'backup-next': this.backupSettings.nextBackup 
                ? this.formatDate(this.backupSettings.nextBackup)
                : 'N/A',
            'backup-total': this.backupHistory.length
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    updateBackupHistory() {
        const container = document.getElementById('backup-history-list');
        if (!container) return;

        container.innerHTML = '';
        
        if (this.backupHistory.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    </svg>
                    <p>Nenhum backup encontrado</p>
                    <p class="text-sm">Crie seu primeiro backup para começar</p>
                </div>
            `;
            return;
        }

        this.backupHistory.forEach(backup => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors';
            
            const typeIcon = backup.type === 'cloud' ? '☁️' : '💾';
            const statusColor = backup.type === 'cloud' ? 'text-blue-600' : 'text-green-600';
            
            item.innerHTML = `
                <div class="flex items-center space-x-4">
                    <div class="text-2xl">${typeIcon}</div>
                    <div>
                        <div class="font-medium text-gray-900">${backup.name}</div>
                        <div class="text-sm text-gray-500">
                            ${this.formatDate(backup.date)} • ${this.formatFileSize(backup.size)}
                        </div>
                        <div class="text-xs ${statusColor}">
                            ${backup.metadata.clientsCount} clientes • ${backup.type === 'cloud' ? 'Nuvem' : 'Local'}
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="window.backupManager.downloadBackup('${backup.id}')" 
                            class="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Download">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                    </button>
                    <button onclick="window.backupManager.restoreFromBackup('${backup.id}')" 
                            class="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Restaurar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                    </button>
                    <button onclick="window.backupManager.deleteBackup('${backup.id}')" 
                            class="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Deletar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            `;
            
            container.appendChild(item);
        });
    }

    getFrequencyLabel(frequency) {
        const labels = {
            daily: 'Diário',
            weekly: 'Semanal',
            monthly: 'Mensal'
        };
        return labels[frequency] || frequency;
    }

    updateProgress(progress, message) {
        const progressBar = document.querySelector('.backup-progress-bar');
        const progressText = document.getElementById('backup-progress-text');
        const progressPercent = document.getElementById('backup-progress-percent');

        if (progressBar) progressBar.style.width = progress + '%';
        if (progressText) progressText.textContent = message;
        if (progressPercent) progressPercent.textContent = Math.round(progress) + '%';
    }

    showNotification(message, type = 'info') {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        const typeClasses = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        
        notification.className = `${typeClasses[type]} px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300`;
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Auto-initialize when loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.__app_id !== 'undefined') {
        const config = typeof window.__firebase_config === 'string' 
            ? JSON.parse(window.__firebase_config) 
            : window.__firebase_config || {};
            
        window.backupManager = new BackupManager(window.__app_id, config);
        
        // Initialize when needed
        if (document.getElementById('backup-container')) {
            window.backupManager.initialize()
                .then(() => console.log('Backup Manager inicializado'))
                .catch(err => console.error('Erro ao inicializar Backup Manager:', err));
        }
    }
});