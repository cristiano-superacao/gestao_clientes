// app.js - Aplicação principal
class GestaoClientesApp {
    constructor() {
        this.storage = new StorageManager();
        this.ui = new UIManager(this.storage);
        this.whatsapp = new WhatsAppManager(this.storage);
        this.initialize();
    }

    initialize() {
        console.log('Sistema de Gestão de Clientes inicializado');
        this.checkDataIntegrity();
        this.setupPeriodicTasks();
        this.addSampleData();
    }

    checkDataIntegrity() {
        // Verificar e corrigir dados inconsistentes
        const clientes = this.storage.getClientes();
        const pagamentos = this.storage.getPagamentos();
        
        // Remover pagamentos de clientes que não existem mais
        const clienteIds = clientes.map(c => c.id);
        const pagamentosValidos = pagamentos.filter(p => clienteIds.includes(p.clienteId));
        
        if (pagamentosValidos.length !== pagamentos.length) {
            this.storage.savePagamentos(pagamentosValidos);
            console.log('Dados de pagamentos corrigidos');
        }
    }

    setupPeriodicTasks() {
        // Verificar vencimentos a cada hora
        setInterval(() => {
            this.checkVencimentos();
        }, 3600000); // 1 hora

        // Verificar vencimentos na inicialização
        setTimeout(() => {
            this.checkVencimentos();
        }, 5000);
    }

    checkVencimentos() {
        const clientes = this.storage.getClientes().filter(c => c.status === 'Ativo');
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        let notificacoes = 0;

        clientes.forEach(cliente => {
            const vencimento = new Date(cliente.vencimento);
            vencimento.setHours(0, 0, 0, 0);
            
            const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
            
            // Notificar sobre vencimentos
            if (diffDias === 0) {
                this.notifyVencimentoHoje(cliente);
                notificacoes++;
            } else if (diffDias === 1) {
                this.notifyVencimentoAmanha(cliente);
                notificacoes++;
            } else if (diffDias < 0) {
                this.notifyVencimentoAtrasado(cliente, Math.abs(diffDias));
                notificacoes++;
            }
        });

        // Atualizar contador de notificações
        if (notificacoes > 0) {
            this.updateNotificationCount(notificacoes);
        }
    }

    notifyVencimentoHoje(cliente) {
        console.log(`Vencimento hoje: ${cliente.nome}`);
        this.storage.addAtividade(
            'Pagamento vence hoje',
            `Cliente ${cliente.nome} tem pagamento vencendo hoje`,
            'pagamento'
        );
    }

    notifyVencimentoAmanha(cliente) {
        console.log(`Vencimento amanhã: ${cliente.nome}`);
        this.storage.addAtividade(
            'Pagamento vence amanhã',
            `Cliente ${cliente.nome} tem pagamento vencendo amanhã`,
            'pagamento'
        );
    }

    notifyVencimentoAtrasado(cliente, dias) {
        console.log(`Pagamento atrasado: ${cliente.nome} (${dias} dias)`);
        this.storage.addAtividade(
            'Pagamento em atraso',
            `Cliente ${cliente.nome} está com pagamento atrasado há ${dias} dia(s)`,
            'pagamento'
        );
    }

    updateNotificationCount(count) {
        const badge = document.getElementById('notification-count');
        if (badge) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        }
    }

    addSampleData() {
        // Adicionar dados de exemplo se não existirem
        const clientes = this.storage.getClientes();
        
        if (clientes.length === 0) {
            const exemploClientes = [
                {
                    nome: 'João Silva',
                    whatsapp: '11999887766',
                    vencimento: '2025-01-15',
                    valor: 89.90,
                    status: 'Ativo',
                    observacoes: 'Cliente preferencial'
                },
                {
                    nome: 'Maria Santos',
                    whatsapp: '11988776655',
                    vencimento: '2025-01-20',
                    valor: 79.90,
                    status: 'Ativo',
                    observacoes: 'Pagamento via PIX'
                },
                {
                    nome: 'Pedro Costa',
                    whatsapp: '11977665544',
                    vencimento: '2025-01-10',
                    valor: 99.90,
                    status: 'Inativo',
                    observacoes: 'Conta suspensa temporariamente'
                }
            ];

            exemploClientes.forEach(cliente => {
                this.storage.addCliente(cliente);
            });

            // Adicionar alguns pagamentos de exemplo
            const clientesCriados = this.storage.getClientes();
            const exemploPagamentos = [
                {
                    clienteId: clientesCriados[0].id,
                    referencia: '2024-12',
                    dataPagamento: '2024-12-15',
                    valor: 89.90,
                    status: 'Pago'
                },
                {
                    clienteId: clientesCriados[1].id,
                    referencia: '2024-12',
                    dataPagamento: '2024-12-20',
                    valor: 79.90,
                    status: 'Pago'
                }
            ];

            exemploPagamentos.forEach(pagamento => {
                this.storage.addPagamento(pagamento);
            });

            console.log('Dados de exemplo adicionados');
        }
    }

    // Métodos utilitários públicos
    exportarDados() {
        const dados = this.storage.exportData();
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-gestao-clientes-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.ui.showNotification('Backup exportado com sucesso!', 'success');
    }

    importarDados(arquivo) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dados = JSON.parse(e.target.result);
                if (this.storage.importData(dados)) {
                    this.ui.showNotification('Dados importados com sucesso!', 'success');
                    this.ui.updateDashboard();
                    this.ui.loadClientes();
                    this.ui.loadPagamentos();
                } else {
                    this.ui.showNotification('Erro ao importar dados', 'error');
                }
            } catch (error) {
                console.error('Erro ao processar arquivo:', error);
                this.ui.showNotification('Arquivo inválido', 'error');
            }
        };
        reader.readAsText(arquivo);
    }

    limparDados() {
        if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
            this.storage.clearAllData();
            this.ui.showNotification('Todos os dados foram removidos', 'info');
            this.ui.updateDashboard();
            this.ui.loadClientes();
            this.ui.loadPagamentos();
        }
    }

    gerarRelatorio(tipo = 'geral', periodo = 'mes') {
        // Implementar geração de relatórios
        this.ui.showNotification('Funcionalidade de relatórios será implementada em breve', 'info');
    }
}

