# 🔧 Guia de Troubleshooting - Sistema de Análise Forex

## ❓ O que não está funcionando?

### 1. **Nada aparece na tela / Tela em branco**

**Verifique:**
- ✅ Servidor está rodando? Execute: `npm run dev`
- ✅ Abra o navegador em: `http://localhost:3000`
- ✅ Abra o Console do navegador (F12) e veja se há erros

**Solução:**
```powershell
# Pare o servidor (Ctrl+C) e reinicie:
npm run dev
```

---

### 2. **Erro: "Erro ao buscar dados"**

**Possíveis causas:**
- ❌ Arquivo `.env.local` não existe ou está incorreto
- ❌ API Key do Alpha Vantage inválida ou expirada
- ❌ Limite de requisições da API atingido

**Solução:**
1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Verifique se as chaves estão corretas:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://utmouqkyveodxrkqyies.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
   ALPHA_VANTAGE_API_KEY=sua_chave_aqui
   ```
3. Reinicie o servidor após alterar `.env.local`

---

### 3. **"Aguardando análise das estratégias..." (nunca termina)**

**Possíveis causas:**
- ❌ Análise não está sendo executada automaticamente
- ❌ Erro na API de análise
- ❌ Banco de dados não configurado

**Solução:**
1. Abra o Console do navegador (F12)
2. Procure por logs:
   - `🔄 [FOREX]` - busca de dados
   - `🆕 [VELA]` - nova vela detectada
   - `📊 [ANÁLISE]` - análise sendo executada
3. Clique no botão **"Forçar Análise"** manualmente
4. Veja se há erros em vermelho no console

---

### 4. **"Nenhuma estratégia deu sinal" / "3 estratégias não falam nada"**

**Isso é NORMAL!** ✅

- Nem sempre as velas apresentam padrões reconhecíveis
- As estratégias só dão sinal quando identificam padrões específicos
- Se 2 estratégias discordam e 3 não falam nada, o consenso será **INDEFINIDO**

**O que fazer:**
- Aguarde mais velas serem coletadas
- O sistema precisa de histórico para identificar padrões
- Algumas estratégias precisam de 3-6 velas anteriores

---

### 5. **Sistema não detecta novas velas**

**Verifique:**
- ✅ O polling está ativo? (deve buscar a cada 60 segundos)
- ✅ Veja no console se aparece `🔄 [FOREX] Buscando dados`
- ✅ Verifique se há erros de API

**Solução:**
1. Abra o Console (F12)
2. Procure por logs a cada minuto
3. Se não aparecer nada, clique em **"Atualizar Dados"** manualmente

---

### 6. **Erro no banco de dados (Supabase)**

**Possíveis causas:**
- ❌ Tabelas não existem
- ❌ Políticas RLS (Row Level Security) bloqueando
- ❌ Chave anon incorreta

**Solução:**
1. Acesse o Supabase Dashboard
2. Verifique se as tabelas existem:
   - `forex_candles`
   - `strategy_predictions`
   - `consensus_analysis`
3. Verifique as políticas RLS (devem permitir SELECT, INSERT, UPDATE)

---

## 🧪 Teste Manual

### Teste 1: API de Forex
Abra o Console do navegador e execute:
```javascript
fetch('/api/forex?pair=EUR/USD')
  .then(r => r.json())
  .then(data => {
    console.log('✅ API funcionando:', data)
    if (data.error) {
      console.error('❌ Erro:', data.error)
    }
  })
```

### Teste 2: API de Análise
```javascript
// Primeiro, pegue um candleId do banco ou da resposta da API acima
fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    candleId: 'ID_DA_VELA',
    pair: 'EUR/USD'
  })
})
  .then(r => r.json())
  .then(data => console.log('✅ Análise:', data))
```

---

## 📊 Logs Esperados

Quando o sistema está funcionando, você deve ver no console:

```
🔄 [FOREX] Buscando dados para: EUR/USD
✅ [FOREX] Dados recebidos: { candleId: '...', hasCandle: true }
🆕 [VELA] Nova vela detectada: ...
📊 [ANÁLISE] Consenso não encontrado ou incompleto, executando análise...
📊 ========================================
📊 Iniciando análise - CandleId: ... Pair: EUR/USD
📊 ========================================
🔍 Executando 5 estratégias (5 selecionadas) com X velas...
✅ Engolfo de Cor Única: green (92.9%)
...
📊 RESUMO DA ANÁLISE:
📊 Total de estratégias executadas: 5
📊 Estratégias com previsão: X
📊 Estratégias sem previsão: Y
```

---

## 🆘 Ainda não funciona?

1. **Copie os erros do console** (F12 → Console)
2. **Verifique o terminal** onde está rodando `npm run dev`
3. **Verifique se o arquivo `.env.local` existe e está correto**
4. **Teste as APIs manualmente** (veja seção "Teste Manual" acima)

---

## ✅ Checklist Rápido

- [ ] Arquivo `.env.local` existe na raiz do projeto
- [ ] Chaves do `.env.local` estão corretas
- [ ] Servidor está rodando (`npm run dev`)
- [ ] Navegador está em `http://localhost:3000`
- [ ] Console do navegador está aberto (F12)
- [ ] Não há erros em vermelho no console
- [ ] Tabelas do Supabase existem
- [ ] API Key do Alpha Vantage está válida

