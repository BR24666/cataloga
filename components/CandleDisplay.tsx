'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { ForexCandle } from '@/lib/supabase'

interface CandleDisplayProps {
  candle: ForexCandle | null
  isLoading?: boolean
}

export default function CandleDisplay({ candle, isLoading }: CandleDisplayProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-8 bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!candle) {
    return (
      <div className="card">
        <p className="text-gray-400">Nenhuma vela disponível</p>
      </div>
    )
  }

  const timestamp = new Date(candle.timestamp)
  const isGreen = candle.color === 'green'
  const change = candle.close - candle.open
  const changePercent = ((change / candle.open) * 100).toFixed(4)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm text-gray-400">Vela Atual</h3>
        <span className="text-xs text-gray-500">
          {format(timestamp, "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Abertura (O)</div>
          <div className="text-lg font-semibold">{candle.open.toFixed(5)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Máxima (H)</div>
          <div className="text-lg font-semibold text-green-400">
            {candle.high.toFixed(5)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Mínima (L)</div>
          <div className="text-lg font-semibold text-red-400">
            {candle.low.toFixed(5)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Fechamento (C)</div>
          <div className={`text-lg font-semibold flex items-center gap-1 ${
            isGreen ? 'text-green-400' : 'text-red-400'
          }`}>
            {isGreen ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {candle.close.toFixed(5)}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Variação</span>
          <div className={`flex items-center gap-2 font-semibold ${
            isGreen ? 'text-green-400' : 'text-red-400'
          }`}>
            {isGreen ? '+' : ''}{change.toFixed(5)} ({isGreen ? '+' : ''}{changePercent}%)
          </div>
        </div>
      </div>
    </div>
  )
}

