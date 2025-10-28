// Dashboard Analytics Module - Sistema de Gestão de Clientes SENAI v2.1
// Analytics e métricas avançadas para visualização de dados

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, getDocs, where, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Importar Chart.js via CDN (será adicionado no HTML)
// <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

export class DashboardAnalytics {
    constructor(appId, firebaseConfig) {
        this.appId = appId;
        this.firebaseConfig = firebaseConfig;
        this.db = null;
        this.charts = {};
        this.analytics = {
            totalClients: 0,
            newClientsThisMonth: 0,
            growthRate: 0,
            topDomains: [],
            clientsByMonth: [],
            activityData: []
        };
    }

    // Inicializar Firebase e carregar dados
    async initialize() {
        try {
            if (!this.firebaseConfig || Object.keys(this.firebaseConfig).length === 0) {
                // Modo de teste - dados simulados
                this.loadTestData();
                return;
            }

            const app = initializeApp(this.firebaseConfig);
            this.db = getFirestore(app);
            await this.loadAnalyticsData();
            this.renderDashboard();
        } catch (error) {
            console.error('Erro ao inicializar dashboard:', error);
            this.loadTestData();
        }
    }

    // Carregar dados reais do Firebase
    async loadAnalyticsData() {
        try {
            const clientsRef = collection(this.db, `artifacts/${this.appId}/public/data/clients`);
            const q = query(clientsRef, orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);

            const clients = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                clients.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() || new Date()
                });
            });

            this.processAnalyticsData(clients);
        } catch (error) {
            console.error('Erro ao carregar dados analytics:', error);
            this.loadTestData();
        }
    }

    // Processar dados para analytics
    processAnalyticsData(clients) {
        this.analytics.totalClients = clients.length;

        // Clientes deste mês
        const currentMonth = new Date();
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        
        this.analytics.newClientsThisMonth = clients.filter(client => 
            client.timestamp >= firstDayOfMonth
        ).length;

        // Taxa de crescimento (comparando com mês anterior)
        const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        const firstDayOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 2, 1);
        
        const lastMonthClients = clients.filter(client => 
            client.timestamp >= firstDayOfLastMonth && client.timestamp < lastMonth
        ).length;

        this.analytics.growthRate = lastMonthClients > 0 
            ? ((this.analytics.newClientsThisMonth - lastMonthClients) / lastMonthClients * 100).toFixed(1)
            : 0;

        // Domínios de email mais comuns
        const domains = {};
        clients.forEach(client => {
            if (client.email) {
                const domain = client.email.split('@')[1];
                domains[domain] = (domains[domain] || 0) + 1;
            }
        });

        this.analytics.topDomains = Object.entries(domains)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([domain, count]) => ({ domain, count }));

        // Clientes por mês (últimos 12 meses)
        const monthlyData = {};
        const last12Months = [];
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            last12Months.push({ key, label });
            monthlyData[key] = 0;
        }

        clients.forEach(client => {
            const date = client.timestamp;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData.hasOwnProperty(key)) {
                monthlyData[key]++;
            }
        });

        this.analytics.clientsByMonth = last12Months.map(({ key, label }) => ({
            month: label,
            count: monthlyData[key]
        }));
    }

    // Carregar dados de teste
    loadTestData() {
        this.analytics = {
            totalClients: 156,
            newClientsThisMonth: 23,
            growthRate: 18.5,
            topDomains: [
                { domain: 'gmail.com', count: 45 },
                { domain: 'hotmail.com', count: 28 },
                { domain: 'yahoo.com', count: 19 },
                { domain: 'outlook.com', count: 15 },
                { domain: 'empresa.com.br', count: 12 }
            ],
            clientsByMonth: [
                { month: 'Jan 2024', count: 8 },
                { month: 'Fev 2024', count: 12 },
                { month: 'Mar 2024', count: 15 },
                { month: 'Abr 2024', count: 18 },
                { month: 'Mai 2024', count: 22 },
                { month: 'Jun 2024', count: 19 },
                { month: 'Jul 2024', count: 25 },
                { month: 'Ago 2024', count: 28 },
                { month: 'Set 2024', count: 31 },
                { month: 'Out 2024', count: 23 }
            ]
        };
        this.renderDashboard();
    }

    // Renderizar dashboard completo
    renderDashboard() {
        this.renderKPICards();
        this.renderCharts();
        this.renderTopDomains();
        this.updateLastUpdated();
    }

    // Renderizar cards de KPIs
    renderKPICards() {
        const kpiContainer = document.getElementById('kpi-cards');
        if (!kpiContainer) return;

        const growthIcon = this.analytics.growthRate >= 0 ? '📈' : '📉';
        const growthColor = this.analytics.growthRate >= 0 ? 'text-green-600' : 'text-red-600';

        kpiContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <!-- Total de Clientes -->
                <div class="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <div class="card-body">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-blue-100 text-sm font-medium">Total de Clientes</p>
                                <p class="text-3xl font-bold">${this.analytics.totalClients.toLocaleString()}</p>
                            </div>
                            <div class="text-4xl opacity-80">👥</div>
                        </div>
                    </div>
                </div>

                <!-- Novos Este Mês -->
                <div class="card bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <div class="card-body">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-green-100 text-sm font-medium">Novos Este Mês</p>
                                <p class="text-3xl font-bold">+${this.analytics.newClientsThisMonth}</p>
                            </div>
                            <div class="text-4xl opacity-80">✨</div>
                        </div>
                    </div>
                </div>

                <!-- Taxa de Crescimento -->
                <div class="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <div class="card-body">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-purple-100 text-sm font-medium">Crescimento</p>
                                <p class="text-3xl font-bold ${growthColor}">${growthIcon} ${Math.abs(this.analytics.growthRate)}%</p>
                            </div>
                            <div class="text-4xl opacity-80">📊</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Renderizar gráficos
    renderCharts() {
        this.renderClientGrowthChart();
        this.renderDomainsChart();
    }

    // Gráfico de crescimento de clientes
    renderClientGrowthChart() {
        const canvas = document.getElementById('client-growth-chart');
        if (!canvas) return;

        if (this.charts.growthChart) {
            this.charts.growthChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        this.charts.growthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.analytics.clientsByMonth.map(item => item.month),
                datasets: [{
                    label: 'Novos Clientes',
                    data: this.analytics.clientsByMonth.map(item => item.count),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Crescimento de Clientes (Últimos 12 Meses)',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                hover: {
                    animationDuration: 300
                }
            }
        });
    }

    // Gráfico de domínios de email
    renderDomainsChart() {
        const canvas = document.getElementById('domains-chart');
        if (!canvas) return;

        if (this.charts.domainsChart) {
            this.charts.domainsChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        const colors = [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)'
        ];

        this.charts.domainsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.analytics.topDomains.map(item => item.domain),
                datasets: [{
                    data: this.analytics.topDomains.map(item => item.count),
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('0.8', '1')),
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Domínios de Email Mais Comuns',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 12
                            },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const dataset = data.datasets[0];
                                        const value = dataset.data[i];
                                        const percentage = ((value / dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                        return {
                                            text: `${label} (${value} - ${percentage}%)`,
                                            fillStyle: dataset.backgroundColor[i],
                                            strokeStyle: dataset.borderColor[i],
                                            lineWidth: dataset.borderWidth,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label;
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} clientes (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000
                }
            }
        });
    }

    // Renderizar lista de top domínios
    renderTopDomains() {
        const container = document.getElementById('top-domains-list');
        if (!container) return;

        const total = this.analytics.topDomains.reduce((sum, item) => sum + item.count, 0);

        container.innerHTML = `
            <div class="space-y-3">
                ${this.analytics.topDomains.map((item, index) => {
                    const percentage = ((item.count / total) * 100).toFixed(1);
                    const colors = [
                        'bg-blue-100 text-blue-800',
                        'bg-green-100 text-green-800',
                        'bg-yellow-100 text-yellow-800',
                        'bg-red-100 text-red-800',
                        'bg-purple-100 text-purple-800'
                    ];
                    return `
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <span class="w-6 h-6 ${colors[index]} rounded-full flex items-center justify-center text-xs font-bold">
                                    ${index + 1}
                                </span>
                                <span class="font-medium text-gray-900">@${item.domain}</span>
                            </div>
                            <div class="text-right">
                                <div class="text-sm font-bold text-gray-900">${item.count} clientes</div>
                                <div class="text-xs text-gray-500">${percentage}%</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Atualizar timestamp da última atualização
    updateLastUpdated() {
        const element = document.getElementById('last-updated');
        if (element) {
            element.textContent = new Date().toLocaleString('pt-BR');
        }
    }

    // Exportar dados de analytics
    exportAnalytics(format = 'json') {
        const data = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalClients: this.analytics.totalClients,
                newClientsThisMonth: this.analytics.newClientsThisMonth,
                growthRate: this.analytics.growthRate
            },
            chartData: {
                clientsByMonth: this.analytics.clientsByMonth,
                topDomains: this.analytics.topDomains
            }
        };

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    // Refresh dos dados
    async refresh() {
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '🔄 Atualizando...';
        }

        try {
            if (this.db) {
                await this.loadAnalyticsData();
            } else {
                this.loadTestData();
            }
            this.renderDashboard();
            
            // Mostrar notificação de sucesso
            if (window.clientManager && typeof window.clientManager.showNotification === 'function') {
                window.clientManager.showNotification('Dashboard atualizado com sucesso!', 'success');
            }
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
            if (window.clientManager && typeof window.clientManager.showNotification === 'function') {
                window.clientManager.showNotification('Erro ao atualizar dashboard', 'error');
            }
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '🔄 Atualizar';
            }
        }
    }

    // Destruir instância e limpar recursos
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Função de utilidade para formatar números
export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Função para calcular porcentagem de crescimento
export function calculateGrowthRate(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
}

// Export default
export default DashboardAnalytics;