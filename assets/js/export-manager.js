// Export System Module - v2.1.0
// Sistema de Gestão de Clientes - SENAI - Export PDF/Excel

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, query, getDocs, orderBy, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// External Libraries (loaded via CDN)
// jsPDF: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
// SheetJS: https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.mini.min.js

export class ExportManager {
    constructor(appId, firebaseConfig) {
        this.appId = appId;
        this.firebaseConfig = firebaseConfig;
        this.clients = [];
        this.filteredClients = [];
        this.exportSettings = {
            format: 'pdf', // 'pdf' or 'excel'
            fields: ['name', 'email', 'phone', 'address', 'createdAt'],
            dateRange: 'all', // 'all', 'thisMonth', 'lastMonth', 'thisYear', 'custom'
            customDateStart: null,
            customDateEnd: null,
            sortBy: 'name', // 'name', 'email', 'createdAt'
            sortOrder: 'asc', // 'asc' or 'desc'
            includeStats: true,
            customFilters: {}
        };
        this.app = null;
        this.db = null;
    }

    // Initialize Firebase connection
    async initialize() {
        try {
            if (!this.firebaseConfig || Object.keys(this.firebaseConfig).length === 0) {
                console.warn('Firebase não configurado, usando dados de teste');
                this.generateTestData();
                return true;
            }
            
            this.app = initializeApp(this.firebaseConfig);
            this.db = getFirestore(this.app);
            await this.loadClients();
            return true;
            
        } catch (error) {
            console.error('Erro ao inicializar Firebase:', error);
            this.generateTestData();
            return false;
        }
    }

