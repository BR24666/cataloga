'use client'

import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { StrategyPrediction } from '@/lib/supabase'

interface StrategiesListProps {
  predictions: StrategyPrediction[]
  isLoading?: boolean
}

export default function StrategiesList({ predictions, isLoading }: StrategiesListProps) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Estratégias</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (predictions.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Estratégias (5 total)</h3>
        <div className="space-y-3">
          <p className="text-gray-400">Aguardando análise das estratégias...</p>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-200">
            <p className="font-semibold mb-2">📊 Por que não há previsões?</p>
            <p className="mb-2">As estratégias precisam de histórico para funcionar:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
              <li><strong>Vela de Força:</strong> 1 vela (mas só se for &quot;forte&quot;)</li>
              <li><strong>Engolfo:</strong> 2+ velas</li>
              <li><strong>Três Soldados:</strong> 3+ velas</li>
              <li><strong>MHI:</strong> 3+ velas</li>
              <li><strong>Três Vales/Picos:</strong> 6+ velas</li>
            </ul>
            <p className="mt-2 text-xs font-semibold">
              ⏳ Aguarde 1-2 minutos para coletar mais velas!
            </p>
            <p className="mt-1 text-xs text-blue-300">
              Quando 2 estratégias discordam e 3 não dão sinal, o consenso será <strong>INDEFINIDO</strong>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const totalStrategies = 5
  const strategiesWithoutPrediction = totalStrategies - predictions.length

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Estratégias</h3>
        <span className="text-xs text-gray-400">
          {predictions.length} de {totalStrategies} com previsão
        </span>
      </div>
      <div className="space-y-3">
        {predictions.map((prediction) => {
          const isGreen = prediction.prediction === 'green'
          const confidence = Math.round(prediction.confidence)

          return (
            <div
              key={prediction.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isGreen
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {isGreen ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <div className="font-semibold">{prediction.strategy_name}</div>
                  {prediction.reasoning && (
                    <div className="text-xs text-gray-400 mt-1">
                      {prediction.reasoning}
                    </div>
                  )}
                </div>
              </div>
              <div className={`font-bold ${
                isGreen ? 'text-green-400' : 'text-red-400'
              }`}>
                {isGreen ? '🟩 Verde' : '🟥 Vermelho'} ({confidence}%)
              </div>
            </div>
          )
        })}
        
        {/* Mostrar estratégias sem previsão */}
        {strategiesWithoutPrediction > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-2">
              {strategiesWithoutPrediction} estratégia{strategiesWithoutPrediction > 1 ? 's' : ''} sem previsão:
            </p>
            <div className="space-y-2">
              {Array.from({ length: strategiesWithoutPrediction }).map((_, index) => (
                <div
                  key={`no-prediction-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-gray-500/5 border-gray-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gray-500/30 flex items-center justify-center">
                      <span className="text-xs text-gray-400">-</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-500">Estratégia sem padrão identificado</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Não foi possível identificar um padrão nas velas atuais
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-500 text-sm">Sem sinal</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

