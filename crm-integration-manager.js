/**
 * Sistema de Integração CRM - Versão 3.0.0
 * Integração bidirecional com HubSpot, Salesforce e Pipedrive
 * Sincronização de dados, histórico de interações e automação
 */

class CRMIntegrationManager {
    constructor() {
        this.db = null;
        this.integrations = {
            hubspot: {
                name: 'HubSpot',
                baseUrl: 'https://api.hubapi.com',
                enabled: false,
                apiKey: '',
                lastSync: null,
                syncInterval: 3600000, // 1 hora
                rateLimits: {
                    requests: 100,
                    perSecond: 10,
                    current: 0
                }
            },
            salesforce: {
                name: 'Salesforce',
                baseUrl: 'https://login.salesforce.com',
                enabled: false,
                clientId: '',
                clientSecret: '',
                accessToken: '',
                refreshToken: '',
                instanceUrl: '',
                lastSync: null,
                syncInterval: 3600000,
                rateLimits: {
                    requests: 15000,
                    perSecond: 20,
                    current: 0
                }
            },
            pipedrive: {
                name: 'Pipedrive',
                baseUrl: 'https://api.pipedrive.com/v1',
                enabled: false,
                apiToken: '',
                lastSync: null,
                syncInterval: 3600000,
                rateLimits: {
                    requests: 100000,
                    perSecond: 10,
                    current: 0
                }
            }
        };
        
        this.syncStatus = {
            inProgress: false,
            lastSync: null,
            conflicts: [],
            stats: {
                created: 0,
                updated: 0,
                errors: 0
            }
        };
        
        this.mappings = {
            clientToContact: {
                'nome': 'firstname',
                'sobrenome': 'lastname',
                'email': 'email',
                'telefone': 'phone',
                'empresa': 'company',
                'endereco': 'address',
                'cidade': 'city',
                'estado': 'state',
                'cep': 'zip'
            },
            contactToClient: {
                'firstname': 'nome',
                'lastname': 'sobrenome',
                'email': 'email',
                'phone': 'telefone',
                'company': 'empresa',
                'address': 'endereco',
                'city': 'cidade',
                'state': 'estado',
                'zip': 'cep'
            }
        };
        
        this.webhooks = new Map();
        this.autoSyncTimer = null;
        
        this.init();
    }

    async init() {
        try {
            await this.initFirebase();
            await this.loadSettings();
            await this.initWebhooks();
            this.startAutoSync();
            
            console.log('CRM Integration Manager inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar CRM Integration Manager:', error);
        }
    }

    async initFirebase() {
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase não está carregado');
        }
        