    // Load clients from Firebase
    async loadClients() {
        if (!this.db) return;

        try {
            const clientsRef = collection(this.db, `artifacts/${this.appId}/public/data/clients`);
            const q = query(clientsRef, orderBy('timestamp', 'desc'));
            const snapshot = await getDocs(q);
            
            this.clients = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                this.clients.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.timestamp?.toDate() || new Date(data.createdAt)
                });
            });

            this.applyFilters();
            this.updateUI();
            
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            this.generateTestData();
        }
    }

    // Generate test data when Firebase is not available
    generateTestData() {
        const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'empresa.com.br'];
        const firstNames = ['Ana', 'João', 'Maria', 'Pedro', 'Carlos', 'Lucia', 'Rafael', 'Fernanda'];
        const lastNames = ['Silva', 'Santos', 'Oliveira', 'Costa', 'Lima', 'Ferreira', 'Rodrigues', 'Almeida'];
        const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Brasília', 'Curitiba'];

        this.clients = [];
        for (let i = 0; i < 50; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const domain = domains[Math.floor(Math.random() * domains.length)];
            const city = cities[Math.floor(Math.random() * cities.length)];
            
            const daysAgo = Math.floor(Math.random() * 365);
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - daysAgo);

            this.clients.push({
                id: `test-${i}`,
                name: `${firstName} ${lastName}`,
                email: `${firstName.toLowerCase()}${i}@${domain}`,
                phone: `(11) ${String(90000 + i).slice(-5)}-${String(1000 + i).slice(-4)}`,
                address: `Rua Exemplo ${i + 1}, ${city} - SP`,
                createdAt: createdAt,
                company: i % 3 === 0 ? `Empresa ${Math.floor(i/3) + 1}` : '',
                notes: i % 5 === 0 ? `Observações do cliente ${i}` : ''
            });
        }

        this.applyFilters();
        this.updateUI();
    }

    // Apply filters to client data
    applyFilters() {
        let filtered = [...this.clients];

        // Date range filter
        if (this.exportSettings.dateRange !== 'all') {
            const now = new Date();
            let startDate, endDate;

            switch (this.exportSettings.dateRange) {
                case 'thisMonth':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    break;
                case 'lastMonth':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                    break;
                case 'thisYear':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
                    break;
                case 'custom':
                    startDate = this.exportSettings.customDateStart;
                    endDate = this.exportSettings.customDateEnd;
                    break;
            }

            if (startDate && endDate) {
                filtered = filtered.filter(client => {
                    const clientDate = client.createdAt;
                    return clientDate >= startDate && clientDate <= endDate;
                });
            }
        }

        // Custom filters
        Object.entries(this.exportSettings.customFilters).forEach(([field, value]) => {
            if (value && value.trim()) {
                filtered = filtered.filter(client => 
                    client[field] && client[field].toLowerCase().includes(value.toLowerCase())
                );
            }
        });

        // Sort
        filtered.sort((a, b) => {
            const fieldA = a[this.exportSettings.sortBy];
            const fieldB = b[this.exportSettings.sortBy];
            
            if (this.exportSettings.sortBy === 'createdAt') {
                return this.exportSettings.sortOrder === 'asc' 
                    ? fieldA - fieldB 
                    : fieldB - fieldA;
            }
            
            const comparison = fieldA.localeCompare(fieldB);
            return this.exportSettings.sortOrder === 'asc' ? comparison : -comparison;
        });

        this.filteredClients = filtered;
    }

    // Update export settings
    updateSettings(newSettings) {
        this.exportSettings = { ...this.exportSettings, ...newSettings };
        this.applyFilters();
        this.updateUI();
    }

    // Export to PDF
    async exportToPDF() {
        if (!window.jsPDF) {
            console.error('jsPDF não está carregado');
            return false;
        }

        try {
            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            // Header
            doc.setFontSize(20);
            doc.setTextColor(79, 70, 229); // Primary color
            doc.text('Relatório de Clientes', 20, 20);
            
            doc.setFontSize(12);
            doc.setTextColor(107, 114, 128); // Gray color
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
            doc.text(`Total de registros: ${this.filteredClients.length}`, 20, 37);

            // Statistics (if enabled)
            let yPosition = 50;
            if (this.exportSettings.includeStats) {
                const stats = this.generateStats();
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text('Estatísticas:', 20, yPosition);
                yPosition += 10;

                doc.setFontSize(10);
                doc.setTextColor(75, 85, 99);
                doc.text(`• Total de clientes: ${stats.total}`, 25, yPosition);
                yPosition += 7;
                doc.text(`• Novos este mês: ${stats.thisMonth}`, 25, yPosition);
                yPosition += 7;
                doc.text(`• Domínio mais comum: ${stats.topDomain}`, 25, yPosition);
                yPosition += 15;
            }

            // Table headers
            const headers = this.getSelectedFieldsLabels();
            const tableData = this.prepareTableData();
            
            // Use autoTable plugin if available
            if (doc.autoTable) {
                doc.autoTable({
                    head: [headers],
                    body: tableData,
                    startY: yPosition,
                    theme: 'grid',
                    styles: { fontSize: 8, cellPadding: 3 },
                    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
                    alternateRowStyles: { fillColor: [249, 250, 251] }
                });
            } else {
                // Fallback: simple text table
                this.drawSimpleTable(doc, headers, tableData, yPosition);
            }

            // Save file
            const fileName = `clientes_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            this.showNotification('PDF exportado com sucesso!', 'success');
            return true;
            
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            this.showNotification('Erro ao exportar PDF', 'error');
            return false;
        }
    }

    // Export to Excel
    async exportToExcel() {
        if (!window.XLSX) {
            console.error('SheetJS não está carregado');
            return false;
        }

        try {
            const workbook = window.XLSX.utils.book_new();
            
            // Main data sheet
            const mainData = this.prepareExcelData();
            const mainSheet = window.XLSX.utils.json_to_sheet(mainData);
            
            // Auto-size columns
            const colWidths = this.calculateColumnWidths(mainData);
            mainSheet['!cols'] = colWidths;
            
            window.XLSX.utils.book_append_sheet(workbook, mainSheet, 'Clientes');

            // Statistics sheet (if enabled)
            if (this.exportSettings.includeStats) {
                const statsData = this.prepareStatsSheet();
                const statsSheet = window.XLSX.utils.json_to_sheet(statsData);
                window.XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estatísticas');
            }

            // Export options
            const fileName = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
            window.XLSX.writeFile(workbook, fileName);
            
            this.showNotification('Excel exportado com sucesso!', 'success');
            return true;
            
        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
            this.showNotification('Erro ao exportar Excel', 'error');
            return false;
        }
    }

    // Helper methods
    getSelectedFieldsLabels() {
        const fieldLabels = {
            name: 'Nome',
            email: 'E-mail',
            phone: 'Telefone',
            address: 'Endereço',
            company: 'Empresa',
            createdAt: 'Data de Cadastro',
            notes: 'Observações'
        };

        return this.exportSettings.fields.map(field => fieldLabels[field] || field);
    }

    prepareTableData() {
        return this.filteredClients.map(client => {
            return this.exportSettings.fields.map(field => {
                if (field === 'createdAt') {
                    return client[field].toLocaleDateString('pt-BR');
                }
                return client[field] || '';
            });
        });
    }

    prepareExcelData() {
        const fieldLabels = {
            name: 'Nome',
            email: 'E-mail',
            phone: 'Telefone',
            address: 'Endereço',
            company: 'Empresa',
            createdAt: 'Data de Cadastro',
            notes: 'Observações'
        };

        return this.filteredClients.map(client => {
            const row = {};
            this.exportSettings.fields.forEach(field => {
                const label = fieldLabels[field] || field;
                if (field === 'createdAt') {
                    row[label] = client[field].toLocaleDateString('pt-BR');
                } else {
                    row[label] = client[field] || '';
                }
            });
            return row;
        });
    }

    calculateColumnWidths(data) {
        if (!data.length) return [];
        
        const keys = Object.keys(data[0]);
        return keys.map(key => {
            const maxLength = Math.max(
                key.length,
                ...data.map(row => String(row[key] || '').length)
            );
            return { wch: Math.min(maxLength + 2, 50) };
        });
    }

    prepareStatsSheet() {
        const stats = this.generateStats();
        return [
            { Métrica: 'Total de Clientes', Valor: stats.total },
            { Métrica: 'Novos Este Mês', Valor: stats.thisMonth },
            { Métrica: 'Novos Esta Semana', Valor: stats.thisWeek },
            { Métrica: 'Taxa de Crescimento (%)', Valor: stats.growthRate },
            { Métrica: 'Domínio Mais Comum', Valor: stats.topDomain },
            { Métrica: 'Média por Dia', Valor: stats.averagePerDay }
        ];
    }

    generateStats() {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisWeek = new Date(now);
        thisWeek.setDate(now.getDate() - 7);

        const thisMonthCount = this.filteredClients.filter(
            client => client.createdAt >= thisMonth
        ).length;

        const thisWeekCount = this.filteredClients.filter(
            client => client.createdAt >= thisWeek
        ).length;

        // Calculate growth rate
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const lastMonthCount = this.filteredClients.filter(
            client => client.createdAt >= lastMonth && client.createdAt <= lastMonthEnd
        ).length;

        const growthRate = lastMonthCount > 0 
            ? ((thisMonthCount - lastMonthCount) / lastMonthCount * 100).toFixed(1)
            : thisMonthCount > 0 ? 100 : 0;

        // Top domain
        const domains = {};
        this.filteredClients.forEach(client => {
            if (client.email) {
                const domain = client.email.split('@')[1];
                domains[domain] = (domains[domain] || 0) + 1;
            }
        });

        const topDomain = Object.entries(domains)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

        return {
            total: this.filteredClients.length,
            thisMonth: thisMonthCount,
            thisWeek: thisWeekCount,
            growthRate: `${growthRate}%`,
            topDomain,
            averagePerDay: (this.filteredClients.length / 30).toFixed(1)
        };
    }

    drawSimpleTable(doc, headers, data, startY) {
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const tableWidth = pageWidth - (margin * 2);
        const colWidth = tableWidth / headers.length;
        
        let yPos = startY;
        
        // Headers
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        headers.forEach((header, index) => {
            doc.text(header, margin + (index * colWidth), yPos);
        });
        
        yPos += 10;
        
        // Data rows
        doc.setFontSize(8);
        data.forEach(row => {
            if (yPos > 270) { // New page
                doc.addPage();
                yPos = 20;
            }
            
            row.forEach((cell, index) => {
                doc.text(String(cell).substring(0, 25), margin + (index * colWidth), yPos);
            });
            yPos += 7;
        });
    }

    // UI Update methods
    updateUI() {
        this.updatePreview();
        this.updateStatistics();
        this.updateFilterInfo();
    }

    updatePreview() {
        const previewTable = document.getElementById('export-preview-table');
        if (!previewTable) return;

        const headers = this.getSelectedFieldsLabels();
        const data = this.prepareTableData().slice(0, 10); // Show first 10 rows

        let html = '<thead><tr>';
        headers.forEach(header => {
            html += `<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${header}</th>`;
        });
        html += '</tr></thead><tbody>';

        data.forEach((row, index) => {
            html += `<tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;
            row.forEach(cell => {
                html += `<td class="px-4 py-2 text-sm text-gray-900">${cell}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody>';
        previewTable.innerHTML = html;
    }

    updateStatistics() {
        const stats = this.generateStats();
        
        const elements = {
            'export-total-clients': stats.total,
            'export-filtered-count': this.filteredClients.length,
            'export-growth-rate': stats.growthRate,
            'export-top-domain': stats.topDomain
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    updateFilterInfo() {
        const filterInfo = document.getElementById('export-filter-info');
        if (!filterInfo) return;

        let info = [];
        if (this.exportSettings.dateRange !== 'all') {
            info.push(`Período: ${this.exportSettings.dateRange}`);
        }
        if (Object.keys(this.exportSettings.customFilters).length > 0) {
            info.push(`Filtros customizados aplicados`);
        }
        
        filterInfo.textContent = info.join(' • ') || 'Todos os registros';
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
        
        notification.className = `${typeClasses[type]} px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300`;
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Auto-initialize when loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.__app_id !== 'undefined') {
        const config = typeof window.__firebase_config === 'string' 
            ? JSON.parse(window.__firebase_config) 
            : window.__firebase_config || {};
            
        window.exportManager = new ExportManager(window.__app_id, config);
        
        // Initialize when needed
        if (document.getElementById('export-container')) {
            window.exportManager.initialize()
                .then(() => console.log('Export Manager inicializado'))
                .catch(err => console.error('Erro ao inicializar Export Manager:', err));
        }
    }
});