# 📊 Analisador de Forex - Estratégias Probabilísticas

Sistema de monitoramento e análise de pares de moeda (EUR/USD, GBP/USD, USD/CHF) usando 10 estratégias probabilísticas para prever a cor da próxima vela.

## 🎯 Conceito

Para cada par de moeda selecionado:
- **Vela de Entrada:** 14:29:00 a 14:29:59
- **Vela Revelada:** 14:30:00 a 14:30:59

O sistema mostra quantas estratégias preveem que a próxima vela será **verde** vs **vermelha**.

## 📈 10 Estratégias Probabilísticas (IMPLEMENTADAS ✅)

1. **Engolfo de Cor Única** (92.9%) - Melhor: 8h, Sábado
   - Vela grande que engolfa a anterior mantendo a mesma cor

2. **Três Soldados Brancos** (92.0%) - Melhor: 14h, Quarta-feira
   - Três velas verdes fortes consecutivas

3. **Vela de Força** (90.9%) - Melhor: 13h, Sexta-feira
   - Vela com corpo grande e pavio curto

4. **Três Vales/Picos** (85.7%) - Melhor: 12h, Quarta-feira
   - Três fundos ascendentes ou três topos descendentes

5. **MHI** (85.0%) - Melhor: 10h, Segunda-feira
   - Entrada na cor oposta quando há 2+ velas da mesma cor

6. **Reversão Pós-Doji** (84.2%) - Melhor: 15h, Segunda-feira
   - Reversão após vela Doji

7. **Minoria** (80.0%) - Melhor: 9h, Terça-feira
   - Entrada a favor da cor que apareceu menos vezes

8. **Primeira Vela do Quadrante** (75.0%) - Melhor: 10h, Domingo
   - Primeira vela forte de cada bloco de 15 minutos

9. **Alternância de Cores** (72.2%) - Melhor: 11h, Quinta-feira
   - Mantém padrão alternado de cores

10. **Sequência Ímpar** (71.4%) - Melhor: 9h, Terça-feira
    - Entrada contra sequência de 3 velas iguais

## 🛠️ Stack Tecnológica

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **API de Dados:** Alpha Vantage
- **Deploy:** Vercel

## 🚀 Funcionalidades

### Tela Principal
- Seletor de par de moeda (EUR/USD, GBP/USD, USD/CHF)
- Display em tempo real da vela atual
- **Painel de Votos:**
  - 🟩 X estratégias dizem: **VERDE**
  - 🟥 Y estratégias dizem: **VERMELHO**
- Lista de estratégias com suas previsões individuais
- Consenso geral com % de confiança

### Dashboard de Performance
- Winrate de cada estratégia
- Winrate do consenso
- Histórico de acertos/erros
- Gráficos de performance

### Configurações
- Ativar/desativar estratégias
- Ajustar peso de cada estratégia
- Threshold de consenso mínimo

## 📊 Como Funciona

1. **Coleta de Dados:** API Alpha Vantage fornece dados históricos e em tempo real
2. **Análise:** Cada estratégia analisa as últimas velas e faz sua previsão
3. **Consenso:** Sistema consolida todas as previsões
4. **Exibição:** Frontend mostra:
   - Quantas estratégias votam em verde
   - Quantas estratégias votam em vermelho
   - Consenso final
5. **Verificação:** Após vela revelar, sistema registra acerto/erro

## 🔧 Setup

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Crie .env.local na raiz do projeto:
NEXT_PUBLIC_SUPABASE_URL=https://utmouqkyveodxrkqyies.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
ALPHA_VANTAGE_API_KEY=1f7ed07b3amsh8fe6f412a14cc56p10dcfajsnf59306922095

# Inicializar estratégias no banco (opcional - primeira vez)
# Acesse: http://localhost:3000/api/init-strategies (POST)

# Executar em desenvolvimento
npm run dev
```

## 📝 Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=seu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
ALPHA_VANTAGE_API_KEY=sua_api_key
```

## 🎨 Interface

### Tela Principal
```
┌─────────────────────────────────────────┐
│  PAR: [EUR/USD ▼] [GBP/USD] [USD/CHF]  │
├─────────────────────────────────────────┤
│  Vela Atual: 14:29:45                   │
│  O: 1.0850 | H: 1.0855 | L: 1.0845      │
│  C: 1.0852                              │
├─────────────────────────────────────────┤
│  🎯 PREVISÃO PARA PRÓXIMA VELA          │
│                                         │
│  🟩 7 estratégias dizem: VERDE (70%)    │
│  🟥 3 estratégias dizem: VERMELHO (30%) │
│                                         │
│  Consenso: 🟩 VERDE (Confiança: 70%)    │
├─────────────────────────────────────────┤
│  📋 Detalhes das Estratégias:           │
│  ✅ Engolfo → Verde (92.9%)             │
│  ✅ Três Soldados → Verde (92.0%)       │
│  ❌ Vela de Força → Vermelho (90.9%)    │
│  ...                                    │
└─────────────────────────────────────────┘
```

## 🚀 Deploy

```bash
# Fazer build
npm run build

# Deploy no Vercel
vercel deploy
```

## 📞 Repositório

GitHub: https://github.com/BR24666/cataloga.git

---

**Desenvolvido com Vercel + Supabase + Alpha Vantage**

