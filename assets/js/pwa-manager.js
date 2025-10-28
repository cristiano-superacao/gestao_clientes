// PWA Manager - Service Worker Integration
// Sistema de Gestão de Clientes - SENAI v2.2.0

class PWAManager {
    constructor() {
        this.isInstalled = false;
        this.isOnline = navigator.onLine;
        this.deferredPrompt = null;
        this.swRegistration = null;
        this.notificationPermission = 'default';
        this.offlineQueue = [];
        this.syncInProgress = false;
        
        this.init();
    }
    
    async init() {
        console.log('🚀 PWA Manager iniciando...');
        
        // Register service worker
        await this.registerServiceWorker();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check installation status
        this.checkInstallationStatus();
        
        // Setup offline/online handlers
        this.setupNetworkHandlers();
        
        // Initialize background sync
        this.initializeBackgroundSync();
        
        // Setup periodic sync
        this.setupPeriodicSync();
        
        // Check for updates
        this.checkForUpdates();
        
        console.log('✅ PWA Manager inicializado com sucesso');
    }
    
    // Service Worker Registration
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                
                console.log('✅ Service Worker registrado:', this.swRegistration.scope);
                
                // Handle updates
                this.swRegistration.addEventListener('updatefound', () => {
                    console.log('🔄 Nova versão do Service Worker encontrada');
                    this.handleServiceWorkerUpdate();
                });
                
                // Listen for messages from SW
                navigator.serviceWorker.addEventListener('message', event => {
                    this.handleServiceWorkerMessage(event);
                });
                
