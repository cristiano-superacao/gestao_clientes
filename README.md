# Sistema de Gestão de Clientes - TV Box

Sistema responsivo completo para gestão de clientes e pagamentos com integração WhatsApp e funcionalidades PWA.

## 🚀 Funcionalidades Principais

### ✅ Gestão de Clientes
- ➕ Cadastro completo de clientes
- ✏️ Edição e atualização de dados
- 🗑️ Exclusão de clientes
- 🔍 Busca e filtros avançados
- 📱 Contato direto via WhatsApp

### 💰 Controle de Pagamentos
- 💳 Registro de pagamentos
- 📊 Histórico completo
- 📋 Status automatizado (Pago, Pendente, Atrasado)
- 📎 Upload de comprovantes
- 📅 Controle de vencimentos

### 📱 Integração WhatsApp
- 🤖 Envio automático de mensagens
- 📝 Templates personalizáveis
- 📅 Lembretes de vencimento
- ⏰ Notificações de atraso
- ✅ Confirmações de pagamento
- 🎯 Envios em massa inteligentes

### 📊 Dashboard Interativo
- 📈 Métricas em tempo real
- 📋 Atividades recentes
- 🎯 Ações rápidas
- 📱 Interface responsiva

### 🔧 Recursos Técnicos
- 📱 **PWA (Progressive Web App)**
- 🌐 **Funciona offline/online**
- 📺 **Otimizado para TV Box**
- 🎨 **Tema escuro/claro**
- 💾 **Sincronização automática**
- 🔒 **Armazenamento local seguro**

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Design responsivo e moderno
- **JavaScript ES6+** - Interatividade e lógica
- **Service Worker** - Funcionalidade PWA

### Backend
- **Node.js** - Servidor JavaScript
- **Express.js** - Framework web
- **CORS** - Controle de acesso
- **File System** - Persistência de dados

### Integrações
- **Twilio API** - WhatsApp Business
- **WhatsApp Web** - Fallback automático
- **JIMP** - Processamento de imagens
- **Manifest.json** - Configuração PWA

## 📋 Instalação e Configuração

### Pré-requisitos
- Node.js (versão 14+)
- npm ou yarn
- Navegador moderno

### 1. Instalação das Dependências
```bash
cd "d:\Senai 2025\Monitoramento_Tv_Box"
npm install
```

### 2. Configuração do WhatsApp (Opcional)
Para usar a integração completa com Twilio:

```bash
# Criar arquivo .env na raiz do projeto
TWILIO_ACCOUNT_SID=seu_account_sid
TWILIO_AUTH_TOKEN=seu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 3. Iniciar o Servidor
```bash
npm start
# ou
node server/index.js
```

### 4. Acessar o Sistema
- **Local**: http://localhost:5000
- **Rede**: http://seu-ip:5000

## 📱 Como Usar

### Primeiro Acesso
1. Abra o sistema no navegador
2. O dashboard mostrará as estatísticas iniciais
3. Use os dados de exemplo ou cadastre novos clientes

### Gestão de Clientes
1. **Novo Cliente**: Botão "➕ Novo Cliente" ou FAB
2. **Editar**: Clique no ícone ✏️ na tabela
3. **WhatsApp**: Clique no ícone 📱 para enviar mensagem
4. **Excluir**: Clique no ícone 🗑️

### Pagamentos
1. **Registrar**: Botão "💳 Registrar Pagamento"
2. **Upload**: Anexe comprovantes (imagens/PDF)
3. **Histórico**: Visualize todos os pagamentos

### WhatsApp Automation
1. **Configurar**: Acesse "Mensagens" → "⚙️ Configurar Templates"
2. **Templates**: Personalize as mensagens automáticas
3. **Envio**: Use as ações rápidas ou automático

### PWA (Aplicativo)
1. **Instalar**: Banner de instalação ou menu do navegador
2. **Ícone**: Será criado na tela inicial
3. **Offline**: Funciona sem internet

## 🎨 Responsividade

### 📱 Mobile (até 768px)
- Menu lateral retrátil
- Cards empilhados
- Botões de toque ampliados
- Formulários otimizados

### 💻 Desktop (768px - 1920px)
- Sidebar fixa
- Grade de múltiplas colunas
- Hover effects
- Navegação por teclado

### 📺 TV Box (1920px+)
- Fonte ampliada
- Elementos espaçados
- Controle remoto amigável
- Interface simplificada

## 🔄 Fluxo de Dados

### Modo Online
1. Dados salvos localmente (localStorage)
2. Sincronização automática com API
3. Backup em arquivos JSON
4. WhatsApp via Twilio API

### Modo Offline
1. Funcionalidade completa local
2. Dados em localStorage
3. WhatsApp via web (wa.me)
4. Sincronização ao reconectar

## 📁 Estrutura do Projeto

```
d:\Senai 2025\Monitoramento_Tv_Box\
├── index.html              # Página principal
├── manifest.json           # Configuração PWA
├── sw.js                   # Service Worker
├── package.json            # Dependências
├── 
├── css/
│   └── styles.css          # Estilos responsivos
├── 
├── js/
│   ├── app.js              # Aplicação principal
│   ├── storage.js          # Gerenciamento de dados
│   ├── ui.js               # Interface do usuário
│   ├── whatsapp.js         # Integração WhatsApp
│   └── upload.js           # Upload de arquivos
├── 
├── server/
│   └── index.js            # Servidor Express
├── 
├── assets/
│   ├── icon-192.png        # Ícones PWA
│   ├── icon-512.png
│   └── (outros ícones)
├── 
└── data/
    ├── clientes.json       # Dados dos clientes
    └── pagamentos.json     # Dados dos pagamentos
