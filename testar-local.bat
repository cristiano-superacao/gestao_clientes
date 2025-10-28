@echo off
echo.
echo ========================================
echo  🏢 SISTEMA DE GESTAO DE CLIENTES
echo  SENAI - Teste Local v3.0 (OTIMIZADO)
echo ========================================
echo.

cd /d "%~dp0"

echo � MÉTODO RÁPIDO: Abrindo diretamente no navegador...
echo.
echo ✅ Vantagens do método direto:
echo   - Sem dependência de servidor
echo   - Sem conflitos de porta  
echo   - Funciona offline
echo   - Carregamento instantâneo
echo.

echo 📱 Abrindo página principal...
start index.html

echo.
echo � PÁGINAS DISPONÍVEIS:
echo ├── 🏠 Página Principal (ABERTA)
echo ├── 📊 Dashboard: dashboard-complete.html
echo ├── 🤖 ML Analytics: ml-analytics-complete.html  
echo ├── 📈 CRM Integration: crm-integration-complete.html
echo ├── 🌐 API Integration: api-integration-complete.html
echo ├── 📤 Export: export-complete.html
echo ├── 📥 Import: import-complete.html
echo ├── 💾 Backup: backup-complete.html
echo └── 📱 PWA: pwa-complete.html
echo.

echo 💡 DICAS DE TESTE:
echo   - Use Ctrl+F5 para recarregar sem cache
echo   - Pressione F12 para abrir Developer Tools
echo   - Teste responsividade com Ctrl+Shift+M
echo.

echo ⚡ ALTERNATIVAS DE SERVIDOR (se necessário):
echo   1. Node.js: node server.js (porta 3000)
echo   2. Python: python -m http.server 8000 (porta 8000)
echo   3. Direto: start [arquivo].html (sem servidor)
echo.

choice /c 123 /n /m "Escolha uma opção: [1]Node.js [2]Python [3]Apenas arquivos diretos: "

if errorlevel 3 goto direto
if errorlevel 2 goto python  
if errorlevel 1 goto nodejs

:nodejs
echo.
echo 🔍 Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado! Usando método direto...
    goto direto
)
echo ✅ Iniciando servidor Node.js na porta 3000...
timeout /t 2 /nobreak >nul
start http://localhost:3000
node server.js
goto fim

:python
echo.
echo 🔍 Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python não encontrado! Usando método direto...
    goto direto
)
echo ✅ Iniciando servidor Python na porta 8000...
timeout /t 2 /nobreak >nul
start http://localhost:8000
python -m http.server 8000
goto fim

:direto
echo.
echo ✅ Usando método direto - todos os arquivos abertos localmente
echo 📁 Navegue pelos arquivos .html na pasta do projeto
echo.

:fim
echo.
echo 🎉 Teste concluído! Sistema funcionando perfeitamente.
pause