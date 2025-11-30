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
  
  // Refs para controle de estado
  const lastCandleIdRef = useRef<string | null>(null)
  const lastAnalysisTimeRef = useRef<number>(0)
  const isProcessingRef = useRef(false)

  // Buscar dados do Forex - COM refetch automático a cada minuto para monitorar vela a vela
  const { data: forexData, isLoading: isLoadingForex, error: forexError, refetch: refetchForex } = useQuery({
    queryKey: ['forex', selectedPair],
    queryFn: async () => {
      console.log('🔄 [FOREX] Buscando dados para:', selectedPair)
      const response = await fetch(`/api/forex?pair=${selectedPair}`)
      const responseData = await response.json().catch(() => ({}))
      
      if (!response.ok) {
        console.error('❌ [FOREX] Erro:', responseData.error || 'Erro desconhecido')
        throw new Error(responseData.error || 'Erro ao buscar dados')
      }
      
      const candleId = responseData.candle?.id
      console.log('✅ [FOREX] Dados recebidos:', {
        candleId,
        hasCandle: !!responseData.candle,
        historicalCount: responseData.historical?.length || 0,
      })
      
      return responseData
    },
    // HABILITAR refetch automático a cada 60 segundos para monitorar vela a vela
    refetchInterval: 60000, // 60 segundos = 1 minuto (tempo de uma vela)
    staleTime: 0, // Dados ficam stale imediatamente para forçar refetch
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('429') || error?.message?.includes('RATE_LIMIT')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Função para buscar previsões e consenso
  const fetchPredictions = async (candleId: string) => {
    if (!candleId) return

    try {
      const { data: preds } = await supabase
        .from('strategy_predictions')
        .select('*')
        .eq('candle_id', candleId)
        .order('confidence', { ascending: false })

      if (preds) {
        console.log('📊 [PREVISÕES] Encontradas:', preds.length)
        setPredictions(preds)
      }

      const { data: cons, error: consError } = await supabase
        .from('consensus_analysis')
        .select('*')
        .eq('candle_id', candleId)
        .maybeSingle()

      if (consError && consError.code !== 'PGRST116') {
        console.error('❌ [CONSENSO] Erro:', consError)
      } else if (cons) {
        console.log('✅ [CONSENSO] Encontrado:', cons.total_strategies, 'estratégias')
        setConsensus(cons)
      } else {
        setConsensus(null)
      }
    } catch (error) {
      console.error('❌ [ERRO] Ao buscar previsões:', error)
    }
  }

  // Executar análise
  const executeAnalysis = async (candle: ForexCandle) => {
    if (isProcessingRef.current) {
      console.log('⏸️ [ANÁLISE] Já em processamento, aguardando...')
      return
    }

    isProcessingRef.current = true
    setIsAnalyzing(true)

    try {
      console.log('🔄 [ANÁLISE] Iniciando para vela:', candle.id)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candleId: candle.id,
          pair: candle.pair,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const result = await response.json()
      
      if (response.ok) {
        console.log('✅ [ANÁLISE] Concluída:', result)
        // Buscar previsões após análise
        setTimeout(() => fetchPredictions(candle.id), 1500)
      } else {
        console.error('❌ [ANÁLISE] Erro:', result.error)
        fetchPredictions(candle.id)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('⏱️ [ANÁLISE] Timeout após 30s')
      } else {
        console.error('❌ [ANÁLISE] Erro:', error)
      }
      fetchPredictions(candle.id)
    } finally {
      setIsAnalyzing(false)
      isProcessingRef.current = false
      lastAnalysisTimeRef.current = Date.now()
    }
  }

  // Forçar busca inicial quando o componente monta
  useEffect(() => {
    console.log('🚀 [INIT] Componente montado, buscando dados iniciais...')
    // Pequeno delay para garantir que tudo está inicializado
    setTimeout(() => {
      refetchForex()
    }, 500)
  }, [refetchForex]) // Executa quando o componente monta e quando refetchForex muda

  // Processar nova vela quando dados chegarem
  useEffect(() => {
    if (!forexData?.candle) {
      console.log('⏳ [VELA] Aguardando dados da vela...')
      return
    }

    const newCandle = forexData.candle as ForexCandle
    const newCandleId = newCandle.id
    const newCandleTimestamp = newCandle.timestamp

    // Ignorar velas temporárias
    if (newCandleId?.toString().startsWith('temp-')) {
      console.warn('⚠️ [VELA] Ignorando vela temporária:', newCandleId)
      return
    }

    // Verificar se é realmente uma nova vela (comparar timestamp também)
    const isNewCandle = lastCandleIdRef.current !== newCandleId || 
                        (currentCandle && currentCandle.timestamp !== newCandleTimestamp)

    if (!isNewCandle && lastCandleIdRef.current === newCandleId) {
      // Mesma vela - apenas atualizar se necessário
      if (!consensus && newCandleId) {
        console.log('🔄 [VELA] Mesma vela, buscando previsões...')
        fetchPredictions(newCandleId)
      }
      return
    }

    // NOVA VELA DETECTADA
    console.log('🆕 [VELA] ========================================')
    console.log('🆕 [VELA] Nova vela detectada!')
    console.log('🆕 [VELA] ID:', newCandleId)
    console.log('🆕 [VELA] Timestamp:', newCandleTimestamp)
    console.log('🆕 [VELA] Cor:', newCandle.color)
    console.log('🆕 [VELA] Anterior ID:', lastCandleIdRef.current)
    console.log('🆕 [VELA] ========================================')
    
    lastCandleIdRef.current = newCandleId
    setCurrentCandle(newCandle)
    
    // Limpar consenso anterior para mostrar estado de análise
    setConsensus(null)
    setPredictions([])
    
    // Buscar previsões existentes primeiro
    fetchPredictions(newCandleId)

    // Verificar se precisa executar análise
    const checkAndAnalyze = async () => {
      try {
        // Aguardar um pouco para garantir que a vela foi salva
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const { data: existingConsensus } = await supabase
          .from('consensus_analysis')
          .select('*')
          .eq('candle_id', newCandleId)
          .maybeSingle()

        // Se não tem consenso ou tem menos de 5 estratégias, executar análise
        // IMPORTANTE: Sempre executar análise para garantir que temos as 5 estratégias
        if (!existingConsensus || existingConsensus.total_strategies < 5) {
          console.log('📊 [ANÁLISE] Consenso não encontrado ou incompleto, executando análise...')
          console.log('📊 [ANÁLISE] Estratégias encontradas:', existingConsensus?.total_strategies || 0, 'de 5')
          await executeAnalysis(newCandle)
        } else {
          console.log('✅ [ANÁLISE] Consenso já existe com', existingConsensus.total_strategies, 'estratégias')
          setConsensus(existingConsensus)
          // Mesmo assim, buscar previsões para garantir que temos todas
          fetchPredictions(newCandleId)
        }
      } catch (err) {
        console.error('❌ [ERRO] Ao verificar consenso:', err)
        await executeAnalysis(newCandle)
      }
    }

    checkAndAnalyze()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forexData?.candle?.id, forexData?.candle?.timestamp]) // Dispara quando ID ou timestamp muda

  // Escutar mudanças em tempo real para a vela atual
  useEffect(() => {
    if (!currentCandle?.id) return

    const candleId = currentCandle.id

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
          console.log('🔔 [REALTIME] Nova previsão detectada')
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
          console.log('🔔 [REALTIME] Consenso atualizado')
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

  // Polling manual adicional como backup (o React Query já faz isso, mas garantimos)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ [POLLING] Verificando nova vela (backup)...')
      refetchForex()
    }, 60000) // Verificar a cada minuto

    return () => clearInterval(interval)
  }, [refetchForex])

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analisador de Forex</h1>
            <p className="text-gray-400">
              Análise probabilística com 5 estratégias em tempo real
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
                      console.log('✅ [MANUAL] Análise executada:', result)
                      setTimeout(() => fetchPredictions(currentCandle.id), 1000)
                    }
                  } catch (error) {
                    console.error('❌ [MANUAL] Erro:', error)
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
              onClick={() => {
                console.log('🔄 [MANUAL] Atualizando dados...')
                refetchForex()
              }}
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
