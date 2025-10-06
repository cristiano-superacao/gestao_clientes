# 🛠️ Documentação Técnica - Sistema de Gestão de Clientes

## 🏗️ Arquitetura do Sistema

### 📐 Visão Geral da Arquitetura
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Integrações   │
│   (PWA)         │◄──►│   (Express)     │◄──►│   (WhatsApp)    │
│                 │    │                 │    │                 │
│ • HTML/CSS/JS   │    │ • Node.js       │    │ • Twilio API    │
│ • Service Worker│    │ • Express.js    │    │ • WhatsApp Web  │
│ • Local Storage │    │ • File System   │    │ • Fallback      │
│ • PWA Manifest  │    │ • CORS          │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔄 Fluxo de Dados
```
User Interface → Local Storage → API Backend → Twilio/WhatsApp → External Services
     ↑                                                              ↓
Service Worker ← ← ← ← ← Offline Sync ← ← ← ← ← ← ← ← ← ← ← ← ← Response
```

## 📁 Estrutura de Arquivos Detalhada

```
gestao_clientes/
├── 📁 .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions workflow
├── 📁 .netlify/
│   ├── plugins/                # Plugins do Netlify
│   └── state.json             # Estado do deploy
├── 📁 api/                    # Serverless Functions (Vercel)
│   └── index.js               # API principal serverless
├── 📁 assets/                 # Recursos estáticos
│   ├── browserconfig.json     # Configuração Internet Explorer
│   ├── icon.svg              # Ícone vetorial base
│   └── icon-*.png            # Ícones PWA (72px a 512px)
├── 📁 css/
│   └── styles.css             # Estilos principais (responsive)
├── 📁 data/                   # Banco de dados JSON
│   ├── clientes.json          # Dados dos clientes
│   └── pagamentos.json        # Dados dos pagamentos
├── 📁 docs/                   # Documentação
│   ├── DOCUMENTACAO.md        # Documentação principal
│   ├── GUIA_USUARIO.md        # Guia do usuário
│   ├── DOCUMENTACAO_TECNICA.md # Esta documentação
│   └── FAQ.md                 # Perguntas frequentes
├── 📁 js/                     # Scripts JavaScript
│   ├── app.js                 # Aplicação principal
│   ├── storage.js             # Gerenciamento de dados
│   ├── ui.js                  # Interface do usuário
│   ├── whatsapp.js            # Integração WhatsApp
│   └── upload.js              # Upload de arquivos
├── 📁 scripts/                # Scripts de build
│   ├── generate-icons.js      # Geração de ícones PWA
│   └── test-api.ps1          # Testes da API
├── 📁 server/                 # Servidor Express
│   └── index.js               # Servidor principal
├── 📁 static/                 # Assets estáticos
│   └── manifest.json          # Manifest alternativo
├── 📄 .env.example            # Variáveis de ambiente exemplo
├── 📄 .gitignore              # Arquivos ignorados pelo Git
├── 📄 .nvmrc                  # Versão do Node.js
├── 📄 index.html              # Página principal
├── 📄 manifest.json           # PWA Manifest
├── 📄 netlify.toml            # Configuração Netlify
├── 📄 package.json            # Dependências Node.js
├── 📄 sw.js                   # Service Worker
└── 📄 vercel.json             # Configuração Vercel
```

## 🔧 Tecnologias e Dependências

### 📦 Frontend Stack
```json
{
  "core": {
    "HTML5": "Estrutura semântica",
    "CSS3": "Grid, Flexbox, Custom Properties",
    "JavaScript": "ES6+, Modules, Async/Await"
  },
  "pwa": {
    "Service Worker": "Caching, Offline, Background Sync",
    "Web App Manifest": "Instalação, Ícones, Shortcuts",
    "Local Storage": "Persistência de dados"
  },
  "styling": {
    "CSS Grid": "Layout principal",
    "Flexbox": "Componentes",
    "CSS Variables": "Theming",
    "Media Queries": "Responsividade"
  }
}
```

