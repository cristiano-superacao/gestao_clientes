// storage.js - Gerenciamento de dados local
class StorageManager {
    constructor() {
        this.keys = {
            clientes: 'gestao_clientes',
            pagamentos: 'gestao_pagamentos',
            configuracoes: 'gestao_configuracoes',
            atividades: 'gestao_atividades'
        };
        this.initializeData();
        this.apiBase = window.location.origin; // usa o mesmo host (server) se disponível
    }

    initializeData() {
        // Inicializar dados se não existirem
        if (!this.getClientes()) {
            this.saveClientes([]);
        }
        if (!this.getPagamentos()) {
            this.savePagamentos([]);
        }
        if (!this.getConfiguracoes()) {
            this.saveConfiguracoes(this.getDefaultConfig());
        }
        if (!this.getAtividades()) {
            this.saveAtividades([]);
        }
    }

    getDefaultConfig() {
        return {
            theme: 'light',
            notifications: true,
            whatsappApi: {
                provider: '',
                apiKey: '',
                endpoint: ''
            },
            mensagemTemplate: {
                lembrete: 'Olá {nome}, lembramos que seu pagamento vence em {dias} dia(s). Valor: R$ {valor}',
                vencimento: 'Olá {nome}, seu pagamento vence hoje. Por favor, efetue o pagamento de R$ {valor}',
                atraso: 'Olá {nome}, seu pagamento está em atraso desde {dias} dia(s). Valor: R$ {valor}'
            }
        };
    }

    // Clientes
    getClientes() {
        // Tenta buscar via API
        if (navigator.onLine) {
            try {
                // Sincronização síncrona não é possível aqui, então retornamos localStorage e tentamos atualizar em background
                fetch(`${this.apiBase}/api/clientes`).then(r => r.json()).then(data => {
                    if (Array.isArray(data)) this.saveClientes(data);
                }).catch(() => {});
            } catch (e) {}
        }

        try {
            return JSON.parse(localStorage.getItem(this.keys.clientes)) || [];
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            return [];
        }
    }

    saveClientes(clientes) {
        try {
            localStorage.setItem(this.keys.clientes, JSON.stringify(clientes));
            return true;
        } catch (error) {
            console.error('Erro ao salvar clientes:', error);
            return false;
        }
    }

