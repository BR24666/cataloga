'use client'

import { Target, TrendingUp, TrendingDown, Zap, AlertCircle } from 'lucide-react'
import type { ConsensusAnalysis } from '@/lib/supabase'

interface ConsensusPanelProps {
  consensus: ConsensusAnalysis | null
  isLoading?: boolean
}

// Função para calcular força do sinal
function calculateSignalStrength(total: number, majorityCount: number): 'strong' | 'medium' | 'weak' {
  if (total === 0) return 'weak'
  
  const majorityPercent = (majorityCount / total) * 100
  
  // Sinal forte: 70% ou mais das estratégias concordam
  if (majorityPercent >= 70) return 'strong'
  // Sinal médio: entre 50% e 69%
  if (majorityPercent >= 50) return 'medium'
  // Sinal fraco: menos de 50% das estratégias concordam
  return 'weak'
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
  
  // Calcular força do sinal baseado na maioria
  const majorityCount = Math.max(greenCount, redCount)
  const signalStrength = calculateSignalStrength(total, majorityCount)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">🎯 PREVISÃO PRÓXIMA VELA</h3>
        </div>
        {/* Legenda de força do sinal */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-gray-400">Forte (≥70%)</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-orange-400" />
            <span className="text-gray-400">Médio (50-69%)</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-gray-400" />
            <span className="text-gray-400">Fraco (&lt;50%)</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className={`rounded-lg p-4 border ${
            isGreen && signalStrength === 'strong'
              ? 'bg-green-500/20 border-green-500'
              : isGreen && signalStrength === 'medium'
              ? 'bg-green-500/10 border-green-500/70'
              : 'bg-[#0d2818] border-green-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-sm text-gray-400">Verde</span>
              {isGreen && signalStrength === 'strong' && (
                <Zap className="w-3 h-3 text-yellow-400" />
              )}
            </div>
            <div className="text-2xl font-bold text-green-400">{greenCount}</div>
            <div className="text-xs text-gray-500">estratégias ({greenPercent}%)</div>
            {isGreen && (
              <div className="text-xs mt-1">
                {signalStrength === 'strong' && (
                  <span className="text-yellow-400 font-semibold">✓ Sinal Forte</span>
                )}
                {signalStrength === 'medium' && (
                  <span className="text-orange-400 font-semibold">⚠ Sinal Médio</span>
                )}
                {signalStrength === 'weak' && (
                  <span className="text-gray-400 font-semibold">○ Sinal Fraco</span>
                )}
              </div>
            )}
          </div>

          <div className={`rounded-lg p-4 border ${
            !isGreen && signalStrength === 'strong'
              ? 'bg-red-500/20 border-red-500'
              : !isGreen && signalStrength === 'medium'
              ? 'bg-red-500/10 border-red-500/70'
              : 'bg-[#28180d] border-red-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-sm text-gray-400">Vermelho</span>
              {!isGreen && signalStrength === 'strong' && (
                <Zap className="w-3 h-3 text-yellow-400" />
              )}
            </div>
            <div className="text-2xl font-bold text-red-400">{redCount}</div>
            <div className="text-xs text-gray-500">estratégias ({redPercent}%)</div>
            {!isGreen && (
              <div className="text-xs mt-1">
                {signalStrength === 'strong' && (
                  <span className="text-yellow-400 font-semibold">✓ Sinal Forte</span>
                )}
                {signalStrength === 'medium' && (
                  <span className="text-orange-400 font-semibold">⚠ Sinal Médio</span>
                )}
                {signalStrength === 'weak' && (
                  <span className="text-gray-400 font-semibold">○ Sinal Fraco</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={`border-2 rounded-lg p-4 ${
          isGreen 
            ? signalStrength === 'strong' 
              ? 'bg-green-500/20 border-green-500' 
              : signalStrength === 'medium'
              ? 'bg-green-500/10 border-green-500/70'
              : 'bg-green-500/10 border-green-500/50'
            : signalStrength === 'strong'
            ? 'bg-red-500/20 border-red-500'
            : signalStrength === 'medium'
            ? 'bg-red-500/10 border-red-500/70'
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
          
          {/* Indicador de força do sinal */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {signalStrength === 'strong' ? (
                <>
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-400">SINAL FORTE</span>
                </>
              ) : signalStrength === 'medium' ? (
                <>
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-semibold text-orange-400">SINAL MÉDIO</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-400">SINAL FRACO</span>
                </>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {majorityCount} de {total} estratégias ({confidence}%)
            </div>
          </div>
          
          {/* Barra de força do sinal */}
          <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                signalStrength === 'strong' 
                  ? isGreen ? 'bg-green-500' : 'bg-red-500'
                  : signalStrength === 'medium'
                  ? isGreen ? 'bg-green-400' : 'bg-red-400'
                  : isGreen ? 'bg-green-500/50' : 'bg-red-500/50'
              }`}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

