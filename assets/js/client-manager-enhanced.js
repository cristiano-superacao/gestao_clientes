// Enhanced Client Manager with Full CRUD Operations
// Sistema de Gestão de Clientes - SENAI - Versão Completa

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, query, addDoc, serverTimestamp, getDocs, setLogLevel, updateDoc, deleteDoc, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables
let app, db, auth, userId = null;

// Configuration for Firestore debug logging
setLogLevel('debug');

// Common UI elements
const loadingOverlay = document.getElementById('loading-overlay');
const userInfoEl = document.getElementById('user-info');
const profileStatusEl = document.getElementById('profile-status');
const profileDataEl = document.getElementById('profile-data');
const profileNameEl = document.getElementById('profile-name');
const profileCompanyEl = document.getElementById('profile-company');
const clientListEl = document.getElementById('client-list');
const clientErrorEl = document.getElementById('client-error');
const saveProfileBtn = document.getElementById('save-profile-btn');

// Enhanced Client Manager Class
export class ClientManager {
    constructor(appId, firebaseConfig, initialAuthToken) {
        this.appId = appId;
        this.firebaseConfig = firebaseConfig;
        this.initialAuthToken = initialAuthToken;
        this.clients = [];
        this.filteredClients = [];
        this.currentEditingClient = null;
    }

    // Utility Methods
    showNotification(message, type = 'info', duration = 3000) {
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
            warning: 'bg-yellow-500 text-black',
            info: 'bg-blue-500 text-white'
        };
        
