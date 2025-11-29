# Script para fazer commit e push
# Execute: .\git-commit-push.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FAZENDO COMMIT E PUSH" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Verificar status
Write-Host "[1/4] Verificando status..." -ForegroundColor Yellow
git status --short

# 2. Adicionar arquivos
Write-Host "`n[2/4] Adicionando arquivos..." -ForegroundColor Yellow
git add .
Write-Host "✅ Arquivos adicionados" -ForegroundColor Green

# 3. Fazer commit
Write-Host "`n[3/4] Fazendo commit..." -ForegroundColor Yellow
$commitMessage = "fix: Reescrever app para corrigir loop infinito de requisições - desabilitar refetch automático e usar polling manual"
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit realizado!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Nenhuma mudança para commitar" -ForegroundColor Yellow
}

# 4. Fazer push
Write-Host "`n[4/4] Fazendo push..." -ForegroundColor Yellow
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  ✅ PUSH REALIZADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "`n❌ Erro no push. Verifique sua conexão e autenticação." -ForegroundColor Red
}

Write-Host "`n"
