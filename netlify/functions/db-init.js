const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        if (event.httpMethod === 'GET') {
            // Health check do banco
            const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    status: 'healthy',
                    database: 'Neon PostgreSQL',
                    timestamp: result.rows[0].current_time,
                    version: result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]
                })
            };
        }

        if (event.httpMethod === 'POST') {
            // Inicializar tabelas do banco
            const initQueries = [
                `CREATE TABLE IF NOT EXISTS clientes (
                    id SERIAL PRIMARY KEY,
                    nome VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    telefone VARCHAR(20),
                    endereco JSONB,
                    status VARCHAR(50) DEFAULT 'ativo',
                    tipo_cliente VARCHAR(50) DEFAULT 'pessoa_fisica',
                    documento VARCHAR(20),
                    data_nascimento DATE,
                    observacoes TEXT,
                    tags TEXT[],
                    valor_total_gasto DECIMAL(10,2) DEFAULT 0,
                    ultima_compra TIMESTAMP,
                    criado_em TIMESTAMP DEFAULT NOW(),
                    atualizado_em TIMESTAMP DEFAULT NOW()
                );`,

                `CREATE TABLE IF NOT EXISTS interacoes (
                    id SERIAL PRIMARY KEY,
                    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
                    tipo VARCHAR(50) NOT NULL,
                    assunto VARCHAR(255),
                    descricao TEXT,
                    status VARCHAR(50) DEFAULT 'pendente',
                    usuario_responsavel VARCHAR(100),
                    data_interacao TIMESTAMP DEFAULT NOW(),
                    prazo DATE,
                    prioridade VARCHAR(20) DEFAULT 'media'
                );`,

                `CREATE TABLE IF NOT EXISTS pedidos (
                    id SERIAL PRIMARY KEY,
                    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
                    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
                    valor_total DECIMAL(10,2) NOT NULL,
                    status VARCHAR(50) DEFAULT 'pendente',
                    items JSONB,
                    data_pedido TIMESTAMP DEFAULT NOW(),
                    data_entrega TIMESTAMP,
                    observacoes TEXT
                );`,

                `CREATE TABLE IF NOT EXISTS ml_predictions (
                    id SERIAL PRIMARY KEY,
                    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
                    tipo_predicao VARCHAR(50) NOT NULL,
                    resultado JSONB NOT NULL,
                    confianca DECIMAL(5,4),
                    data_predicao TIMESTAMP DEFAULT NOW(),
                    modelo_usado VARCHAR(100)
                );`,

                // Índices
                `CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);`,
                `CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);`,
                `CREATE INDEX IF NOT EXISTS idx_interacoes_cliente ON interacoes(cliente_id);`,
                `CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);`,
                `CREATE INDEX IF NOT EXISTS idx_ml_predictions_cliente ON ml_predictions(cliente_id);`
            ];

            for (const query of initQueries) {
                await pool.query(query);
            }

            // Inserir dados demo
            const demoData = [
                {
                    nome: 'João Silva',
                    email: 'joao.silva@email.com',
                    telefone: '(11) 99999-9999',
                    endereco: '{"rua": "Rua das Flores, 123", "cidade": "São Paulo", "cep": "01234-567"}',
                    valor_total_gasto: 1250.50
                },
                {
                    nome: 'Maria Santos',
                    email: 'maria.santos@email.com',
                    telefone: '(11) 88888-8888',
                    endereco: '{"rua": "Av. Paulista, 456", "cidade": "São Paulo", "cep": "01310-100"}',
                    valor_total_gasto: 890.75
                },
                {
                    nome: 'Pedro Oliveira',
                    email: 'pedro.oliveira@email.com',
                    telefone: '(11) 77777-7777',
                    endereco: '{"rua": "Rua Augusta, 789", "cidade": "São Paulo", "cep": "01305-000"}',
                    valor_total_gasto: 450.25,
                    status: 'pendente'
                },
                {
                    nome: 'Ana Costa',
                    email: 'ana.costa@email.com',
                    telefone: '(11) 66666-6666',
                    endereco: '{"rua": "Rua Oscar Freire, 321", "cidade": "São Paulo", "cep": "01426-001"}',
                    valor_total_gasto: 2100.00
                }
            ];

            for (const cliente of demoData) {
                await pool.query(`
                    INSERT INTO clientes (nome, email, telefone, endereco, valor_total_gasto, status)
                    VALUES ($1, $2, $3, $4::jsonb, $5, $6)
                    ON CONFLICT (email) DO NOTHING
                `, [
                    cliente.nome, 
                    cliente.email, 
                    cliente.telefone, 
                    cliente.endereco, 
                    cliente.valor_total_gasto,
                    cliente.status || 'ativo'
                ]);
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Database inicializado com sucesso',
                    tables_created: 4,
                    demo_data_inserted: demoData.length
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Database initialization error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Database initialization failed',
                message: error.message
            })
        };
    }
};