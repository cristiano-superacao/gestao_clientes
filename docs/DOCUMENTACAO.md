# 📱 Sistema de Gestão de Clientes

## 🌟 Visão Geral

O **Sistema de Gestão de Clientes** é uma aplicação web completa (PWA) desenvolvida para facilitar o gerenciamento de clientes e pagamentos, com integração automática para envio de mensagens via WhatsApp. O sistema foi projetado para ser intuitivo, responsivo e funcionar tanto online quanto offline.

### 🎯 Objetivos

- **Simplificar** o controle de clientes e pagamentos
- **Automatizar** lembretes e cobranças via WhatsApp
- **Centralizar** todas as informações em uma única plataforma
- **Proporcionar** acesso fácil em qualquer dispositivo
- **Garantir** segurança e backup dos dados

## 🚀 Funcionalidades Principais

### 👥 Gestão de Clientes
- ✅ Cadastro completo de clientes
- ✅ Edição e exclusão de registros
- ✅ Busca e filtros avançados
- ✅ Controle de status (Ativo/Inativo)
- ✅ Acompanhamento de vencimentos
- ✅ Histórico de atividades

### 💰 Controle de Pagamentos
- ✅ Registro de pagamentos mensais
- ✅ Upload de comprovantes
- ✅ Status de pagamento (Pago/Pendente/Atrasado)
- ✅ Relatórios financeiros
- ✅ Controle por período
- ✅ Alertas de vencimento

### 📱 Integração WhatsApp
- ✅ Envio automático de lembretes
- ✅ Mensagens de cobrança
- ✅ Confirmação de pagamentos
- ✅ Templates personalizáveis
- ✅ Fallback para WhatsApp Web
- ✅ Integração com Twilio (opcional)

### 📊 Dashboard e Relatórios
- ✅ Visão geral dos dados
- ✅ Estatísticas em tempo real
- ✅ Atividades recentes
- ✅ Indicadores de performance
- ✅ Alertas visuais
- ✅ Ações rápidas

### 📱 Progressive Web App (PWA)
- ✅ Instalável em dispositivos móveis
- ✅ Funciona offline
- ✅ Atualizações automáticas
- ✅ Interface nativa
- ✅ Notificações push
- ✅ Atalhos personalizados

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilização responsiva e animações
- **JavaScript ES6+** - Lógica da aplicação
- **Service Worker** - Funcionalidade offline
- **Web App Manifest** - Configuração PWA

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **CORS** - Controle de acesso
- **File System** - Armazenamento local de dados

### Integrações
- **Twilio** - API para WhatsApp Business
- **WhatsApp Web** - Fallback para envio de mensagens
- **Jimp** - Processamento de imagens

### Deploy
- **Netlify** - Hospedagem principal
- **Vercel** - Deploy alternativo
- **GitHub** - Controle de versão

## 🌍 URLs e Acesso

### 🔗 Links Principais
- **Site Principal:** https://gestaodecliente.netlify.app
- **Repositório:** https://github.com/cristiano-superacao/gestao_clientes
- **Dashboard Netlify:** https://app.netlify.com/projects/gestaodecliente

### 📱 Instalação
O sistema pode ser instalado como aplicativo nativo:
1. Acesse o site no navegador
2. Clique no banner de instalação ou
3. Use "Adicionar à tela inicial" no menu do navegador

## 📋 Estrutura do Projeto

```
gestao_clientes/
├── 📁 assets/          # Ícones e recursos visuais
├── 📁 css/             # Estilos CSS
├── 📁 js/              # Scripts JavaScript
├── 📁 data/            # Dados JSON (clientes/pagamentos)
├── 📁 api/             # Funções serverless (Vercel)
├── 📁 server/          # Servidor Express.js
├── 📁 scripts/         # Scripts de build e utilitários
├── 📁 .github/         # Workflows de CI/CD
├── 📄 index.html       # Página principal
├── 📄 manifest.json    # Configuração PWA
├── 📄 sw.js           # Service Worker
├── 📄 netlify.toml    # Configuração Netlify
├── 📄 vercel.json     # Configuração Vercel
└── 📄 package.json    # Dependências Node.js
```

