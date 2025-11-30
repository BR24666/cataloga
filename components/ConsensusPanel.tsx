'use client'

import { Target, TrendingUp, TrendingDown, Zap, AlertCircle } from 'lucide-react'
import type { ConsensusAnalysis } from '@/lib/supabase'

interface ConsensusPanelProps {
  consensus: ConsensusAnalysis | null
  isLoading?: boolean
  isAnalyzing?: boolean
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

export default function ConsensusPanel({ consensus, isLoading, isAnalyzing }: ConsensusPanelProps) {
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
        <div className="space-y-3">
          {isAnalyzing ? (
            <>
              <p className="text-blue-400 font-semibold">🔄 Analisando estratégias...</p>
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Executando análise automática das 10 estratégias...</span>
              </div>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-200">
                <p className="font-semibold mb-1">⏳ Processando:</p>
                <p>As estratégias estão sendo executadas. Isso pode levar alguns segundos.</p>
                <p className="mt-2">Aguarde enquanto analisamos os padrões das velas...</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-400">Aguardando análise das estratégias...</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                <span>Nenhuma análise em andamento</span>
              </div>
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-200">
                <p className="font-semibold mb-1">💡 Dica:</p>
                <p>As estratégias precisam identificar padrões nas velas. Se não houver padrões claros, nenhuma previsão será gerada.</p>
                <p className="mt-2">A análise será executada automaticamente quando uma nova vela chegar.</p>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  const total = consensus.total_strategies
  const greenCount = consensus.green_predictions
  const redCount = consensus.red_predictions
  const totalStrategies = 5 // Total de estratégias configuradas
  const strategiesWithoutPrediction = totalStrategies - total // Estratégias que não deram sinal
  const greenPercent = totalStrategies > 0 ? Math.round((greenCount / totalStrategies) * 100) : 0
  const redPercent = totalStrategies > 0 ? Math.round((redCount / totalStrategies) * 100) : 0
  const neutralPercent = totalStrategies > 0 ? Math.round((strategiesWithoutPrediction / totalStrategies) * 100) : 0
  const isGreen = consensus.consensus_prediction === 'green'
  const confidence = consensus.consensus_confidence || 0
  
  // Calcular força do sinal baseado na maioria
  const majorityCount = Math.max(greenCount, redCount)
  const signalStrength = calculateSignalStrength(total, majorityCount)
  
  // Detectar situação especial: 2 discordam e 3 não falam nada
  const isDiscordantWithNeutrals = total === 2 && greenCount === 1 && redCount === 1 && strategiesWithoutPrediction === 3

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
        {/* Alerta especial quando 2 discordam e 3 não falam nada */}
        {isDiscordantWithNeutrals && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold text-yellow-400">⚠️ SITUAÇÃO ESPECIAL</span>
            </div>
            <p className="text-sm text-yellow-200">
              <strong>2 estratégias discordam</strong> (1 verde vs 1 vermelho) e <strong>3 estratégias não deram sinal</strong>.
            </p>
            <p className="text-xs text-yellow-300 mt-2">
              Neste caso, o consenso é <strong>indefinido</strong> - não há maioria clara.
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
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
            <div className="text-xs text-gray-500">de {totalStrategies} ({greenPercent}%)</div>
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
            <div className="text-xs text-gray-500">de {totalStrategies} ({redPercent}%)</div>
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

          <div className="rounded-lg p-4 border bg-gray-500/10 border-gray-500/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm text-gray-400">Sem Sinal</span>
            </div>
            <div className="text-2xl font-bold text-gray-400">{strategiesWithoutPrediction}</div>
            <div className="text-xs text-gray-500">de {totalStrategies} ({neutralPercent}%)</div>
            {strategiesWithoutPrediction > 0 && (
              <div className="text-xs mt-1 text-gray-400">
                Estratégias sem padrão identificado
              </div>
            )}
          </div>
        </div>

        <div className={`border-2 rounded-lg p-4 ${
          isDiscordantWithNeutrals
            ? 'bg-yellow-500/10 border-yellow-500/50'
            : isGreen 
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
            {isDiscordantWithNeutrals ? (
              <div className="flex items-center gap-2 font-bold text-lg text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                INDEFINIDO
              </div>
            ) : (
              <div className={`flex items-center gap-2 font-bold text-lg ${
                isGreen ? 'text-green-400' : 'text-red-400'
              }`}>
                {isGreen ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {isGreen ? 'VERDE' : 'VERMELHO'}
              </div>
            )}
          </div>
          
          {/* Indicador de força do sinal */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {isDiscordantWithNeutrals ? (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-400">SEM CONSENSO</span>
                </>
              ) : signalStrength === 'strong' ? (
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
              {total > 0 ? `${majorityCount} de ${total} estratégias (${confidence}%)` : 'Nenhuma estratégia deu sinal'}
            </div>
          </div>
          
          {/* Barra de força do sinal */}
          {!isDiscordantWithNeutrals && (
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
          )}
        </div>
      </div>
    </div>
  )
}

