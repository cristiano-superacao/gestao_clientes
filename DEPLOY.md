# Instruções rápidas para deploy

# Deploy no Vercel
1. Faça login no Vercel CLI: vercel login
2. No diretório do projeto, execute: vercel
3. Para deploy em produção: vercel --prod

# Deploy no Netlify
1. Instale Netlify CLI: npm i -g netlify-cli
2. Faça login: netlify login
3. No diretório do projeto: netlify deploy --dir=. --prod

# Observações
- O projeto é um site estático; tanto Vercel quanto Netlify suportam deploy direto.
- Certifique-se de gerar os ícones (assets/icon-*.png) ou substitua por seus próprios ícones.
- Caso utilize APIs externas (WhatsApp), configure variáveis de ambiente no painel do provedor.

## Deploy e CI recomendados

1. GitHub Actions: existe um workflow de exemplo em `.github/workflows/ci.yml` que instala dependências e roda checks básicos.
2. Para deploy automático no Vercel, conecte o repositório ao Vercel e configure a branch `main` como produção.
3. Para Netlify, conecte o repositório e use `dist` (ou a raiz) como diretório de publicação.

## Variáveis de ambiente úteis

- `TWILIO_ACCOUNT_SID` - SID da conta Twilio
- `TWILIO_AUTH_TOKEN` - Token de autenticação Twilio
- `TWILIO_WHATSAPP_NUMBER` - Número do remetente no formato `whatsapp:+1415XXXX`
- `NETLIFY_AUTH_TOKEN` - token se for usar deploy via CLI
- `VERCEL_TOKEN` - token se for usar deploy via CLI

## Testes locais automatizados

1. Inicie o servidor backend:

```powershell
npm run start:server
```

2. Em outra aba, inicie o site estático (dev):

```powershell
npm run dev
```

3. Execute o script de teste rápido do API:

```powershell
.
\scripts\test-api.ps1 -BaseUrl http://localhost:5000
```

4. Para verificar health endpoint manualmente:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

## Observações finais
Se preferir que eu faça o deploy em um serviço (Vercel/Netlify), posso executar os comandos no seu terminal local se você autorizar. Para deploy com integração de envio de mensagens via Twilio é necessário fornecer as credenciais via variáveis de ambiente no painel do provedor (não compartilhe secretos em chat público).
