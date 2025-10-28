// API Integration Manager - v3.0.0
// Sistema de Gestão de Clientes - SENAI

class APIIntegrationManager {
    constructor() {
        this.apiEndpoints = {
            cep: {
                viacep: 'https://viacep.com.br/ws/{cep}/json/',
                awesomeapi: 'https://cep.awesomeapi.com.br/json/{cep}',
                postmon: 'http://api.postmon.com.br/v1/cep/{cep}'
            },
            cnpj: {
                receitaws: 'https://receitaws.com.br/v1/cnpj/{cnpj}',
                brasilapi: 'https://brasilapi.com.br/api/cnpj/v1/{cnpj}',
                consulta: 'https://www.consultacnpj.com/api/{cnpj}'
            },
            company: {
                clearbit: 'https://company.clearbit.com/v2/companies/find?domain={domain}',
                hunter: 'https://api.hunter.io/v2/domain-search?domain={domain}&api_key={key}'
            },
            validation: {
                email: 'https://api.hunter.io/v2/email-verifier?email={email}&api_key={key}',
                phone: 'https://phonevalidation.abstractapi.com/v1/?api_key={key}&phone={phone}'
            }
        };
        
        this.apiKeys = {
            hunter: localStorage.getItem('hunter_api_key') || '',
            clearbit: localStorage.getItem('clearbit_api_key') || '',
            abstract: localStorage.getItem('abstract_api_key') || ''
        };
        
        this.webhooks = [];
        this.rateLimits = new Map();
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        this.init();
    }
    
    async init() {
        console.log('🔌 API Integration Manager iniciando...');
        
        // Load webhooks from storage
        this.loadWebhooks();
        
        // Setup rate limiting
        this.setupRateLimiting();
        
        // Test API connectivity
        await this.testConnectivity();
        
        console.log('✅ API Integration Manager inicializado');
    }
    
    // CEP API Integration
    async validateCEP(cep) {
        try {
            const cleanCEP = cep.replace(/\D/g, '');
            
            if (cleanCEP.length !== 8) {
                throw new Error('CEP deve ter 8 dígitos');
            }
            
            // Check cache first
            const cacheKey = `cep_${cleanCEP}`;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log('🎯 CEP encontrado no cache:', cleanCEP);
                    return cached.data;
                }
            }
            
            // Try multiple APIs for reliability
            const apis = [
                this.fetchViaCEP(cleanCEP),
                this.fetchAwesomeAPICEP(cleanCEP)
            ];
            
            const result = await Promise.any(apis);
            