### 🚀 Backend Stack
```json
{
  "runtime": "Node.js 20.18.0",
  "framework": "Express.js 4.18.2",
  "middleware": [
    "cors@2.8.5",
    "body-parser (built-in)"
  ],
  "integrations": [
    "twilio@4.5.0",
    "jimp@0.22.10"
  ],
  "storage": "File System (JSON)"
}
```

### 🌐 Deploy Stack
```json
{
  "primary": {
    "platform": "Netlify",
    "build": "Static Site + Functions",
    "cdn": "Global CDN",
    "ssl": "Auto SSL"
  },
  "alternative": {
    "platform": "Vercel",
    "functions": "Serverless Functions",
    "edge": "Edge Runtime",
    "ssl": "Auto SSL"
  }
}
```

## 📊 Banco de Dados (JSON)

### 👥 Schema dos Clientes
```typescript
interface Cliente {
  id: string;                    // UUID único
  nome: string;                  // Nome completo
  whatsapp: string;              // Número com DDD
  vencimento: string;            // Data ISO (YYYY-MM-DD)
  valor: number;                 // Valor mensal
  status: 'Ativo' | 'Inativo';  // Status do cliente
  observacoes?: string;          // Observações opcionais
  dataCriacao: string;           // Timestamp ISO
  dataAtualizacao?: string;      // Timestamp ISO
}
```

### 💰 Schema dos Pagamentos
```typescript
interface Pagamento {
  id: string;                    // UUID único
  clienteId: string;             // Referência ao cliente
  referencia: string;            // Mês/ano (YYYY-MM)
  dataPagamento: string;         // Data ISO
  valor: number;                 // Valor pago
  status: 'Pago' | 'Pendente' | 'Atrasado';
  comprovante?: string;          // Base64 ou URL
  observacoes?: string;          // Observações opcionais
  dataCriacao: string;           // Timestamp ISO
  dataAtualizacao?: string;      // Timestamp ISO
}
```

### 📋 Schema das Atividades
```typescript
interface Atividade {
  id: string;                    // UUID único
  tipo: string;                  // Tipo da atividade
  descricao: string;             // Descrição detalhada
  categoria: 'cliente' | 'pagamento' | 'mensagem';
  timestamp: string;             // Timestamp ISO
  metadata?: object;             // Dados adicionais
}
```

## 🔌 API Endpoints

### 🏥 Health Check
```http
GET /api/health
Response: {
  "status": "ok",
  "timestamp": "2025-10-06T20:00:00.000Z",
  "platform": "netlify|vercel",
  "twilioConfigured": boolean
}
```

### 👥 Clientes
```http
# Listar todos os clientes
GET /api/clientes
Response: Cliente[]

# Obter cliente específico
GET /api/clientes/:id
Response: Cliente

# Criar novo cliente
POST /api/clientes
Body: Omit<Cliente, 'id' | 'dataCriacao'>
Response: Cliente

# Atualizar cliente
PUT /api/clientes/:id
Body: Partial<Cliente>
Response: Cliente

# Deletar cliente
DELETE /api/clientes/:id
Response: { ok: true }
```

### 💰 Pagamentos
```http
# Listar todos os pagamentos
GET /api/pagamentos
Response: Pagamento[]

# Obter pagamento específico
GET /api/pagamentos/:id
Response: Pagamento

# Criar novo pagamento
POST /api/pagamentos
Body: Omit<Pagamento, 'id' | 'dataCriacao'>
Response: Pagamento

# Atualizar pagamento
PUT /api/pagamentos/:id
Body: Partial<Pagamento>
Response: Pagamento

# Deletar pagamento
DELETE /api/pagamentos/:id
Response: { ok: true }
```

### 💬 WhatsApp
```http
# Enviar mensagem
POST /api/send-whatsapp
Body: {
  "to": string,      # Número do WhatsApp
  "message": string  # Mensagem a enviar
}
Response: {
  "ok": boolean,
  "sid"?: string,         # Twilio SID (se sucesso)
  "fallback"?: boolean,   # Se usou fallback
  "waLink"?: string,      # Link WhatsApp Web
  "method": "twilio" | "fallback" | "web",
  "error"?: string
}

# Testar configuração WhatsApp
POST /api/test-whatsapp
Response: {
  "configured": boolean,
  "message": string,
  "error"?: string
}
```

