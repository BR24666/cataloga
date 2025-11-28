'use client'

import { useState, useEffect } from 'react'
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

  // Buscar dados do Forex
  const { data: forexData, isLoading: isLoadingForex, refetch: refetchForex } = useQuery({
    queryKey: ['forex', selectedPair],
    queryFn: async () => {
      const response = await fetch(`/api/forex?pair=${selectedPair}`)
      if (!response.ok) throw new Error('Erro ao buscar dados')
      return response.json()
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  })

  // Buscar previsões e consenso
  useEffect(() => {
    if (!currentCandle) return

    const fetchPredictions = async () => {
      // Buscar previsões
      const { data: preds } = await supabase
        .from('strategy_predictions')
        .select('*')
        .eq('candle_id', currentCandle.id)
        .order('confidence', { ascending: false })

      if (preds) setPredictions(preds)

      // Buscar consenso
      const { data: cons } = await supabase
        .from('consensus_analysis')
        .select('*')
        .eq('candle_id', currentCandle.id)
        .single()

      if (cons) setConsensus(cons)
    }

    fetchPredictions()

    // Escutar novas previsões em tempo real
    const predictionsChannel = supabase
      .channel('predictions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'strategy_predictions',
          filter: `candle_id=eq.${currentCandle.id}`,
        },
        () => {
          fetchPredictions()
        }
      )
      .subscribe()

    const consensusChannel = supabase
      .channel('consensus')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consensus_analysis',
          filter: `candle_id=eq.${currentCandle.id}`,
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
  }, [currentCandle])

  // Atualizar vela atual quando os dados chegarem e executar análise
  useEffect(() => {
    if (forexData?.candle) {
      const newCandle = forexData.candle as ForexCandle
      setCurrentCandle(newCandle)

      // Executar análise automaticamente quando uma nova vela chegar
      const executeAnalysis = async () => {
        try {
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

          if (response.ok) {
            // Análise executada com sucesso
            // As previsões serão atualizadas via realtime
          }
        } catch (error) {
          console.error('Erro ao executar análise:', error)
        }
      }

      // Verificar se já existe consenso para esta vela
      supabase
        .from('consensus_analysis')
        .select('*')
        .eq('candle_id', newCandle.id)
        .single()
        .then(({ data }) => {
          // Se não existe consenso, executar análise
          if (!data) {
            executeAnalysis()
          }
        })
    }
  }, [forexData])

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
          <button
            onClick={() => refetchForex()}
            disabled={isLoadingForex}
            className="card flex items-center gap-2 hover:bg-[#252525] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingForex ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Seletor de Par */}
        <div className="flex items-center gap-4">
          <span className="text-gray-400">PAR:</span>
          <PairSelector
            selectedPair={selectedPair}
            onPairChange={setSelectedPair}
          />
        </div>

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

