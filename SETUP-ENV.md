# 🔧 Configuração do Arquivo .env.local

## 📝 Instruções

Crie um arquivo chamado `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://utmouqkyveodxrkqyies.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui

# Alpha Vantage API (via RapidAPI)
ALPHA_VANTAGE_API_KEY=1f7ed07b3amsh8fe6f412a14cc56p10dcfajsnf59306922095
```

## ⚠️ IMPORTANTE

**Substitua `sua_chave_anon_aqui` pela sua chave anon real do Supabase!**

Para obter sua chave:
1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em Settings > API
4. Copie a "anon public" key
5. Cole no lugar de `sua_chave_anon_aqui`

## 🚀 Métodos para Criar o Arquivo

### Método 1: Via PowerShell (Windows)
```powershell
cd "C:\Users\br246\OneDrive\Documentos\cataloga"
New-Item -Path .env.local -ItemType File
# Depois abra o arquivo e cole o conteúdo acima
```

### Método 2: Via VS Code
1. Clique com botão direito na raiz do projeto
2. Selecione "New File"
3. Nomeie como `.env.local`
4. Cole o conteúdo acima

### Método 3: Via Terminal
```bash
# No terminal, na raiz do projeto:
touch .env.local
# Depois abra e edite com seu editor favorito
```

## ✅ Verificação

Após criar o arquivo, verifique se está na raiz do projeto:
```
cataloga/
  ├── .env.local  ← Deve estar aqui
  ├── app/
  ├── components/
  ├── lib/
  └── ...
```

## 🔒 Segurança

- O arquivo `.env.local` já está no `.gitignore`
- **NUNCA** commite este arquivo no Git
- Mantenha suas chaves seguras

