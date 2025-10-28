#!/bin/bash

# 🚀 Script de Configuração Automática - Neon PostgreSQL + Netlify Deploy
# Sistema de Gestão de Clientes SENAI v3.0

echo "=========================================="
echo "🏢 SETUP AUTOMÁTICO - GESTÃO DE CLIENTES"
echo "🚀 Deploy: Netlify + Neon PostgreSQL"
echo "=========================================="
echo

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função de log
log_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}❌ ERROR:${NC} $1"
}

# Verificar dependências
log_info "Verificando dependências..."

if ! command -v git &> /dev/null; then
    log_error "Git não encontrado. Instale o Git primeiro."
    exit 1
fi

if ! command -v node &> /dev/null; then
    log_warning "Node.js não encontrado. Algumas funcionalidades podem não funcionar."
fi

log_success "Dependências verificadas"

# Configurar Git (se necessário)
log_info "Configurando repositório Git..."

git config --global --get user.name > /dev/null || {
    log_warning "Configuração Git necessária"
    echo -n "Digite seu nome para Git: "
    read GIT_NAME
    git config --global user.name "$GIT_NAME"
}

git config --global --get user.email > /dev/null || {
    echo -n "Digite seu email para Git: "
    read GIT_EMAIL
    git config --global user.email "$GIT_EMAIL"
}

# Verificar se já é um repositório Git
if [ ! -d ".git" ]; then
    log_info "Inicializando repositório Git..."
    git init
    git remote add origin https://github.com/cristiano-superacao/gestao_clientes.git
fi

# Instalar dependências Node.js (se disponível)
if command -v npm &> /dev/null && [ -f "package.json" ]; then
    log_info "Instalando dependências Node.js..."
    npm install
    log_success "Dependências instaladas"
fi

# Configuração do Neon PostgreSQL
log_info "Configuração do Neon PostgreSQL"
echo
echo "Para configurar o Neon PostgreSQL:"
echo "1. Acesse: https://console.neon.tech/"
echo "2. Crie uma conta gratuita"
echo "3. Crie um novo projeto: 'gestao-clientes'"
echo "4. Copie a Connection String"
echo
echo -n "Cole sua Database URL do Neon (pressione Enter para usar demo): "
read NEON_URL

if [ -z "$NEON_URL" ]; then
    NEON_URL="postgresql://demo_user:demo_pass@ep-demo-123456.us-east-1.aws.neon.tech/gestao_clientes?sslmode=require"
    log_warning "Usando configuração demo do Neon"
else
    log_success "URL do Neon configurada"
fi

# Atualizar netlify.toml com a URL do Neon
log_info "Atualizando configuração do Netlify..."
sed -i "s|DATABASE_URL = \".*\"|DATABASE_URL = \"$NEON_URL\"|g" netlify.toml
log_success "Configuração do Netlify atualizada"

# Configuração do Netlify
log_info "Configuração do Deploy Netlify"
echo
echo "Para fazer o deploy automático:"
echo "1. Acesse: https://app.netlify.com/"
echo "2. Conecte sua conta GitHub"
echo "3. Importe este repositório: cristiano-superacao/gestao_clientes"
echo "4. Configure as variáveis de ambiente:"
echo "   - DATABASE_URL: $NEON_URL"
echo "5. Deploy será automático a cada git push"
echo

# Commit das configurações
log_info "Salvando configurações..."
git add .
git commit -m "🚀 AUTO-SETUP: Configuração Neon PostgreSQL + Deploy Netlify"

# Push para GitHub
log_info "Enviando para GitHub..."
git push -u origin master || {
    log_warning "Push falhou. Verifique as credenciais do GitHub"
    echo "Execute manualmente: git push -u origin master"
}

log_success "Configuração concluída!"

echo
echo "=========================================="
echo "🎉 SETUP FINALIZADO COM SUCESSO!"
echo "=========================================="
echo
echo "📱 URLs do Sistema:"
echo "   • Local: http://localhost:3000 (execute: npm run dev)"
echo "   • Produção: https://gestaodecliente.netlify.app/"
echo
echo "🔧 Próximos Passos:"
echo "   1. Configure o Neon PostgreSQL em: https://console.neon.tech/"
echo "   2. Configure o Netlify em: https://app.netlify.com/"
echo "   3. Atualize a variável DATABASE_URL no Netlify"
echo "   4. Execute: npm run dev (para teste local)"
echo
echo "📚 Documentação:"
echo "   • README.md - Guia completo"
echo "   • TESTE-LOCAL.md - Testes locais"
echo
echo "✅ Sistema pronto para uso!"