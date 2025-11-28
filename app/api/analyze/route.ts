import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { STRATEGIES } from '@/lib/strategies'
import type { ForexCandle } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { candleId, pair } = await request.json()

    if (!candleId || !pair) {
      return NextResponse.json(
        { error: 'candleId e pair são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar vela atual e históricas
    const { data: currentCandle } = await supabase
      .from('forex_candles')
      .select('*')
      .eq('id', candleId)
      .single()

    if (!currentCandle) {
      return NextResponse.json(
        { error: 'Vela não encontrada' },
        { status: 404 }
      )
    }

    // Buscar últimas 20 velas para análise
    const { data: historicalCandles } = await supabase
      .from('forex_candles')
      .select('*')
      .eq('pair', pair)
      .lte('timestamp', currentCandle.timestamp)
      .order('timestamp', { ascending: false })
      .limit(20)

    if (!historicalCandles || historicalCandles.length < 3) {
      return NextResponse.json(
        { error: 'Dados históricos insuficientes' },
        { status: 400 }
      )
    }

    // Reverter para ordem cronológica
    const candles = historicalCandles.reverse() as ForexCandle[]

    // Executar análise de cada estratégia
    const predictions = []
    let greenCount = 0
    let redCount = 0

    for (const strategy of STRATEGIES) {
      const result = strategy.rules(candles)

      if (result.prediction) {
        // Salvar previsão no banco
        const { data: prediction, error } = await supabase
          .from('strategy_predictions')
          .upsert({
            candle_id: candleId,
            pair,
            timestamp: currentCandle.timestamp,
            strategy_name: strategy.name,
            prediction: result.prediction,
            confidence: result.confidence,
            reasoning: result.reasoning,
          }, {
            onConflict: 'candle_id,strategy_name',
          })
          .select()
          .single()

        if (!error && prediction) {
          predictions.push(prediction)
          
          if (result.prediction === 'green') {
            greenCount++
          } else {
            redCount++
          }
        }
      }
    }

    // Calcular consenso
    const total = predictions.length
    const consensusPrediction = greenCount > redCount ? 'green' : greenCount < redCount ? 'red' : null
    const consensusConfidence = total > 0 
      ? Math.round((Math.max(greenCount, redCount) / total) * 100)
      : 0

    // Calcular timestamp de revelação (próxima vela - 1 minuto)
    const currentTimestamp = new Date(currentCandle.timestamp)
    const revealTimestamp = new Date(currentTimestamp.getTime() + 60 * 1000) // +1 minuto

    // Salvar ou atualizar consenso
    const { data: consensus, error: consensusError } = await supabase
      .from('consensus_analysis')
      .upsert({
        candle_id: candleId,
        pair,
        entry_timestamp: currentCandle.timestamp,
        reveal_timestamp: revealTimestamp.toISOString(),
        total_strategies: total,
        green_predictions: greenCount,
        red_predictions: redCount,
        consensus_prediction: consensusPrediction,
        consensus_confidence: consensusConfidence,
        actual_color: null,
        result: null,
      }, {
        onConflict: 'candle_id',
      })
      .select()
      .single()

    if (consensusError) {
      console.error('Erro ao salvar consenso:', consensusError)
    }

    return NextResponse.json({
      success: true,
      predictions: predictions.length,
      consensus: {
        total,
        green: greenCount,
        red: redCount,
        prediction: consensusPrediction,
        confidence: consensusConfidence,
      },
    })
  } catch (error: any) {
    console.error('Erro na análise:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao executar análise' },
      { status: 500 }
    )
  }
}

