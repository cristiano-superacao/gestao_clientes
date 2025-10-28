// Dashboard Analytics Module - v2.1.0
// Sistema de Gestão de Clientes - SENAI - Dashboard com Analytics

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, query, onSnapshot, orderBy, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables
let app, db, userId = null;

export class DashboardAnalytics {
    constructor(appId, firebaseConfig) {
        this.appId = appId;
        this.firebaseConfig = firebaseConfig;
        this.clients = [];
        this.charts = {};
        this.analytics = {
            totalClients: 0,
            newClientsThisMonth: 0,
            newClientsThisWeek: 0,
            growthRate: 0,
            averageClientsPerDay: 0,
            topDomains: [],
            clientsByMonth: {},
            clientsByWeekday: {},
            recentActivity: []
        };
    }

    // Initialize Firebase and setup analytics
    async initialize() {
        try {
            if (!this.firebaseConfig || Object.keys(this.firebaseConfig).length === 0) {
                this.simulateTestData();
                return;
            }
            
            app = initializeApp(this.firebaseConfig);
            db = getFirestore(app);
            
            await this.setupClientListener();
            this.setupPeriodicUpdates();
            
        } catch (error) {
            console.error('Erro ao inicializar dashboard:', error);
            this.simulateTestData();
        }
    }

    // Calculate analytics from client data
    calculateAnalytics() {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisWeek = new Date(now);
        thisWeek.setDate(now.getDate() - 7);

        this.analytics.totalClients = this.clients.length;
        this.analytics.newClientsThisMonth = this.clients.filter(client => {
            const clientDate = client.timestamp?.toDate() || new Date(client.createdAt);
            return clientDate >= thisMonth;
        }).length;

        this.analytics.newClientsThisWeek = this.clients.filter(client => {
            const clientDate = client.timestamp?.toDate() || new Date(client.createdAt);
            return clientDate >= thisWeek;
        }).length;

        // Calculate growth rate and other metrics
        this.calculateGrowthMetrics();
        this.calculateTopDomains();
        this.calculateClientsByMonth();
        this.calculateClientsByWeekday();
        this.calculateRecentActivity();
    }

    calculateGrowthMetrics() {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const lastMonthClients = this.clients.filter(client => {
            const clientDate = client.timestamp?.toDate() || new Date(client.createdAt);
            return clientDate >= lastMonth && clientDate < thisMonth;
        }).length;

        this.analytics.growthRate = lastMonthClients > 0 
            ? ((this.analytics.newClientsThisMonth - lastMonthClients) / lastMonthClients * 100).toFixed(1)
            : this.analytics.newClientsThisMonth > 0 ? 100 : 0;

        this.analytics.averageClientsPerDay = (this.analytics.totalClients / 30).toFixed(1);
    }

