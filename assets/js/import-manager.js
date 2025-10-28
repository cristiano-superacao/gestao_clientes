// Import System Module - v2.1.0  
// Sistema de Gestão de Clientes - SENAI - Import Bulk CSV/Excel

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, writeBatch, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export class ImportManager {
    constructor(appId, firebaseConfig) {
        this.appId = appId;
        this.firebaseConfig = firebaseConfig;
        this.importData = [];
        this.validationResults = {
            valid: [],
            invalid: [],
            duplicates: [],
            warnings: []
        };
        this.importSettings = {
            skipDuplicates: true,
            validateEmails: true,
            validatePhones: true,
            updateExisting: false,
            batchSize: 50,
            fieldMapping: {
                name: ['name', 'nome', 'client_name', 'cliente'],
                email: ['email', 'e-mail', 'e_mail', 'mail'],
                phone: ['phone', 'telefone', 'tel', 'celular', 'fone'],
                address: ['address', 'endereco', 'endereço', 'addr'],
                company: ['company', 'empresa', 'organizacao', 'organization']
            }
        };
        this.app = null;
        this.db = null;
        this.existingClients = [];
    }

    // Initialize Firebase connection
    async initialize() {
        try {
            if (!this.firebaseConfig || Object.keys(this.firebaseConfig).length === 0) {
                console.warn('Firebase não configurado, modo de demonstração');
                return true;
            }
            
            this.app = initializeApp(this.firebaseConfig);
            this.db = getFirestore(this.app);
            await this.loadExistingClients();
            return true;
            
        } catch (error) {
            console.error('Erro ao inicializar Firebase:', error);
            return false;
        }
    }

    // Load existing clients to check for duplicates
    async loadExistingClients() {
        if (!this.db) return;

        try {
            const clientsRef = collection(this.db, `artifacts/${this.appId}/public/data/clients`);
            const snapshot = await getDocs(clientsRef);
            
            this.existingClients = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                this.existingClients.push({
                    id: doc.id,
                    email: data.email?.toLowerCase(),
                    phone: this.normalizePhone(data.phone)
                });
            });
        } catch (error) {
            console.error('Erro ao carregar clientes existentes:', error);
        }
    }

    // Process uploaded file
    async processFile(file) {
        try {
            if (!file) {
                throw new Error('Nenhum arquivo selecionado');
            }

            const fileExtension = file.name.split('.').pop().toLowerCase();
            let rawData = [];

            if (fileExtension === 'csv') {
                rawData = await this.processCSV(file);
            } else if (['xlsx', 'xls'].includes(fileExtension)) {
                rawData = await this.processExcel(file);
            } else {
                throw new Error('Formato de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls)');
            }

            if (rawData.length === 0) {
                throw new Error('Arquivo vazio ou sem dados válidos');
            }

            // Map fields and validate data
            this.importData = this.mapFields(rawData);
            await this.validateData();
            this.updateUI();

            return {
                success: true,
                totalRecords: rawData.length,
                validRecords: this.validationResults.valid.length,
                invalidRecords: this.validationResults.invalid.length,
                duplicates: this.validationResults.duplicates.length
            };

        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            this.showNotification(error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    // Process CSV file
    async processCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const lines = csv.split('\n').filter(line => line.trim());
                    
                    if (lines.length < 2) {
                        reject(new Error('CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados'));
                        return;
                    }

                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                    const data = [];

                    for (let i = 1; i < lines.length; i++) {
                        const values = this.parseCSVLine(lines[i]);
                        if (values.length !== headers.length) continue;

                        const row = {};
                        headers.forEach((header, index) => {
                            row[header] = values[index]?.trim() || '';
                        });
                        data.push(row);
                    }

                    resolve(data);
                } catch (error) {
                    reject(new Error('Erro ao processar CSV: ' + error.message));
                }
            };
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    // Process Excel file
    async processExcel(file) {
        if (!window.XLSX) {
            throw new Error('Biblioteca XLSX não carregada');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = window.XLSX.read(data, { type: 'array' });
                    
                    // Use first sheet
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    // Convert to JSON with header row
                    const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { 
                        header: 1,
                        defval: '',
                        blankrows: false
                    });

                    if (jsonData.length < 2) {
                        reject(new Error('Excel deve ter pelo menos uma linha de cabeçalho e uma linha de dados'));
                        return;
                    }

                    const headers = jsonData[0].map(h => String(h).trim().toLowerCase());
                    const data = [];

                    for (let i = 1; i < jsonData.length; i++) {
                        const row = {};
                        headers.forEach((header, index) => {
                            row[header] = String(jsonData[i][index] || '').trim();
                        });
                        
                        // Skip empty rows
                        if (!Object.values(row).some(v => v)) continue;
                        data.push(row);
                    }

                    resolve(data);
                } catch (error) {
                    reject(new Error('Erro ao processar Excel: ' + error.message));
                }
            };
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsArrayBuffer(file);
        });
    }

    // Parse CSV line handling quotes and commas
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result.map(item => item.replace(/^"|"$/g, ''));
    }

    // Map imported fields to system fields
    mapFields(rawData) {
        const mapped = [];
        
        rawData.forEach((row, index) => {
            const mappedRow = {
                originalIndex: index,
                name: '',
                email: '',
                phone: '',
                address: '',
                company: '',
                notes: '',
                originalData: { ...row }
            };

            // Auto-map fields based on field mapping configuration
            Object.entries(this.importSettings.fieldMapping).forEach(([systemField, possibleNames]) => {
                const foundField = possibleNames.find(possible => row.hasOwnProperty(possible));
                if (foundField) {
                    mappedRow[systemField] = row[foundField];
                }
            });

            // If no mapping found, try to map by exact keys
            Object.keys(row).forEach(key => {
                const lowerKey = key.toLowerCase();
                if (mappedRow.hasOwnProperty(lowerKey)) {
                    mappedRow[lowerKey] = row[key];
                }
            });

            mapped.push(mappedRow);
        });

        return mapped;
    }

    // Validate imported data
    async validateData() {
        this.validationResults = {
            valid: [],
            invalid: [],
            duplicates: [],
            warnings: []
        };

        for (let i = 0; i < this.importData.length; i++) {
            const client = this.importData[i];
            const validation = this.validateClient(client);
            
            client.validation = validation;

            if (validation.isValid) {
                // Check for duplicates
                const isDuplicate = this.checkDuplicate(client);
                if (isDuplicate) {
                    client.isDuplicate = true;
                    this.validationResults.duplicates.push(client);
                } else {
                    this.validationResults.valid.push(client);
                }
            } else {
                this.validationResults.invalid.push(client);
            }

            // Check for warnings
            if (validation.warnings.length > 0) {
                this.validationResults.warnings.push({
                    client,
                    warnings: validation.warnings
                });
            }
        }
    }

    // Validate individual client
    validateClient(client) {
        const errors = [];
        const warnings = [];

        // Required fields validation
        if (!client.name || client.name.length < 2) {
            errors.push('Nome é obrigatório e deve ter pelo menos 2 caracteres');
        }

        if (!client.email) {
            errors.push('E-mail é obrigatório');
        } else if (this.importSettings.validateEmails && !this.isValidEmail(client.email)) {
            errors.push('E-mail inválido');
        }

        // Phone validation
        if (client.phone && this.importSettings.validatePhones && !this.isValidPhone(client.phone)) {
            warnings.push('Formato de telefone pode estar incorreto');
        }

        // Name length check
        if (client.name && client.name.length > 100) {
            warnings.push('Nome muito longo, será truncado');
        }

        // Address length check
        if (client.address && client.address.length > 200) {
            warnings.push('Endereço muito longo, será truncado');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Check for duplicates
    checkDuplicate(client) {
        if (!client.email) return false;

        const normalizedEmail = client.email.toLowerCase();
        const normalizedPhone = this.normalizePhone(client.phone);

        // Check against existing clients
        const existingDuplicate = this.existingClients.some(existing => 
            existing.email === normalizedEmail || 
            (normalizedPhone && existing.phone === normalizedPhone)
        );

        if (existingDuplicate) return true;

        // Check against other import data
        const importDuplicate = this.validationResults.valid.some(validClient => 
            validClient.email.toLowerCase() === normalizedEmail ||
            (normalizedPhone && this.normalizePhone(validClient.phone) === normalizedPhone)
        );

        return importDuplicate;
    }

    // Execute import
    async executeImport(options = {}) {
        if (!this.db) {
            throw new Error('Firebase não configurado');
        }

        const settings = { ...this.importSettings, ...options };
        let toImport = [...this.validationResults.valid];

        // Include duplicates if not skipping
        if (!settings.skipDuplicates) {
            toImport = [...toImport, ...this.validationResults.duplicates];
        }

        if (toImport.length === 0) {
            throw new Error('Nenhum registro válido para importar');
        }

        const results = {
            success: 0,
            errors: 0,
            skipped: 0,
            details: []
        };

        try {
            // Process in batches
            const batches = this.createBatches(toImport, settings.batchSize);
            
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                const batchResults = await this.processBatch(batch, settings);
                
                results.success += batchResults.success;
                results.errors += batchResults.errors;
                results.skipped += batchResults.skipped;
                results.details.push(...batchResults.details);

                // Update progress
                const progress = ((batchIndex + 1) / batches.length) * 100;
                this.updateImportProgress(progress, `Batch ${batchIndex + 1}/${batches.length}`);
            }

            // Final update
            this.updateImportProgress(100, 'Importação concluída');
            
            return results;

        } catch (error) {
            console.error('Erro durante importação:', error);
            throw error;
        }
    }

    // Process single batch
    async processBatch(clients, settings) {
        const batch = writeBatch(this.db);
        const results = { success: 0, errors: 0, skipped: 0, details: [] };

        clients.forEach(client => {
            try {
                const clientData = {
                    name: client.name.substring(0, 100),
                    email: client.email.toLowerCase(),
                    phone: client.phone || '',
                    address: client.address?.substring(0, 200) || '',
                    company: client.company || '',
                    notes: client.notes || '',
                    timestamp: new Date(),
                    imported: true,
                    importDate: new Date()
                };

                const docRef = doc(collection(this.db, `artifacts/${this.appId}/public/data/clients`));
                batch.set(docRef, clientData);
                
                results.success++;
                results.details.push({
                    client: client.name,
                    status: 'success',
                    message: 'Importado com sucesso'
                });

            } catch (error) {
                results.errors++;
                results.details.push({
                    client: client.name,
                    status: 'error',
                    message: error.message
                });
            }
        });

        await batch.commit();
        return results;
    }

    // Create batches for processing
    createBatches(data, batchSize) {
        const batches = [];
        for (let i = 0; i < data.length; i += batchSize) {
            batches.push(data.slice(i, i + batchSize));
        }
        return batches;
    }

    // Utility functions
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\(\)\s\-\+\d]{8,}$/;
        return phoneRegex.test(phone);
    }

    normalizePhone(phone) {
        if (!phone) return '';
        return phone.replace(/[\(\)\s\-\+]/g, '');
    }

    // UI Update methods
    updateUI() {
        this.updateStatistics();
        this.updatePreviewTable();
        this.updateValidationSummary();
    }

    updateStatistics() {
        const elements = {
            'import-total-records': this.importData.length,
            'import-valid-records': this.validationResults.valid.length,
            'import-invalid-records': this.validationResults.invalid.length,
            'import-duplicate-records': this.validationResults.duplicates.length
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    updatePreviewTable() {
        const table = document.getElementById('import-preview-table');
        if (!table) return;

        let html = `
            <thead>
                <tr class="bg-gray-50">
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Problemas</th>
                </tr>
            </thead>
            <tbody>
        `;

        // Show first 20 records
        const displayData = this.importData.slice(0, 20);
        
        displayData.forEach((client, index) => {
            const statusClass = client.validation?.isValid 
                ? (client.isDuplicate ? 'text-yellow-600' : 'text-green-600')
                : 'text-red-600';
                
            const statusIcon = client.validation?.isValid 
                ? (client.isDuplicate ? '⚠️' : '✅')
                : '❌';

            const statusText = client.validation?.isValid 
                ? (client.isDuplicate ? 'Duplicado' : 'Válido')
                : 'Inválido';

            const problems = [
                ...(client.validation?.errors || []),
                ...(client.validation?.warnings || [])
            ].join(', ') || '-';

            html += `
                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                    <td class="px-4 py-2">
                        <span class="${statusClass} flex items-center">
                            ${statusIcon} ${statusText}
                        </span>
                    </td>
                    <td class="px-4 py-2 text-sm text-gray-900">${client.name || '-'}</td>
                    <td class="px-4 py-2 text-sm text-gray-900">${client.email || '-'}</td>
                    <td class="px-4 py-2 text-sm text-gray-900">${client.phone || '-'}</td>
                    <td class="px-4 py-2 text-sm text-gray-900">${client.company || '-'}</td>
                    <td class="px-4 py-2 text-sm text-gray-600">${problems}</td>
                </tr>
            `;
        });

        html += '</tbody>';
        table.innerHTML = html;
    }

    updateValidationSummary() {
        const container = document.getElementById('validation-summary');
        if (!container) return;

        let html = '';

        // Errors summary
        if (this.validationResults.invalid.length > 0) {
            html += `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h4 class="text-red-800 font-medium mb-2">Registros Inválidos (${this.validationResults.invalid.length})</h4>
                    <ul class="text-sm text-red-700 space-y-1">
            `;
            
            this.validationResults.invalid.slice(0, 5).forEach(client => {
                html += `<li>• ${client.name || 'Linha ' + (client.originalIndex + 1)}: ${client.validation.errors.join(', ')}</li>`;
            });
            
            if (this.validationResults.invalid.length > 5) {
                html += `<li class="text-red-600">... e mais ${this.validationResults.invalid.length - 5} registros</li>`;
            }
            
            html += '</ul></div>';
        }

        // Duplicates summary
        if (this.validationResults.duplicates.length > 0) {
            html += `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 class="text-yellow-800 font-medium mb-2">Duplicados Encontrados (${this.validationResults.duplicates.length})</h4>
                    <ul class="text-sm text-yellow-700 space-y-1">
            `;
            
            this.validationResults.duplicates.slice(0, 5).forEach(client => {
                html += `<li>• ${client.name} (${client.email})</li>`;
            });
            
            if (this.validationResults.duplicates.length > 5) {
                html += `<li class="text-yellow-600">... e mais ${this.validationResults.duplicates.length - 5} duplicados</li>`;
            }
            
            html += '</ul></div>';
        }

        // Success summary
        if (this.validationResults.valid.length > 0) {
            html += `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="text-green-800 font-medium mb-2">Registros Válidos (${this.validationResults.valid.length})</h4>
                    <p class="text-sm text-green-700">Estes registros estão prontos para importação.</p>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    updateImportProgress(progress, message) {
        const progressBar = document.querySelector('.import-progress-bar');
        const progressText = document.getElementById('import-progress-text');
        const progressPercent = document.getElementById('import-progress-percent');

        if (progressBar) progressBar.style.width = progress + '%';
        if (progressText) progressText.textContent = message;
        if (progressPercent) progressPercent.textContent = Math.round(progress) + '%';
    }

    // Update import settings
    updateSettings(newSettings) {
        this.importSettings = { ...this.importSettings, ...newSettings };
        
        // Re-validate if data exists
        if (this.importData.length > 0) {
            this.validateData();
            this.updateUI();
        }
    }

    // Show notification
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
            
        window.importManager = new ImportManager(window.__app_id, config);
        
        // Initialize when needed
        if (document.getElementById('import-container')) {
            window.importManager.initialize()
                .then(() => console.log('Import Manager inicializado'))
                .catch(err => console.error('Erro ao inicializar Import Manager:', err));
        }
    }
});