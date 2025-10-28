const { Pool } = require('pg');

// Configuração do pool de conexões Neon
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const { httpMethod, path, body } = event;
        const pathParts = path.split('/').filter(Boolean);
        const resource = pathParts[pathParts.length - 1]; // 'clientes'

        switch (httpMethod) {
            case 'GET':
                return await handleGet(resource, event.queryStringParameters);
            
            case 'POST':
                return await handlePost(resource, JSON.parse(body || '{}'));
            
            case 'PUT':
                const id = event.queryStringParameters?.id;
                return await handlePut(resource, id, JSON.parse(body || '{}'));
            
            case 'DELETE':
                const deleteId = event.queryStringParameters?.id;
                return await handleDelete(resource, deleteId);
            
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

async function handleGet(resource, queryParams) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    switch (resource) {
        case 'clientes':
            const limit = queryParams?.limit || 50;
            const offset = queryParams?.offset || 0;
            const search = queryParams?.search;
            
            let query = `
                SELECT id, nome, email, telefone, status, endereco, 
                       valor_total_gasto, criado_em, atualizado_em
                FROM clientes
            `;
            const params = [];
            
            if (search) {
                query += ` WHERE nome ILIKE $1 OR email ILIKE $1 OR telefone ILIKE $1`;
                params.push(`%${search}%`);
            }
            
            query += ` ORDER BY criado_em DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);
            
            const result = await pool.query(query, params);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: result.rows,
                    count: result.rows.length
                })
            };

        case 'stats':
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_clientes,
                    COUNT(*) FILTER (WHERE status = 'ativo') as clientes_ativos,
                    COUNT(*) FILTER (WHERE status = 'pendente') as clientes_pendentes,
                    COALESCE(SUM(valor_total_gasto), 0) as receita_total,
                    COALESCE(AVG(valor_total_gasto), 0) as ticket_medio
                FROM clientes
            `;
            
            const statsResult = await pool.query(statsQuery);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: statsResult.rows[0]
                })
            };

        default:
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Resource not found' })
            };
    }
}

async function handlePost(resource, data) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    switch (resource) {
        case 'clientes':
            const { nome, email, telefone, endereco, status = 'ativo' } = data;
            
            if (!nome || !email) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Nome e email são obrigatórios' 
                    })
                };
            }

            const insertQuery = `
                INSERT INTO clientes (nome, email, telefone, endereco, status)
                VALUES ($1, $2, $3, $4::jsonb, $5)
                RETURNING id, nome, email, telefone, status, criado_em
            `;
            
            const result = await pool.query(insertQuery, [
                nome, email, telefone, endereco ? JSON.stringify(endereco) : null, status
            ]);
            
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: result.rows[0],
                    message: 'Cliente criado com sucesso'
                })
            };

        default:
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Resource not found' })
            };
    }
}

async function handlePut(resource, id, data) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    if (!id) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID é obrigatório' })
        };
    }

    switch (resource) {
        case 'clientes':
            const fields = [];
            const values = [];
            let paramCount = 1;

            // Campos permitidos para atualização
            const allowedFields = ['nome', 'email', 'telefone', 'endereco', 'status', 'observacoes'];
            
            for (const [key, value] of Object.entries(data)) {
                if (allowedFields.includes(key) && value !== undefined) {
                    if (key === 'endereco') {
                        fields.push(`${key} = $${paramCount}::jsonb`);
                        values.push(JSON.stringify(value));
                    } else {
                        fields.push(`${key} = $${paramCount}`);
                        values.push(value);
                    }
                    paramCount++;
                }
            }

            if (fields.length === 0) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Nenhum campo válido para atualizar' })
                };
            }

            fields.push(`atualizado_em = NOW()`);
            values.push(id);

            const updateQuery = `
                UPDATE clientes 
                SET ${fields.join(', ')}
                WHERE id = $${paramCount}
                RETURNING id, nome, email, telefone, status, atualizado_em
            `;

            const result = await pool.query(updateQuery, values);

            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Cliente não encontrado' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: result.rows[0],
                    message: 'Cliente atualizado com sucesso'
                })
            };

        default:
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Resource not found' })
            };
    }
}

async function handleDelete(resource, id) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    if (!id) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID é obrigatório' })
        };
    }

    switch (resource) {
        case 'clientes':
            const deleteQuery = `
                DELETE FROM clientes 
                WHERE id = $1 
                RETURNING id, nome
            `;

            const result = await pool.query(deleteQuery, [id]);

            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Cliente não encontrado' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: result.rows[0],
                    message: 'Cliente removido com sucesso'
                })
            };

        default:
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Resource not found' })
            };
    }
}