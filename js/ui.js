// ui.js - Gerenciamento da interface do usuário
class UIManager {
    constructor(storage) {
        this.storage = storage;
        this.currentPage = 'dashboard';
        this.editingId = null;
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.setupTheme();
        this.hideSplashScreen();
        this.updateDashboard();
        this.checkInstallPrompt();
    }

    setupEventListeners() {
        // Menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        
        menuToggle?.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            menuToggle.classList.toggle('active');
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Action cards
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.page;
                const action = card.dataset.action;
                
                if (action === 'add') {
                    this.navigateToPage(page);
                    setTimeout(() => {
                        if (page === 'clientes') this.openClienteModal();
                        if (page === 'pagamentos') this.openPagamentoModal();
                    }, 100);
                } else {
                    this.navigateToPage(page);
                }
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Buttons
        document.getElementById('add-cliente')?.addEventListener('click', () => this.openClienteModal());
        document.getElementById('add-pagamento')?.addEventListener('click', () => this.openPagamentoModal());
        document.getElementById('refresh-data')?.addEventListener('click', () => this.updateDashboard());

        // Forms
        document.getElementById('form-cliente')?.addEventListener('submit', (e) => this.handleClienteSubmit(e));
        document.getElementById('form-pagamento')?.addEventListener('submit', (e) => this.handlePagamentoSubmit(e));

        // Modal controls
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                this.closeModal();
            }
        });

        // Search and filters
        document.getElementById('search-clientes')?.addEventListener('input', (e) => {
            this.searchClientes(e.target.value);
        });

        document.getElementById('filter-status')?.addEventListener('change', () => {
            this.applyClienteFilters();
        });

        document.getElementById('filter-vencimento')?.addEventListener('change', () => {
            this.applyClienteFilters();
        });

        // FAB
        document.getElementById('fab')?.addEventListener('click', () => {
            this.openClienteModal();
        });

        // WhatsApp functionality
        document.getElementById('btn-config-whatsapp')?.addEventListener('click', () => {
            this.openWhatsAppModal();
        });

        document.getElementById('btn-envio-automatico')?.addEventListener('click', () => {
            this.sendAutomaticReminders();
        });

        document.getElementById('btn-lembretes-vencimento')?.addEventListener('click', () => {
            this.sendVencimentoReminders();
        });

        document.getElementById('btn-cobrar-atrasados')?.addEventListener('click', () => {
            this.sendAtrasadosReminders();
        });

        document.getElementById('btn-salvar-templates')?.addEventListener('click', () => {
            this.saveWhatsAppTemplates();
        });

        document.getElementById('btn-test-whatsapp')?.addEventListener('click', () => {
            this.testWhatsAppIntegration();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    setupTheme() {
        const config = this.storage.getConfiguracoes();
        if (config.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.querySelector('.theme-icon').textContent = '☀️';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        document.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
        const config = this.storage.getConfiguracoes();
        config.theme = newTheme;
        this.storage.saveConfiguracoes(config);
    }

    hideSplashScreen() {
        setTimeout(() => {
            document.getElementById('splash-screen')?.classList.add('hidden');
        }, 2000);
    }

    checkInstallPrompt() {
        // PWA install prompt será implementado no service worker
        if ('serviceWorker' in navigator) {
            // Simular banner de instalação após 5 segundos
            setTimeout(() => {
                const banner = document.getElementById('install-banner');
                if (banner && !localStorage.getItem('install-dismissed')) {
                    banner.classList.remove('hidden');
                }
            }, 5000);
        }

        document.getElementById('install-button')?.addEventListener('click', () => {
            this.installApp();
        });

        document.getElementById('dismiss-install')?.addEventListener('click', () => {
            document.getElementById('install-banner').classList.add('hidden');
            localStorage.setItem('install-dismissed', 'true');
        });
    }

    installApp() {
        // PWA installation logic
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('App instalado');
                }
                window.deferredPrompt = null;
            });
        } else {
            // Fallback para dispositivos que não suportam
            this.showNotification('Para instalar, use o menu do navegador "Adicionar à tela inicial"', 'info');
        }
        document.getElementById('install-banner').classList.add('hidden');
    }

    navigateToPage(page) {
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-page="${page}"]`)?.parentElement.classList.add('active');

        // Show page
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`)?.classList.add('active');

        this.currentPage = page;

        // Load page data
        switch (page) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'clientes':
                this.loadClientes();
                break;
            case 'pagamentos':
                this.loadPagamentos();
                break;
            case 'mensagens':
                this.updateMensagensPage();
                break;
        }

        // Close sidebar on mobile
        if (window.innerWidth < 1024) {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('menu-toggle').classList.remove('active');
        }
    }

    updateDashboard() {
        const stats = this.storage.getEstatisticas();
        
        document.getElementById('total-clientes').textContent = stats.totalClientes;
        document.getElementById('clientes-ativos').textContent = stats.clientesAtivos;
        document.getElementById('pagamentos-mes').textContent = this.formatCurrency(stats.valorMes);
        document.getElementById('pagamentos-atrasados').textContent = stats.pagamentosAtrasados;

        this.loadRecentActivities();
    }

    loadRecentActivities() {
        const atividades = this.storage.getAtividades().slice(0, 5);
        const container = document.getElementById('activities-list');
        
        if (!container) return;

        if (atividades.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma atividade recente</p>';
            return;
        }

        container.innerHTML = atividades.map(atividade => `
            <div class="activity-item">
                <div class="activity-icon">${this.getActivityIcon(atividade.tipo)}</div>
                <div class="activity-content">
                    <div class="activity-title">${atividade.titulo}</div>
                    <div class="activity-description">${atividade.descricao}</div>
                    <div class="activity-time">${this.formatRelativeTime(atividade.data)}</div>
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(tipo) {
        const icons = {
            cliente: '👤',
            pagamento: '💰',
            mensagem: '💬',
            sistema: '⚙️',
            geral: '📋'
        };
        return icons[tipo] || icons.geral;
    }

    loadClientes() {
        this.applyClienteFilters();
        this.updateClienteOptions();
    }

    applyClienteFilters() {
        const searchTerm = document.getElementById('search-clientes')?.value || '';
        const statusFilter = document.getElementById('filter-status')?.value || '';
        const vencimentoFilter = document.getElementById('filter-vencimento')?.value || '';

        let clientes = this.storage.getClientes();

        // Apply search
        if (searchTerm) {
            clientes = this.storage.buscarClientes(searchTerm);
        }

        // Apply filters
        clientes = this.storage.filtrarClientes({
            status: statusFilter,
            vencimento: vencimentoFilter
        });

        // Apply search again if needed
        if (searchTerm && statusFilter || vencimentoFilter) {
            const termoLower = searchTerm.toLowerCase();
            clientes = clientes.filter(cliente => 
                cliente.nome.toLowerCase().includes(termoLower) ||
                cliente.whatsapp.includes(searchTerm) ||
                (cliente.observacoes && cliente.observacoes.toLowerCase().includes(termoLower))
            );
        }

        this.renderClientesTable(clientes);
    }

    searchClientes(term) {
        this.applyClienteFilters();
    }

    renderClientesTable(clientes) {
        const tbody = document.getElementById('clientes-tbody');
        if (!tbody) return;

        if (clientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        Nenhum cliente encontrado
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = clientes.map(cliente => `
            <tr>
                <td>${cliente.nome}</td>
                <td>${this.formatPhone(cliente.whatsapp)}</td>
                <td>${this.formatDate(cliente.vencimento)}</td>
                <td>
                    <span class="status-badge status-${cliente.status.toLowerCase()}">
                        ${cliente.status}
                    </span>
                </td>
                <td>${this.formatCurrency(cliente.valor)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="ui.editCliente('${cliente.id}')" title="Editar">
                            ✏️
                        </button>
                        <button class="btn-action btn-whatsapp" onclick="ui.sendWhatsAppMessage('${cliente.id}')" title="WhatsApp">
                            💬
                        </button>
                        <button class="btn-action btn-delete" onclick="ui.deleteCliente('${cliente.id}')" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    loadPagamentos() {
        const pagamentos = this.storage.getPagamentos();
        this.renderPagamentosTable(pagamentos);
    }

    renderPagamentosTable(pagamentos) {
        const tbody = document.getElementById('pagamentos-tbody');
        if (!tbody) return;

        if (pagamentos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        Nenhum pagamento encontrado
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pagamentos.map(pagamento => {
            const cliente = this.storage.getClienteById(pagamento.clienteId);
            return `
                <tr>
                    <td>${cliente?.nome || 'Cliente não encontrado'}</td>
                    <td>${this.formatMonth(pagamento.referencia)}</td>
                    <td>${this.formatDate(pagamento.dataPagamento)}</td>
                    <td>
                        <span class="status-badge status-${pagamento.status.toLowerCase()}">
                            ${pagamento.status}
                        </span>
                    </td>
                    <td>${this.formatCurrency(pagamento.valor)}</td>
                    <td>
                        ${pagamento.comprovante ? `
                            <button class="btn-action" onclick="ui.viewComprovante('${pagamento.id}')" title="Ver comprovante">
                                📄
                            </button>
                        ` : '-'}
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-edit" onclick="ui.editPagamento('${pagamento.id}')" title="Editar">
                                ✏️
                            </button>
                            <button class="btn-action btn-delete" onclick="ui.deletePagamento('${pagamento.id}')" title="Excluir">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Modal Management
    openClienteModal(clienteId = null) {
        this.editingId = clienteId;
        const modal = document.getElementById('modal-cliente');
        const overlay = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-cliente-title');
        const form = document.getElementById('form-cliente');

        if (clienteId) {
            const cliente = this.storage.getClienteById(clienteId);
            if (cliente) {
                title.textContent = 'Editar Cliente';
                this.fillClienteForm(cliente);
            }
        } else {
            title.textContent = 'Novo Cliente';
            form.reset();
        }

        overlay.classList.remove('hidden');
        modal.style.display = 'block';
        document.getElementById('cliente-nome')?.focus();
    }

    openPagamentoModal(pagamentoId = null) {
        this.editingId = pagamentoId;
        const modal = document.getElementById('modal-pagamento');
        const overlay = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-pagamento-title');
        const form = document.getElementById('form-pagamento');

        this.updateClienteOptions();

        if (pagamentoId) {
            const pagamento = this.storage.getPagamentos().find(p => p.id === pagamentoId);
            if (pagamento) {
                title.textContent = 'Editar Pagamento';
                this.fillPagamentoForm(pagamento);
            }
        } else {
            title.textContent = 'Registrar Pagamento';
            form.reset();
            // Set default date to today
            document.getElementById('pagamento-data').value = new Date().toISOString().split('T')[0];
            // Set default reference to current month
            const now = new Date();
            document.getElementById('pagamento-referencia').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        overlay.classList.remove('hidden');
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        this.editingId = null;
    }

    fillClienteForm(cliente) {
        document.getElementById('cliente-nome').value = cliente.nome || '';
        document.getElementById('cliente-whatsapp').value = cliente.whatsapp || '';
        document.getElementById('cliente-vencimento').value = cliente.vencimento || '';
        document.getElementById('cliente-valor').value = cliente.valor || '';
        document.getElementById('cliente-status').value = cliente.status || 'Ativo';
        document.getElementById('cliente-observacoes').value = cliente.observacoes || '';
    }

    fillPagamentoForm(pagamento) {
        document.getElementById('pagamento-cliente').value = pagamento.clienteId || '';
        document.getElementById('pagamento-referencia').value = pagamento.referencia || '';
        document.getElementById('pagamento-data').value = pagamento.dataPagamento || '';
        document.getElementById('pagamento-valor').value = pagamento.valor || '';
        document.getElementById('pagamento-status').value = pagamento.status || 'Pago';
    }

    updateClienteOptions() {
        const select = document.getElementById('pagamento-cliente');
        if (!select) return;

        const clientes = this.storage.getClientes().filter(c => c.status === 'Ativo');
        
        select.innerHTML = '<option value="">Selecione um cliente</option>' +
            clientes.map(cliente => `
                <option value="${cliente.id}">${cliente.nome}</option>
            `).join('');
    }

    // Form Handlers
    handleClienteSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const clienteData = {
            nome: document.getElementById('cliente-nome').value.trim(),
            whatsapp: document.getElementById('cliente-whatsapp').value.trim(),
            vencimento: document.getElementById('cliente-vencimento').value,
            valor: parseFloat(document.getElementById('cliente-valor').value) || 0,
            status: document.getElementById('cliente-status').value,
            observacoes: document.getElementById('cliente-observacoes').value.trim()
        };

        // Validation
        if (!clienteData.nome || !clienteData.whatsapp || !clienteData.vencimento) {
            this.showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (this.editingId) {
            // Update existing cliente
            Promise.resolve(this.storage.updateCliente(this.editingId, clienteData)).then(updated => {
                if (updated) {
                    this.showNotification('Cliente atualizado com sucesso!', 'success');
                    this.closeModal();
                    this.loadClientes();
                    this.updateDashboard();
                } else {
                    this.showNotification('Erro ao atualizar cliente', 'error');
                }
            }).catch(() => this.showNotification('Erro ao atualizar cliente', 'error'));
        } else {
            // Create new cliente
            Promise.resolve(this.storage.addCliente(clienteData)).then(created => {
                if (created) {
                    this.showNotification('Cliente cadastrado com sucesso!', 'success');
                    this.closeModal();
                    this.loadClientes();
                    this.updateDashboard();
                } else {
                    this.showNotification('Erro ao cadastrar cliente', 'error');
                }
            }).catch(() => this.showNotification('Erro ao cadastrar cliente', 'error'));
        }
    }

    handlePagamentoSubmit(e) {
        e.preventDefault();
        
        const pagamentoData = {
            clienteId: document.getElementById('pagamento-cliente').value,
            referencia: document.getElementById('pagamento-referencia').value,
            dataPagamento: document.getElementById('pagamento-data').value,
            valor: parseFloat(document.getElementById('pagamento-valor').value) || 0,
            status: document.getElementById('pagamento-status').value,
            comprovante: null // File handling will be implemented later
        };

        // Validation
        if (!pagamentoData.clienteId || !pagamentoData.referencia || !pagamentoData.dataPagamento) {
            this.showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (this.editingId) {
            // Update existing pagamento
            Promise.resolve(this.storage.updatePagamento(this.editingId, pagamentoData)).then(updated => {
                if (updated) {
                    this.showNotification('Pagamento atualizado com sucesso!', 'success');
                    this.closeModal();
                    this.loadPagamentos();
                    this.updateDashboard();
                } else {
                    this.showNotification('Erro ao atualizar pagamento', 'error');
                }
            }).catch(() => this.showNotification('Erro ao atualizar pagamento', 'error'));
        } else {
            // Create new pagamento
            Promise.resolve(this.storage.addPagamento(pagamentoData)).then(created => {
                if (created) {
                    this.showNotification('Pagamento registrado com sucesso!', 'success');
                    this.closeModal();
                    this.loadPagamentos();
                    this.updateDashboard();
                } else {
                    this.showNotification('Erro ao registrar pagamento', 'error');
                }
            }).catch(() => this.showNotification('Erro ao registrar pagamento', 'error'));
        }
    }

    // Actions
    editCliente(id) {
        this.openClienteModal(id);
    }

    deleteCliente(id) {
        const cliente = this.storage.getClienteById(id);
        if (!cliente) return;

        if (confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome}"?`)) {
            if (this.storage.deleteCliente(id)) {
                this.showNotification('Cliente excluído com sucesso!', 'success');
                this.loadClientes();
                this.updateDashboard();
            } else {
                this.showNotification('Erro ao excluir cliente', 'error');
            }
        }
    }

    editPagamento(id) {
        this.openPagamentoModal(id);
    }

    deletePagamento(id) {
        if (confirm('Tem certeza que deseja excluir este pagamento?')) {
            if (this.storage.deletePagamento(id)) {
                this.showNotification('Pagamento excluído com sucesso!', 'success');
                this.loadPagamentos();
                this.updateDashboard();
            } else {
                this.showNotification('Erro ao excluir pagamento', 'error');
            }
        }
    }

    sendWhatsAppMessage(clienteId) {
        const cliente = this.storage.getClienteById(clienteId);
        if (!cliente) return;

        // Simple WhatsApp Web link (will be enhanced with API integration)
        const message = `Olá ${cliente.nome}, lembramos que seu pagamento vence em breve. Valor: ${this.formatCurrency(cliente.valor)}`;
        const whatsappUrl = `https://wa.me/${cliente.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');
        
        this.storage.addAtividade('Mensagem enviada', `Mensagem enviada para ${cliente.nome}`, 'mensagem');
        this.showNotification('Redirecionando para WhatsApp...', 'info');
    }

    viewComprovante(pagamentoId) {
        this.showNotification('Visualização de comprovantes será implementada em breve', 'info');
    }

    // Utility methods
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    formatMonth(monthString) {
        if (!monthString) return '-';
        const [year, month] = monthString.split('-');
        return new Date(year, month - 1).toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        });
    }

    formatPhone(phone) {
        if (!phone) return '-';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        }
        return phone;
    }

    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} dia${days > 1 ? 's' : ''} atrás`;
        if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
        if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
        return 'Agora mesmo';
    }

    // WhatsApp Methods
    openWhatsAppModal() {
        this.loadWhatsAppTemplates();
        this.checkWhatsAppStatus();
        this.showModal('modal-whatsapp');
    }

    loadWhatsAppTemplates() {
        const config = this.storage.getConfiguracoes();
        const templates = config.mensagemTemplate || {};

        const defaultTemplates = {
            lembrete: 'Olá {nome}! 👋\n\nLembramos que seu pagamento vence em {dias} dia(s).\n💰 Valor: {valor}\n📅 Vencimento: {vencimento}\n\nQualquer dúvida, estamos à disposição!',
            vencimento: 'Olá {nome}! ⏰\n\nSeu pagamento vence HOJE!\n💰 Valor: {valor}\n\nPor favor, efetue o pagamento para manter seu serviço ativo.',
            atraso: 'Olá {nome}! ⚠️\n\nSeu pagamento está em atraso há {dias} dia(s).\n💰 Valor: {valor}\n📅 Venceu em: {vencimento}\n\nPor favor, regularize sua situação o quanto antes.',
            confirmacao: 'Olá {nome}! ✅\n\nRecebemos seu pagamento de {valor}!\n📅 Data: {dataPagamento}\n\nObrigado pela confiança! 😊',
            boas_vindas: 'Olá {nome}! 🎉\n\nSeja bem-vindo(a) ao nosso sistema!\n💰 Valor mensal: {valor}\n📅 Vencimento: todo dia {vencimento}\n\nEstamos aqui para ajudar! 💪'
        };

        Object.keys(defaultTemplates).forEach(key => {
            const textarea = document.getElementById(`template-${key}`);
            if (textarea) {
                textarea.value = templates[key] || defaultTemplates[key];
            }
        });
    }

    async checkWhatsAppStatus() {
        try {
            const response = await fetch('/api/health');
            const health = await response.json();
            
            const backendStatus = document.getElementById('status-backend-text');
            const backendDot = document.getElementById('status-backend');
            
            if (backendStatus && backendDot) {
                backendStatus.textContent = 'Online';
                backendDot.textContent = '🟢';
            }

            const twilioStatus = document.getElementById('status-twilio-text');
            const twilioDot = document.getElementById('status-twilio');
            
            if (twilioStatus && twilioDot) {
                if (health.twilioConfigured) {
                    twilioStatus.textContent = 'Configurado';
                    twilioDot.textContent = '🟢';
                } else {
                    twilioStatus.textContent = 'Não configurado';
                    twilioDot.textContent = '🟡';
                }
            }
        } catch (error) {
            const backendStatus = document.getElementById('status-backend-text');
            const backendDot = document.getElementById('status-backend');
            
            if (backendStatus && backendDot) {
                backendStatus.textContent = 'Offline - Usando modo local';
                backendDot.textContent = '🟡';
            }
        }
    }

    saveWhatsAppTemplates() {
        const config = this.storage.getConfiguracoes();
        
        const templates = {};
        ['lembrete', 'vencimento', 'atraso', 'confirmacao', 'boas_vindas'].forEach(key => {
            const textarea = document.getElementById(`template-${key}`);
            if (textarea) {
                templates[key] = textarea.value;
            }
        });

        config.mensagemTemplate = templates;
        this.storage.saveConfiguracoes(config);
        
        this.showNotification('Templates salvos com sucesso!', 'success');
    }

    async sendAutomaticReminders() {
        const clientes = this.storage.getClientes().filter(c => c.status === 'Ativo');
        const hoje = new Date();
        
        let enviados = 0;
        let errors = 0;

        for (const cliente of clientes) {
            try {
                const vencimento = new Date(cliente.vencimento);
                const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
                
                if (diffDias === 1) {
                    await this.sendWhatsAppMessage(cliente, 'lembrete');
                    enviados++;
                } else if (diffDias === 0) {
                    await this.sendWhatsAppMessage(cliente, 'vencimento');
                    enviados++;
                } else if (diffDias < 0) {
                    await this.sendWhatsAppMessage(cliente, 'atraso');
                    enviados++;
                }
                
                // Delay para não sobrecarregar
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Erro para ${cliente.nome}:`, error);
                errors++;
            }
        }

        this.showNotification(
            `Processo concluído! ${enviados} mensagens enviadas${errors > 0 ? `, ${errors} erros` : ''}`,
            errors > 0 ? 'warning' : 'success'
        );
    }

    async sendVencimentoReminders() {
        const clientes = this.storage.getClientes().filter(c => c.status === 'Ativo');
        const hoje = new Date();
        
        const vencendoAmanha = clientes.filter(cliente => {
            const vencimento = new Date(cliente.vencimento);
            const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
            return diffDias === 1;
        });

        if (vencendoAmanha.length === 0) {
            this.showNotification('Nenhum cliente com vencimento amanhã', 'info');
            return;
        }

        let enviados = 0;
        for (const cliente of vencendoAmanha) {
            try {
                await this.sendWhatsAppMessage(cliente, 'lembrete');
                enviados++;
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Erro para ${cliente.nome}:`, error);
            }
        }

        this.showNotification(`${enviados} lembretes de vencimento enviados!`, 'success');
    }

    async sendAtrasadosReminders() {
        const clientes = this.storage.getClientes().filter(c => c.status === 'Ativo');
        const hoje = new Date();
        
        const atrasados = clientes.filter(cliente => {
            const vencimento = new Date(cliente.vencimento);
            const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
            return diffDias < 0;
        });

        if (atrasados.length === 0) {
            this.showNotification('Nenhum cliente em atraso', 'info');
            return;
        }

        let enviados = 0;
        for (const cliente of atrasados) {
            try {
                await this.sendWhatsAppMessage(cliente, 'atraso');
                enviados++;
                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
                console.error(`Erro para ${cliente.nome}:`, error);
            }
        }

        this.showNotification(`${enviados} cobranças de atraso enviadas!`, 'success');
    }

    async sendWhatsAppMessage(cliente, templateType) {
        const config = this.storage.getConfiguracoes();
        const templates = config.mensagemTemplate || {};
        
        let template = templates[templateType];
        if (!template) {
            throw new Error(`Template ${templateType} não encontrado`);
        }

        // Substituir variáveis
        const hoje = new Date();
        const vencimento = new Date(cliente.vencimento);
        const diffDias = Math.abs(Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24)));

        const replacements = {
            '{nome}': cliente.nome,
            '{valor}': `R$ ${cliente.valor.toFixed(2)}`,
            '{vencimento}': vencimento.toLocaleDateString('pt-BR'),
            '{dias}': diffDias,
            '{whatsapp}': cliente.whatsapp
        };

        Object.entries(replacements).forEach(([key, value]) => {
            template = template.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
        });

        // Tentar enviar via API primeiro
        try {
            const response = await fetch('/api/send-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: cliente.whatsapp.replace(/\D/g, ''),
                    message: template
                })
            });

            const result = await response.json();
            
            if (result.ok || result.fallback) {
                if (result.fallback && result.waLink) {
                    window.open(result.waLink, '_blank');
                }
                
                this.storage.addAtividade(
                    'Mensagem WhatsApp enviada',
                    `${templateType} enviado para ${cliente.nome}`,
                    'mensagem'
                );
                
                return result;
            }
        } catch (error) {
            console.error('Erro na API, usando fallback:', error);
        }

        // Fallback direto
        const phone = cliente.whatsapp.replace(/\D/g, '');
        const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(template)}`;
        window.open(waLink, '_blank');
        
        this.storage.addAtividade(
            'Mensagem WhatsApp via Web',
            `${templateType} enviado para ${cliente.nome}`,
            'mensagem'
        );
    }

    async testWhatsAppIntegration() {
        try {
            const response = await fetch('/api/test-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();
            
            if (result.configured) {
                this.showNotification('✅ Integração Twilio funcionando!', 'success');
            } else {
                this.showNotification(`⚠️ Twilio não configurado: ${result.message}`, 'warning');
            }
        } catch (error) {
            this.showNotification('❌ Erro ao testar integração', 'error');
        }
    }

    updateMensagensPage() {
        if (this.currentPage !== 'mensagens') return;

        // Update statistics
        this.updateMensagensStats();
        
        // Load message history
        this.loadMessageHistory();
    }

    updateMensagensStats() {
        const clientes = this.storage.getClientes().filter(c => c.status === 'Ativo');
        const hoje = new Date();
        
        let vencendoHoje = 0;
        let vencendoAmanha = 0;
        let atrasados = 0;

        clientes.forEach(cliente => {
            const vencimento = new Date(cliente.vencimento);
            const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
            
            if (diffDias === 0) vencendoHoje++;
            else if (diffDias === 1) vencendoAmanha++;
            else if (diffDias < 0) atrasados++;
        });

        document.getElementById('vencimentos-hoje').textContent = vencendoHoje;
        document.getElementById('vencimentos-amanha').textContent = vencendoAmanha;
        document.getElementById('pagamentos-atrasados').textContent = atrasados;
    }

    loadMessageHistory() {
        const activities = this.storage.getAtividades()
            .filter(a => a.tipo === 'mensagem')
            .slice(0, 20);

        const container = document.getElementById('mensagens-list');
        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">Nenhuma mensagem enviada ainda</p>';
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="message-item">
                <div class="message-info">
                    <div class="message-cliente">${activity.titulo}</div>
                    <div class="message-preview">${activity.descricao}</div>
                </div>
                <div class="message-meta">
                    <div>${new Date(activity.data).toLocaleDateString('pt-BR')}</div>
                    <div class="message-status success">Enviado</div>
                </div>
            </div>
        `).join('');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Add notification styles to CSS
const notificationStyles = `
.notification {
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 2000;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    animation: slideIn 0.3s ease;
}

.notification-success { background: #28a745; }
.notification-error { background: #dc3545; }
.notification-warning { background: #fd7e14; }
.notification-info { background: #17a2b8; }

.notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    margin-left: auto;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
}

.status-ativo { background: #d4edda; color: #155724; }
.status-inativo { background: #f8d7da; color: #721c24; }
.status-pago { background: #d4edda; color: #155724; }
.status-pendente { background: #fff3cd; color: #856404; }
.status-atrasado { background: #f8d7da; color: #721c24; }

.action-buttons {
    display: flex;
    gap: 4px;
}

.btn-action {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    transition: background 0.2s;
}

.btn-action:hover {
    background: var(--background-color);
}

.activity-item {
    display: flex;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-color);
}

.activity-item:last-child {
    border-bottom: none;
}

.activity-icon {
    font-size: 20px;
    width: 32px;
    text-align: center;
}

.activity-content {
    flex: 1;
}

.activity-title {
    font-weight: 500;
    margin-bottom: 4px;
}

.activity-description {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 4px;
}

.activity-time {
    font-size: 12px;
    color: var(--text-muted);
}
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);