# Script para criar arquivo .env.local
$envContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://utmouqkyveodxrkqyies.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui

# Alpha Vantage API (via RapidAPI)
ALPHA_VANTAGE_API_KEY=1f7ed07b3amsh8fe6f412a14cc56p10dcfajsnf59306922095
"@

$envContent | Out-File -FilePath ".env.local" -Encoding utf8 -NoNewline
Write-Host "✅ Arquivo .env.local criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Substitua 'sua_chave_anon_aqui' pela sua chave anon do Supabase!" -ForegroundColor Yellow

