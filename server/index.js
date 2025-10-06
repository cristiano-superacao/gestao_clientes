const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos do projeto
const root = path.join(__dirname, '..');
app.use(express.static(root));

// Diretório de dados
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const clientesFile = path.join(dataDir, 'clientes.json');
const pagamentosFile = path.join(dataDir, 'pagamentos.json');

function readJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Erro ao ler JSON', filePath, err.message);
    return [];
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Erro ao escrever JSON', filePath, err.message);
    return false;
  }
}

// Health
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  });
});

// Endpoint para testar configuração do WhatsApp
app.post('/api/test-whatsapp', async (req, res) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.json({
        configured: false,
        message: 'Variáveis TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN não configuradas'
      });
    }
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);
    
    // Tentar listar as mensagens para testar a conexão
    await client.messages.list({ limit: 1 });
    
    res.json({
      configured: true,
      message: 'Configuração Twilio válida'
    });
  } catch (error) {
    res.json({
      configured: false,
      error: error.message
    });
  }
});

// CRUD Clientes
app.get('/api/clientes', (req, res) => {
  const clientes = readJson(clientesFile);
  res.json(clientes);
});

app.get('/api/clientes/:id', (req, res) => {
  const clientes = readJson(clientesFile);
  const c = clientes.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Cliente não encontrado' });
  res.json(c);
});

app.post('/api/clientes', (req, res) => {
  const clientes = readJson(clientesFile);
  const data = req.body;
  data.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  data.dataCriacao = new Date().toISOString();
  clientes.push(data);
  writeJson(clientesFile, clientes);
  res.status(201).json(data);
});

app.put('/api/clientes/:id', (req, res) => {
  const clientes = readJson(clientesFile);
  const idx = clientes.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Cliente não encontrado' });
  clientes[idx] = { ...clientes[idx], ...req.body, dataAtualizacao: new Date().toISOString() };
  writeJson(clientesFile, clientes);
  res.json(clientes[idx]);
});

app.delete('/api/clientes/:id', (req, res) => {
  let clientes = readJson(clientesFile);
  const exists = clientes.some(x => x.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Cliente não encontrado' });
  clientes = clientes.filter(x => x.id !== req.params.id);
  writeJson(clientesFile, clientes);
  res.json({ ok: true });
});

// CRUD Pagamentos
app.get('/api/pagamentos', (req, res) => {
  const pagamentos = readJson(pagamentosFile);
  res.json(pagamentos);
});

app.get('/api/pagamentos/:id', (req, res) => {
  const pagamentos = readJson(pagamentosFile);
  const p = pagamentos.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Pagamento não encontrado' });
  res.json(p);
});

app.post('/api/pagamentos', (req, res) => {
  const pagamentos = readJson(pagamentosFile);
  const data = req.body;
  data.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  data.dataCriacao = new Date().toISOString();
  pagamentos.push(data);
  writeJson(pagamentosFile, pagamentos);
  res.status(201).json(data);
});

app.put('/api/pagamentos/:id', (req, res) => {
  const pagamentos = readJson(pagamentosFile);
  const idx = pagamentos.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Pagamento não encontrado' });
  pagamentos[idx] = { ...pagamentos[idx], ...req.body, dataAtualizacao: new Date().toISOString() };
  writeJson(pagamentosFile, pagamentos);
  res.json(pagamentos[idx]);
});

app.delete('/api/pagamentos/:id', (req, res) => {
  let pagamentos = readJson(pagamentosFile);
  const exists = pagamentos.some(x => x.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Pagamento não encontrado' });
  pagamentos = pagamentos.filter(x => x.id !== req.params.id);
  writeJson(pagamentosFile, pagamentos);
  res.json({ ok: true });
});

// Endpoint para enviar mensagem via WhatsApp (Twilio ou fallback wa.me)
app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ 
        ok: false,
        error: 'Parâmetros "to" e "message" são obrigatórios.' 
      });
    }

    // Limpar número de telefone
    const cleanPhone = to.replace(/\D/g, '');

    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      try {
        const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        const response = await client.messages.create({
          body: message,
          from: TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:+${cleanPhone}`
        });
        
        return res.json({ 
          ok: true, 
          sid: response.sid,
          status: response.status,
          method: 'twilio'
        });
      } catch (twilioError) {
        console.error('Erro Twilio:', twilioError);
        
        // Fallback para WhatsApp Web se Twilio falhar
        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        return res.json({ 
          ok: false, 
          fallback: true, 
          waLink: waLink,
          error: twilioError.message,
          method: 'fallback'
        });
      }
    }

    // Fallback para WhatsApp Web quando Twilio não está configurado
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    return res.json({ 
      ok: false, 
      fallback: true, 
      waLink: waLink,
      message: 'Twilio não configurado, usando WhatsApp Web',
      method: 'web'
    });

  } catch (error) {
    console.error('Erro geral ao enviar WhatsApp:', error);
    
    // Fallback de emergência
    const { to, message } = req.body;
    const cleanPhone = to.replace(/\D/g, '');
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    return res.status(500).json({ 
      ok: false, 
      fallback: true,
      waLink: waLink,
      error: error.message,
      method: 'emergency'
    });
  }
});

// Endpoint para listar gerados icons
app.get('/api/icons', (req, res) => {
  const assetsDir = path.join(root, 'assets');
  try {
    const files = fs.readdirSync(assetsDir).filter(f => f.startsWith('icon-') && f.endsWith('.png'));
    res.json({ icons: files });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar ícones', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Open http://localhost:${PORT}`);
});