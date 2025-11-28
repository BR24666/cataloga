# Script para fazer push com output visível
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FAZENDO PUSH PARA GITHUB" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar status
Write-Host "[1/4] Verificando status do Git..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "Arquivos modificados:" -ForegroundColor Green
    $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "Nenhum arquivo modificado" -ForegroundColor Yellow
}

# Verificar último commit
Write-Host "`n[2/4] Verificando últimos commits..." -ForegroundColor Yellow
$lastCommit = git log -1 --oneline
Write-Host "Último commit: $lastCommit" -ForegroundColor Cyan

# Adicionar arquivos
Write-Host "`n[3/4] Adicionando arquivos..." -ForegroundColor Yellow
git add -A
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Arquivos adicionados" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao adicionar arquivos" -ForegroundColor Red
    exit 1
}

# Verificar se há algo para commitar
$statusAfter = git status --short
if ($statusAfter) {
    Write-Host "`nFazendo commit..." -ForegroundColor Yellow
    git commit -m "feat: Sistema de sinais forte/fraco + melhorias na análise probabilística

- Adicionado sistema de classificação de sinais (forte/médio/fraco)
- Melhorias no tratamento de erros e logs
- Indicadores visuais para força do sinal
- Análise funciona mesmo com poucos dados históricos
- Mensagens de erro visíveis na interface"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Commit realizado" -ForegroundColor Green
        $newCommit = git log -1 --oneline
        Write-Host "Novo commit: $newCommit" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Nenhuma mudança para commitar" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Nenhuma mudança para commitar" -ForegroundColor Yellow
}

# Fazer push
Write-Host "`n[4/4] Fazendo push para GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  ✅ PUSH REALIZADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nRepositório: https://github.com/BR24666/cataloga.git" -ForegroundColor Cyan
    Write-Host "O Vercel deve fazer redeploy automaticamente em alguns segundos." -ForegroundColor Yellow
} else {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  ❌ ERRO NO PUSH" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "`nVerifique:" -ForegroundColor Yellow
    Write-Host "  1. Se está autenticado no GitHub" -ForegroundColor Gray
    Write-Host "  2. Se tem permissão no repositório" -ForegroundColor Gray
    Write-Host "  3. Execute: git push -u origin main manualmente" -ForegroundColor Gray
}

Write-Host "`n"

