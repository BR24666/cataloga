# 🔧 Variáveis de Ambiente para Vercel

## 📋 Variáveis que você precisa adicionar no Vercel

Ao fazer deploy no Vercel, adicione estas variáveis de ambiente no painel do projeto:

### Como adicionar no Vercel:

1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável abaixo:

---

## 🔑 Variáveis de Ambiente

### 1. Supabase URL
```
Nome: NEXT_PUBLIC_SUPABASE_URL
Valor: https://utmouqkyveodxrkqyies.supabase.co
Ambiente: Production, Preview, Development (todas)
```

### 2. Supabase Anon Key
```
Nome: NEXT_PUBLIC_SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bW91cWt5dmVvZHhya3F5aWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzM5NzYsImV4cCI6MjA2MDIwOTk3Nn0.XttMuImhCt3UcF5MfuGkAVBm0vGgeZswXyMw_h5X20w
Ambiente: Production, Preview, Development (todas)
```

### 3. Alpha Vantage API Key
```
Nome: ALPHA_VANTAGE_API_KEY
Valor: 1f7ed07b3amsh8fe6f412a14cc56p10dcfajsnf59306922095
Ambiente: Production, Preview, Development (todas)
```

---

## 📝 Formato para copiar e colar

### Opção 1: Adicionar uma por uma no Vercel
Use os valores acima no painel do Vercel.

### Opção 2: Via Vercel CLI
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Cole: https://utmouqkyveodxrkqyies.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Cole: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bW91cWt5dmVvZHhya3F5aWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzM5NzYsImV4cCI6MjA2MDIwOTk3Nn0.XttMuImhCt3UcF5MfuGkAVBm0vGgeZswXyMw_h5X20w

vercel env add ALPHA_VANTAGE_API_KEY production
# Cole: 1f7ed07b3amsh8fe6f412a14cc56p10dcfajsnf59306922095
```

---

## ✅ Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` adicionada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` adicionada
- [ ] `ALPHA_VANTAGE_API_KEY` adicionada
- [ ] Todas marcadas para Production, Preview e Development
- [ ] Redeploy feito após adicionar as variáveis

---

## 🚀 Após adicionar as variáveis

1. **Redeploy** seu projeto no Vercel
2. As variáveis estarão disponíveis em runtime
3. Verifique os logs se houver erros

---

## 🔒 Segurança

- ✅ Variáveis com `NEXT_PUBLIC_` são expostas ao cliente (necessário para Supabase)
- ✅ `ALPHA_VANTAGE_API_KEY` é server-side only (seguro)
- ⚠️ Nunca commite essas chaves no código

---

## 📞 Suporte

Se tiver problemas:
1. Verifique se todas as variáveis foram adicionadas
2. Confirme que estão habilitadas para o ambiente correto
3. Faça um redeploy após adicionar variáveis