// WhatsApp Manager
class WhatsAppManager {
    constructor(storage) {
        this.storage = storage;
        this.config = storage.getConfiguracoes();
    }

    async enviarMensagem(clienteId, tipo = 'lembrete') {
        const cliente = this.storage.getClienteById(clienteId);
        if (!cliente) {
            throw new Error('Cliente não encontrado');
        }

        const mensagem = this.gerarMensagem(cliente, tipo);
        
        // Por enquanto, abrir WhatsApp Web
        const whatsappUrl = `https://wa.me/${cliente.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
        window.open(whatsappUrl, '_blank');
        
        this.storage.addAtividade('Mensagem enviada', `Mensagem de ${tipo} enviada para ${cliente.nome}`, 'mensagem');
        
        return true;
    }

    gerarMensagem(cliente, tipo) {
        const templates = this.config.mensagemTemplate;
        const hoje = new Date();
        const vencimento = new Date(cliente.vencimento);
        const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));

        let template = templates.lembrete;
        
        if (tipo === 'vencimento' || diffDias === 0) {
            template = templates.vencimento;
        } else if (tipo === 'atraso' || diffDias < 0) {
            template = templates.atraso;
        }

        return template
            .replace('{nome}', cliente.nome)
            .replace('{valor}', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cliente.valor))
            .replace('{dias}', Math.abs(diffDias));
    }

    configurarAPI(config) {
        this.config.whatsappApi = config;
        this.storage.saveConfiguracoes(this.config);
    }
}

// Inicializar aplicação
let app, storage, ui;

// WhatsApp Manager simplificado
class WhatsAppManager {
    constructor(storage) {
        this.storage = storage;
    }

    async sendPaymentReminder(clienteId) {
        try {
            const cliente = this.storage.getClienteById(clienteId);
            if (!cliente) throw new Error('Cliente não encontrado');

            const message = `Olá ${cliente.nome}! 👋\n\nLembramos que seu pagamento vence em breve.\n💰 Valor: R$ ${cliente.valor.toFixed(2)}\n📅 Vencimento: ${new Date(cliente.vencimento).toLocaleDateString('pt-BR')}\n\nQualquer dúvida, estamos à disposição!`;
            
            const phone = cliente.whatsapp.replace(/\D/g, '');
            const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            
            window.open(waLink, '_blank');
            
            this.storage.addAtividade(
                'Lembrete de pagamento enviado',
                `WhatsApp enviado para ${cliente.nome}`,
                'mensagem'
            );

            return { success: true, link: waLink };
        } catch (error) {
            console.error('Erro ao enviar lembrete:', error);
            throw error;
        }
    }

    async sendBulkReminders() {
        const clientes = this.storage.getClientes().filter(c => c.status === 'Ativo');
        const hoje = new Date();
        
        const vencendoAmanha = clientes.filter(cliente => {
            const vencimento = new Date(cliente.vencimento);
            const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
            return diffDias === 1;
        });

        let enviados = 0;
        for (const cliente of vencendoAmanha) {
            try {
                await this.sendPaymentReminder(cliente.id);
                enviados++;
                // Delay para evitar spam
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Erro ao enviar para ${cliente.nome}:`, error);
            }
        }

        return { enviados, total: vencendoAmanha.length };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    app = new GestaoClientesApp();
    storage = app.storage;
    ui = app.ui;
    
    // Expor funções globais necessárias
    window.app = app;
    window.storage = storage;
    window.ui = ui;
});

// Service Worker events
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    
    // Show install banner
    const banner = document.getElementById('install-banner');
    if (banner && !localStorage.getItem('install-dismissed')) {
        banner.classList.remove('hidden');
    }
});

window.addEventListener('appinstalled', () => {
    console.log('App instalado com sucesso');
    window.deferredPrompt = null;
    
    // Hide install banner
    document.getElementById('install-banner')?.classList.add('hidden');
});

// Handle offline/online events
window.addEventListener('online', () => {
    ui?.showNotification('Conexão restaurada', 'success');
});

window.addEventListener('offline', () => {
    ui?.showNotification('Sem conexão - Modo offline ativo', 'warning');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'n':
                e.preventDefault();
                ui?.openClienteModal();
                break;
            case 'p':
                e.preventDefault();
                ui?.openPagamentoModal();
                break;
            case 's':
                e.preventDefault();
                app?.exportarDados();
                break;
        }
    }
});