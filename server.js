const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Log de requisições
    console.log(`📝 Requisição: ${req.method} ${req.url}`);
    
    // Rota padrão para index.html
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Remover parâmetros de query
    filePath = filePath.split('?')[0];
    
    // Caminho completo do arquivo
    const fullPath = path.join(__dirname, filePath);
    console.log(`📁 Buscando arquivo: ${fullPath}`);
    
    // Verificar se o arquivo existe
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            console.log(`❌ Erro ao ler arquivo: ${err.message}`);
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Arquivo não encontrado - Sistema de Gestão</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body class="bg-gradient-to-br from-red-50 to-orange-50 min-h-screen flex items-center justify-center">
                    <div class="text-center max-w-md mx-auto p-8">
                        <div class="mb-6">
                            <svg class="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h1 class="text-2xl font-bold text-gray-800 mb-4">🚫 Arquivo não encontrado</h1>
                        <p class="text-gray-600 mb-2">Arquivo solicitado: <code class="bg-gray-100 px-2 py-1 rounded">${filePath}</code></p>
                        <p class="text-sm text-gray-500 mb-6">Caminho completo: ${fullPath}</p>
                        <div class="space-y-2">
                            <a href="/" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                                ← Voltar ao início
                            </a>
                            <br>
                            <a href="/dashboard-complete.html" class="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                                📊 Dashboard
                            </a>
                        </div>
                    </div>
                </body>
                </html>
            `);
            return;
        }
        
        console.log(`✅ Arquivo encontrado e enviado: ${filePath}`);
        
        // Definir Content-Type baseado na extensão
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };
        
        const contentType = contentTypes[ext] || 'text/plain; charset=utf-8';
        
        res.writeHead(200, { 
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor local iniciado!`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard-complete.html`);
    console.log(`🤖 ML Analytics: http://localhost:${PORT}/ml-analytics-complete.html`);
    console.log(`📤 Export: http://localhost:${PORT}/export-complete.html`);
    console.log(`\n✅ Sistema pronto para teste local!`);
});

// Tratamento de erros
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Porta ${PORT} já está em uso!`);
        console.log(`💡 Tente: http://localhost:${PORT} ou mude a porta`);
    } else {
        console.error('❌ Erro no servidor:', err);
    }
});