```

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npx vercel
```

### Netlify
```bash
npx netlify deploy
```

### Servidor Próprio
```bash
# PM2 para produção
npm install -g pm2
pm2 start server/index.js --name "gestao-clientes"
```

## 🔧 Configurações Avançadas

### Personalização de Templates
```javascript
// Em js/whatsapp.js
const templates = {
    lembrete: 'Sua mensagem personalizada para {nome}...',
    vencimento: 'Pagamento vence hoje para {nome}...',
    // ... outros templates
};
```

### Modificar Porta do Servidor
```javascript
// Em server/index.js
const PORT = process.env.PORT || 3000; // Altere aqui
```

### Temas Customizados
```css
/* Em css/styles.css */
:root {
    --primary-color: #sua-cor;
    --secondary-color: #sua-cor;
    /* ... outras variáveis */
}
```

## 🐛 Solução de Problemas

### WhatsApp não funciona
1. Verifique as variáveis de ambiente Twilio
2. Teste a conexão: Mensagens → "🧪 Testar Configuração"
3. Fallback automático para WhatsApp Web

### PWA não instala
1. Verifique se está em HTTPS (produção)
2. Confirme se manifest.json está acessível
3. Verifique Service Worker no DevTools

### Dados não sincronizam
1. Verifique conexão com a internet
2. Confirme se o servidor está rodando
3. Veja console do navegador para erros

## 📞 Suporte

### Logs do Sistema
- Abra DevTools → Console
- Verifique erros em vermelho
- Network tab para problemas de API

### Informações do Sistema
- Dashboard mostra status de conexão
- Mensagens → Status da Integração
- Configurações para diagnósticos

## 🔮 Próximas Funcionalidades

- [ ] 📊 Relatórios avançados com gráficos
- [ ] 📧 Integração com e-mail
- [ ] 💳 Gateway de pagamento
- [ ] 🔐 Sistema de autenticação
- [ ] 📱 App nativo (React Native)
- [ ] 🤖 Chatbot automatizado
- [ ] 📈 Analytics detalhados

## 📄 Licença

Este projeto é de uso educacional e está disponível sob licença MIT.

---

**Desenvolvido com ❤️ para TV Box e dispositivos móveis**

🚀 **Sistema 100% responsivo e funcional offline!**

Sistema responsivo de gestão de clientes com envio automático de mensagens WhatsApp.

## 🚀 Características

- **Interface Responsiva**: Compatible com mobile, desktop e Android TV Box
- **PWA**: Instalável como aplicativo nativo
- **Gestão de Clientes**: Cadastro completo com controle de pagamentos
- **Automação WhatsApp**: Envio automático de lembretes de pagamento
- **Deploy Fácil**: Compatible com Vercel e Netlify

## 📱 Funcionalidades

- ✅ Cadastro e gestão de clientes
- ✅ Controle de pagamentos mensais
- ✅ Upload de comprovantes
- ✅ Filtros e busca avançada
- ✅ Dashboard com estatísticas
- ✅ Dark mode
- ✅ Notificações automáticas
- ✅ Backup e restauração de dados

## 🛠️ Tecnologias

- HTML5 + CSS3 + JavaScript (Vanilla)
- Progressive Web App (PWA)
- LocalStorage para persistência
- Service Worker para cache offline
- Responsive Design (Mobile First)

## 📦 Instalação Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/sistema-gestao-clientes.git

# Entre no diretório
cd sistema-gestao-clientes

# Instale as dependências
npm install

# Execute localmente
npm run dev
```

### Gerar ícones PWA (Node + sharp)

Se quiser gerar os PNGs do PWA a partir do SVG, execute:

```bash
# Instale dependências do projeto
npm install

# Gere os ícones
npm run generate-icons
```

Os arquivos serão criados em `assets/icon-<size>.png`.

## 🌐 Deploy

### Vercel
```bash
npm run deploy:vercel
```

### Netlify
```bash
npm run deploy:netlify
```

## 📱 Instalação como App

1. Acesse o site pelo navegador
2. Clique no ícone "Instalar App" ou no menu "Adicionar à tela inicial"
3. O app será instalado como aplicativo nativo

## 🔧 Configuração WhatsApp

Para habilitar o envio automático:

1. Acesse as configurações do sistema
2. Configure sua API do WhatsApp (Twilio, Zenvia ou WhatsApp Business)
3. Defina os templates de mensagem
4. Ative as notificações automáticas

### Endpoint local para envio de mensagens (Opcional)

Um servidor Express de teste foi adicionado em `server/index.js`. Ele expõe:

- `POST /api/send-whatsapp` com JSON { to: '<telefone-com-DDI>', message: '<texto>' }

Se variáveis de ambiente do Twilio estiverem configuradas (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER), o endpoint tentará enviar via Twilio; caso contrário, retornará um link `wa.me` como fallback.

Para iniciar o servidor localmente:

```bash
npm install
npm run start:server
```

O server roda por padrão na porta 5000.

## 📊 Estrutura de Dados

### Clientes
- Nome, Contato, Vencimento
- Status (Ativo/Inativo)
- Valor, Observações

### Pagamentos
- Cliente, Mês/Referência
- Data de Pagamento, Status
- Comprovante

## 🤝 Contribuição

Contribuições são bem-vindas! Abra uma issue ou pull request.

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.