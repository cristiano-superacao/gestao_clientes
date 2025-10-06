Param(
    [string]$BaseUrl = "http://localhost:5000"
)

Write-Host "Testando API em $BaseUrl"

$endpoints = @(
    '/api/health',
    '/api/clientes',
    '/api/pagamentos'
)

foreach ($ep in $endpoints) {
    $url = "$BaseUrl$ep"
    try {
        $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -Method Get -TimeoutSec 5
        Write-Host "$url -> $($resp.StatusCode)"
    } catch {
        Write-Host "$url -> Erro: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "Teste concluído."