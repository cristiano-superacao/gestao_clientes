# ❓ FAQ - Sistema de Gestão de Clientes

## 🔍 Perguntas Frequentes

### 📱 Instalação e Acesso

#### **P: Como instalo o sistema como um aplicativo no meu celular?**
**R:** 
1. Acesse https://gestaodecliente.netlify.app no seu navegador
2. Aparecerá um banner "Instalar App" - toque em "Instalar"
3. O aplicativo será adicionado à sua tela inicial
4. Você pode usá-lo como qualquer outro app do seu celular

#### **P: O sistema funciona offline?**
**R:** Sim! O sistema é um PWA (Progressive Web App) que funciona offline. Você pode:
- Visualizar dados salvos anteriormente
- Cadastrar novos clientes e pagamentos
- Os dados serão sincronizados quando você voltar online

#### **P: Preciso criar uma conta para usar?**
**R:** Não! O sistema funciona diretamente no seu navegador, sem necessidade de cadastro. Seus dados ficam salvos localmente no seu dispositivo.

### 👥 Gestão de Clientes

#### **P: Como formato o número do WhatsApp?**
**R:** Use o formato: `(11) 99999-9999`
- Sempre inclua o DDD entre parênteses
- Use o hífen para separar os números
- Exemplo: `(11) 98765-4321`

#### **P: Posso editar um cliente depois de cadastrado?**
**R:** Sim! Na lista de clientes, clique no ícone ✏️ (lápis) para editar qualquer informação do cliente.

#### **P: O que acontece se eu excluir um cliente?**
**R:** ⚠️ **Atenção!** Ao excluir um cliente, todos os pagamentos relacionados a ele também serão removidos. Esta ação não pode ser desfeita.

#### **P: Como faço backup dos meus clientes?**
**R:** 
1. Vá em "Configurações"
2. Clique em "Exportar Dados"
3. Salve o arquivo JSON em local seguro
4. Para restaurar, use "Importar Dados"

### 💰 Pagamentos

#### **P: Posso registrar pagamentos de meses anteriores?**
**R:** Sim! No campo "Mês/Referência", você pode selecionar qualquer mês/ano, incluindo períodos passados.

#### **P: Como adiciono um comprovante de pagamento?**
**R:** 
1. No formulário de pagamento, clique em "Comprovante"
2. Selecione uma imagem (JPG, PNG) ou PDF
3. O arquivo será anexado ao pagamento
4. Para visualizar, clique no ícone 📎 na lista de pagamentos

#### **P: Posso alterar o valor de um pagamento já registrado?**
**R:** Sim! Clique no ícone ✏️ na lista de pagamentos para editar qualquer informação, incluindo o valor.

### 💬 WhatsApp

#### **P: Por que as mensagens não estão sendo enviadas automaticamente?**
**R:** O sistema usa dois métodos:
1. **Twilio** (requer configuração) - Para envio automático
2. **WhatsApp Web** (sempre disponível) - Abre o link para envio manual

Se o Twilio não estiver configurado, você receberá um link para enviar manualmente.