## 🎨 Sistema de Design

### 🎨 Paleta de Cores
```css
:root {
  /* Primary Colors */
  --primary-50: #eff6ff;
  --primary-500: #004aad;
  --primary-900: #1e3a8a;
  
  /* Semantic Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Neutral Colors */
  --gray-50: #f9fafb;
  --gray-500: #6b7280;
  --gray-900: #111827;
}
```

### 📱 Breakpoints Responsivos
```css
/* Mobile First Approach */
.container {
  /* Mobile: 320px+ */
  width: 100%;
  padding: 1rem;
}

@media (min-width: 640px) {
  /* Tablet: 640px+ */
  .container { padding: 1.5rem; }
}

@media (min-width: 768px) {
  /* Desktop: 768px+ */
  .container { padding: 2rem; }
}

@media (min-width: 1024px) {
  /* Large Desktop: 1024px+ */
  .container { max-width: 1200px; margin: 0 auto; }
}
```

### 🎯 Componentes Principais
```css
/* Card Component */
.card {
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1.5rem;
  transition: all 0.2s ease;
}

/* Button Component */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

/* Modal Component */
.modal {
  background: var(--bg-modal);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  max-width: 500px;
  width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
}
```

## 🔄 Service Worker e PWA

### 📱 PWA Features
```javascript
// manifest.json principais configurações
{
  "name": "Sistema de Gestão de Clientes",
  "short_name": "Gestão Clientes",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#004aad",
  "background_color": "#ffffff",
  "orientation": "any",
  "categories": ["business", "productivity"],
  "shortcuts": [
    {
      "name": "Novo Cliente",
      "url": "/?action=novo-cliente"
    }
  ]
}
```

### 🔄 Service Worker Strategy
```javascript
// Cache Strategy: Cache First com Network Fallback
const CACHE_NAME = 'gestao-clientes-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/css/styles.css',
  '/js/app.js',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

### 💾 Local Storage Management
```javascript
class StorageManager {
  constructor() {
    this.prefix = 'gestao_clientes_';
    this.version = '1.0';
  }

  // Save data with versioning
  saveData(key, data) {
    const payload = {
      version: this.version,
      timestamp: new Date().toISOString(),
      data: data
    };
    localStorage.setItem(
      this.prefix + key, 
      JSON.stringify(payload)
    );
  }

  // Load data with migration
  loadData(key, defaultValue = []) {
    try {
      const stored = localStorage.getItem(this.prefix + key);
      if (!stored) return defaultValue;
      
      const payload = JSON.parse(stored);
      return payload.data || defaultValue;
    } catch (error) {
      console.error('Error loading data:', error);
      return defaultValue;
    }
  }
}
```

## 🔐 Segurança e Performance

### 🛡️ Medidas de Segurança
```javascript
// Input Sanitization
function sanitizeInput(input) {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '');
}

// CORS Configuration
const corsOptions = {
  origin: [
    'https://gestaodecliente.netlify.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Rate Limiting (em desenvolvimento)
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por janela
};
```

### ⚡ Otimizações de Performance
```javascript
// Lazy Loading de Módulos
const loadModule = async (moduleName) => {
  const { default: module } = await import(`./modules/${moduleName}.js`);
  return module;
};

// Debounce para Busca
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Virtual Scrolling para Listas Grandes
class VirtualList {
  constructor(container, itemHeight, items) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.items = items;
    this.visibleStart = 0;
    this.visibleEnd = 10;
    this.renderVisibleItems();
  }
}
```

## 🧪 Testes e Qualidade

### 🔍 Estratégia de Testes
```javascript
// Unit Tests (Jest)
describe('StorageManager', () => {
  test('should save and load data correctly', () => {
    const storage = new StorageManager();
    const testData = [{ id: '1', nome: 'Test' }];
    
    storage.saveClientes(testData);
    const loaded = storage.getClientes();
    
    expect(loaded).toEqual(testData);
  });
});

