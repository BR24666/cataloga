# 🔍 Diagnóstico do Sistema

## O que verificar:

### 1. ✅ Variáveis de Ambiente
Verifique se o arquivo `.env.local` existe e tem as chaves corretas:
```env
NEXT_PUBLIC_SUPABASE_URL=https://utmouqkyveodxrkqyies.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
ALPHA_VANTAGE_API_KEY=1f7ed07b3amsh8fe6f412a14cc56p10dcfajsnf59306922095
```

### 2. ✅ Console do Navegador
Abra o DevTools (F12) e verifique:
- Logs começando com `🔄 [FOREX]` - indica que está buscando dados
- Logs `🆕 [VELA]` - indica que detectou nova vela
- Logs `📊 [ANÁLISE]` - indica que está analisando
- Erros em vermelho

### 3. ✅ API funcionando
Teste manualmente:
```bash
# No navegador, abra o console e execute:
fetch('/api/forex?pair=EUR/USD').then(r => r.json()).then(console.log)
```

### 4. ✅ Banco de Dados
Verifique se as tabelas existem no Supabase:
- `forex_candles`
- `strategy_predictions`
- `consensus_analysis`

### 5. ✅ Problemas Comuns

**Problema:** Nada aparece na tela
- **Solução:** Verifique se o servidor está rodando (`npm run dev`)
- **Solução:** Verifique se há erros no console do navegador

**Problema:** "Erro ao buscar dados"
- **Solução:** Verifique a API key do Alpha Vantage
- **Solução:** Verifique se o mercado está aberto (Forex funciona 24h)

**Problema:** "Nenhuma análise executada"
- **Solução:** Aguarde 1 minuto para nova vela chegar
- **Solução:** Clique no botão "Forçar Análise"

**Problema:** "Estratégias não dão sinal"
- **Solução:** Isso é normal! Nem sempre há padrões nas velas
- **Solução:** Aguarde mais velas serem coletadas