    addCliente(cliente) {
        // Se tiver backend, envia para API
        if (navigator.onLine) {
            return fetch(`${this.apiBase}/api/clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cliente)
            }).then(r => r.json()).then(data => {
                // Atualiza cache local
                const clientes = this.getClientes();
                clientes.push(data);
                this.saveClientes(clientes);
                this.addAtividade('Novo cliente cadastrado', `Cliente ${data.nome} foi adicionado ao sistema`, 'cliente');
                return data;
            }).catch(err => {
                console.error('Erro ao adicionar cliente via API', err);
                // fallback local
                const clientes = this.getClientes();
                cliente.id = this.generateId();
                cliente.dataCriacao = new Date().toISOString();
                clientes.push(cliente);
                this.saveClientes(clientes);
                this.addAtividade('Novo cliente cadastrado (offline)', `Cliente ${cliente.nome} foi adicionado offline`, 'cliente');
                return cliente;
            });
        }

        // Offline fallback
        const clientes = this.getClientes();
        cliente.id = this.generateId();
        cliente.dataCriacao = new Date().toISOString();
        clientes.push(cliente);
        if (this.saveClientes(clientes)) {
            this.addAtividade('Novo cliente cadastrado (offline)', `Cliente ${cliente.nome} foi adicionado offline`, 'cliente');
            return cliente;
        }
        return null;
    }

    updateCliente(id, dadosAtualizados) {
        if (navigator.onLine) {
            return fetch(`${this.apiBase}/api/clientes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAtualizados)
            }).then(r => r.json()).then(data => {
                const clientes = this.getClientes();
                const idx = clientes.findIndex(c => c.id === id);
                if (idx !== -1) clientes[idx] = data;
                this.saveClientes(clientes);
                this.addAtividade('Cliente atualizado', `Cliente ${data.nome} foi atualizado`, 'cliente');
                return data;
            }).catch(err => {
                console.error('Erro ao atualizar via API', err);
                // fallback local
            });
        }

        const clientes = this.getClientes();
        const index = clientes.findIndex(c => c.id === id);
        
        if (index !== -1) {
            clientes[index] = { ...clientes[index], ...dadosAtualizados, dataAtualizacao: new Date().toISOString() };
            if (this.saveClientes(clientes)) {
                this.addAtividade('Cliente atualizado', `Cliente ${clientes[index].nome} foi atualizado`, 'cliente');
                return clientes[index];
            }
        }
        return null;
    }

    deleteCliente(id) {
        if (navigator.onLine) {
            return fetch(`${this.apiBase}/api/clientes/${id}`, { method: 'DELETE' }).then(r => {
                if (r.status === 200) {
                    const clientes = this.getClientes().filter(c => c.id !== id);
                    this.saveClientes(clientes);
                    this.addAtividade('Cliente removido', `Cliente removido do sistema`, 'cliente');
                    return true;
                }
                return false;
            }).catch(err => {
                console.error('Erro ao deletar via API', err);
                return false;
            });
        }

        const clientes = this.getClientes();
        const cliente = clientes.find(c => c.id === id);
        
        if (cliente) {
            const novosClientes = clientes.filter(c => c.id !== id);
            if (this.saveClientes(novosClientes)) {
                this.addAtividade('Cliente removido', `Cliente ${cliente.nome} foi removido do sistema`, 'cliente');
                return true;
            }
        }
        return false;
    }

    getClienteById(id) {
        return this.getClientes().find(c => c.id === id);
    }

    // Pagamentos
    getPagamentos() {
        if (navigator.onLine) {
            try {
                fetch(`${this.apiBase}/api/pagamentos`).then(r => r.json()).then(data => {
                    if (Array.isArray(data)) this.savePagamentos(data);
                }).catch(() => {});
            } catch (e) {}
        }

        try {
            return JSON.parse(localStorage.getItem(this.keys.pagamentos)) || [];
        } catch (error) {
            console.error('Erro ao carregar pagamentos:', error);
            return [];
        }
    }

    savePagamentos(pagamentos) {
        try {
            localStorage.setItem(this.keys.pagamentos, JSON.stringify(pagamentos));
            return true;
        } catch (error) {
            console.error('Erro ao salvar pagamentos:', error);
            return false;
        }
    }

    addPagamento(pagamento) {
        if (navigator.onLine) {
            return fetch(`${this.apiBase}/api/pagamentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pagamento)
            }).then(r => r.json()).then(data => {
                const pagamentos = this.getPagamentos();
                pagamentos.push(data);
                this.savePagamentos(pagamentos);
                const cliente = this.getClienteById(data.clienteId);
                this.addAtividade('Pagamento registrado', `Pagamento de ${cliente?.nome || 'Cliente'} foi registrado`, 'pagamento');
                return data;
            }).catch(err => {
                console.error('Erro ao adicionar pagamento via API', err);
                // fallback offline
            });
        }

        const pagamentos = this.getPagamentos();
        pagamento.id = this.generateId();
        pagamento.dataCriacao = new Date().toISOString();
        pagamentos.push(pagamento);
        if (this.savePagamentos(pagamentos)) {
            const cliente = this.getClienteById(pagamento.clienteId);
            this.addAtividade('Pagamento registrado (offline)', `Pagamento de ${cliente?.nome || 'Cliente'} foi registrado offline`, 'pagamento');
            return pagamento;
        }
        return null;
    }

    updatePagamento(id, dadosAtualizados) {
        if (navigator.onLine) {
            return fetch(`${this.apiBase}/api/pagamentos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAtualizados)
            }).then(r => r.json()).then(data => {
                const pagamentos = this.getPagamentos();
                const idx = pagamentos.findIndex(p => p.id === id);
                if (idx !== -1) pagamentos[idx] = data;
                this.savePagamentos(pagamentos);
                return data;
            }).catch(err => {
                console.error('Erro ao atualizar pagamento via API', err);
            });
        }

        const pagamentos = this.getPagamentos();
        const index = pagamentos.findIndex(p => p.id === id);
        
        if (index !== -1) {
            pagamentos[index] = { ...pagamentos[index], ...dadosAtualizados, dataAtualizacao: new Date().toISOString() };
            if (this.savePagamentos(pagamentos)) {
                return pagamentos[index];
            }
        }
        return null;
    }

    deletePagamento(id) {
        if (navigator.onLine) {
            return fetch(`${this.apiBase}/api/pagamentos/${id}`, { method: 'DELETE' }).then(r => {
                if (r.status === 200) {
                    const pagamentos = this.getPagamentos().filter(p => p.id !== id);
                    this.savePagamentos(pagamentos);
                    return true;
                }
                return false;
            }).catch(err => {
                console.error('Erro ao deletar pagamento via API', err);
                return false;
            });
        }

        const pagamentos = this.getPagamentos();
        const novosPagamentos = pagamentos.filter(p => p.id !== id);
        return this.savePagamentos(novosPagamentos);
    }

    // Configurações
    getConfiguracoes() {
        try {
            return JSON.parse(localStorage.getItem(this.keys.configuracoes)) || this.getDefaultConfig();
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            return this.getDefaultConfig();
        }
    }

    saveConfiguracoes(config) {
        try {
            localStorage.setItem(this.keys.configuracoes, JSON.stringify(config));
            return true;
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            return false;
        }
    }

    // Atividades
    getAtividades() {
        try {
            return JSON.parse(localStorage.getItem(this.keys.atividades)) || [];
        } catch (error) {
            console.error('Erro ao carregar atividades:', error);
            return [];
        }
    }

    saveAtividades(atividades) {
        try {
            localStorage.setItem(this.keys.atividades, JSON.stringify(atividades));
            return true;
        } catch (error) {
            console.error('Erro ao salvar atividades:', error);
            return false;
        }
    }

    addAtividade(titulo, descricao, tipo = 'geral') {
        const atividades = this.getAtividades();
        const atividade = {
            id: this.generateId(),
            titulo,
            descricao,
            tipo,
            data: new Date().toISOString()
        };
        
        atividades.unshift(atividade); // Adiciona no início
        
        // Manter apenas as últimas 50 atividades
        if (atividades.length > 50) {
            atividades.splice(50);
        }
        
        this.saveAtividades(atividades);
        return atividade;
    }

    // Utilitários
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    exportData() {
        return {
            clientes: this.getClientes(),
            pagamentos: this.getPagamentos(),
            configuracoes: this.getConfiguracoes(),
            atividades: this.getAtividades(),
            dataExportacao: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            if (data.clientes) this.saveClientes(data.clientes);
            if (data.pagamentos) this.savePagamentos(data.pagamentos);
            if (data.configuracoes) this.saveConfiguracoes(data.configuracoes);
            if (data.atividades) this.saveAtividades(data.atividades);
            
            this.addAtividade('Dados importados', 'Backup foi restaurado com sucesso', 'sistema');
            return true;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }

    clearAllData() {
        Object.values(this.keys).forEach(key => {
            localStorage.removeItem(key);
        });
        this.initializeData();
    }

    // Estatísticas
    getEstatisticas() {
        const clientes = this.getClientes();
        const pagamentos = this.getPagamentos();
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        
        const clientesAtivos = clientes.filter(c => c.status === 'Ativo');
        const pagamentosMes = pagamentos.filter(p => {
            const dataPagamento = new Date(p.dataPagamento);
            return dataPagamento >= inicioMes && dataPagamento <= hoje;
        });
        
        const valorTotalMes = pagamentosMes.reduce((total, p) => {
            return total + (parseFloat(p.valor) || 0);
        }, 0);
        
        const pagamentosAtrasados = clientes.filter(c => {
            if (c.status !== 'Ativo') return false;
            const vencimento = new Date(c.vencimento);
            return vencimento < hoje;
        });
        
        return {
            totalClientes: clientes.length,
            clientesAtivos: clientesAtivos.length,
            valorMes: valorTotalMes,
            pagamentosAtrasados: pagamentosAtrasados.length
        };
    }

    // Busca
    buscarClientes(termo) {
        const clientes = this.getClientes();
        const termoLower = termo.toLowerCase();
        
        return clientes.filter(cliente => 
            cliente.nome.toLowerCase().includes(termoLower) ||
            cliente.whatsapp.includes(termo) ||
            (cliente.observacoes && cliente.observacoes.toLowerCase().includes(termoLower))
        );
    }

    filtrarClientes(filtros) {
        let clientes = this.getClientes();
        
        if (filtros.status) {
            clientes = clientes.filter(c => c.status === filtros.status);
        }
        
        if (filtros.vencimento) {
            const hoje = new Date();
            clientes = clientes.filter(c => {
                const vencimento = new Date(c.vencimento);
                
                switch (filtros.vencimento) {
                    case 'hoje':
                        return vencimento.toDateString() === hoje.toDateString();
                    case 'amanha':
                        const amanha = new Date(hoje);
                        amanha.setDate(hoje.getDate() + 1);
                        return vencimento.toDateString() === amanha.toDateString();
                    case 'semana':
                        const fimSemana = new Date(hoje);
                        fimSemana.setDate(hoje.getDate() + 7);
                        return vencimento >= hoje && vencimento <= fimSemana;
                    case 'atrasado':
                        return vencimento < hoje;
                    default:
                        return true;
                }
            });
        }
        
        return clientes;
    }
}

// Exportar para escopo global
window.StorageManager = StorageManager;