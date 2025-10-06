// js/whatsapp.js - Integração melhorada com WhatsApp
class WhatsAppIntegration {
    constructor(storage) {
        this.storage = storage;
        this.apiBase = window.location.origin;
        this.templates = this.getTemplates();
    }

    getTemplates() {
        const config = this.storage.getConfiguracoes();
        return config.mensagemTemplate || {
            lembrete: 'Olá {nome}! 👋\n\nLembramos que seu pagamento vence em {dias} dia(s).\n💰 Valor: {valor}\n📅 Vencimento: {vencimento}\n\nQualquer dúvida, estamos à disposição!',
            vencimento: 'Olá {nome}! ⏰\n\nSeu pagamento vence HOJE!\n💰 Valor: {valor}\n\nPor favor, efetue o pagamento para manter seu serviço ativo.',
            atraso: 'Olá {nome}! ⚠️\n\nSeu pagamento está em atraso há {dias} dia(s).\n💰 Valor: {valor}\n📅 Venceu em: {vencimento}\n\nPor favor, regularize sua situação o quanto antes.',
            confirmacao: 'Olá {nome}! ✅\n\nRecebemos seu pagamento de {valor}!\n📅 Data: {dataPagamento}\n\nObrigado pela confiança! 😊',
            boas_vindas: 'Olá {nome}! 🎉\n\nSeja bem-vindo(a) ao nosso sistema!\n💰 Valor mensal: {valor}\n📅 Vencimento: todo dia {vencimento}\n\nEstamos aqui para ajudar! 💪'
        };
    }

    formatMessage(template, cliente, extraData = {}) {
        const hoje = new Date();
        const vencimento = new Date(cliente.vencimento);
        const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));

        const replacements = {
            '{nome}': cliente.nome,
            '{valor}': this.formatCurrency(cliente.valor),
            '{vencimento}': this.formatDate(cliente.vencimento),
            '{dias}': Math.abs(diffDias),
            '{whatsapp}': this.formatPhone(cliente.whatsapp),
            ...extraData
        };

        let message = template;
        Object.entries(replacements).forEach(([key, value]) => {
            message = message.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
        });

        return message;
    }

    async sendMessage(clienteId, templateType = 'lembrete', extraData = {}) {
        const cliente = this.storage.getClienteById(clienteId);
        if (!cliente) {
            throw new Error('Cliente não encontrado');
        }

        const template = this.templates[templateType] || this.templates.lembrete;
        const message = this.formatMessage(template, cliente, extraData);
        
        const phoneNumber = cliente.whatsapp.replace(/\D/g, '');
        
        try {
            // Tentar enviar via API backend primeiro
            const response = await fetch(`${this.apiBase}/api/send-whatsapp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: phoneNumber,
                    message: message
                })
            });

            const result = await response.json();
            
            if (result.ok) {
                // Sucesso via Twilio
                this.storage.addAtividade(
                    'Mensagem enviada via API',
                    `WhatsApp enviado para ${cliente.nome} via Twilio`,
                    'mensagem'
                );
                return { success: true, method: 'api', sid: result.sid };
            } else if (result.fallback && result.waLink) {
                // Fallback para WhatsApp Web
                window.open(result.waLink, '_blank');
                this.storage.addAtividade(
                    'Mensagem redirecionada',
                    `WhatsApp Web aberto para ${cliente.nome}`,
                    'mensagem'
                );
                return { success: true, method: 'web', link: result.waLink };
            }
        } catch (error) {
            console.error('Erro na API, usando fallback:', error);
        }

        // Fallback direto para WhatsApp Web
        const waLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(waLink, '_blank');
        
        this.storage.addAtividade(
            'Mensagem via WhatsApp Web',
            `Link WhatsApp aberto para ${cliente.nome}`,
            'mensagem'
        );
        
        return { success: true, method: 'web', link: waLink };
    }

    async sendBulkMessages(clienteIds, templateType = 'lembrete', delay = 2000) {
        const results = [];
        
        for (let i = 0; i < clienteIds.length; i++) {
            const clienteId = clienteIds[i];
            
            try {
                const result = await this.sendMessage(clienteId, templateType);
                results.push({ clienteId, success: true, result });
                
                // Delay entre mensagens para evitar spam
                if (i < clienteIds.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } catch (error) {
                results.push({ clienteId, success: false, error: error.message });
            }
        }
        
        return results;
    }

    async sendPaymentReminders() {
        const clientes = this.storage.getClientes().filter(c => c.status === 'Ativo');
        const hoje = new Date();
        
        const vencendoHoje = [];
        const vencendoAmanha = [];
        const atrasados = [];
        
        clientes.forEach(cliente => {
            const vencimento = new Date(cliente.vencimento);
            vencimento.setHours(0, 0, 0, 0);
            hoje.setHours(0, 0, 0, 0);
            
            const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
            
            if (diffDias === 0) {
                vencendoHoje.push(cliente.id);
            } else if (diffDias === 1) {
                vencendoAmanha.push(cliente.id);
            } else if (diffDias < 0) {
                atrasados.push(cliente.id);
            }
        });
        
        const results = {
            vencendoHoje: [],
            vencendoAmanha: [],
            atrasados: []
        };
        
        // Enviar para quem vence hoje
        if (vencendoHoje.length > 0) {
            results.vencendoHoje = await this.sendBulkMessages(vencendoHoje, 'vencimento', 3000);
        }
        
        // Enviar para quem vence amanhã
        if (vencendoAmanha.length > 0) {
            results.vencendoAmanha = await this.sendBulkMessages(vencendoAmanha, 'lembrete', 3000);
        }
        
        // Enviar para atrasados
        if (atrasados.length > 0) {
            results.atrasados = await this.sendBulkMessages(atrasados, 'atraso', 4000);
        }
        
        return results;
    }

    createCustomTemplate(name, template) {
        const config = this.storage.getConfiguracoes();
        if (!config.mensagemTemplate) {
            config.mensagemTemplate = this.getTemplates();
        }
        config.mensagemTemplate[name] = template;
        this.storage.saveConfiguracoes(config);
        this.templates = config.mensagemTemplate;
    }

    getAvailableVariables() {
        return [
            '{nome}', '{valor}', '{vencimento}', '{dias}', '{whatsapp}',
            '{dataPagamento}', '{valorPago}', '{referencia}'
        ];
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        }
        return phone;
    }

    // Verificar status da integração
    async checkIntegrationStatus() {
        try {
            const response = await fetch(`${this.apiBase}/api/health`);
            const health = await response.json();
            
            // Verificar se Twilio está configurado
            const testResponse = await fetch(`${this.apiBase}/api/send-whatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: '5511999999999', message: 'test' })
            });
            
            const testResult = await testResponse.json();
            
            return {
                backendOnline: true,
                twilioConfigured: testResult.ok === true,
                fallbackAvailable: testResult.fallback === true
            };
        } catch (error) {
            return {
                backendOnline: false,
                twilioConfigured: false,
                fallbackAvailable: true
            };
        }
    }
}

// Compatibilidade com o nome esperado pela aplicação
class WhatsAppManager extends WhatsAppIntegration {}

// Exportar para escopo global
window.WhatsAppManager = WhatsAppManager;
window.WhatsAppIntegration = WhatsAppIntegration;