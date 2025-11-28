'use client'

import { Target, TrendingUp, TrendingDown } from 'lucide-react'
import type { ConsensusAnalysis } from '@/lib/supabase'

interface ConsensusPanelProps {
  consensus: ConsensusAnalysis | null
  isLoading?: boolean
}

export default function ConsensusPanel({ consensus, isLoading }: ConsensusPanelProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/2"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!consensus) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">🎯 PREVISÃO PRÓXIMA VELA</h3>
        </div>
        <p className="text-gray-400">Aguardando análise das estratégias...</p>
      </div>
    )
  }

  const total = consensus.total_strategies
  const greenCount = consensus.green_predictions
  const redCount = consensus.red_predictions
  const greenPercent = total > 0 ? Math.round((greenCount / total) * 100) : 0
  const redPercent = total > 0 ? Math.round((redCount / total) * 100) : 0
  const isGreen = consensus.consensus_prediction === 'green'
  const confidence = consensus.consensus_confidence || 0

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold">🎯 PREVISÃO PRÓXIMA VELA</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0d2818] border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-sm text-gray-400">Verde</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{greenCount}</div>
            <div className="text-xs text-gray-500">estratégias ({greenPercent}%)</div>
          </div>

          <div className="bg-[#28180d] border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-sm text-gray-400">Vermelho</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{redCount}</div>
            <div className="text-xs text-gray-500">estratégias ({redPercent}%)</div>
          </div>
        </div>

        <div className={`border-2 rounded-lg p-4 ${
          isGreen 
            ? 'bg-green-500/10 border-green-500/50' 
            : 'bg-red-500/10 border-red-500/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Consenso:</span>
            <div className={`flex items-center gap-2 font-bold text-lg ${
              isGreen ? 'text-green-400' : 'text-red-400'
            }`}>
              {isGreen ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {isGreen ? 'VERDE' : 'VERMELHO'}
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {confidence}% de confiança
          </div>
        </div>
      </div>
    </div>
  )
}

