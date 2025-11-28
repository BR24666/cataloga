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

  // Buscar dados do Forex
  const { data: forexData, isLoading: isLoadingForex, error: forexError, refetch: refetchForex } = useQuery({
    queryKey: ['forex', selectedPair],
    queryFn: async () => {
      const response = await fetch(`/api/forex?pair=${selectedPair}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao buscar dados')
      }
      return response.json()
    },
    refetchInterval: 60000, // Atualizar a cada minuto
    retry: 2,
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

      // Buscar consenso
      const { data: cons } = await supabase
        .from('consensus_analysis')
        .select('*')
        .eq('candle_id', candleId)
        .single()

      if (cons) {
        console.log('Consenso encontrado:', cons)
        setConsensus(cons)
      }
    } catch (error) {
      console.error('Erro ao buscar previsões:', error)
    }
  }

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
          setConsensus(payload.new as ConsensusAnalysis)
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
    
    // Evitar atualizar se for a mesma vela (verificar antes de setar)
    if (currentCandle?.id === newCandle.id && lastAnalyzedCandleId.current === newCandle.id) {
      return
    }

    // Atualizar vela apenas se for diferente
    if (currentCandle?.id !== newCandle.id) {
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
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candleId: newCandle.id,
            pair: newCandle.pair,
          }),
        })

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
      } catch (error) {
        console.error('❌ Erro ao executar análise:', error)
        // Mesmo com erro, tentar buscar previsões existentes
        fetchPredictions(newCandle.id)
      } finally {
        setIsAnalyzing(false)
      }
    }

    // Buscar previsões existentes primeiro
    fetchPredictions(newCandle.id)

    // Evitar análise duplicada para a mesma vela
    if (lastAnalyzedCandleId.current === newCandle.id) {
      console.log('Vela já analisada, pulando...')
      return
    }

    // Sempre executar análise quando uma nova vela chegar
    // Verificar se já existe consenso primeiro (para evitar análise duplicada)
    const checkAndExecuteAnalysis = async () => {
      try {
        const { data, error } = await supabase
          .from('consensus_analysis')
          .select('*')
          .eq('candle_id', newCandle.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao verificar consenso:', error)
        }
        
        // Se não existe consenso OU se não tem previsões suficientes, executar análise
        if (!data || (data.total_strategies < 5)) {
          console.log('Executando análise para vela:', newCandle.id)
          lastAnalyzedCandleId.current = newCandle.id
          await executeAnalysis()
        } else {
          console.log('Consenso já existe com', data.total_strategies, 'estratégias')
          lastAnalyzedCandleId.current = newCandle.id
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
            <p className="text-red-400 font-semibold">Erro ao buscar dados</p>
            <p className="text-red-300 text-sm mt-1">
              {forexError instanceof Error ? forexError.message : 'Erro desconhecido'}
            </p>
            <button
              onClick={() => refetchForex()}
              className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-white text-sm"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            <CandleDisplay candle={currentCandle} isLoading={isLoadingForex} />
            <ConsensusPanel consensus={consensus} isLoading={isLoadingForex} />
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