        notification.className = `${typeClasses[type]} px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-lg leading-none">&times;</button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Animate entry
        setTimeout(() => notification.classList.remove('translate-x-full'), 100);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('translate-x-full');
                setTimeout(() => {
                    if (notification.parentElement) {
                        container.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    }

    handleError(error, context) {
        console.error(`Erro em ${context}:`, error);
        
        const errorMessages = {
            'permission-denied': 'Você não tem permissão para esta ação',
            'not-found': 'Documento não encontrado',
            'network-request-failed': 'Erro de conexão. Verifique sua internet',
            'unauthenticated': 'Usuário não autenticado'
        };
        
        const message = errorMessages[error.code] || `Erro em ${context}: ${error.message}`;
        this.showNotification(message, 'error');
    }

    validateClientData(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length < 2) {
            errors.push('Nome deve ter pelo menos 2 caracteres');
        }
        
        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('Email deve ter formato válido');
        }
        
        if (data.phone && !/^[\d\s\(\)\-\+]+$/.test(data.phone)) {
            errors.push('Telefone deve conter apenas números e símbolos válidos');
        }
        
        return errors;
    }

    setLoadingState(element, isLoading, originalText = null) {
        if (isLoading) {
            if (originalText) element.dataset.originalText = originalText;
            element.disabled = true;
            element.innerHTML = '<div class="spinner w-4 h-4 mr-2 inline-block"></div> Carregando...';
        } else {
            element.disabled = false;
            element.innerHTML = element.dataset.originalText || originalText || 'Salvar';
        }
    }

    // Profile Management
    async loadUserProfile() {
        if (!db || !userId) return;

        try {
            const profileDocRef = doc(db, `artifacts/${this.appId}/users/${userId}/profile`, 'data');
            const profileSnap = await getDoc(profileDocRef);

            if (profileSnap.exists()) {
                const data = profileSnap.data();
                profileNameEl.textContent = data.name || 'N/A';
                profileCompanyEl.textContent = data.company || 'N/A';
                profileStatusEl.textContent = 'Dados carregados.';
                profileDataEl.classList.remove('hidden');
            } else {
                profileStatusEl.textContent = 'Perfil não encontrado. Clique em Salvar para criar um.';
                profileDataEl.classList.add('hidden');
            }
        } catch (error) {
            this.handleError(error, 'carregamento do perfil');
        }
    }

    async saveDefaultProfile() {
        if (!db || !userId) return;

        try {
            this.setLoadingState(saveProfileBtn, true, 'Salvar Perfil Padrão');
            
            const profileDocRef = doc(db, `artifacts/${this.appId}/users/${userId}/profile`, 'data');
            const defaultData = {
                name: 'Usuário Gestor',
                company: 'Minha Empresa de Clientes',
                createdAt: serverTimestamp()
            };
            
            await setDoc(profileDocRef, defaultData);
            
            profileNameEl.textContent = defaultData.name;
            profileCompanyEl.textContent = defaultData.company;
            profileStatusEl.textContent = 'Perfil padrão salvo com sucesso!';
            profileDataEl.classList.remove('hidden');
            
            this.showNotification('Perfil salvo com sucesso!', 'success');

        } catch (error) {
            this.handleError(error, 'salvamento do perfil');
        } finally {
            this.setLoadingState(saveProfileBtn, false);
        }
    }

    // Client CRUD Operations
    async addClient(clientData) {
        if (!db || !userId) return false;
        
        const errors = this.validateClientData(clientData);
        if (errors.length > 0) {
            this.showNotification(errors.join(', '), 'error');
            return false;
        }

        try {
            const clientsColRef = collection(db, `artifacts/${this.appId}/public/data/clients`);
            await addDoc(clientsColRef, {
                ...clientData,
                addedBy: userId,
                timestamp: serverTimestamp()
            });
            this.showNotification('Cliente adicionado com sucesso!', 'success');
            return true;
        } catch (error) {
            this.handleError(error, 'adição de cliente');
            return false;
        }
    }

    async updateClient(clientId, clientData) {
        if (!db || !userId) return false;
        
        const errors = this.validateClientData(clientData);
        if (errors.length > 0) {
            this.showNotification(errors.join(', '), 'error');
            return false;
        }

        try {
            const clientDocRef = doc(db, `artifacts/${this.appId}/public/data/clients`, clientId);
            await updateDoc(clientDocRef, {
                ...clientData,
                updatedAt: serverTimestamp(),
                updatedBy: userId
            });
            this.showNotification('Cliente atualizado com sucesso!', 'success');
            return true;
        } catch (error) {
            this.handleError(error, 'atualização de cliente');
            return false;
        }
    }

    async deleteClient(clientId) {
        if (!db || !userId) return false;
        
        if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
            return false;
        }

        try {
            const clientDocRef = doc(db, `artifacts/${this.appId}/public/data/clients`, clientId);
            await deleteDoc(clientDocRef);
            this.showNotification('Cliente excluído com sucesso!', 'success');
            return true;
        } catch (error) {
            this.handleError(error, 'exclusão de cliente');
            return false;
        }
    }

    // Client List Management
    filterClients(searchTerm = '', sortBy = 'timestamp') {
        let filtered = [...this.clients];
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(client => 
                client.name.toLowerCase().includes(term) ||
                client.email.toLowerCase().includes(term) ||
                (client.phone && client.phone.includes(term))
            );
        }
        
        // Sort clients
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'email':
                    return a.email.localeCompare(b.email);
                case 'recent':
                    return (b.timestamp?.toDate() || new Date()) - (a.timestamp?.toDate() || new Date());
                default:
                    return (a.timestamp?.toDate() || new Date()) - (b.timestamp?.toDate() || new Date());
            }
        });
        
        this.filteredClients = filtered;
        this.renderClientList();
    }

    renderClientList() {
        if (!clientListEl) return;

        clientListEl.innerHTML = '';
        
        if (this.filteredClients.length === 0) {
            clientListEl.innerHTML = '<li class="p-4 bg-gray-50 rounded-lg text-gray-600">Nenhum cliente encontrado.</li>';
            return;
        }

        this.filteredClients.forEach(client => {
            const li = document.createElement('li');
            li.className = 'client-item p-4 bg-primary bg-opacity-5 rounded-lg border-l-4 border-primary shadow transition-all duration-200 hover:shadow-lg hover:transform hover:scale-[1.02]';
            li.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <p class="text-lg font-medium text-gray-800">${client.name}</p>
                        <p class="text-sm text-gray-600">📧 ${client.email}</p>
                        ${client.phone ? `<p class="text-sm text-gray-600">📞 ${client.phone}</p>` : ''}
                        <p class="text-xs text-gray-500 mt-1">ID: ${client.id}</p>
                        ${client.timestamp ? `<p class="text-xs text-gray-500">Adicionado: ${client.timestamp.toDate().toLocaleDateString('pt-BR')}</p>` : ''}
                    </div>
                    <div class="flex gap-1 ml-4">
                        <button onclick="clientManager.editClient('${client.id}')" 
                                class="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                title="Editar cliente">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                            </svg>
                        </button>
                        <button onclick="clientManager.deleteClient('${client.id}')" 
                                class="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                                title="Excluir cliente">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            clientListEl.appendChild(li);
        });
    }

    // Real-time listener for client list
    setupClientListener() {
        if (!db) return;

        const clientsColRef = collection(db, `artifacts/${this.appId}/public/data/clients`);
        const q = query(clientsColRef, orderBy('timestamp', 'desc'));
        
        onSnapshot(q, (snapshot) => {
            this.clients = [];
            snapshot.forEach(doc => {
                this.clients.push({ id: doc.id, ...doc.data() });
            });

            this.filteredClients = [...this.clients];
            this.renderClientList();
            
            // Update search if active
            const searchInput = document.getElementById('search-input');
            const filterSelect = document.getElementById('filter-select');
            if (searchInput || filterSelect) {
                this.filterClients(
                    searchInput?.value || '',
                    filterSelect?.value || 'timestamp'
                );
            }
        }, (error) => {
            this.handleError(error, 'escuta de clientes');
        });
    }

    // Modal Management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
        this.currentEditingClient = null;
    }

    // Client Form Management
    editClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;

        this.currentEditingClient = client;
        
        // Fill form with client data
        document.getElementById('client-name').value = client.name;
        document.getElementById('client-email').value = client.email;
        document.getElementById('client-phone').value = client.phone || '';
        
        // Update modal title and button
        document.getElementById('modal-title').textContent = 'Editar Cliente';
        document.getElementById('save-client-btn').textContent = 'Atualizar Cliente';
        
        this.openModal('client-modal');
    }

    resetClientForm() {
        document.getElementById('client-form').reset();
        document.getElementById('modal-title').textContent = 'Adicionar Cliente';
        document.getElementById('save-client-btn').textContent = 'Salvar Cliente';
        this.currentEditingClient = null;
    }

    // Firebase initialization and authentication
    async initialize() {
        try {
            if (!this.firebaseConfig || Object.keys(this.firebaseConfig).length === 0) {
                throw new Error("Configuração do Firebase não fornecida.");
            }
            
            app = initializeApp(this.firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);

            // Authentication
            if (this.initialAuthToken) {
                await signInWithCustomToken(auth, this.initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }

            // Authentication state observer
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    userId = user.uid;
                    userInfoEl.textContent = `Usuário ID: ${userId.substring(0, 8)}... (Autenticado)`;
                    this.loadUserProfile();
                    this.setupClientListener();
                } else {
                    userId = null;
                    userInfoEl.textContent = 'Usuário: Anônimo (Não Autenticado)';
                    profileStatusEl.textContent = 'Por favor, aguarde a autenticação.';
                }
                loadingOverlay.classList.add('hidden');
            });

        } catch (error) {
            this.handleError(error, 'inicialização do Firebase');
            loadingOverlay.classList.add('hidden');
        }
    }

    // Add event listeners
    setupEventListeners() {
        // Profile save button
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => this.saveDefaultProfile());
        }

        // Search functionality
        const searchInput = document.getElementById('search-input');
        const filterSelect = document.getElementById('filter-select');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterClients(e.target.value, filterSelect?.value || 'timestamp');
            });
        }

        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterClients(searchInput?.value || '', e.target.value);
            });
        }

        // Add client button
        const addClientBtn = document.getElementById('add-client-btn');
        if (addClientBtn) {
            addClientBtn.addEventListener('click', () => {
                this.resetClientForm();
                this.openModal('client-modal');
            });
        }

        // Client form submission
        const clientForm = document.getElementById('client-form');
        if (clientForm) {
            clientForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = {
                    name: document.getElementById('client-name').value.trim(),
                    email: document.getElementById('client-email').value.trim(),
                    phone: document.getElementById('client-phone').value.trim()
                };

                const saveBtn = document.getElementById('save-client-btn');
                this.setLoadingState(saveBtn, true);

                let success = false;
                if (this.currentEditingClient) {
                    success = await this.updateClient(this.currentEditingClient.id, formData);
                } else {
                    success = await this.addClient(formData);
                }

                this.setLoadingState(saveBtn, false);

                if (success) {
                    this.closeModal('client-modal');
                }
            });
        }

        // Modal close buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close')) {
                this.closeModal('client-modal');
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal('client-modal');
            }
        });
    }
}

// Test mode simulation functions
export function simulateTestMode() {
    setTimeout(() => {
        if (profileStatusEl) profileStatusEl.textContent = '⚠️ Modo de teste - Firebase não configurado';
        if (userInfoEl) userInfoEl.textContent = 'Usuário: Teste Local (Simulado)';
        
        // Simulate test clients
        if (clientListEl) {
            clientListEl.innerHTML = `
                <li class="client-item p-4 bg-primary bg-opacity-5 rounded-lg border-l-4 border-primary shadow">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <p class="text-lg font-medium text-gray-800">João Silva</p>
                            <p class="text-sm text-gray-600">📧 joao@exemplo.com</p>
                            <p class="text-sm text-gray-600">📞 (11) 99999-0001</p>
                            <p class="text-xs text-gray-500 mt-1">ID: test-001</p>
                        </div>
                        <div class="flex gap-1 ml-4">
                            <button class="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Editar cliente">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                                </svg>
                            </button>
                            <button class="p-2 text-red-600 hover:bg-red-100 rounded transition-colors" title="Excluir cliente">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </li>
                <li class="client-item p-4 bg-primary bg-opacity-5 rounded-lg border-l-4 border-primary shadow">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <p class="text-lg font-medium text-gray-800">Maria Santos</p>
                            <p class="text-sm text-gray-600">📧 maria@exemplo.com</p>
                            <p class="text-sm text-gray-600">📞 (11) 99999-0002</p>
                            <p class="text-xs text-gray-500 mt-1">ID: test-002</p>
                        </div>
                        <div class="flex gap-1 ml-4">
                            <button class="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Editar cliente">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                                </svg>
                            </button>
                            <button class="p-2 text-red-600 hover:bg-red-100 rounded transition-colors" title="Excluir cliente">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </li>
            `;
        }
    }, 1000);
}

export function simulateProfileSave() {
    if (profileNameEl) profileNameEl.textContent = 'Usuário Gestor (Teste)';
    if (profileCompanyEl) profileCompanyEl.textContent = 'Empresa de Teste';
    if (profileStatusEl) profileStatusEl.textContent = 'Perfil de teste criado!';
    if (profileDataEl) profileDataEl.classList.remove('hidden');
}