            if (result && !result.erro) {
                // Cache successful result
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });
                
                console.log('✅ CEP validado:', cleanCEP, result);
                return result;
            } else {
                throw new Error('CEP não encontrado');
            }
            
        } catch (error) {
            console.error('❌ Erro ao validar CEP:', error);
            throw error;
        }
    }
    
    async fetchViaCEP(cep) {
        const url = this.apiEndpoints.cep.viacep.replace('{cep}', cep);
        const response = await this.makeRequest(url, { timeout: 5000 });
        return response;
    }
    
    async fetchAwesomeAPICEP(cep) {
        const url = this.apiEndpoints.cep.awesomeapi.replace('{cep}', cep);
        const response = await this.makeRequest(url, { timeout: 5000 });
        
        // Convert AwesomeAPI format to ViaCEP format
        if (response && response.address) {
            return {
                cep: response.cep,
                logradouro: response.address,
                complemento: '',
                bairro: response.district,
                localidade: response.city,
                uf: response.state,
                ibge: response.city_ibge,
                gia: '',
                ddd: response.ddd,
                siafi: ''
            };
        }
        
        return response;
    }
    
    // CNPJ API Integration
    async validateCNPJ(cnpj) {
        try {
            const cleanCNPJ = cnpj.replace(/\D/g, '');
            
            if (cleanCNPJ.length !== 14) {
                throw new Error('CNPJ deve ter 14 dígitos');
            }
            
            // Validate CNPJ algorithm
            if (!this.isValidCNPJAlgorithm(cleanCNPJ)) {
                throw new Error('CNPJ inválido');
            }
            
            // Check cache first
            const cacheKey = `cnpj_${cleanCNPJ}`;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log('🎯 CNPJ encontrado no cache:', cleanCNPJ);
                    return cached.data;
                }
            }
            
            // Try multiple APIs for reliability
            const apis = [
                this.fetchReceitaWSCNPJ(cleanCNPJ),
                this.fetchBrasilAPICNPJ(cleanCNPJ)
            ];
            
            const result = await Promise.any(apis);
            
            if (result && result.status !== 'ERROR') {
                // Cache successful result
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });
                
                console.log('✅ CNPJ validado:', cleanCNPJ, result);
                return result;
            } else {
                throw new Error('CNPJ não encontrado ou inativo');
            }
            
        } catch (error) {
            console.error('❌ Erro ao validar CNPJ:', error);
            throw error;
        }
    }
    
    async fetchReceitaWSCNPJ(cnpj) {
        const url = this.apiEndpoints.cnpj.receitaws.replace('{cnpj}', cnpj);
        const response = await this.makeRequest(url, { timeout: 10000 });
        return response;
    }
    
    async fetchBrasilAPICNPJ(cnpj) {
        const url = this.apiEndpoints.cnpj.brasilapi.replace('{cnpj}', cnpj);
        const response = await this.makeRequest(url, { timeout: 8000 });
        
        // Convert BrasilAPI format to ReceitaWS format
        if (response && response.razao_social) {
            return {
                status: 'OK',
                nome: response.razao_social,
                fantasia: response.nome_fantasia,
                porte: response.porte,
                abertura: response.data_inicio_atividade,
                natureza_juridica: response.natureza_juridica,
                tipo: response.identificador_matriz_filial,
                situacao: response.descricao_situacao_cadastral,
                bairro: response.bairro,
                logradouro: response.logradouro,
                numero: response.numero,
                cep: response.cep,
                municipio: response.municipio,
                uf: response.uf,
                email: response.email,
                telefone: response.telefone,
                cnae_fiscal: response.cnae_fiscal,
                cnae_fiscal_descricao: response.cnae_fiscal_descricao
            };
        }
        
        return response;
    }
    
    // Email Validation
    async validateEmail(email) {
        try {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Formato de email inválido');
            }
            
            // Check cache
            const cacheKey = `email_${email}`;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }
            
            // Use Hunter.io API if key is available
            if (this.apiKeys.hunter) {
                const url = this.apiEndpoints.validation.email
                    .replace('{email}', email)
                    .replace('{key}', this.apiKeys.hunter);
                
                const result = await this.makeRequest(url, { timeout: 8000 });
                
                if (result && result.data) {
                    const validation = {
                        email: email,
                        valid: result.data.result === 'deliverable',
                        result: result.data.result,
                        score: result.data.score,
                        regexp: result.data.regexp,
                        gibberish: result.data.gibberish,
                        disposable: result.data.disposable,
                        webmail: result.data.webmail,
                        mx_records: result.data.mx_records,
                        smtp_server: result.data.smtp_server,
                        smtp_check: result.data.smtp_check,
                        accept_all: result.data.accept_all,
                        block: result.data.block
                    };
                    
                    // Cache result
                    this.cache.set(cacheKey, {
                        data: validation,
                        timestamp: Date.now()
                    });
                    
                    return validation;
                }
            }
            
            // Fallback to basic validation
            return {
                email: email,
                valid: true,
                result: 'basic_validation',
                score: 50,
                regexp: true,
                api_used: 'local'
            };
            
        } catch (error) {
            console.error('❌ Erro ao validar email:', error);
            return {
                email: email,
                valid: false,
                result: 'error',
                error: error.message
            };
        }
    }
    
    // Phone Validation
    async validatePhone(phone, country = 'BR') {
        try {
            const cleanPhone = phone.replace(/\D/g, '');
            
            // Basic Brazilian phone validation
            if (country === 'BR') {
                if (cleanPhone.length < 10 || cleanPhone.length > 11) {
                    throw new Error('Telefone brasileiro deve ter 10 ou 11 dígitos');
                }
            }
            
            // Check cache
            const cacheKey = `phone_${cleanPhone}`;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }
            
            // Use AbstractAPI if key is available
            if (this.apiKeys.abstract) {
                const url = this.apiEndpoints.validation.phone
                    .replace('{phone}', cleanPhone)
                    .replace('{key}', this.apiKeys.abstract);
                
                const result = await this.makeRequest(url, { timeout: 8000 });
                
                if (result) {
                    const validation = {
                        phone: phone,
                        clean_phone: cleanPhone,
                        valid: result.valid,
                        format: result.format,
                        country: result.country,
                        location: result.location,
                        type: result.type,
                        carrier: result.carrier
                    };
                    
                    // Cache result
                    this.cache.set(cacheKey, {
                        data: validation,
                        timestamp: Date.now()
                    });
                    
                    return validation;
                }
            }
            
            // Fallback to basic validation
            return {
                phone: phone,
                clean_phone: cleanPhone,
                valid: true,
                format: this.formatBrazilianPhone(cleanPhone),
                country: 'BR',
                type: cleanPhone.length === 11 ? 'mobile' : 'landline',
                api_used: 'local'
            };
            
        } catch (error) {
            console.error('❌ Erro ao validar telefone:', error);
            return {
                phone: phone,
                valid: false,
                error: error.message
            };
        }
    }
    
    // Company Information
    async getCompanyInfo(domain) {
        try {
            const cacheKey = `company_${domain}`;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }
            
            let companyInfo = {};
            
            // Try Clearbit API
            if (this.apiKeys.clearbit) {
                try {
                    const clearbitUrl = this.apiEndpoints.company.clearbit.replace('{domain}', domain);
                    const clearbitResult = await this.makeRequest(clearbitUrl, {
                        timeout: 10000,
                        headers: {
                            'Authorization': `Bearer ${this.apiKeys.clearbit}`
                        }
                    });
                    
                    if (clearbitResult) {
                        companyInfo.clearbit = {
                            name: clearbitResult.name,
                            domain: clearbitResult.domain,
                            description: clearbitResult.description,
                            founded: clearbitResult.foundedYear,
                            employees: clearbitResult.metrics?.employees,
                            industry: clearbitResult.category?.industry,
                            location: clearbitResult.geo,
                            logo: clearbitResult.logo,
                            website: clearbitResult.site?.url,
                            social: {
                                twitter: clearbitResult.twitter?.handle,
                                facebook: clearbitResult.facebook?.handle,
                                linkedin: clearbitResult.linkedin?.handle
                            }
                        };
                    }
                } catch (error) {
                    console.warn('⚠️ Clearbit API error:', error);
                }
            }
            
            // Try Hunter.io API
            if (this.apiKeys.hunter) {
                try {
                    const hunterUrl = this.apiEndpoints.company.hunter
                        .replace('{domain}', domain)
                        .replace('{key}', this.apiKeys.hunter);
                    
                    const hunterResult = await this.makeRequest(hunterUrl, { timeout: 10000 });
                    
                    if (hunterResult && hunterResult.data) {
                        companyInfo.hunter = {
                            domain: hunterResult.data.domain,
                            disposable: hunterResult.data.disposable,
                            webmail: hunterResult.data.webmail,
                            accept_all: hunterResult.data.accept_all,
                            pattern: hunterResult.data.pattern,
                            organization: hunterResult.data.organization,
                            emails: hunterResult.data.emails?.length || 0
                        };
                    }
                } catch (error) {
                    console.warn('⚠️ Hunter.io API error:', error);
                }
            }
            
            // Cache result if we got any data
            if (Object.keys(companyInfo).length > 0) {
                this.cache.set(cacheKey, {
                    data: companyInfo,
                    timestamp: Date.now()
                });
            }
            
            return companyInfo;
            
        } catch (error) {
            console.error('❌ Erro ao buscar informações da empresa:', error);
            throw error;
        }
    }
    
    // Data Import from External APIs
    async importDataFromAPI(apiConfig) {
        try {
            console.log('📥 Importando dados da API:', apiConfig.name);
            
            const { url, headers, method = 'GET', dataPath, mapping } = apiConfig;
            
            const response = await this.makeRequest(url, {
                method: method,
                headers: headers,
                timeout: 30000
            });
            
            if (!response) {
                throw new Error('Nenhum dado retornado da API');
            }
            
            // Extract data using dataPath
            let data = response;
            if (dataPath) {
                const pathParts = dataPath.split('.');
                for (const part of pathParts) {
                    data = data[part];
                    if (!data) break;
                }
            }
            
            if (!Array.isArray(data)) {
                data = [data];
            }
            
            // Map data to our client format
            const mappedData = data.map(item => this.mapDataToClient(item, mapping));
            
            console.log(`✅ ${mappedData.length} registros importados da API`);
            return mappedData;
            
        } catch (error) {
            console.error('❌ Erro ao importar dados da API:', error);
            throw error;
        }
    }
    
    // Webhook Management
    registerWebhook(webhook) {
        const id = 'webhook_' + Date.now();
        const webhookData = {
            id: id,
            name: webhook.name,
            url: webhook.url,
            events: webhook.events || ['client.created', 'client.updated', 'client.deleted'],
            active: webhook.active !== false,
            secret: webhook.secret || this.generateWebhookSecret(),
            created: new Date().toISOString()
        };
        
        this.webhooks.push(webhookData);
        this.saveWebhooks();
        
        console.log('🔗 Webhook registrado:', webhookData);
        return webhookData;
    }
    
    async triggerWebhook(event, data) {
        const activeWebhooks = this.webhooks.filter(w => w.active && w.events.includes(event));
        
        if (activeWebhooks.length === 0) {
            return;
        }
        
        console.log(`🔔 Disparando webhooks para evento: ${event}`);
        
        const promises = activeWebhooks.map(webhook => 
            this.sendWebhook(webhook, event, data)
        );
        
        await Promise.allSettled(promises);
    }
    
    async sendWebhook(webhook, event, data) {
        try {
            const payload = {
                event: event,
                data: data,
                timestamp: new Date().toISOString(),
                webhook_id: webhook.id
            };
            
            const signature = this.generateWebhookSignature(payload, webhook.secret);
            
            const response = await this.makeRequest(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'User-Agent': 'GestaoClientes-Webhook/1.0'
                },
                body: JSON.stringify(payload),
                timeout: 10000
            });
            
            console.log(`✅ Webhook enviado: ${webhook.name} - ${event}`);
            return response;
            
        } catch (error) {
            console.error(`❌ Erro ao enviar webhook ${webhook.name}:`, error);
            throw error;
        }
    }
    
    // Rate Limiting
    setupRateLimiting() {
        // Clear rate limits every minute
        setInterval(() => {
            this.rateLimits.clear();
        }, 60000);
    }
    
    checkRateLimit(endpoint, limit = 60) {
        const key = `rate_${endpoint}`;
        const current = this.rateLimits.get(key) || 0;
        
        if (current >= limit) {
            throw new Error(`Rate limit excedido para ${endpoint}`);
        }
        
        this.rateLimits.set(key, current + 1);
        return true;
    }
    
    // HTTP Request Helper
    async makeRequest(url, options = {}) {
        try {
            const {
                method = 'GET',
                headers = {},
                body,
                timeout = 10000
            } = options;
            
            // Check rate limit
            const endpoint = new URL(url).hostname;
            this.checkRateLimit(endpoint);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const requestOptions = {
                method: method,
                headers: {
                    'User-Agent': 'GestaoClientes/3.0.0',
                    ...headers
                },
                signal: controller.signal
            };
            
            if (body) {
                requestOptions.body = body;
            }
            
            const response = await fetch(url, requestOptions);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }
    
    // Utility Functions
    isValidCNPJAlgorithm(cnpj) {
        if (cnpj.length !== 14) return false;
        
        // Check if all digits are the same
        if (/^(\d)\1+$/.test(cnpj)) return false;
        
        // Validate check digits
        let sum = 0;
        let weight = 2;
        
        for (let i = 11; i >= 0; i--) {
            sum += parseInt(cnpj[i]) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }
        
        const digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (parseInt(cnpj[12]) !== digit1) return false;
        
        sum = 0;
        weight = 2;
        
        for (let i = 12; i >= 0; i--) {
            sum += parseInt(cnpj[i]) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }
        
        const digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        return parseInt(cnpj[13]) === digit2;
    }
    
    formatBrazilianPhone(phone) {
        if (phone.length === 11) {
            return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (phone.length === 10) {
            return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    }
    
    mapDataToClient(item, mapping) {
        const client = {};
        
        for (const [clientField, apiField] of Object.entries(mapping)) {
            if (typeof apiField === 'string') {
                client[clientField] = this.getNestedValue(item, apiField);
            } else if (typeof apiField === 'function') {
                client[clientField] = apiField(item);
            }
        }
        
        return client;
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
    }
    
    generateWebhookSecret() {
        return 'wh_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    generateWebhookSignature(payload, secret) {
        // Simple signature - in production use HMAC-SHA256
        const data = JSON.stringify(payload) + secret;
        return btoa(data).substring(0, 32);
    }
    
    // Storage
    saveWebhooks() {
        localStorage.setItem('api_webhooks', JSON.stringify(this.webhooks));
    }
    
    loadWebhooks() {
        try {
            const saved = localStorage.getItem('api_webhooks');
            if (saved) {
                this.webhooks = JSON.parse(saved);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar webhooks:', error);
            this.webhooks = [];
        }
    }
    
    // API Keys Management
    setAPIKey(service, key) {
        this.apiKeys[service] = key;
        localStorage.setItem(`${service}_api_key`, key);
        console.log(`🔑 API Key configurada para ${service}`);
    }
    
    getAPIKey(service) {
        return this.apiKeys[service];
    }
    
    // Connectivity Test
    async testConnectivity() {
        console.log('🔍 Testando conectividade das APIs...');
        
        const tests = [
            { name: 'ViaCEP', test: () => this.fetchViaCEP('01310-100') },
            { name: 'ReceitaWS', test: () => this.fetchReceitaWSCNPJ('11222333000181') }
        ];
        
        const results = {};
        
        for (const test of tests) {
            try {
                await test.test();
                results[test.name] = 'online';
                console.log(`✅ ${test.name}: Online`);
            } catch (error) {
                results[test.name] = 'offline';
                console.log(`❌ ${test.name}: Offline`);
            }
        }
        
        return results;
    }
    
    // Statistics
    getAPIStats() {
        const cacheSize = this.cache.size;
        const webhookCount = this.webhooks.length;
        const activeWebhooks = this.webhooks.filter(w => w.active).length;
        
        return {
            cache_size: cacheSize,
            webhooks_total: webhookCount,
            webhooks_active: activeWebhooks,
            api_keys_configured: Object.values(this.apiKeys).filter(key => key).length,
            rate_limits: this.rateLimits.size
        };
    }
    
    // Clear cache
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache de APIs limpo');
    }
    
    // Validate complete client data
    async validateCompleteClient(clientData) {
        const results = {
            client: clientData,
            validations: {},
            errors: [],
            warnings: []
        };
        
        try {
            // Validate CEP
            if (clientData.cep) {
                try {
                    const cepData = await this.validateCEP(clientData.cep);
                    results.validations.cep = cepData;
                    
                    // Auto-fill address if empty
                    if (!clientData.address && cepData.logradouro) {
                        results.client.address = cepData.logradouro;
                        results.client.neighborhood = cepData.bairro;
                        results.client.city = cepData.localidade;
                        results.client.state = cepData.uf;
                    }
                } catch (error) {
                    results.errors.push(`CEP: ${error.message}`);
                }
            }
            
            // Validate CNPJ
            if (clientData.cnpj) {
                try {
                    const cnpjData = await this.validateCNPJ(clientData.cnpj);
                    results.validations.cnpj = cnpjData;
                    
                    // Auto-fill company info if empty
                    if (!clientData.company_name && cnpjData.nome) {
                        results.client.company_name = cnpjData.nome;
                        results.client.fantasy_name = cnpjData.fantasia;
                    }
                } catch (error) {
                    results.errors.push(`CNPJ: ${error.message}`);
                }
            }
            
            // Validate Email
            if (clientData.email) {
                try {
                    const emailData = await this.validateEmail(clientData.email);
                    results.validations.email = emailData;
                    
                    if (!emailData.valid) {
                        results.warnings.push(`Email pode ser inválido: ${emailData.result}`);
                    }
                } catch (error) {
                    results.errors.push(`Email: ${error.message}`);
                }
            }
            
            // Validate Phone
            if (clientData.phone) {
                try {
                    const phoneData = await this.validatePhone(clientData.phone);
                    results.validations.phone = phoneData;
                    
                    // Format phone number
                    if (phoneData.format) {
                        results.client.phone = phoneData.format;
                    }
                } catch (error) {
                    results.errors.push(`Telefone: ${error.message}`);
                }
            }
            
            console.log('✅ Validação completa do cliente finalizada');
            return results;
            
        } catch (error) {
            console.error('❌ Erro na validação completa:', error);
            results.errors.push(`Erro geral: ${error.message}`);
            return results;
        }
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.apiIntegrationManager = new APIIntegrationManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIIntegrationManager;
}