        this.db = firebase.firestore();
    }

    async loadSettings() {
        try {
            const settings = localStorage.getItem('crmIntegrationSettings');
            if (settings) {
                const parsedSettings = JSON.parse(settings);
                Object.assign(this.integrations, parsedSettings);
            }
        } catch (error) {
            console.error('Erro ao carregar configurações CRM:', error);
        }
    }

    async saveSettings() {
        try {
            localStorage.setItem('crmIntegrationSettings', JSON.stringify(this.integrations));
        } catch (error) {
            console.error('Erro ao salvar configurações CRM:', error);
        }
    }

    // ==================== HUBSPOT INTEGRATION ====================

    async connectHubSpot(apiKey) {
        try {
            this.integrations.hubspot.apiKey = apiKey;
            
            // Teste de conectividade
            const response = await this.makeHubSpotRequest('/contacts/v1/lists/all/contacts/all', 'GET', null, { count: 1 });
            
            if (response.status === 200) {
                this.integrations.hubspot.enabled = true;
                await this.saveSettings();
                return { success: true, message: 'Conectado ao HubSpot com sucesso!' };
            } else {
                throw new Error('Falha na autenticação');
            }
        } catch (error) {
            console.error('Erro ao conectar com HubSpot:', error);
            return { success: false, message: error.message };
        }
    }

    async makeHubSpotRequest(endpoint, method = 'GET', data = null, params = {}) {
        const { apiKey } = this.integrations.hubspot;
        
        if (!apiKey) {
            throw new Error('API Key do HubSpot não configurada');
        }

        await this.checkRateLimit('hubspot');

        const url = new URL(`${this.integrations.hubspot.baseUrl}${endpoint}`);
        url.searchParams.append('hapikey', apiKey);
        
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url.toString(), options);
        this.integrations.hubspot.rateLimits.current++;
        
        return {
            status: response.status,
            data: await response.json()
        };
    }

    async syncToHubSpot(cliente) {
        try {
            const contactData = this.mapClientToContact(cliente);
            
            // Verificar se o contato já existe
            const existingContact = await this.findHubSpotContactByEmail(cliente.email);
            
            if (existingContact) {
                // Atualizar contato existente
                const response = await this.makeHubSpotRequest(
                    `/contacts/v1/contact/vid/${existingContact.vid}/profile`,
                    'POST',
                    { properties: contactData }
                );
                
                if (response.status === 204) {
                    await this.logInteraction(cliente.id, 'hubspot', 'update', 'Contato atualizado no HubSpot');
                    return { success: true, action: 'updated', contactId: existingContact.vid };
                }
            } else {
                // Criar novo contato
                const response = await this.makeHubSpotRequest(
                    '/contacts/v1/contact',
                    'POST',
                    { properties: contactData }
                );
                
                if (response.status === 200) {
                    await this.logInteraction(cliente.id, 'hubspot', 'create', 'Contato criado no HubSpot');
                    return { success: true, action: 'created', contactId: response.data.vid };
                }
            }
            
            throw new Error('Falha na sincronização com HubSpot');
        } catch (error) {
            console.error('Erro ao sincronizar com HubSpot:', error);
            await this.logInteraction(cliente.id, 'hubspot', 'error', error.message);
            return { success: false, error: error.message };
        }
    }

    async findHubSpotContactByEmail(email) {
        try {
            const response = await this.makeHubSpotRequest(
                `/contacts/v1/contact/email/${encodeURIComponent(email)}/profile`
            );
            
            return response.status === 200 ? response.data : null;
        } catch (error) {
            return null;
        }
    }

    async getHubSpotContacts(limit = 100) {
        try {
            const response = await this.makeHubSpotRequest(
                '/contacts/v1/lists/all/contacts/all',
                'GET',
                null,
                { count: limit }
            );
            
            return response.status === 200 ? response.data.contacts : [];
        } catch (error) {
            console.error('Erro ao buscar contatos do HubSpot:', error);
            return [];
        }
    }

    // ==================== SALESFORCE INTEGRATION ====================

    async connectSalesforce(clientId, clientSecret, username, password) {
        try {
            this.integrations.salesforce.clientId = clientId;
            this.integrations.salesforce.clientSecret = clientSecret;
            
            // OAuth 2.0 Password Flow
            const authResponse = await fetch(`${this.integrations.salesforce.baseUrl}/services/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'password',
                    client_id: clientId,
                    client_secret: clientSecret,
                    username: username,
                    password: password
                })
            });

            if (authResponse.ok) {
                const authData = await authResponse.json();
                this.integrations.salesforce.accessToken = authData.access_token;
                this.integrations.salesforce.refreshToken = authData.refresh_token;
                this.integrations.salesforce.instanceUrl = authData.instance_url;
                this.integrations.salesforce.enabled = true;
                
                await this.saveSettings();
                return { success: true, message: 'Conectado ao Salesforce com sucesso!' };
            } else {
                throw new Error('Falha na autenticação');
            }
        } catch (error) {
            console.error('Erro ao conectar com Salesforce:', error);
            return { success: false, message: error.message };
        }
    }

    async makeSalesforceRequest(endpoint, method = 'GET', data = null) {
        const { accessToken, instanceUrl } = this.integrations.salesforce;
        
        if (!accessToken || !instanceUrl) {
            throw new Error('Salesforce não está autenticado');
        }

        await this.checkRateLimit('salesforce');

        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${instanceUrl}${endpoint}`, options);
        this.integrations.salesforce.rateLimits.current++;

        if (response.status === 401) {
            // Token expirado, tentar renovar
            await this.refreshSalesforceToken();
            return this.makeSalesforceRequest(endpoint, method, data);
        }

        return {
            status: response.status,
            data: await response.json()
        };
    }

    async refreshSalesforceToken() {
        try {
            const { clientId, clientSecret, refreshToken } = this.integrations.salesforce;
            
            const response = await fetch(`${this.integrations.salesforce.baseUrl}/services/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: clientId,
                    client_secret: clientSecret,
                    refresh_token: refreshToken
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.integrations.salesforce.accessToken = data.access_token;
                await this.saveSettings();
            }
        } catch (error) {
            console.error('Erro ao renovar token Salesforce:', error);
        }
    }

    async syncToSalesforce(cliente) {
        try {
            const contactData = this.mapClientToSalesforceContact(cliente);
            
            // Verificar se o contato já existe
            const existingContact = await this.findSalesforceContactByEmail(cliente.email);
            
            if (existingContact) {
                // Atualizar contato existente
                const response = await this.makeSalesforceRequest(
                    `/services/data/v52.0/sobjects/Contact/${existingContact.Id}`,
                    'PATCH',
                    contactData
                );
                
                if (response.status === 204) {
                    await this.logInteraction(cliente.id, 'salesforce', 'update', 'Contato atualizado no Salesforce');
                    return { success: true, action: 'updated', contactId: existingContact.Id };
                }
            } else {
                // Criar novo contato
                const response = await this.makeSalesforceRequest(
                    '/services/data/v52.0/sobjects/Contact',
                    'POST',
                    contactData
                );
                
                if (response.status === 201) {
                    await this.logInteraction(cliente.id, 'salesforce', 'create', 'Contato criado no Salesforce');
                    return { success: true, action: 'created', contactId: response.data.id };
                }
            }
            
            throw new Error('Falha na sincronização com Salesforce');
        } catch (error) {
            console.error('Erro ao sincronizar com Salesforce:', error);
            await this.logInteraction(cliente.id, 'salesforce', 'error', error.message);
            return { success: false, error: error.message };
        }
    }

    async findSalesforceContactByEmail(email) {
        try {
            const response = await this.makeSalesforceRequest(
                `/services/data/v52.0/query?q=SELECT Id, FirstName, LastName, Email FROM Contact WHERE Email = '${email}' LIMIT 1`
            );
            
            return response.status === 200 && response.data.records.length > 0 ? response.data.records[0] : null;
        } catch (error) {
            return null;
        }
    }

    mapClientToSalesforceContact(cliente) {
        return {
            FirstName: cliente.nome,
            LastName: cliente.sobrenome || 'N/A',
            Email: cliente.email,
            Phone: cliente.telefone,
            MailingStreet: cliente.endereco,
            MailingCity: cliente.cidade,
            MailingState: cliente.estado,
            MailingPostalCode: cliente.cep,
            AccountId: null // Pode ser configurado posteriormente
        };
    }

    // ==================== PIPEDRIVE INTEGRATION ====================

    async connectPipedrive(apiToken) {
        try {
            this.integrations.pipedrive.apiToken = apiToken;
            
            // Teste de conectividade
            const response = await this.makePipedriveRequest('/persons', 'GET', null, { limit: 1 });
            
            if (response.status === 200) {
                this.integrations.pipedrive.enabled = true;
                await this.saveSettings();
                return { success: true, message: 'Conectado ao Pipedrive com sucesso!' };
            } else {
                throw new Error('Falha na autenticação');
            }
        } catch (error) {
            console.error('Erro ao conectar com Pipedrive:', error);
            return { success: false, message: error.message };
        }
    }

    async makePipedriveRequest(endpoint, method = 'GET', data = null, params = {}) {
        const { apiToken } = this.integrations.pipedrive;
        
        if (!apiToken) {
            throw new Error('API Token do Pipedrive não configurado');
        }

        await this.checkRateLimit('pipedrive');

        const url = new URL(`${this.integrations.pipedrive.baseUrl}${endpoint}`);
        url.searchParams.append('api_token', apiToken);
        
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url.toString(), options);
        this.integrations.pipedrive.rateLimits.current++;
        
        return {
            status: response.status,
            data: await response.json()
        };
    }

    async syncToPipedrive(cliente) {
        try {
            const personData = this.mapClientToPipedrivePerson(cliente);
            
            // Verificar se a pessoa já existe
            const existingPerson = await this.findPipedrivePersonByEmail(cliente.email);
            
            if (existingPerson) {
                // Atualizar pessoa existente
                const response = await this.makePipedriveRequest(
                    `/persons/${existingPerson.id}`,
                    'PUT',
                    personData
                );
                
                if (response.status === 200) {
                    await this.logInteraction(cliente.id, 'pipedrive', 'update', 'Contato atualizado no Pipedrive');
                    return { success: true, action: 'updated', personId: existingPerson.id };
                }
            } else {
                // Criar nova pessoa
                const response = await this.makePipedriveRequest(
                    '/persons',
                    'POST',
                    personData
                );
                
                if (response.status === 201) {
                    await this.logInteraction(cliente.id, 'pipedrive', 'create', 'Contato criado no Pipedrive');
                    return { success: true, action: 'created', personId: response.data.data.id };
                }
            }
            
            throw new Error('Falha na sincronização com Pipedrive');
        } catch (error) {
            console.error('Erro ao sincronizar com Pipedrive:', error);
            await this.logInteraction(cliente.id, 'pipedrive', 'error', error.message);
            return { success: false, error: error.message };
        }
    }

    async findPipedrivePersonByEmail(email) {
        try {
            const response = await this.makePipedriveRequest(
                '/persons/search',
                'GET',
                null,
                { term: email, fields: 'email', exact_match: 1 }
            );
            
            if (response.status === 200 && response.data.data && response.data.data.items.length > 0) {
                return response.data.data.items[0].item;
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    mapClientToPipedrivePerson(cliente) {
        return {
            name: `${cliente.nome} ${cliente.sobrenome || ''}`.trim(),
            email: [{ value: cliente.email, primary: true }],
            phone: [{ value: cliente.telefone, primary: true }],
            org_id: null // Pode ser configurado posteriormente
        };
    }

    // ==================== MAPPING UTILITIES ====================

    mapClientToContact(cliente) {
        const mapped = {};
        Object.entries(this.mappings.clientToContact).forEach(([clientField, contactField]) => {
            if (cliente[clientField]) {
                mapped[contactField] = { value: cliente[clientField] };
            }
        });
        return mapped;
    }

    mapContactToClient(contact) {
        const mapped = {};
        Object.entries(this.mappings.contactToClient).forEach(([contactField, clientField]) => {
            if (contact.properties && contact.properties[contactField]) {
                mapped[clientField] = contact.properties[contactField].value;
            }
        });
        return mapped;
    }

    // ==================== RATE LIMITING ====================

    async checkRateLimit(platform) {
        const integration = this.integrations[platform];
        
        if (integration.rateLimits.current >= integration.rateLimits.perSecond) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            integration.rateLimits.current = 0;
        }
    }

    // ==================== SYNC OPERATIONS ====================

    async syncAllClients() {
        if (this.syncStatus.inProgress) {
            return { success: false, message: 'Sincronização já em andamento' };
        }

        this.syncStatus.inProgress = true;
        this.syncStatus.stats = { created: 0, updated: 0, errors: 0 };

        try {
            const clientsRef = this.db.collection('clientes');
            const snapshot = await clientsRef.get();
            
            for (const doc of snapshot.docs) {
                const cliente = { id: doc.id, ...doc.data() };
                
                // Sincronizar com cada CRM habilitado
                if (this.integrations.hubspot.enabled) {
                    const result = await this.syncToHubSpot(cliente);
                    this.updateSyncStats(result);
                }
                
                if (this.integrations.salesforce.enabled) {
                    const result = await this.syncToSalesforce(cliente);
                    this.updateSyncStats(result);
                }
                
                if (this.integrations.pipedrive.enabled) {
                    const result = await this.syncToPipedrive(cliente);
                    this.updateSyncStats(result);
                }
                
                // Pequena pausa para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            this.syncStatus.lastSync = new Date();
            this.syncStatus.inProgress = false;
            
            return {
                success: true,
                stats: this.syncStatus.stats,
                message: 'Sincronização concluída com sucesso'
            };
            
        } catch (error) {
            console.error('Erro na sincronização:', error);
            this.syncStatus.inProgress = false;
            return { success: false, message: error.message };
        }
    }

    updateSyncStats(result) {
        if (result.success) {
            if (result.action === 'created') {
                this.syncStatus.stats.created++;
            } else if (result.action === 'updated') {
                this.syncStatus.stats.updated++;
            }
        } else {
            this.syncStatus.stats.errors++;
        }
    }

    async importFromCRM() {
        const importedClients = [];
        
        try {
            // Importar do HubSpot
            if (this.integrations.hubspot.enabled) {
                const contacts = await this.getHubSpotContacts();
                for (const contact of contacts) {
                    const cliente = this.mapContactToClient(contact);
                    if (cliente.email) {
                        importedClients.push({ ...cliente, source: 'hubspot' });
                    }
                }
            }
            
            // Importar do Salesforce
            if (this.integrations.salesforce.enabled) {
                const contacts = await this.getSalesforceContacts();
                for (const contact of contacts) {
                    const cliente = this.mapSalesforceContactToClient(contact);
                    if (cliente.email) {
                        importedClients.push({ ...cliente, source: 'salesforce' });
                    }
                }
            }
            
            // Importar do Pipedrive
            if (this.integrations.pipedrive.enabled) {
                const persons = await this.getPipedrivePersons();
                for (const person of persons) {
                    const cliente = this.mapPipedrivePersonToClient(person);
                    if (cliente.email) {
                        importedClients.push({ ...cliente, source: 'pipedrive' });
                    }
                }
            }
            
            return { success: true, clients: importedClients };
            
        } catch (error) {
            console.error('Erro ao importar do CRM:', error);
            return { success: false, message: error.message };
        }
    }

    async getSalesforceContacts() {
        try {
            const response = await this.makeSalesforceRequest(
                '/services/data/v52.0/query?q=SELECT Id, FirstName, LastName, Email, Phone, MailingStreet, MailingCity, MailingState, MailingPostalCode FROM Contact LIMIT 1000'
            );
            
            return response.status === 200 ? response.data.records : [];
        } catch (error) {
            console.error('Erro ao buscar contatos do Salesforce:', error);
            return [];
        }
    }

    async getPipedrivePersons() {
        try {
            const response = await this.makePipedriveRequest('/persons', 'GET', null, { limit: 500 });
            
            return response.status === 200 ? response.data.data : [];
        } catch (error) {
            console.error('Erro ao buscar pessoas do Pipedrive:', error);
            return [];
        }
    }

    mapSalesforceContactToClient(contact) {
        return {
            nome: contact.FirstName || '',
            sobrenome: contact.LastName || '',
            email: contact.Email || '',
            telefone: contact.Phone || '',
            endereco: contact.MailingStreet || '',
            cidade: contact.MailingCity || '',
            estado: contact.MailingState || '',
            cep: contact.MailingPostalCode || ''
        };
    }

    mapPipedrivePersonToClient(person) {
        const [nome, ...sobrenomeParts] = (person.name || '').split(' ');
        return {
            nome: nome || '',
            sobrenome: sobrenomeParts.join(' '),
            email: person.email && person.email.length > 0 ? person.email[0].value : '',
            telefone: person.phone && person.phone.length > 0 ? person.phone[0].value : ''
        };
    }

    // ==================== INTERACTION LOGGING ====================

    async logInteraction(clientId, platform, action, details) {
        try {
            const interaction = {
                clientId,
                platform,
                action,
                details,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection('crmInteractions').add(interaction);
        } catch (error) {
            console.error('Erro ao registrar interação:', error);
        }
    }

    async getInteractionHistory(clientId) {
        try {
            const snapshot = await this.db
                .collection('crmInteractions')
                .where('clientId', '==', clientId)
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));
        } catch (error) {
            console.error('Erro ao buscar histórico de interações:', error);
            return [];
        }
    }

    // ==================== WEBHOOKS ====================

    async initWebhooks() {
        // Configurar webhooks para receber notificações dos CRMs
        this.webhooks.set('contact.created', []);
        this.webhooks.set('contact.updated', []);
        this.webhooks.set('contact.deleted', []);
    }

    async handleWebhook(platform, event, data) {
        try {
            switch (event) {
                case 'contact.created':
                    await this.handleContactCreated(platform, data);
                    break;
                case 'contact.updated':
                    await this.handleContactUpdated(platform, data);
                    break;
                case 'contact.deleted':
                    await this.handleContactDeleted(platform, data);
                    break;
            }
        } catch (error) {
            console.error('Erro ao processar webhook:', error);
        }
    }

    async handleContactCreated(platform, data) {
        // Lógica para lidar com criação de contato no CRM
        console.log(`Novo contato criado no ${platform}:`, data);
    }

    async handleContactUpdated(platform, data) {
        // Lógica para lidar com atualização de contato no CRM
        console.log(`Contato atualizado no ${platform}:`, data);
    }

    async handleContactDeleted(platform, data) {
        // Lógica para lidar com exclusão de contato no CRM
        console.log(`Contato excluído no ${platform}:`, data);
    }

    // ==================== AUTO SYNC ====================

    startAutoSync() {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
        }
        
        this.autoSyncTimer = setInterval(async () => {
            const enabledIntegrations = Object.values(this.integrations).filter(i => i.enabled);
            
            if (enabledIntegrations.length > 0) {
                console.log('Iniciando sincronização automática...');
                await this.syncAllClients();
            }
        }, 3600000); // 1 hora
    }

    stopAutoSync() {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
            this.autoSyncTimer = null;
        }
    }

    // ==================== UTILITY METHODS ====================

    async testConnection(platform) {
        try {
            switch (platform) {
                case 'hubspot':
                    if (!this.integrations.hubspot.enabled) return false;
                    const hubspotResponse = await this.makeHubSpotRequest('/contacts/v1/lists/all/contacts/all', 'GET', null, { count: 1 });
                    return hubspotResponse.status === 200;
                    
                case 'salesforce':
                    if (!this.integrations.salesforce.enabled) return false;
                    const salesforceResponse = await this.makeSalesforceRequest('/services/data/v52.0/query?q=SELECT Id FROM Contact LIMIT 1');
                    return salesforceResponse.status === 200;
                    
                case 'pipedrive':
                    if (!this.integrations.pipedrive.enabled) return false;
                    const pipedriveResponse = await this.makePipedriveRequest('/persons', 'GET', null, { limit: 1 });
                    return pipedriveResponse.status === 200;
                    
                default:
                    return false;
            }
        } catch (error) {
            console.error(`Erro ao testar conexão com ${platform}:`, error);
            return false;
        }
    }

    getEnabledIntegrations() {
        return Object.entries(this.integrations)
            .filter(([key, integration]) => integration.enabled)
            .map(([key, integration]) => ({
                key,
                name: integration.name,
                lastSync: integration.lastSync
            }));
    }

    getSyncStatus() {
        return { ...this.syncStatus };
    }

    async disconnect(platform) {
        if (this.integrations[platform]) {
            this.integrations[platform].enabled = false;
            this.integrations[platform].apiKey = '';
            this.integrations[platform].accessToken = '';
            this.integrations[platform].refreshToken = '';
            
            await this.saveSettings();
            return true;
        }
        return false;
    }
}

// Singleton instance
window.crmIntegrationManager = new CRMIntegrationManager();