require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Servir arquivos estáticos da pasta 'public'
app.use(express.static('public'));

// Configuração do Pool de Conexão com o Banco de Dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Rota principal que serve o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota de exemplo para testar a conexão com o banco de dados
app.get('/test-db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    res.json({ success: true, data: result.rows[0] });
    client.release();
  } catch (err) {
    console.error('Erro de conexão com o banco de dados:', err);
    res.status(500).json({ success: false, message: 'Erro ao conectar ao banco de dados.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});


