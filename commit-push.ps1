# Script para fazer commit e push das correções
# Execute: .\commit-push.ps1

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
$commitMessage = @"
fix: Melhorar sistema de análise com logs detalhados e feedback claro

- Habilitar polling automático a cada 60s para monitorar velas
- Reduzir estratégias de 10 para 5 (as melhores)
- Ajustar lógica de consenso para mostrar quando 2 discordam e 3 não falam nada
- Melhorar detecção de novas velas (comparar ID e timestamp)
- Adicionar painel mostrando estratégias sem previsão
- Melhorar logs detalhados no servidor para debug
- Adicionar feedback claro sobre requisitos de cada estratégia
- Adicionar busca inicial automática ao carregar página
- Melhorar mensagens explicando por que não há previsões no início
"@

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit realizado!" -ForegroundColor Green
    $commitHash = git log -1 --format="%h"
    Write-Host "   Hash: $commitHash" -ForegroundColor Gray
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
    Write-Host "`nTente executar manualmente:" -ForegroundColor Yellow
    Write-Host "  git push" -ForegroundColor White
}

Write-Host "`n"

