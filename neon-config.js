// Configuração do Neon PostgreSQL para Sistema de Gestão de Clientes
// Database URL será fornecida via variáveis de ambiente do Netlify

class NeonDatabase {
    constructor() {
        this.connectionString = this.getConnectionString();
        this.isConnected = false;
    }

    getConnectionString() {
        // Prioridade: ENV > Local Config > Demo
        if (typeof process !== 'undefined' && process.env.DATABASE_URL) {
            return process.env.DATABASE_URL;
        }
        
        if (typeof window !== 'undefined' && window.NEON_DATABASE_URL) {
            return window.NEON_DATABASE_URL;
        }

        // Configuração demo para desenvolvimento
        return 'postgresql://demo_user:demo_pass@ep-demo-123456.us-east-1.aws.neon.tech/gestao_clientes?sslmode=require';
    }

    async connect() {
        try {
            console.log('🔗 Conectando ao Neon PostgreSQL...');
            
            // Simulação de conexão para ambiente web
            if (typeof window !== 'undefined') {
                // No browser, usar fetch para API endpoints
                const response = await fetch('/api/db/health');
                if (response.ok) {
                    this.isConnected = true;
                    console.log('✅ Conectado ao Neon PostgreSQL via API');
                    return true;
                }
                throw new Error('API database não disponível');
            }

            // Node.js environment (para funções Netlify)
            if (typeof require !== 'undefined') {
                const { Pool } = require('pg');
                this.pool = new Pool({
                    connectionString: this.connectionString,
                    ssl: { rejectUnauthorized: false }
                });

                await this.pool.query('SELECT NOW()');
                this.isConnected = true;
                console.log('✅ Conectado ao Neon PostgreSQL');
                return true;
            }

            throw new Error('Ambiente não suportado');
            
        } catch (error) {
            console.warn('⚠️ Neon indisponível, usando modo demo:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    async initializeTables() {
        if (!this.isConnected) {
            console.log('📝 Usando esquema demo (sem Neon)');
            return this.initializeDemoSchema();
        }

        try {
            const queries = [
                // Tabela de clientes
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

                // Tabela de interações
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

                // Tabela de pedidos
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

                // Tabela de analytics ML
                `CREATE TABLE IF NOT EXISTS ml_predictions (
                    id SERIAL PRIMARY KEY,
                    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
                    tipo_predicao VARCHAR(50) NOT NULL,
                    resultado JSONB NOT NULL,
                    confianca DECIMAL(5,4),
                    data_predicao TIMESTAMP DEFAULT NOW(),
                    modelo_usado VARCHAR(100)
                );`,

                // Índices para performance
                `CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);`,
                `CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);`,
                `CREATE INDEX IF NOT EXISTS idx_interacoes_cliente ON interacoes(cliente_id);`,
                `CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);`,
                `CREATE INDEX IF NOT EXISTS idx_ml_predictions_cliente ON ml_predictions(cliente_id);`
            ];

            for (const query of queries) {
                await this.pool.query(query);
            }

            console.log('✅ Tabelas Neon inicializadas com sucesso');
            await this.insertDemoData();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar tabelas Neon:', error);
        }
    }

    async insertDemoData() {
        try {
            // Inserir clientes demo
            const demoClients = [
                {
                    nome: 'João Silva',
                    email: 'joao.silva@email.com',
                    telefone: '(11) 99999-9999',
                    status: 'ativo',
                    endereco: '{"rua": "Rua das Flores, 123", "cidade": "São Paulo", "cep": "01234-567"}',
                    valor_total_gasto: 1250.50
                },
                {
                    nome: 'Maria Santos',
                    email: 'maria.santos@email.com',
                    telefone: '(11) 88888-8888',
                    status: 'ativo',
                    endereco: '{"rua": "Av. Paulista, 456", "cidade": "São Paulo", "cep": "01310-100"}',
                    valor_total_gasto: 890.75
                },
                {
                    nome: 'Pedro Oliveira',
                    email: 'pedro.oliveira@email.com',
                    telefone: '(11) 77777-7777',
                    status: 'pendente',
                    endereco: '{"rua": "Rua Augusta, 789", "cidade": "São Paulo", "cep": "01305-000"}',
                    valor_total_gasto: 450.25
                }
            ];

            for (const client of demoClients) {
                await this.pool.query(`
                    INSERT INTO clientes (nome, email, telefone, status, endereco, valor_total_gasto)
                    VALUES ($1, $2, $3, $4, $5::jsonb, $6)
                    ON CONFLICT (email) DO NOTHING
                `, [client.nome, client.email, client.telefone, client.status, client.endereco, client.valor_total_gasto]);
            }

            console.log('✅ Dados demo inseridos no Neon');
            
        } catch (error) {
            console.error('❌ Erro ao inserir dados demo:', error);
        }
    }

    initializeDemoSchema() {
        // Schema demo para quando Neon não estiver disponível
        return {
            clientes: [
                {
                    id: 1,
                    nome: 'João Silva',
                    email: 'joao.silva@email.com',
                    telefone: '(11) 99999-9999',
                    status: 'ativo',
                    valor_total_gasto: 1250.50
                },
                {
                    id: 2,
                    nome: 'Maria Santos', 
                    email: 'maria.santos@email.com',
                    telefone: '(11) 88888-8888',
                    status: 'ativo',
                    valor_total_gasto: 890.75
                },
                {
                    id: 3,
                    nome: 'Pedro Oliveira',
                    email: 'pedro.oliveira@email.com', 
                    telefone: '(11) 77777-7777',
                    status: 'pendente',
                    valor_total_gasto: 450.25
                }
            ],
            interacoes: [],
            pedidos: [],
            ml_predictions: []
        };
    }

    async query(sql, params = []) {
        if (!this.isConnected) {
            console.warn('⚠️ Consulta em modo demo (Neon indisponível)');
            return { rows: [] };
        }

        try {
            return await this.pool.query(sql, params);
        } catch (error) {
            console.error('❌ Erro na consulta Neon:', error);
            throw error;
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('🔌 Conexão Neon fechada');
        }
    }
}

// Export para uso em diferentes ambientes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NeonDatabase;
} else if (typeof window !== 'undefined') {
    window.NeonDatabase = NeonDatabase;
}

// Instância global para uso direto
const neonDB = new NeonDatabase();

// Auto-inicialização
if (typeof window !== 'undefined') {
    // Browser environment
    document.addEventListener('DOMContentLoaded', async () => {
        await neonDB.connect();
        await neonDB.initializeTables();
    });
} else if (typeof process !== 'undefined') {
    // Node.js environment
    neonDB.connect().then(() => neonDB.initializeTables());
}