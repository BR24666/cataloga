# Script para fazer commit e push
Write-Host "=== Configurando Git ===" -ForegroundColor Cyan

# Inicializar Git se necessário
if (-not (Test-Path .git)) {
    Write-Host "Inicializando repositório Git..." -ForegroundColor Yellow
    git init
}

# Configurar remote
Write-Host "`n=== Configurando remote ===" -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin https://github.com/BR24666/cataloga.git
Write-Host "Remote configurado: $(git remote get-url origin)" -ForegroundColor Green

# Adicionar arquivos
Write-Host "`n=== Adicionando arquivos ===" -ForegroundColor Cyan
git add .
$status = git status --short
if ($status) {
    Write-Host "Arquivos para commit:" -ForegroundColor Yellow
    $status | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "Nenhum arquivo novo para adicionar" -ForegroundColor Yellow
}

# Fazer commit
Write-Host "`n=== Fazendo commit ===" -ForegroundColor Cyan
$commitMessage = "Initial commit: Forex Analyzer - Sistema completo com 10 estratégias probabilísticas"
git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit realizado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Nenhuma mudança para commitar ou commit já existe" -ForegroundColor Yellow
}

# Configurar branch main
Write-Host "`n=== Configurando branch main ===" -ForegroundColor Cyan
git branch -M main

# Fazer push
Write-Host "`n=== Fazendo push para GitHub ===" -ForegroundColor Cyan
Write-Host "⚠️  Você pode precisar autenticar no GitHub" -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Push realizado com sucesso!" -ForegroundColor Green
    Write-Host "Repositório: https://github.com/BR24666/cataloga.git" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Erro no push. Verifique:" -ForegroundColor Red
    Write-Host "  1. Se você está autenticado no GitHub" -ForegroundColor Yellow
    Write-Host "  2. Se tem permissão para fazer push neste repositório" -ForegroundColor Yellow
    Write-Host "  3. Execute: git push -u origin main manualmente" -ForegroundColor Yellow
}

