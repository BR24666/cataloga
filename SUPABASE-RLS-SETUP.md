# 🔒 Configuração de Políticas RLS no Supabase

## Problema
Se você está recebendo erro "Erro ao salvar vela no banco de dados", provavelmente as políticas RLS (Row Level Security) não estão configuradas corretamente.

## Solução: Configurar Políticas RLS

### 1. Acesse o Supabase Dashboard
1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**

### 2. Execute os seguintes comandos SQL

#### Para a tabela `forex_candles`:

```sql
-- Habilitar RLS
ALTER TABLE forex_candles ENABLE ROW LEVEL SECURITY;

-- Política para permitir INSERT (inserir velas)
CREATE POLICY "Permitir inserção de velas para usuários anônimos"
ON forex_candles
FOR INSERT
TO anon
WITH CHECK (true);

-- Política para permitir SELECT (ler velas)
CREATE POLICY "Permitir leitura de velas para usuários anônimos"
ON forex_candles
FOR SELECT
TO anon
USING (true);

-- Política para permitir UPDATE (atualizar velas)
CREATE POLICY "Permitir atualização de velas para usuários anônimos"
ON forex_candles
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
```

#### Para a tabela `strategy_predictions`:

```sql
-- Habilitar RLS
ALTER TABLE strategy_predictions ENABLE ROW LEVEL SECURITY;

-- Política para permitir INSERT
CREATE POLICY "Permitir inserção de previsões para usuários anônimos"
ON strategy_predictions
FOR INSERT
TO anon
WITH CHECK (true);

-- Política para permitir SELECT
CREATE POLICY "Permitir leitura de previsões para usuários anônimos"
ON strategy_predictions
FOR SELECT
TO anon
USING (true);

-- Política para permitir UPDATE
CREATE POLICY "Permitir atualização de previsões para usuários anônimos"
ON strategy_predictions
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
```

#### Para a tabela `consensus_analysis`:

```sql
-- Habilitar RLS
ALTER TABLE consensus_analysis ENABLE ROW LEVEL SECURITY;

-- Política para permitir INSERT
CREATE POLICY "Permitir inserção de consenso para usuários anônimos"
ON consensus_analysis
FOR INSERT
TO anon
WITH CHECK (true);

-- Política para permitir SELECT
CREATE POLICY "Permitir leitura de consenso para usuários anônimos"
ON consensus_analysis
FOR SELECT
TO anon
USING (true);

-- Política para permitir UPDATE
CREATE POLICY "Permitir atualização de consenso para usuários anônimos"
ON consensus_analysis
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
```

#### Para a tabela `strategies_config` (opcional, se quiser permitir leitura):

```sql
-- Habilitar RLS
ALTER TABLE strategies_config ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT (apenas leitura)
CREATE POLICY "Permitir leitura de estratégias para usuários anônimos"
ON strategies_config
FOR SELECT
TO anon
USING (true);
```

### 3. Verificar se funcionou

Após executar os comandos SQL:
1. Tente atualizar os dados no aplicativo
2. Verifique os logs do Supabase em **Logs** → **Postgres Logs**
3. Se ainda houver erro, verifique se as tabelas existem

### 4. Verificar se as tabelas existem

Execute este comando para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('forex_candles', 'strategy_predictions', 'consensus_analysis', 'strategies_config');
```

## Alternativa: Desabilitar RLS (NÃO RECOMENDADO para produção)

⚠️ **ATENÇÃO**: Isso remove a segurança. Use apenas para desenvolvimento/testes.

```sql
ALTER TABLE forex_candles DISABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE consensus_analysis DISABLE ROW LEVEL SECURITY;
ALTER TABLE strategies_config DISABLE ROW LEVEL SECURITY;
```

## Verificar Políticas Existentes

Para ver quais políticas já existem:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('forex_candles', 'strategy_predictions', 'consensus_analysis', 'strategies_config');
```

## Problemas Comuns

### Erro: "permission denied for table"
- **Causa**: RLS está habilitado mas não há políticas
- **Solução**: Execute os comandos SQL acima

### Erro: "relation does not exist"
- **Causa**: Tabela não foi criada
- **Solução**: Execute os scripts de criação de tabelas primeiro

### Erro: "duplicate key value"
- **Causa**: Tentando inserir vela que já existe
- **Solução**: Isso é normal, o upsert deve resolver automaticamente

## Suporte

Se ainda tiver problemas, verifique:
1. ✅ Variáveis de ambiente configuradas (`.env.local`)
2. ✅ URL e chave do Supabase corretas
3. ✅ Tabelas criadas no banco
4. ✅ Políticas RLS configuradas
5. ✅ Logs do Supabase para mais detalhes

