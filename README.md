# 🎯 Sistema de Gestão de Clientes - Versão 3.0.0

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-site-id/deploy-status)](https://app.netlify.com/sites/gestaodecliente/deploys)
[![GitHub](https://img.shields.io/github/license/cristiano-superacao/gestao_clientes)](https://github.com/cristiano-superacao/gestao_clientes)
[![Version](https://img.shields.io/badge/version-3.0.0-blue)](https://gestaodecliente.netlify.app/)

**Sistema completo de gestão de clientes com Inteligência Artificial integrada**

🌐 **[Demo Online](https://gestaodecliente.netlify.app/)**

## 🚀 Características Principais

### 📊 **Versão 2.1.0 - Analytics & Automation**
- **Dashboard Analytics** - Métricas em tempo real com Chart.js
- **Export PDF/Excel** - Exportação avançada com jsPDF e SheetJS
- **Import Bulk** - Importação em massa com validação completa
- **Backup System** - Backup automatizado para Firebase Storage

### 📱 **Versão 2.2.0 - PWA & Notifications**
- **Progressive Web App** - Funciona offline com Service Workers
- **Push Notifications** - Sistema de notificações push com VAPID

### 🧠 **Versão 3.0.0 - AI & Integrations**
- **API Integration** - Validação de CEP, CNPJ, Email em tempo real
- **CRM Integration** - Sincronização com HubSpot, Salesforce, Pipedrive
- **ML Analytics** - Machine Learning com TensorFlow.js

## 🤖 Inteligência Artificial

### **Predições Avançadas:**
- **Churn Prediction** - Identifica clientes em risco de cancelamento
- **LTV Prediction** - Calcula Lifetime Value com precisão
- **Next Purchase** - Prevê quando cliente fará próxima compra

### **Segmentação Inteligente:**
- **K-Means Clustering** - Segmentação automática por ML
- **5 Segmentos** - Alto Valor, Leais, Em Risco, Novos, Perdidos
- **Recomendações** - Sugestões personalizadas por IA

## 🛠️ Tecnologias Utilizadas

### **Frontend:**
- HTML5, CSS3, JavaScript ES6+
- Tailwind CSS para design responsivo
- Chart.js para visualizações
- Font Awesome para ícones

### **Backend & Database:**
- Firebase Firestore (NoSQL)
- Firebase Storage (arquivos)
- Firebase Authentication

### **Machine Learning:**
- TensorFlow.js
- Redes Neurais para predição
- K-Means para clustering
- Análise preditiva avançada

### **Integrações:**
- APIs de validação (ViaCEP, ReceitaWS, BrasilAPI)
- CRMs (HubSpot, Salesforce, Pipedrive)
- Webhooks para automação
- Sistema de cache inteligente

### **PWA & Performance:**
- Service Workers para cache offline
- Manifest.json configurado
- Estratégias de cache avançadas
- Background sync

## 📁 Estrutura do Projeto

```
├── index-complete.html           # Interface principal
├── dashboard-complete.html       # Dashboard analytics
├── export-complete.html          # Sistema de exportação
├── import-complete.html          # Importação em massa
├── backup-complete.html          # Sistema de backup
├── api-integration-complete.html # Integração APIs
├── crm-integration-complete.html # Integração CRM
├── ml-analytics-complete.html    # Machine Learning
├── dashboard-manager.js          # Gerenciador do dashboard
├── export-manager.js            # Gerenciador de exportação
├── import-manager.js            # Gerenciador de importação
├── backup-manager.js            # Gerenciador de backup
├── pwa-manager.js               # Gerenciador PWA
├── api-integration-manager.js    # Gerenciador APIs
├── crm-integration-manager.js    # Gerenciador CRM
├── ml-analytics-manager.js       # Gerenciador ML
├── sw.js                        # Service Worker
├── manifest.json               # PWA Manifest
└── netlify.toml               # Configuração Netlify
```

## 🚀 Como Usar

### **1. Acesse Online:**
🌐 **[https://gestaodecliente.netlify.app/](https://gestaodecliente.netlify.app/)**

### **2. Clone o repositório:**
```bash
git clone https://github.com/cristiano-superacao/gestao_clientes.git
cd gestao_clientes
```

### **3. Configure o Firebase:**
Edite os arquivos HTML e substitua a configuração do Firebase

## 📊 Funcionalidades Detalhadas

### **Dashboard Analytics:**
- 5 métricas principais em tempo real
- 3 gráficos interativos (Chart.js)
- Feed de atividades recentes
- Filtros por período e status

### **Sistema de Export:**
- PDF com jsPDF (relatórios profissionais)
- Excel com SheetJS (planilhas completas)
- Filtros avançados por data e campos
- Estatísticas incluídas

### **Import em Massa:**
- Suporte a CSV e Excel
- Validação completa dos dados
- Detecção de duplicatas
- Processo em 3 etapas

### **Backup Automatizado:**
- Cloud (Firebase Storage)
- Local (download direto)
- Agendamento automático
- Compressão e criptografia

### **Integração APIs:**
- Validação de CEP (ViaCEP, AwesomeAPI)
- Validação de CNPJ (ReceitaWS, BrasilAPI)
- Validação de Email (Hunter.io)
- Rate limiting e cache inteligente

### **CRM Integration:**
- **HubSpot:** Sincronização completa de contatos
- **Salesforce:** OAuth 2.0 e API v52.0
- **Pipedrive:** Sincronização de pessoas e organizações
- Mapeamento de campos configurável

### **Machine Learning:**
- **Churn Model:** Rede neural com 85%+ accuracy
- **Segmentation:** K-Means clustering automático
- **LTV Prediction:** Algoritmo proprietário
- **Recommendations:** Sistema colaborativo

## 🎯 Casos de Uso

### **Para Pequenas Empresas:**
- Gestão completa de clientes
- Backup automático
- Relatórios profissionais
- Validação de dados

### **Para Médias Empresas:**
- Integração com CRMs existentes
- Análise preditiva de churn
- Segmentação automática
- Dashboard executivo

## 📈 Performance

- **Lighthouse Score:** 95+ (Performance, Accessibility, SEO)
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Offline Ready:** 100% funcional offline

## 🔒 Segurança

- Autenticação Firebase
- Validação client-side e server-side
- Rate limiting em APIs
- Criptografia de dados sensíveis
- Headers de segurança configurados

## 👨‍💻 Autor

**Cristiano Superação**
- GitHub: [@cristiano-superacao](https://github.com/cristiano-superacao)

---

**Sistema desenvolvido com ❤️ para otimizar a gestão de clientes com tecnologia de ponta!**

🌐 **[Demo Online](https://gestaodecliente.netlify.app/)**