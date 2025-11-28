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
        <h3 className="text-lg font-semibold mb-4">Estratégias</h3>
        <p className="text-gray-400">Nenhuma previsão disponível ainda</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Estratégias</h3>
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
      </div>
    </div>
  )
}