// Integration Tests
describe('WhatsApp Integration', () => {
  test('should send message via Twilio', async () => {
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: '+5511999999999',
        message: 'Test message'
      })
    });
    
    expect(response.ok).toBe(true);
  });
});
```

### 📊 Quality Metrics
```yaml
# Lighthouse Targets
performance: '>= 90'
accessibility: '>= 95'
best_practices: '>= 90'
seo: '>= 90'
pwa: '>= 90'

# Bundle Size Targets
total_bundle: '< 500KB'
main_chunk: '< 200KB'
css_bundle: '< 100KB'

# Performance Targets
first_contentful_paint: '< 1.5s'
time_to_interactive: '< 3.0s'
cumulative_layout_shift: '< 0.1'
```

## 🚀 Deploy e CI/CD

### 📦 Build Process
```json
{
  "scripts": {
    "dev": "live-server --port=3000",
    "build": "npm run copy-files && npm run generate-icons",
    "copy-files": "robocopy . dist /E /XD node_modules .git dist",
    "generate-icons": "node scripts/generate-icons.js",
    "test": "jest",
    "lint": "eslint js/**/*.js",
    "deploy:netlify": "netlify deploy --prod",
    "deploy:vercel": "vercel --prod"
  }
}
```

### 🔄 GitHub Actions
```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=.
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🔧 Configuração de Desenvolvimento

### 🛠️ Setup Local
```bash
# Clone do repositório
git clone https://github.com/cristiano-superacao/gestao_clientes.git
cd gestao_clientes

# Instalação de dependências
npm install

# Configuração de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Deploy
npm run deploy:netlify
```

### 🔒 Variáveis de Ambiente
```bash
# .env.example
NODE_ENV=development
PORT=5000

# Twilio Configuration (Opcional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Database (Futuro)
DATABASE_URL=your_database_url

# Analytics (Futuro)
GOOGLE_ANALYTICS_ID=your_ga_id
```

## 📈 Monitoramento e Analytics

### 📊 Métricas Coletadas
```javascript
// Performance Monitoring
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration}ms`);
  }
});

// Error Tracking
window.addEventListener('error', (event) => {
  console.error('Error:', event.error);
  // Send to monitoring service
});

// User Analytics
const trackEvent = (action, category, label) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: category,
      event_label: label
    });
  }
};
```

## 🔮 Roadmap e Extensibilidade

### 🎯 Próximas Features
- [ ] **Database Integration** - PostgreSQL/MongoDB
- [ ] **Multi-tenant** - Suporte a múltiplos usuários
- [ ] **Real-time Sync** - WebSockets/Server-Sent Events
- [ ] **Advanced Reports** - Charts.js/D3.js
- [ ] **Mobile App** - React Native/Ionic
- [ ] **API Documentation** - Swagger/OpenAPI

### 🔌 Plugin Architecture
```javascript
// Plugin System (Futuro)
class PluginManager {
  constructor() {
    this.plugins = new Map();
  }

  register(name, plugin) {
    this.plugins.set(name, plugin);
    plugin.init?.();
  }

  execute(hook, ...args) {
    for (const plugin of this.plugins.values()) {
      plugin[hook]?.(...args);
    }
  }
}

// Example Plugin
const analyticsPlugin = {
  init() {
    console.log('Analytics plugin initialized');
  },
  
  onClienteCreated(cliente) {
    this.track('cliente_created', { id: cliente.id });
  }
};
```

---

## 📞 Suporte Técnico

### 🛠️ Debugging
```javascript
// Debug Mode
const DEBUG = localStorage.getItem('debug') === 'true';

const log = (...args) => {
  if (DEBUG) console.log('[DEBUG]', ...args);
};

// Feature Flags
const FEATURES = {
  NEW_UI: false,
  ADVANCED_REPORTS: false,
  REAL_TIME_SYNC: false
};
```

### 📧 Contato
- **Email:** cristiano.s.santos@ba.estudante.senai.br
- **GitHub:** https://github.com/cristiano-superacao/gestao_clientes
- **Issues:** https://github.com/cristiano-superacao/gestao_clientes/issues

---

*Documentação atualizada em: Outubro 2025*