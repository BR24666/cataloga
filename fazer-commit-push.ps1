# Script completo para commit e push
$ErrorActionPreference = "Continue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURANDO GIT E FAZENDO PUSH" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Inicializar Git
Write-Host "[1/6] Inicializando repositório Git..." -ForegroundColor Yellow
if (-not (Test-Path .git)) {
    git init | Out-Host
    Write-Host "✅ Git inicializado" -ForegroundColor Green
} else {
    Write-Host "✅ Git já inicializado" -ForegroundColor Green
}

# 2. Configurar remote
Write-Host "`n[2/6] Configurando remote..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/BR24666/cataloga.git 2>&1 | Out-Host
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Remote configurado: https://github.com/BR24666/cataloga.git" -ForegroundColor Green
} else {
    git remote set-url origin https://github.com/BR24666/cataloga.git
    Write-Host "✅ Remote atualizado" -ForegroundColor Green
}

# 3. Adicionar arquivos
Write-Host "`n[3/6] Adicionando arquivos ao staging..." -ForegroundColor Yellow
git add . 2>&1 | Out-Host
$status = git status --short
if ($status) {
    Write-Host "✅ Arquivos adicionados:" -ForegroundColor Green
    $status | Select-Object -First 10 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    if (($status | Measure-Object).Count -gt 10) {
        Write-Host "   ... e mais arquivos" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  Nenhum arquivo novo para adicionar" -ForegroundColor Yellow
}

# 4. Fazer commit
Write-Host "`n[4/6] Fazendo commit..." -ForegroundColor Yellow
$commitMsg = "Initial commit: Forex Analyzer - Sistema completo com 10 estratégias probabilísticas"
git commit -m $commitMsg 2>&1 | Out-Host
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit realizado com sucesso!" -ForegroundColor Green
    $commitHash = git log -1 --format="%h"
    Write-Host "   Hash: $commitHash" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Nenhuma mudança para commitar ou commit já existe" -ForegroundColor Yellow
}

# 5. Configurar branch main
Write-Host "`n[5/6] Configurando branch main..." -ForegroundColor Yellow
git branch -M main 2>&1 | Out-Host
Write-Host "✅ Branch main configurado" -ForegroundColor Green

# 6. Fazer push
Write-Host "`n[6/6] Fazendo push para GitHub..." -ForegroundColor Yellow
Write-Host "⚠️  Se pedir autenticação, use seu token do GitHub" -ForegroundColor Yellow
git push -u origin main 2>&1 | Out-Host

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  ✅ PUSH REALIZADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nRepositório: https://github.com/BR24666/cataloga.git" -ForegroundColor Cyan
} else {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  ❌ ERRO NO PUSH" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "`nPossíveis causas:" -ForegroundColor Yellow
    Write-Host "  1. Precisa autenticar no GitHub" -ForegroundColor Yellow
    Write-Host "  2. Não tem permissão no repositório" -ForegroundColor Yellow
    Write-Host "  3. Repositório remoto não está vazio" -ForegroundColor Yellow
    Write-Host "`nTente executar manualmente:" -ForegroundColor Cyan
    Write-Host "  git push -u origin main" -ForegroundColor White
}

Write-Host "`n"