    calculateTopDomains() {
        const domains = {};
        this.clients.forEach(client => {
            if (client.email) {
                const domain = client.email.split('@')[1];
                domains[domain] = (domains[domain] || 0) + 1;
            }
        });

        this.analytics.topDomains = Object.entries(domains)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([domain, count]) => ({ domain, count }));
    }

    calculateClientsByMonth() {
        const months = {};
        const now = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            months[key] = 0;
        }

        this.clients.forEach(client => {
            const clientDate = client.timestamp?.toDate() || new Date(client.createdAt);
            const key = clientDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            if (months.hasOwnProperty(key)) {
                months[key]++;
            }
        });

        this.analytics.clientsByMonth = months;
    }

    calculateClientsByWeekday() {
        const weekdays = {
            'Dom': 0, 'Seg': 0, 'Ter': 0, 'Qua': 0, 'Qui': 0, 'Sex': 0, 'Sáb': 0
        };

        this.clients.forEach(client => {
            const clientDate = client.timestamp?.toDate() || new Date(client.createdAt);
            const weekday = clientDate.toLocaleDateString('pt-BR', { weekday: 'short' });
            weekdays[weekday]++;
        });

        this.analytics.clientsByWeekday = weekdays;
    }

    calculateRecentActivity() {
        this.analytics.recentActivity = this.clients
            .slice(0, 10)
            .map(client => ({
                id: client.id,
                name: client.name,
                email: client.email,
                action: 'Cadastrado',
                timestamp: client.timestamp?.toDate() || new Date(client.createdAt),
                timeAgo: this.formatTimeAgo(client.timestamp?.toDate() || new Date(client.createdAt))
            }));
    }

    formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Agora mesmo';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h atrás`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
        return date.toLocaleDateString('pt-BR');
    }

    // Update dashboard UI elements
    updateDashboardUI() {
        this.updateMetricCards();
        this.updateCharts();
        this.updateRecentActivity();
        this.updateTopDomains();
    }

    updateMetricCards() {
        const elements = {
            'total-clients': this.analytics.totalClients,
            'new-clients-month': this.analytics.newClientsThisMonth,
            'new-clients-week': this.analytics.newClientsThisWeek,
            'growth-rate': this.analytics.growthRate + '%',
            'avg-clients-day': this.analytics.averageClientsPerDay
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                element.classList.add('metric-updated');
                setTimeout(() => element.classList.remove('metric-updated'), 300);
            }
        });
    }

    updateCharts() {
        this.createClientsByMonthChart();
        this.createClientsByWeekdayChart();
        this.createGrowthTrendChart();
    }

    createClientsByMonthChart() {
        const ctx = document.getElementById('clients-by-month-chart');
        if (!ctx || !window.Chart) return;

        if (this.charts.monthlyChart) {
            this.charts.monthlyChart.destroy();
        }

        const data = this.analytics.clientsByMonth;
        this.charts.monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: 'Novos Clientes',
                    data: Object.values(data),
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    createClientsByWeekdayChart() {
        const ctx = document.getElementById('clients-by-weekday-chart');
        if (!ctx || !window.Chart) return;

        if (this.charts.weekdayChart) {
            this.charts.weekdayChart.destroy();
        }

        const data = this.analytics.clientsByWeekday;
        this.charts.weekdayChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: 'Clientes por Dia',
                    data: Object.values(data),
                    backgroundColor: [
                        '#ef4444', '#f97316', '#eab308', '#22c55e', 
                        '#3b82f6', '#6366f1', '#8b5cf6'
                    ],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    createGrowthTrendChart() {
        const ctx = document.getElementById('growth-trend-chart');
        if (!ctx || !window.Chart) return;

        if (this.charts.growthChart) {
            this.charts.growthChart.destroy();
        }

        const monthlyData = Object.values(this.analytics.clientsByMonth);
        const cumulativeData = [];
        let total = 0;
        monthlyData.forEach(count => {
            total += count;
            cumulativeData.push(total);
        });

        this.charts.growthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(this.analytics.clientsByMonth),
                datasets: [{
                    label: 'Total Acumulado',
                    data: cumulativeData,
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    updateRecentActivity() {
        const container = document.getElementById('recent-activity-list');
        if (!container) return;

        container.innerHTML = '';
        this.analytics.recentActivity.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors';
            item.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">${activity.name}</p>
                        <p class="text-sm text-gray-500 truncate">${activity.action} • ${activity.email}</p>
                    </div>
                </div>
                <div class="flex-shrink-0 text-sm text-gray-400">${activity.timeAgo}</div>
            `;
            container.appendChild(item);
        });
    }

    updateTopDomains() {
        const container = document.getElementById('top-domains-list');
        if (!container) return;

        container.innerHTML = '';
        this.analytics.topDomains.forEach((item, index) => {
            const domainItem = document.createElement('div');
            domainItem.className = 'flex items-center justify-between py-2';
            domainItem.innerHTML = `
                <div class="flex items-center space-x-3">
                    <span class="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                        ${index + 1}
                    </span>
                    <span class="text-sm font-medium text-gray-900">${item.domain}</span>
                </div>
                <span class="text-sm text-gray-500">${item.count} cliente${item.count !== 1 ? 's' : ''}</span>
            `;
            container.appendChild(domainItem);
        });
    }

    // Setup real-time listener for client data
    async setupClientListener() {
        if (!db) return;

        const clientsColRef = collection(db, `artifacts/${this.appId}/public/data/clients`);
        const q = query(clientsColRef, orderBy('timestamp', 'desc'));
        
        onSnapshot(q, (snapshot) => {
            this.clients = [];
            snapshot.forEach(doc => {
                this.clients.push({ id: doc.id, ...doc.data() });
            });

            this.calculateAnalytics();
            this.updateDashboardUI();
        });
    }

    // Simulate test data when Firebase is not available
    simulateTestData() {
        const today = new Date();
        this.clients = [];

        for (let i = 0; i < 45; i++) {
            const daysAgo = Math.floor(Math.random() * 180);
            const clientDate = new Date(today);
            clientDate.setDate(today.getDate() - daysAgo);

            const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'empresa.com.br'];
            const names = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Lima'];
            
            const name = names[Math.floor(Math.random() * names.length)];
            const domain = domains[Math.floor(Math.random() * domains.length)];
            
            this.clients.push({
                id: `test-${i}`,
                name: `${name} ${i}`,
                email: `cliente${i}@${domain}`,
                phone: `(11) 9999${String(i).padStart(4, '0')}`,
                timestamp: { toDate: () => clientDate },
                createdAt: clientDate.toISOString()
            });
        }

        this.calculateAnalytics();
        setTimeout(() => this.updateDashboardUI(), 100);
    }

    setupPeriodicUpdates() {
        setInterval(() => {
            if (this.clients.length > 0) {
                this.calculateAnalytics();
                this.updateDashboardUI();
            }
        }, 5 * 60 * 1000);
    }

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
            info: 'bg-blue-500 text-white'
        };
        
        notification.className = `${typeClasses[type]} px-4 py-2 rounded-lg shadow-lg`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2">&times;</button>
            </div>
        `;
        
        container.appendChild(notification);
        setTimeout(() => container.removeChild(notification), 5000);
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.__app_id !== 'undefined') {
        const config = typeof window.__firebase_config === 'string' 
            ? JSON.parse(window.__firebase_config) 
            : window.__firebase_config || {};
            
        window.dashboardManager = new DashboardAnalytics(window.__app_id, config);
        window.dashboardManager.initialize();
    }
});