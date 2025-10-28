// Firebase Configuration and Common Functions
// Sistema de Gestão de Clientes - SENAI

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, query, addDoc, serverTimestamp, getDocs, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

// Common Functions
export class ClientManager {
    constructor(appId, firebaseConfig, initialAuthToken) {
        this.appId = appId;
        this.firebaseConfig = firebaseConfig;
        this.initialAuthToken = initialAuthToken;
    }

    // Function to load user profile data
    async loadUserProfile() {
        if (!db || !userId) return;

        // CORRECTION: Document path must have EVEN number of segments (Collection/Document/Collection/Document...).
        // Previous path '.../profile' (5 segments) was incorrect.
        // Fixed to '.../profile/data' (6 segments), where 'profile' is a collection and 'data' is the document ID.
        // Full path: artifacts/{appId}/users/{userId}/profile/data
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
            console.error("Erro ao carregar o perfil do usuário:", error);
            profileStatusEl.textContent = `Erro ao carregar: ${error.message}`;
        }
    }

    // Function to save default profile
    async saveDefaultProfile() {
        if (!db || !userId) return;

        try {
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

        } catch (error) {
            console.error("Erro ao salvar o perfil do usuário:", error);
            profileStatusEl.textContent = `Erro ao salvar: ${error.message}`;
        }
    }
    
    // Real-time listener for client list
    setupClientListener() {
        if (!db) return;

        const clientsColRef = collection(db, `artifacts/${this.appId}/public/data/clients`);
        
        onSnapshot(clientsColRef, (snapshot) => {
            const clients = [];
            snapshot.forEach(doc => {
                clients.push({ id: doc.id, ...doc.data() });
            });

            clientListEl.innerHTML = '';
            if (clients.length === 0) {
                clientListEl.innerHTML = '<li class="p-4 bg-gray-50 rounded-lg text-gray-600">Nenhum cliente cadastrado.</li>';
            } else {
                clients.forEach(client => {
                    const li = document.createElement('li');
                    li.className = 'p-4 bg-primary bg-opacity-5 rounded-lg border-l-4 border-primary shadow';
                    li.innerHTML = `
                        <p class="text-lg font-medium text-gray-800">${client.name || 'Cliente Sem Nome'}</p>
                        <p class="text-sm text-gray-600">ID: ${client.id}</p>
                        <p class="text-sm text-gray-600">Email: ${client.email || 'N/A'}</p>
                    `;
                    clientListEl.appendChild(li);
                });
            }
        }, (error) => {
            console.error("Erro no listener de clientes:", error);
            clientErrorEl.textContent = `Erro ao carregar clientes: ${error.message}`;
            clientErrorEl.classList.remove('hidden');
        });
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
                    userInfoEl.textContent = `Usuário ID: ${userId} (Autenticado)`;
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
            console.error("Erro na inicialização do Firebase:", error);
            userInfoEl.textContent = `Erro de Inicialização: ${error.message}`;
            loadingOverlay.classList.add('hidden');
        }
    }

    // Add event listeners
    setupEventListeners() {
        saveProfileBtn.addEventListener('click', () => this.saveDefaultProfile());
    }

    // Example function to add a new client (for demonstration)
    async addExampleClient() {
        if (!db || !userId) return;
        try {
            const clientsColRef = collection(db, `artifacts/${this.appId}/public/data/clients`);
            await addDoc(clientsColRef, {
                name: `Novo Cliente ${Date.now() % 100}`,
                email: `client${Date.now() % 100}@example.com`,
                addedBy: userId,
                timestamp: serverTimestamp()
            });
            console.log("Cliente de exemplo adicionado.");
        } catch (e) {
            console.error("Erro ao adicionar cliente de exemplo: ", e);
        }
    }
}

// Test mode simulation
export function simulateTestMode() {
    setTimeout(() => {
        profileStatusEl.textContent = '⚠️ Modo de teste - Firebase não configurado';
        userInfoEl.textContent = 'Usuário: Teste Local (Simulado)';
        
        // Simulate test clients
        clientListEl.innerHTML = `
            <li class="p-4 bg-primary bg-opacity-5 rounded-lg border-l-4 border-primary shadow">
                <p class="text-lg font-medium text-gray-800">João Silva</p>
                <p class="text-sm text-gray-600">ID: test-001</p>
                <p class="text-sm text-gray-600">Email: joao@exemplo.com</p>
            </li>
            <li class="p-4 bg-primary bg-opacity-5 rounded-lg border-l-4 border-primary shadow">
                <p class="text-lg font-medium text-gray-800">Maria Santos</p>
                <p class="text-sm text-gray-600">ID: test-002</p>
                <p class="text-sm text-gray-600">Email: maria@exemplo.com</p>
            </li>
        `;
    }, 1000);
}

// Test mode profile save
export function simulateProfileSave() {
    profileNameEl.textContent = 'Usuário Gestor (Teste)';
    profileCompanyEl.textContent = 'Empresa de Teste';
    profileStatusEl.textContent = 'Perfil de teste criado!';
    profileDataEl.classList.remove('hidden');
}