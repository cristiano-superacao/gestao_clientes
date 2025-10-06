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

# 📱 Sistema de Gestão de Clientes

[![Netlify Status](https://api.netlify.com/api/v1/badges/030d1169-306d-4194-8cea-773f0714f7e5/deploy-status)](https://app.netlify.com/sites/gestaodecliente/deploys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2020.0.0-brightgreen)](https://nodejs.org/)
[![PWA](https://img.shields.io/badge/PWA-enabled-blue)](https://gestaodecliente.netlify.app)

> 🚀 **Sistema completo de gestão de clientes com integração WhatsApp** - Desenvolvido como PWA (Progressive Web App) para máxima compatibilidade e experiência nativa.

## 🌟 Demonstração

**🌐 Acesse o sistema:** [https://gestaodecliente.netlify.app](https://gestaodecliente.netlify.app)

**📱 Instale como app:** O sistema pode ser instalado como aplicativo nativo em dispositivos móveis e desktop.

## ✨ Principais Funcionalidades

### 👥 **Gestão Completa de Clientes**
- ✅ Cadastro e edição de clientes
- ✅ Controle de status (Ativo/Inativo)
- ✅ Busca e filtros avançados
- ✅ Acompanhamento de vencimentos
- ✅ Histórico de atividades

### 💰 **Controle Financeiro**
- ✅ Registro de pagamentos mensais
- ✅ Upload de comprovantes (PDF/Imagem)
- ✅ Status de pagamento (Pago/Pendente/Atrasado)
- ✅ Relatórios e estatísticas
- ✅ Alertas de vencimento automáticos

### 📱 **Integração WhatsApp**
- ✅ Envio automático de lembretes
- ✅ Mensagens de cobrança personalizadas
- ✅ Templates configuráveis
- ✅ Integração com Twilio (opcional)
- ✅ Fallback para WhatsApp Web
- ✅ Variáveis dinâmicas nas mensagens

### 📊 **Dashboard Inteligente**
- ✅ Visão geral em tempo real
- ✅ Estatísticas de pagamentos
- ✅ Indicadores de performance
- ✅ Ações rápidas
- ✅ Atividades recentes

### 📱 **Progressive Web App (PWA)**
- ✅ Instalável em qualquer dispositivo
- ✅ Funciona offline
- ✅ Interface nativa
- ✅ Atualizações automáticas
- ✅ Notificações push
- ✅ Atalhos personalizados

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Design responsivo com Grid/Flexbox
- **JavaScript ES6+** - Lógica da aplicação
- **Service Worker** - Funcionalidade offline
- **Web App Manifest** - Configuração PWA

### Backend
- **Node.js 20+** - Runtime JavaScript
- **Express.js** - Framework web minimalista
- **CORS** - Controle de acesso entre origens
- **File System** - Armazenamento de dados em JSON

### Integrações
- **Twilio API** - WhatsApp Business (opcional)
- **WhatsApp Web** - Fallback para envio
- **Jimp** - Processamento de imagens

### Deploy & Hosting
- **Netlify** - Hospedagem principal com CI/CD
- **Vercel** - Deploy alternativo
- **GitHub Actions** - Automação de deploy

## 🚀 Instalação e Uso

### 📋 Pré-requisitos
- Node.js 20+ 
- NPM 8+
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### 💻 Instalação Local
```bash
# Clone o repositório
git clone https://github.com/cristiano-superacao/gestao_clientes.git
cd gestao_clientes

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev

# Acesse no navegador
http://localhost:3000
```

### 🌐 Deploy
```bash
# Deploy para Netlify
npm run deploy:netlify

# Deploy para Vercel
npm run deploy:vercel
```

### 🔧 Configuração (Opcional)

Para integração completa com WhatsApp via Twilio:

1. Crie uma conta no [Twilio](https://www.twilio.com/)
2. Configure as variáveis de ambiente:
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## 📱 Como Usar

### 1. **Acessar o Sistema**
- Visite [gestaodecliente.netlify.app](https://gestaodecliente.netlify.app)
- Instale como app quando solicitado (recomendado)

### 2. **Cadastrar Clientes**
- Clique em "👥 Clientes" no menu
- Use "➕ Novo Cliente" para cadastrar
- Preencha: nome, WhatsApp, vencimento, valor

### 3. **Registrar Pagamentos**
- Acesse "💰 Pagamentos"
- Use "➕ Registrar Pagamento"
- Anexe comprovantes quando necessário

### 4. **Configurar WhatsApp**
- Vá em "💬 Mensagens"
- Configure templates em "⚙️ Configurar Templates"
- Use variáveis: `{nome}`, `{valor}`, `{vencimento}`

### 5. **Enviar Mensagens**
- **Lembretes:** "📅 Lembretes de Vencimento"
- **Cobranças:** "⏰ Cobrar Atrasados"  
- **Personalizadas:** "💬 Mensagem Personalizada"

## 📊 Estrutura do Projeto

```
gestao_clientes/
├── 📁 assets/          # Ícones e recursos visuais
├── 📁 css/             # Estilos CSS responsivos
├── 📁 js/              # Scripts JavaScript modulares
│   ├── app.js          # Aplicação principal
│   ├── storage.js      # Gerenciamento de dados
│   ├── ui.js           # Interface do usuário
│   ├── whatsapp.js     # Integração WhatsApp
│   └── upload.js       # Upload de arquivos
├── 📁 data/            # Dados JSON (clientes/pagamentos)
├── 📁 api/             # Funções serverless (Vercel)
├── 📁 server/          # Servidor Express.js
├── 📁 docs/            # Documentação completa
├── 📄 index.html       # Página principal
├── 📄 manifest.json    # Configuração PWA
├── 📄 sw.js           # Service Worker
├── 📄 netlify.toml    # Configuração Netlify
└── 📄 vercel.json     # Configuração Vercel
```

## 📚 Documentação

### 📖 Guias Completos
- **[📋 Documentação Principal](docs/DOCUMENTACAO.md)** - Visão geral completa
- **[👤 Guia do Usuário](docs/GUIA_USUARIO.md)** - Como usar passo a passo
- **[🛠️ Documentação Técnica](docs/DOCUMENTACAO_TECNICA.md)** - Para desenvolvedores
- **[❓ FAQ](docs/FAQ.md)** - Perguntas frequentes e solução de problemas

### 🎯 Links Rápidos
- **Demo Online:** https://gestaodecliente.netlify.app
- **Repositório:** https://github.com/cristiano-superacao/gestao_clientes
- **Issues:** https://github.com/cristiano-superacao/gestao_clientes/issues

## 🔧 Scripts Disponíveis

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build para produção
npm run start            # Iniciar servidor
npm run generate-icons   # Gerar ícones PWA
npm run start:server     # Iniciar servidor Express
npm run deploy:netlify   # Deploy para Netlify
npm run deploy:vercel    # Deploy para Vercel
```

## 🔐 Segurança e Privacidade

- ✅ **Dados Locais:** Armazenamento no dispositivo do usuário
- ✅ **HTTPS Obrigatório:** Comunicação criptografada
- ✅ **Validação de Inputs:** Proteção contra XSS
- ✅ **CORS Configurado:** Controle de acesso restrito
- ✅ **Sem Tracking:** Nenhum dado pessoal coletado

## 📈 Performance

- ⚡ **Lighthouse Score:** 95+ em todas as categorias
- 📱 **Mobile First:** Otimizado para dispositivos móveis
- 🔄 **Cache Inteligente:** Recursos salvos localmente
- 📊 **Bundle Otimizado:** < 500KB total
- 🚀 **Loading Speed:** < 2s para primeira visualização

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. **Fork** o projeto
2. **Clone** seu fork
3. **Crie** uma branch para sua feature
4. **Commit** suas mudanças
5. **Push** para a branch
6. **Abra** um Pull Request

### 🐛 Reportando Bugs

Use as [GitHub Issues](https://github.com/cristiano-superacao/gestao_clientes/issues) para reportar bugs:

1. Descreva o problema claramente
2. Inclua steps para reproduzir
3. Anexe screenshots se necessário
4. Informe seu navegador/dispositivo

## 🗺️ Roadmap

### 🎯 Próximas Versões

#### v1.1 - Relatórios Avançados
- [ ] Gráficos interativos (Chart.js)
- [ ] Exportação para PDF/Excel
- [ ] Análise de tendências
- [ ] Relatórios personalizáveis

#### v1.2 - Sync na Nuvem
- [ ] Backup automático
- [ ] Sincronização entre dispositivos
- [ ] Banco de dados remoto
- [ ] Multi-usuário

#### v1.3 - Recursos Avançados
- [ ] Notificações push
- [ ] Integração com bancos
- [ ] App mobile nativo
- [ ] API pública

## 🏆 Reconhecimentos

### 🎓 Projeto Acadêmico
Este sistema foi desenvolvido como projeto educacional no **SENAI 2025**, demonstrando:
- Desenvolvimento Full Stack
- Práticas modernas de web development
- Integração com APIs externas
- Deploy e CI/CD
- Documentação técnica

### 🙏 Agradecimentos
- **SENAI** - Pela formação técnica
- **Netlify/Vercel** - Pela hospedagem gratuita
- **Twilio** - Pela API de WhatsApp
- **Comunidade Open Source** - Pelas ferramentas utilizadas

## 📞 Suporte e Contato

### 📧 Contato Direto
- **Email:** cristiano.s.santos@ba.estudante.senai.br
- **GitHub:** [@cristiano-superacao](https://github.com/cristiano-superacao)

### 🆘 Canais de Suporte
- **GitHub Issues:** Para bugs e sugestões
- **Email:** Para dúvidas gerais
- **Documentação:** Para tutoriais e guias

### ⏰ Tempo de Resposta
- **Issues GitHub:** 24-48 horas
- **Email:** 2-3 dias úteis
- **Bugs críticos:** Prioridade máxima

## 📄 Licença

Este projeto está licenciado sob a **MIT License**. Isso significa que você pode:

- ✅ **Usar** comercialmente
- ✅ **Modificar** o código
- ✅ **Distribuir** livremente
- ✅ **Sublicenciar** 
- ❌ **Responsabilizar** o autor por danos

Veja o arquivo [LICENSE](LICENSE) para detalhes completos.

## 🌟 Mostre seu Apoio

Se este projeto foi útil para você:

⭐ **Dê uma estrela** no GitHub  
🐛 **Reporte bugs** que encontrar  
💡 **Sugira melhorias** nas Issues  
🤝 **Contribua** com código  
📢 **Compartilhe** com outros desenvolvedores

---

<div align="center">

**✨ Desenvolvido com ❤️ por [Cristiano Santos](https://github.com/cristiano-superacao) ✨**

**🎓 SENAI 2025 | Sistema de Gestão de Clientes | v1.0.0**

[🌐 Demo](https://gestaodecliente.netlify.app) • [📚 Docs](docs/) • [🐛 Issues](https://github.com/cristiano-superacao/gestao_clientes/issues) • [📧 Contato](mailto:cristiano.s.santos@ba.estudante.senai.br)

</div>

---

*Última atualização: Outubro 2025*

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