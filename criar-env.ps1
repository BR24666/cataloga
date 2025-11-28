# Script para criar .env.local
$envPath = Join-Path $PSScriptRoot ".env.local"

$envContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://utmouqkyveodxrkqyies.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bW91cWt5dmVvZHhya3F5aWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzM5NzYsImV4cCI6MjA2MDIwOTk3Nn0.XttMuImhCt3UcF5MfuGkAVBm0vGgeZswXyMw_h5X20w

# Alpha Vantage API (via RapidAPI)
ALPHA_VANTAGE_API_KEY=1f7ed07b3amsh8fe6f412a14cc56p10dcfajsnf59306922095
"@

try {
    $envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline
    Write-Host "✅ Arquivo .env.local criado com sucesso em:" -ForegroundColor Green
    Write-Host $envPath -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Conteúdo do arquivo:" -ForegroundColor Yellow
    Get-Content $envPath
} catch {
    Write-Host "❌ Erro ao criar arquivo: $_" -ForegroundColor Red
}

