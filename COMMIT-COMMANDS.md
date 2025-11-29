# Comandos para Commit e Push

## 📝 Comandos Git (Execute no PowerShell ou Terminal)

```powershell
# 1. Verificar status
git status

# 2. Adicionar todos os arquivos modificados
git add .

# 3. Fazer commit com mensagem descritiva
git commit -m "fix: Corrigir travamento do sistema de análise

- Adicionar timeout de 30s na requisição de análise
- Melhorar feedback visual no ConsensusPanel com estado isAnalyzing
- Implementar polling automático para buscar resultados
- Adicionar limpeza de intervalos para evitar memory leaks
- Melhorar logs na API para facilitar debug
- Tratar erros de forma mais robusta"

# 4. Fazer push para o repositório remoto
git push
```

## 🚀 Versão Simplificada (Um comando por vez)

```powershell
git add .
git commit -m "fix: Corrigir travamento do sistema de análise - timeout, polling e melhor feedback visual"
git push
```

## 📋 Se precisar configurar o remote pela primeira vez:

```powershell
git remote add origin https://github.com/BR24666/cataloga.git
git branch -M main
git push -u origin main
```

## ⚠️ Se der erro de autenticação:

Você precisará usar um Personal Access Token do GitHub ou configurar SSH.

