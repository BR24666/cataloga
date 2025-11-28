# Script para desbloquear arquivo .env.local
Write-Host "=== Desbloqueando arquivo .env.local ===" -ForegroundColor Cyan

$envFile = ".env.local"

if (Test-Path $envFile) {
    Write-Host "`nArquivo encontrado: $envFile" -ForegroundColor Green
    
    # Verificar atributos atuais
    $file = Get-Item $envFile
    Write-Host "`nAtributos atuais:" -ForegroundColor Yellow
    Write-Host "  Nome: $($file.Name)" -ForegroundColor Gray
    Write-Host "  Somente Leitura: $($file.IsReadOnly)" -ForegroundColor Gray
    Write-Host "  Atributos: $($file.Attributes)" -ForegroundColor Gray
    
    # Remover atributo somente leitura
    Write-Host "`nRemovendo atributo somente leitura..." -ForegroundColor Yellow
    $file.IsReadOnly = $false
    
    # Usar attrib para garantir
    attrib -r $envFile
    
    # Verificar novamente
    $file = Get-Item $envFile
    Write-Host "`n✅ Atributos após correção:" -ForegroundColor Green
    Write-Host "  Somente Leitura: $($file.IsReadOnly)" -ForegroundColor Gray
    
    if (-not $file.IsReadOnly) {
        Write-Host "`n✅ Arquivo desbloqueado com sucesso!" -ForegroundColor Green
        Write-Host "   Você pode editar o arquivo normalmente agora." -ForegroundColor Cyan
    } else {
        Write-Host "`n⚠️  Ainda está somente leitura. Pode ser bloqueio do OneDrive." -ForegroundColor Yellow
        Write-Host "   Tente:" -ForegroundColor Yellow
        Write-Host "   1. Fechar o VS Code" -ForegroundColor Gray
        Write-Host "   2. Clicar com botão direito no arquivo > Propriedades" -ForegroundColor Gray
        Write-Host "   3. Desmarcar 'Somente leitura'" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Arquivo .env.local não encontrado!" -ForegroundColor Red
    Write-Host "   Criando arquivo..." -ForegroundColor Yellow
    
    $content = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://utmouqkyveodxrkqyies.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bW91cWt5dmVvZHhya3F5aWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzM5NzYsImV4cCI6MjA2MDIwOTk3Nn0.XttMuImhCt3UcF5MfuGkAVBm0vGgeZswXyMw_h5X20w

# Alpha Vantage API (via RapidAPI)
ALPHA_VANTAGE_API_KEY=1f7ed07b3amsh8fe6f412a14cc56p10dcfajsnf59306922095
"@
    
    $content | Out-File -FilePath $envFile -Encoding utf8 -NoNewline
    attrib -r $envFile
    Write-Host "✅ Arquivo criado e desbloqueado!" -ForegroundColor Green
}

Write-Host "`n"