                return this.swRegistration;
                
            } catch (error) {
                console.error('❌ Falha ao registrar Service Worker:', error);
                throw error;
            }
        } else {
            console.warn('⚠️ Service Worker não suportado neste navegador');
            return null;
        }
    }
    
    // Setup Event Listeners
    setupEventListeners() {
        // Install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 Prompt de instalação disponível');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
        
        // App installed
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA instalado com sucesso');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showWelcomeMessage();
        });
        
        // Visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
                this.syncOfflineData();
            }
        });
        
        // Page load
        window.addEventListener('load', () => {
            this.requestNotificationPermission();
        });
    }
    
    // Network Handlers
    setupNetworkHandlers() {
        window.addEventListener('online', () => {
            console.log('🌐 Conexão restaurada');
            this.isOnline = true;
            this.updateNetworkStatus(true);
            this.syncOfflineData();
            this.showNotification('Conexão Restaurada', {
                body: 'Você está online novamente. Sincronizando dados...',
                tag: 'network-status'
            });
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 Conexão perdida - modo offline');
            this.isOnline = false;
            this.updateNetworkStatus(false);
            this.showNotification('Modo Offline', {
                body: 'Você está offline. Os dados serão sincronizados quando a conexão for restaurada.',
                tag: 'network-status'
            });
        });
    }
    
    // Install PWA
    async installPWA() {
        if (!this.deferredPrompt) {
            console.warn('⚠️ Prompt de instalação não disponível');
            return false;
        }
        
        try {
            // Show install prompt
            this.deferredPrompt.prompt();
            
            // Wait for user response
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('✅ Usuário aceitou a instalação');
                this.isInstalled = true;
            } else {
                console.log('❌ Usuário recusou a instalação');
            }
            
            this.deferredPrompt = null;
            return outcome === 'accepted';
            
        } catch (error) {
            console.error('❌ Erro durante instalação:', error);
            return false;
        }
    }
    
    // Show/Hide Install Button
    showInstallButton() {
        const installBtn = document.getElementById('install-pwa-btn');
        if (installBtn) {
            installBtn.style.display = 'block';
            installBtn.onclick = () => this.installPWA();
        } else {
            // Create install button if it doesn't exist
            this.createInstallButton();
        }
    }
    
    hideInstallButton() {
        const installBtn = document.getElementById('install-pwa-btn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }
    
    createInstallButton() {
        const button = document.createElement('button');
        button.id = 'install-pwa-btn';
        button.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50';
        button.innerHTML = '📱 Instalar App';
        button.onclick = () => this.installPWA();
        
        document.body.appendChild(button);
    }
    
    // Check Installation Status
    checkInstallationStatus() {
        // Check if running as PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isInWebAppiOS = window.navigator.standalone === true;
        
        this.isInstalled = isStandalone || isInWebAppiOS;
        
        if (this.isInstalled) {
            console.log('✅ PWA já está instalado');
            this.hideInstallButton();
        }
        
        return this.isInstalled;
    }
    
    // Network Status UI
    updateNetworkStatus(isOnline) {
        const statusElement = document.getElementById('network-status');
        
        if (!statusElement) {
            this.createNetworkStatusElement();
            return;
        }
        
        if (isOnline) {
            statusElement.className = 'fixed top-4 right-4 bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm z-50 opacity-0 transition-opacity';
            statusElement.textContent = '🌐 Online';
            
            // Show temporarily
            statusElement.style.opacity = '1';
            setTimeout(() => {
                statusElement.style.opacity = '0';
            }, 3000);
        } else {
            statusElement.className = 'fixed top-4 right-4 bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm z-50 opacity-100 transition-opacity';
            statusElement.textContent = '📴 Offline';
        }
    }
    
    createNetworkStatusElement() {
        const element = document.createElement('div');
        element.id = 'network-status';
        element.className = 'fixed top-4 right-4 px-3 py-1 rounded-lg text-sm z-50 opacity-0 transition-opacity';
        document.body.appendChild(element);
        
        this.updateNetworkStatus(this.isOnline);
    }
    
    // Notification Management
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
            
            console.log('🔔 Permissão de notificação:', permission);
            
            if (permission === 'granted') {
                await this.setupPushNotifications();
            }
            
            return permission;
        }
        
        return 'denied';
    }
    
    async setupPushNotifications() {
        if (!this.swRegistration) {
            console.warn('⚠️ Service Worker não registrado para push notifications');
            return;
        }
        
        try {
            // Check if already subscribed
            let subscription = await this.swRegistration.pushManager.getSubscription();
            
            if (!subscription) {
                // Subscribe to push notifications
                subscription = await this.swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(
                        'YOUR_VAPID_PUBLIC_KEY' // Replace with actual VAPID key
                    )
                });
                
                console.log('✅ Inscrito em push notifications');
                
                // Send subscription to server
                await this.sendSubscriptionToServer(subscription);
            }
            
            return subscription;
            
        } catch (error) {
            console.error('❌ Erro ao configurar push notifications:', error);
        }
    }
    
    async sendSubscriptionToServer(subscription) {
        try {
            // In a real app, send this to your server
            console.log('📤 Enviando subscription para servidor:', subscription);
            
            // Store locally for now
            localStorage.setItem('push_subscription', JSON.stringify(subscription));
            
        } catch (error) {
            console.error('❌ Erro ao enviar subscription:', error);
        }
    }
    
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    }
    
    // Show notification
    async showNotification(title, options = {}) {
        if (this.notificationPermission !== 'granted') {
            return;
        }
        
        const defaultOptions = {
            icon: '/assets/images/icon-192.png',
            badge: '/assets/images/icon-192.png',
            tag: 'default',
            requireInteraction: false
        };
        
        const notificationOptions = { ...defaultOptions, ...options };
        
        if (this.swRegistration) {
            return this.swRegistration.showNotification(title, notificationOptions);
        } else {
            return new Notification(title, notificationOptions);
        }
    }
    
    // Background Sync
    initializeBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            console.log('✅ Background Sync disponível');
            
            // Register sync events
            this.registerBackgroundSync('client-sync');
            this.registerBackgroundSync('backup-sync');
        } else {
            console.warn('⚠️ Background Sync não suportado');
        }
    }
    
    async registerBackgroundSync(tag) {
        try {
            if (this.swRegistration) {
                await this.swRegistration.sync.register(tag);
                console.log(`✅ Background sync registrado: ${tag}`);
            }
        } catch (error) {
            console.error(`❌ Erro ao registrar sync ${tag}:`, error);
        }
    }
    
    // Periodic Sync
    setupPeriodicSync() {
        if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then(registration => {
                return registration.periodicSync.register('backup-check', {
                    minInterval: 24 * 60 * 60 * 1000 // 24 hours
                });
            }).then(() => {
                console.log('✅ Periodic sync registrado');
            }).catch(error => {
                console.error('❌ Erro no periodic sync:', error);
            });
        }
    }
    
    // Offline Data Management
    addToOfflineQueue(action, data) {
        const queueItem = {
            id: Date.now(),
            action: action,
            data: data,
            timestamp: new Date().toISOString()
        };
        
        this.offlineQueue.push(queueItem);
        localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
        
        console.log('📝 Ação adicionada à fila offline:', action);
        
        // Try to sync if online
        if (this.isOnline) {
            this.syncOfflineData();
        }
    }
    
    async syncOfflineData() {
        if (this.syncInProgress || !this.isOnline) {
            return;
        }
        
        this.syncInProgress = true;
        
        try {
            // Load offline queue
            const queueData = localStorage.getItem('offline_queue');
            if (queueData) {
                this.offlineQueue = JSON.parse(queueData);
            }
            
            if (this.offlineQueue.length === 0) {
                this.syncInProgress = false;
                return;
            }
            
            console.log(`🔄 Sincronizando ${this.offlineQueue.length} itens offline...`);
            
            const processedItems = [];
            
            for (const item of this.offlineQueue) {
                try {
                    await this.processOfflineItem(item);
                    processedItems.push(item.id);
                    console.log('✅ Item sincronizado:', item.action);
                } catch (error) {
                    console.error('❌ Erro ao sincronizar item:', error);
                }
            }
            
            // Remove processed items
            this.offlineQueue = this.offlineQueue.filter(
                item => !processedItems.includes(item.id)
            );
            
            localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
            
            if (processedItems.length > 0) {
                this.showNotification('Sincronização Concluída', {
                    body: `${processedItems.length} itens foram sincronizados com sucesso.`,
                    tag: 'sync-complete'
                });
            }
            
        } catch (error) {
            console.error('❌ Erro na sincronização offline:', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    async processOfflineItem(item) {
        const { action, data } = item;
        
        switch (action) {
            case 'create-client':
                // Process client creation
                if (window.clientManager) {
                    await window.clientManager.addClient(data);
                }
                break;
                
            case 'update-client':
                // Process client update
                if (window.clientManager) {
                    await window.clientManager.updateClient(data.id, data);
                }
                break;
                
            case 'delete-client':
                // Process client deletion
                if (window.clientManager) {
                    await window.clientManager.deleteClient(data.id);
                }
                break;
                
            case 'create-backup':
                // Process backup creation
                if (window.backupManager) {
                    await window.backupManager.createBackup(data);
                }
                break;
                
            default:
                console.warn('⚠️ Ação offline desconhecida:', action);
        }
    }
    
    // Service Worker Updates
    handleServiceWorkerUpdate() {
        const newWorker = this.swRegistration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 Nova versão disponível');
                this.showUpdateAvailable();
            }
        });
    }
    
    showUpdateAvailable() {
        const updateBanner = document.createElement('div');
        updateBanner.id = 'update-banner';
        updateBanner.className = 'fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 text-center z-50';
        updateBanner.innerHTML = `
            <div class="flex items-center justify-between max-w-4xl mx-auto">
                <span>🔄 Nova versão disponível!</span>
                <div>
                    <button onclick="pwaManager.updateApp()" class="bg-white text-blue-600 px-4 py-1 rounded mr-2 hover:bg-gray-100">
                        Atualizar
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
                        ✕
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertBefore(updateBanner, document.body.firstChild);
    }
    
    async updateApp() {
        if (this.swRegistration && this.swRegistration.waiting) {
            // Tell SW to skip waiting
            this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            // Reload the page
            window.location.reload();
        }
    }
    
    async checkForUpdates() {
        if (this.swRegistration) {
            try {
                await this.swRegistration.update();
            } catch (error) {
                console.error('❌ Erro ao verificar atualizações:', error);
            }
        }
    }
    
    // Handle Service Worker Messages
    handleServiceWorkerMessage(event) {
        const { type, data } = event.data;
        
        console.log('📨 Mensagem do Service Worker:', type, data);
        
        switch (type) {
            case 'SW_ACTIVATED':
                console.log('✅ Service Worker ativado:', data.version);
                break;
                
            case 'SYNC_COMPLETE':
                console.log('✅ Sincronização completa:', data);
                this.showNotification('Sincronização Completa', {
                    body: `Dados de ${data} sincronizados com sucesso.`,
                    tag: 'sync-complete'
                });
                break;
                
            case 'NOTIFICATION_CLICKED':
                console.log('🔔 Notificação clicada:', data);
                this.handleNotificationClick(data);
                break;
                
            default:
                console.log('📨 Mensagem SW não tratada:', type, data);
        }
    }
    
    handleNotificationClick(data) {
        const { action, url } = data;
        
        switch (action) {
            case 'backup-now':
                if (window.location.pathname !== '/backup-complete.html') {
                    window.location.href = '/backup-complete.html';
                }
                break;
                
            case 'view-dashboard':
                if (window.location.pathname !== '/dashboard-complete.html') {
                    window.location.href = '/dashboard-complete.html';
                }
                break;
                
            default:
                if (url && window.location.pathname !== url) {
                    window.location.href = url;
                }
        }
    }
    
    // Welcome Message
    showWelcomeMessage() {
        this.showNotification('Bem-vindo ao App!', {
            body: 'O Sistema de Gestão de Clientes foi instalado com sucesso. Agora você pode usar offline!',
            tag: 'welcome',
            requireInteraction: true,
            actions: [
                { action: 'view-dashboard', title: 'Ver Dashboard' },
                { action: 'dismiss', title: 'OK' }
            ]
        });
    }
    
    // Utility Methods
    isOnlineStatus() {
        return this.isOnline;
    }
    
    isInstallationReady() {
        return this.deferredPrompt !== null;
    }
    
    getServiceWorkerRegistration() {
        return this.swRegistration;
    }
    
    getNotificationPermission() {
        return this.notificationPermission;
    }
    
    getOfflineQueueLength() {
        return this.offlineQueue.length;
    }
    
    // Clear all caches
    async clearAllCaches() {
        if (this.swRegistration) {
            return new Promise((resolve) => {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data);
                };
                
                this.swRegistration.active.postMessage(
                    { type: 'CLEAR_CACHE' },
                    [messageChannel.port2]
                );
            });
        }
    }
    
    // Get app version
    async getAppVersion() {
        if (this.swRegistration) {
            return new Promise((resolve) => {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data);
                };
                
                this.swRegistration.active.postMessage(
                    { type: 'GET_VERSION' },
                    [messageChannel.port2]
                );
            });
        }
        
        return { version: 'unknown' };
    }
}

// Initialize PWA Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAManager;
}