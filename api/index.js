// Vercel Serverless Function
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Função para ler JSON
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

// Função para escrever JSON
function writeJson(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Erro ao escrever JSON', filePath, err.message);
    return false;
  }
}

// Handler principal para Vercel
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  const urlPath = url.replace('/api', '');

  try {
    // Caminhos dos arquivos de dados
    const dataDir = '/tmp'; // Vercel usa /tmp para arquivos temporários
    const clientesFile = path.join(dataDir, 'clientes.json');
    const pagamentosFile = path.join(dataDir, 'pagamentos.json');

    // Health Check
    if (urlPath === '/health' && method === 'GET') {
      return res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        platform: 'vercel',
        twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
      });
    }

    // Clientes endpoints
    if (urlPath === '/clientes' && method === 'GET') {
      const clientes = readJson(clientesFile);
      return res.json(clientes);
    }

    if (urlPath === '/clientes' && method === 'POST') {
      const clientes = readJson(clientesFile);
      const data = req.body;
      data.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      data.dataCriacao = new Date().toISOString();
      clientes.push(data);
      writeJson(clientesFile, clientes);
      return res.status(201).json(data);
    }

    // Pagamentos endpoints
    if (urlPath === '/pagamentos' && method === 'GET') {
      const pagamentos = readJson(pagamentosFile);
      return res.json(pagamentos);
    }

    if (urlPath === '/pagamentos' && method === 'POST') {
      const pagamentos = readJson(pagamentosFile);
      const data = req.body;
      data.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      data.dataCriacao = new Date().toISOString();
      pagamentos.push(data);
      writeJson(pagamentosFile, pagamentos);
      return res.status(201).json(data);
    }

    // WhatsApp endpoint
    if (urlPath === '/send-whatsapp' && method === 'POST') {
      const { to, message } = req.body;

      if (!to || !message) {
        return res.status(400).json({ 
          ok: false,
          error: 'Parâmetros "to" e "message" são obrigatórios.' 
        });
      }

      const cleanPhone = to.replace(/\D/g, '');
      const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

      // Tentar usar Twilio se configurado
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
          const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          const response = await client.messages.create({
            body: message,
            from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
            to: `whatsapp:+${cleanPhone}`
          });
          
          return res.json({ 
            ok: true, 
            sid: response.sid,
            status: response.status,
            method: 'twilio'
          });
        } catch (error) {
          return res.json({ 
            ok: false, 
            fallback: true, 
            waLink: waLink,
            error: error.message,
            method: 'fallback'
          });
        }
      }

      return res.json({ 
        ok: false, 
        fallback: true, 
        waLink: waLink,
        message: 'Twilio não configurado, usando WhatsApp Web',
        method: 'web'
      });
    }

    // Endpoint não encontrado
    return res.status(404).json({ error: 'Endpoint não encontrado' });

  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};