'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import PairSelector from '@/components/PairSelector'
import CandleDisplay from '@/components/CandleDisplay'
import ConsensusPanel from '@/components/ConsensusPanel'
import StrategiesList from '@/components/StrategiesList'
import { supabase, type ForexCandle, type StrategyPrediction, type ConsensusAnalysis } from '@/lib/supabase'
import { RefreshCw } from 'lucide-react'

export default function Home() {
  const [selectedPair, setSelectedPair] = useState('EUR/USD')
  const [currentCandle, setCurrentCandle] = useState<ForexCandle | null>(null)
  const [predictions, setPredictions] = useState<StrategyPrediction[]>([])
  const [consensus, setConsensus] = useState<ConsensusAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const lastAnalyzedCandleId = useRef<string | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const processingCandleId = useRef<string | null>(null) // Evitar processamento duplicado

  // Buscar dados do Forex
  const { data: forexData, isLoading: isLoadingForex, error: forexError, refetch: refetchForex } = useQuery({
    queryKey: ['forex', selectedPair],
    queryFn: async () => {
      console.log('🔄 Buscando dados do Forex para:', selectedPair)
      const response = await fetch(`/api/forex?pair=${selectedPair}`)
      const responseData = await response.json().catch(() => ({}))
      
      if (!response.ok) {
        console.error('❌ Erro na API Forex:', responseData.error || 'Erro desconhecido')
        throw new Error(responseData.error || 'Erro ao buscar dados')
      }
      
      console.log('✅ Dados recebidos:', {
        hasCandle: !!responseData.candle,
        candleId: responseData.candle?.id,
        historicalCount: responseData.historical?.length || 0,
      })
      
      return responseData
    },
    refetchInterval: 60000, // Atualizar a cada minuto
    retry: (failureCount, error: any) => {
      // Não tentar novamente se for erro 429 (limite de requisições)
      if (error?.message?.includes('429') || error?.message?.includes('RATE_LIMIT')) {
        return false
      }
      // Tentar até 2 vezes para outros erros
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial até 30s
  })

  // Função para buscar previsões e consenso
  const fetchPredictions = async (candleId: string) => {
    if (!candleId) return

    try {
      // Buscar previsões
      const { data: preds } = await supabase
        .from('strategy_predictions')
        .select('*')
        .eq('candle_id', candleId)
        .order('confidence', { ascending: false })

      if (preds) {
        console.log('Previsões encontradas:', preds.length)
        setPredictions(preds)
      }

      // Buscar consenso (usar maybeSingle para evitar erro 406 quando não há dados)
      const { data: cons, error: consError } = await supabase
        .from('consensus_analysis')
        .select('*')
        .eq('candle_id', candleId)
        .maybeSingle()

      if (consError && consError.code !== 'PGRST116') {
        console.error('Erro ao buscar consenso:', consError)
      } else if (cons) {
        console.log('Consenso encontrado:', cons)
        setConsensus(cons)
      } else {
        // Não há consenso ainda, limpar estado
        setConsensus(null)
      }
    } catch (error) {
      console.error('Erro ao buscar previsões:', error)
    }
  }

  // Limpar polling quando componente desmontar ou vela mudar
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [currentCandle?.id])

  // Buscar previsões e consenso quando a vela mudar
  useEffect(() => {
    if (!currentCandle) return

    const candleId = currentCandle.id
    fetchPredictions(candleId)

    // Escutar novas previsões em tempo real
    const predictionsChannel = supabase
      .channel(`predictions-${candleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'strategy_predictions',
          filter: `candle_id=eq.${candleId}`,
        },
        () => {
          fetchPredictions(candleId)
        }
      )
      .subscribe()

    const consensusChannel = supabase
      .channel(`consensus-${candleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consensus_analysis',
          filter: `candle_id=eq.${candleId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setConsensus(payload.new as ConsensusAnalysis)
          } else if (payload.eventType === 'DELETE') {
            setConsensus(null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(predictionsChannel)
      supabase.removeChannel(consensusChannel)
    }
  }, [currentCandle?.id])

  // Atualizar vela atual quando os dados chegarem e executar análise
  useEffect(() => {
    if (!forexData?.candle) return

    const newCandle = forexData.candle as ForexCandle
    
    // Ignorar velas temporárias (não podem ser analisadas)
    if (newCandle.id && newCandle.id.toString().startsWith('temp-')) {
      console.warn('⚠️ Ignorando vela temporária - não pode ser analisada:', newCandle.id)
      return
    }
    
    // Evitar processamento duplicado da mesma vela
    if (processingCandleId.current === newCandle.id) {
      console.log('⏸️ Vela já está sendo processada, aguardando...', newCandle.id)
      return
    }
    
    // Evitar atualizar se for a mesma vela já analisada
    if (currentCandle?.id === newCandle.id && lastAnalyzedCandleId.current === newCandle.id) {
      console.log('⏸️ Mesma vela já analisada, pulando:', newCandle.id)
      return
    }

    // Atualizar vela apenas se for diferente e tiver ID válido
    if (currentCandle?.id !== newCandle.id && newCandle.id) {
      console.log('🔄 Nova vela detectada:', newCandle.id, 'Anterior:', currentCandle?.id)
      setCurrentCandle(newCandle)
    }

    // Executar análise automaticamente quando uma nova vela chegar
    const executeAnalysis = async () => {
      if (isAnalyzing) {
        console.log('Análise já em andamento, aguardando...')
        return
      }

      setIsAnalyzing(true)
      try {
        console.log('🔄 Executando análise para vela:', newCandle.id, 'Par:', newCandle.pair)
        
        // Criar AbortController para timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos de timeout
        
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candleId: newCandle.id,
            pair: newCandle.pair,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const result = await response.json()
        
        if (response.ok) {
          console.log('✅ Análise executada com sucesso:', result)
          // Forçar atualização das previsões após 1 segundo
          setTimeout(() => {
            fetchPredictions(newCandle.id)
          }, 1000)
        } else {
          console.error('❌ Erro na análise:', result.error)
          // Mesmo com erro, tentar buscar previsões existentes
          fetchPredictions(newCandle.id)
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error('⏱️ Análise expirou após 30 segundos')
        } else {
          console.error('❌ Erro ao executar análise:', error)
        }
        // Mesmo com erro, tentar buscar previsões existentes
        fetchPredictions(newCandle.id)
      } finally {
        setIsAnalyzing(false)
      }
    }

    // Evitar análise duplicada para a mesma vela
    if (lastAnalyzedCandleId.current === newCandle.id && processingCandleId.current === newCandle.id) {
      console.log('⏸️ Vela já analisada e processada, pulando...', newCandle.id)
      return
    }

    // Marcar vela como sendo processada
    processingCandleId.current = newCandle.id

    // Buscar previsões existentes primeiro (só se tiver ID válido)
    if (newCandle.id) {
      fetchPredictions(newCandle.id)
    }

    // Sempre executar análise quando uma nova vela chegar
    // Verificar se já existe consenso primeiro (para evitar análise duplicada)
    const checkAndExecuteAnalysis = async () => {
      try {
        const { data, error } = await supabase
          .from('consensus_analysis')
          .select('*')
          .eq('candle_id', newCandle.id)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao verificar consenso:', error)
        }
        
        // Se não existe consenso OU se não tem previsões suficientes, executar análise
        if (!data || (data.total_strategies < 5)) {
          console.log('📊 Executando análise para vela:', newCandle.id)
          lastAnalyzedCandleId.current = newCandle.id
          
          // Limpar polling anterior se existir
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          
          await executeAnalysis()
          
          // Após análise, fazer polling para buscar resultados (caso a análise tenha demorado)
          let attempts = 0
          const maxAttempts = 10
          pollIntervalRef.current = setInterval(async () => {
            attempts++
            const { data: updatedConsensus } = await supabase
              .from('consensus_analysis')
              .select('*')
              .eq('candle_id', newCandle.id)
              .maybeSingle()
            
            if (updatedConsensus || attempts >= maxAttempts) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
              }
              fetchPredictions(newCandle.id)
            }
          }, 2000) // Verificar a cada 2 segundos
        } else {
          console.log('✅ Consenso já existe com', data.total_strategies, 'estratégias')
          lastAnalyzedCandleId.current = newCandle.id
          processingCandleId.current = null // Liberar processamento
          // Mesmo assim, buscar previsões para garantir que estão atualizadas
          setTimeout(() => {
            fetchPredictions(newCandle.id)
          }, 500)
        }
      } catch (err) {
        console.error('Erro ao verificar consenso, executando análise mesmo assim:', err)
        // Em caso de erro, executar análise
        lastAnalyzedCandleId.current = newCandle.id
        await executeAnalysis()
      } finally {
        // Liberar processamento após um tempo
        setTimeout(() => {
          if (processingCandleId.current === newCandle.id) {
            processingCandleId.current = null
          }
        }, 5000)
      }
    }

    checkAndExecuteAnalysis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forexData?.candle?.id])

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analisador de Forex</h1>
            <p className="text-gray-400">
              Análise probabilística com 10 estratégias em tempo real
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (currentCandle) {
                  setIsAnalyzing(true)
                  try {
                    const response = await fetch('/api/analyze', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        candleId: currentCandle.id,
                        pair: currentCandle.pair,
                      }),
                    })
                    const result = await response.json()
                    if (response.ok) {
                      console.log('Análise manual executada:', result)
                      setTimeout(() => fetchPredictions(currentCandle.id), 1000)
                    }
                  } catch (error) {
                    console.error('Erro na análise manual:', error)
                  } finally {
                    setIsAnalyzing(false)
                  }
                }
              }}
              disabled={!currentCandle || isAnalyzing}
              className="card flex items-center gap-2 hover:bg-[#252525] transition-colors disabled:opacity-50"
              title="Forçar análise das estratégias"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analisando...' : 'Forçar Análise'}</span>
            </button>
            <button
              onClick={() => refetchForex()}
              disabled={isLoadingForex}
              className="card flex items-center gap-2 hover:bg-[#252525] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingForex ? 'animate-spin' : ''}`} />
              <span>Atualizar Dados</span>
            </button>
          </div>
        </div>

        {/* Seletor de Par */}
        <div className="flex items-center gap-4">
          <span className="text-gray-400">PAR:</span>
          <PairSelector
            selectedPair={selectedPair}
            onPairChange={setSelectedPair}
          />
        </div>

        {/* Mensagem de Erro */}
        {forexError && (
          <div className="card bg-red-500/10 border-red-500/50">
            <p className="text-red-400 font-semibold">⚠️ Erro ao buscar dados</p>
            <p className="text-red-300 text-sm mt-1">
              {forexError instanceof Error ? forexError.message : 'Erro desconhecido'}
            </p>
            
            {/* Mensagem específica para erro 429 */}
            {forexError instanceof Error && forexError.message.includes('429') && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                <p className="text-yellow-300 text-sm font-semibold mb-2">
                  ⏱️ Limite de Requisições Atingido
                </p>
                <p className="text-yellow-200 text-xs">
                  A API Alpha Vantage tem um limite de requisições por minuto. 
                  Aguarde 1-2 minutos antes de tentar novamente. 
                  A análise não pode ser executada enquanto não houver dados salvos no banco.
                </p>
              </div>
            )}

            {/* Mensagem específica para erro de banco */}
            {forexError instanceof Error && (
              forexError.message.includes('banco de dados') || 
              forexError.message.includes('Supabase') ||
              forexError.message.includes('PERMISSION_DENIED') ||
              forexError.message.includes('TABLE_NOT_FOUND')
            ) && (
              <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded">
                <p className="text-orange-300 text-sm font-semibold mb-2">
                  🔧 Problema com Banco de Dados
                </p>
                <p className="text-orange-200 text-xs mb-2">
                  O erro pode ser causado por:
                </p>
                <ul className="text-orange-200 text-xs list-disc list-inside space-y-1 ml-2">
                  <li>Políticas RLS (Row Level Security) bloqueando inserções</li>
                  <li>Tabela não existe ou nome incorreto</li>
                  <li>Variáveis de ambiente não configuradas</li>
                  <li>Permissões insuficientes na chave anon do Supabase</li>
                </ul>
                <p className="text-orange-200 text-xs mt-2">
                  <strong>Como resolver:</strong> Verifique as políticas RLS no Supabase e certifique-se de que a tabela <code className="bg-orange-900/30 px-1 rounded">forex_candles</code> permite INSERT para usuários anônimos.
                </p>
              </div>
            )}

            <div className="mt-3 space-y-2 text-xs text-red-200">
              <p><strong>Possíveis causas:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>API Alpha Vantage com limite de requisições atingido (429)</li>
                <li>Erro ao salvar vela no banco de dados (verifique RLS)</li>
                <li>Mercado fechado (Forex funciona 24h, mas pode haver problemas na API)</li>
                <li>Problema de conexão com a internet</li>
                <li>Chave da API não configurada corretamente</li>
              </ul>
            </div>
            <button
              onClick={() => refetchForex()}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-white text-sm transition-colors"
            >
              🔄 Tentar novamente
            </button>
          </div>
        )}

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            <CandleDisplay candle={currentCandle} isLoading={isLoadingForex} />
            <ConsensusPanel consensus={consensus} isLoading={isLoadingForex || isAnalyzing} isAnalyzing={isAnalyzing} />
          </div>

          {/* Coluna Direita */}
          <div>
            <StrategiesList predictions={predictions} isLoading={isLoadingForex} />
          </div>
        </div>
      </div>
    </main>
  )
}