#### **P: Como configuro o Twilio para envio automático?**
**R:** 
1. Crie uma conta no Twilio
2. Configure as variáveis de ambiente:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_NUMBER`
3. Teste a configuração na seção "Mensagens"

#### **P: Posso personalizar as mensagens enviadas?**
**R:** Sim! Em "Mensagens" → "⚙️ Configurar Templates", você pode:
- Editar os templates de mensagem
- Usar variáveis como {nome}, {valor}, {vencimento}
- Criar mensagens personalizadas

#### **P: Quais variáveis posso usar nas mensagens?**
**R:** Variáveis disponíveis:
- `{nome}` - Nome do cliente
- `{valor}` - Valor do pagamento
- `{vencimento}` - Data de vencimento
- `{dias}` - Dias até/após vencimento
- `{whatsapp}` - Número do WhatsApp
- `{dataPagamento}` - Data do pagamento

### 📊 Dashboard e Relatórios

#### **P: Os dados do dashboard são atualizados automaticamente?**
**R:** Sim! O dashboard é atualizado automaticamente sempre que você:
- Adiciona/edita/remove clientes
- Registra novos pagamentos
- Muda o status de pagamentos

#### **P: Como interpreto as cores dos status?**
**R:** 
- 🟢 **Verde (Pago)** - Pagamento confirmado
- 🟡 **Amarelo (Pendente)** - Aguardando confirmação
- 🔴 **Vermelho (Atrasado)** - Vencimento passou

### 🔧 Problemas Técnicos

#### **P: O site está lento ou não carrega**
**R:** Tente:
1. Recarregar a página (F5)
2. Limpar cache do navegador
3. Verificar sua conexão com internet
4. Usar modo anônimo/privado
5. Tentar outro navegador

#### **P: Meus dados sumiram!**
**R:** 
1. Verifique se está no mesmo navegador e dispositivo
2. Veja se não limpou dados do navegador
3. Verifique se tem backup dos dados
4. Entre em contato com suporte se necessário

#### **P: O aplicativo não instala no celular**
**R:** Certifique-se de que:
1. Está usando um navegador atualizado (Chrome, Edge, Firefox)
2. Tem espaço suficiente no dispositivo
3. Permite instalação de PWAs nas configurações
4. Não está em modo anônimo/privado

#### **P: As notificações não aparecem**
**R:** 
1. Permita notificações quando solicitado
2. Verifique as configurações de notificação do navegador
3. No celular, verifique as configurações do app

### 🔒 Segurança e Privacidade

#### **P: Meus dados estão seguros?**
**R:** Sim! Seus dados:
- Ficam armazenados localmente no seu dispositivo
- Não são enviados para servidores externos
- Só você tem acesso aos seus dados
- Use backup regular para proteção extra

#### **P: Posso usar em múltiplos dispositivos?**
**R:** Atualmente, os dados ficam locais em cada dispositivo. Para usar em múltiplos dispositivos:
1. Faça backup dos dados no primeiro dispositivo
2. Importe os dados no segundo dispositivo
3. Repita o processo quando necessário

#### **P: O que acontece se eu trocar de celular?**
**R:** 
1. Faça backup dos dados antes de trocar
2. No novo celular, acesse o sistema
3. Importe o backup dos dados
4. Continue usando normalmente

### 📞 Suporte e Contato

#### **P: Como reporto um bug ou problema?**
**R:** 
1. **Email:** cristiano.s.santos@ba.estudante.senai.br
2. **GitHub Issues:** https://github.com/cristiano-superacao/gestao_clientes/issues
3. Descreva o problema detalhadamente
4. Inclua prints de tela se possível

#### **P: Posso sugerir novas funcionalidades?**
**R:** Claro! Use os mesmos canais de contato para sugestões:
- Descreva a funcionalidade desejada
- Explique como seria útil
- Considere contribuir com desenvolvimento

#### **P: O sistema é gratuito?**
**R:** Sim! O sistema é totalmente gratuito e open source. Você pode:
- Usar livremente
- Modificar o código
- Contribuir com melhorias
- Compartilhar com outros

## 🚨 Solução de Problemas

### ⚠️ Problemas Comuns

#### **Problema: "Erro ao salvar dados"**
**Solução:**
1. Verifique se o navegador permite armazenamento local
2. Verifique espaço disponível no dispositivo
3. Tente em modo anônimo
4. Recarregue a página

#### **Problema: "WhatsApp não abre"**
**Solução:**
1. Verifique se o WhatsApp está instalado
2. Verifique se o número está correto
3. Tente copiar o link e abrir manualmente
4. Use o WhatsApp Web como alternativa

#### **Problema: "Página em branco"**
**Solução:**
1. Recarregue a página (Ctrl+F5)
2. Verifique console do navegador (F12)
3. Desative extensões do navegador
4. Tente outro navegador

#### **Problema: "Não consegue instalar o app"**
**Solução:**
1. Use navegador atualizado
2. Verifique espaço no dispositivo
3. Permita instalação de apps desconhecidos
4. Acesse via HTTPS

### 🔧 Diagnóstico Avançado

#### **Para Desenvolvedores:**

```javascript
// Debug Mode
localStorage.setItem('debug', 'true');
// Recarregue a página para ver logs detalhados

// Verificar dados armazenados
console.log('Clientes:', JSON.parse(localStorage.getItem('gestao_clientes_clientes')));
console.log('Pagamentos:', JSON.parse(localStorage.getItem('gestao_clientes_pagamentos')));

// Limpar dados (USE COM CUIDADO!)
// localStorage.clear();
```

#### **Informações do Sistema:**
```javascript
// Copie e cole no console (F12) para diagnóstico
console.log({
  userAgent: navigator.userAgent,
  localStorage: !!window.localStorage,
  serviceWorker: 'serviceWorker' in navigator,
  online: navigator.onLine,
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight
  }
});
```

## 📝 Glossário

### 🔤 Termos Técnicos

- **PWA** - Progressive Web App (Aplicativo Web Progressivo)
- **API** - Interface de Programação de Aplicações
- **JSON** - Formato de intercâmbio de dados
- **localStorage** - Armazenamento local do navegador
- **Service Worker** - Script que roda em segundo plano
- **Twilio** - Serviço de comunicação por API
- **Fallback** - Alternativa quando método principal falha

### 🏢 Termos do Negócio

- **Cliente** - Pessoa que paga pelos serviços
- **Vencimento** - Data limite para pagamento
- **Comprovante** - Documento que prova o pagamento
- **Status** - Situação atual (Ativo/Inativo, Pago/Pendente/Atrasado)
- **Referência** - Mês/ano do pagamento
- **Template** - Modelo de mensagem pré-definida

---

## 🆕 Atualizações Recentes

### v1.0.0 (Outubro 2025)
- ✅ Lançamento inicial
- ✅ Gestão completa de clientes
- ✅ Controle de pagamentos
- ✅ Integração WhatsApp
- ✅ PWA funcional
- ✅ Deploy Netlify/Vercel

### 🔮 Próximas Versões
- 🔄 Sincronização em nuvem
- 📊 Relatórios avançados
- 🔔 Notificações push
- 👥 Multi-usuário
- 📱 App mobile nativo

---

**Não encontrou sua pergunta?** Entre em contato conosco!

📧 **Email:** cristiano.s.santos@ba.estudante.senai.br  
🐙 **GitHub:** https://github.com/cristiano-superacao/gestao_clientes

*FAQ atualizado em: Outubro 2025*