## 🎨 Interface do Sistema

### 🎯 Design Responsivo
- **Mobile First** - Otimizado para dispositivos móveis
- **Adaptive Layout** - Adapta-se a diferentes tamanhos de tela
- **Dark/Light Mode** - Temas claro e escuro
- **Acessibilidade** - Seguindo padrões WCAG

### 🧭 Navegação
- **Sidebar** - Menu lateral com todas as seções
- **Header** - Barra superior com ações rápidas
- **FAB** - Botão de ação flutuante
- **Breadcrumbs** - Navegação contextual

### 📱 Páginas Principais
1. **Dashboard** - Visão geral e estatísticas
2. **Clientes** - Gestão completa de clientes
3. **Pagamentos** - Controle financeiro
4. **Mensagens** - Central de WhatsApp
5. **Relatórios** - Análises e gráficos
6. **Configurações** - Personalização do sistema

## 🔧 Configuração e Setup

### ⚙️ Requisitos
- **Node.js** 18+ 
- **NPM** 8+
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)

### 📦 Instalação Local
```bash
git clone https://github.com/cristiano-superacao/gestao_clientes.git
cd gestao_clientes
npm install
npm run dev
```

### 🌐 Deploy
```bash
# Netlify
npm run deploy:netlify

# Vercel
npm run deploy:vercel
```

## 🔐 Segurança e Backup

### 🛡️ Medidas de Segurança
- **CORS** configurado para domínios autorizados
- **Validação** de dados no frontend e backend
- **Sanitização** de inputs
- **HTTPS** obrigatório em produção

### 💾 Backup dos Dados
- **Local Storage** - Dados salvos localmente
- **Export/Import** - Funcionalidade de backup manual
- **Sincronização** - Backup automático (em desenvolvimento)

## 📊 Performance

### ⚡ Otimizações
- **Lazy Loading** - Carregamento sob demanda
- **Code Splitting** - Divisão de código
- **Caching** - Cache inteligente de recursos
- **Compression** - Compressão de assets

### 📈 Métricas
- **Lighthouse Score** - 95+ em todas as categorias
- **First Contentful Paint** - < 1.5s
- **Time to Interactive** - < 3s
- **Bundle Size** - < 500KB

## 🌟 Diferenciais

### 🎯 Pontos Fortes
- ✨ **Interface Moderna** - Design clean e intuitivo
- 🚀 **Performance Otimizada** - Carregamento rápido
- 📱 **Mobile Ready** - Funcionalidade completa em dispositivos móveis
- 🔄 **Offline First** - Funciona sem conexão
- 🤖 **Automação Inteligente** - Lembretes automáticos
- 🔧 **Fácil Manutenção** - Código bem estruturado

### 📈 Escalabilidade
- **Modular** - Arquitetura baseada em módulos
- **Extensível** - Fácil adição de novas funcionalidades
- **Multi-tenant** - Preparado para múltiplos usuários
- **API Ready** - Backend preparado para integrações

## 📞 Suporte e Contato

### 🆘 Canais de Suporte
- **Email:** cristiano.s.santos@ba.estudante.senai.br
- **GitHub Issues:** https://github.com/cristiano-superacao/gestao_clientes/issues
- **Documentação:** Consulte os arquivos de documentação

### 🔄 Atualizações
O sistema é atualizado regularmente com:
- 🐛 Correções de bugs
- ✨ Novas funcionalidades
- 🔧 Melhorias de performance
- 📱 Compatibilidade com novos dispositivos

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License**. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Agradecimentos

Desenvolvido com ❤️ por **Cristiano Santos** como parte do curso no **SENAI 2025**.

---

*Última atualização: Outubro 2025*