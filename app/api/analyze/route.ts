import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { STRATEGIES } from '@/lib/strategies'
import type { ForexCandle } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  try {
    const { candleId, pair } = await request.json()

    console.log('📊 ========================================')
    console.log('📊 Iniciando análise - CandleId:', candleId, 'Pair:', pair)
    console.log('📊 ========================================')

    if (!candleId || !pair) {
      console.error('❌ Parâmetros faltando - candleId:', candleId, 'pair:', pair)
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
    const { data: historicalCandles, error: historyError } = await supabase
      .from('forex_candles')
      .select('*')
      .eq('pair', pair)
      .lte('timestamp', currentCandle.timestamp)
      .order('timestamp', { ascending: false })
      .limit(20)

    if (historyError) {
      console.error('Erro ao buscar histórico:', historyError)
    }

    // Se não houver dados históricos suficientes, tentar usar apenas a vela atual
    // Mas precisamos de pelo menos 1 vela para análise básica
    if (!historicalCandles || historicalCandles.length < 1) {
      console.error('❌ Dados históricos insuficientes - Total:', historicalCandles?.length || 0)
      console.log('💡 Dica: Aguarde alguns minutos para que mais velas sejam coletadas')
      return NextResponse.json(
        { 
          error: 'Dados históricos insuficientes. Aguarde mais velas serem coletadas.',
          hint: 'A análise precisa de pelo menos 1 vela histórica. Aguarde 1-2 minutos.',
        },
        { status: 400 }
      )
    }

    // Se tiver apenas 1 vela, algumas estratégias não funcionarão, mas outras sim
    if (historicalCandles.length === 1) {
      console.warn('⚠️ Apenas 1 vela disponível. Algumas estratégias podem não funcionar.')
    }

    console.log('✅ Dados históricos encontrados:', historicalCandles.length, 'velas')

    // Se tiver menos de 3 velas, usar apenas as disponíveis
    // Algumas estratégias podem não funcionar, mas outras sim
    const availableCandles = Math.min(historicalCandles.length, 20)

    // Reverter para ordem cronológica e usar apenas as disponíveis
    const candles = historicalCandles.slice(0, availableCandles).reverse() as ForexCandle[]
    
    console.log(`📊 Analisando com ${candles.length} velas históricas`)
    if (candles.length > 0) {
      console.log(`📅 Timestamps: ${candles[0]?.timestamp} → ${candles[candles.length - 1]?.timestamp}`)
      console.log(`🎨 Cores das últimas 5 velas:`, candles.slice(-5).map(c => c.color).join(', '))
      
      // Verificar se as velas estão na ordem correta (mais antiga → mais recente)
      if (candles.length >= 2) {
        const firstTimestamp = new Date(candles[0].timestamp).getTime()
        const lastTimestamp = new Date(candles[candles.length - 1].timestamp).getTime()
        if (firstTimestamp > lastTimestamp) {
          console.warn('⚠️ ATENÇÃO: Velas podem estar em ordem incorreta!')
        } else {
          console.log('✅ Velas em ordem cronológica correta')
        }
      }
      
      // Verificar distribuição de cores
      const greenCount = candles.filter(c => c.color === 'green').length
      const redCount = candles.filter(c => c.color === 'red').length
      console.log(`📊 Distribuição: ${greenCount} verdes, ${redCount} vermelhas`)
    }

    // Executar análise de cada estratégia
    const predictions = []
    let greenCount = 0
    let redCount = 0
    let strategiesWithPrediction = 0
    let strategiesWithoutPrediction = 0

    console.log(`🔍 Executando ${STRATEGIES.length} estratégias com ${candles.length} velas...`)
    console.log(`📊 Primeiras 3 velas:`, candles.slice(0, 3).map(c => ({
      timestamp: c.timestamp,
      color: c.color,
      open: c.open,
      close: c.close,
      high: c.high,
      low: c.low
    })))

    for (const strategy of STRATEGIES) {
      try {
        const result = strategy.rules(candles)

        if (result.prediction) {
          strategiesWithPrediction++
          console.log(`✅ ${strategy.name}: ${result.prediction} (${result.confidence}%) - ${result.reasoning}`)
          
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

          if (error) {
            console.error(`❌ Erro ao salvar previsão da estratégia ${strategy.name}:`, error)
          } else if (prediction) {
            predictions.push(prediction)
            
            if (result.prediction === 'green') {
              greenCount++
            } else {
              redCount++
            }
            console.log(`💾 Previsão salva: ${strategy.name} -> ${result.prediction}`)
          } else {
            console.warn(`⚠️ Previsão não retornada do banco para ${strategy.name}`)
          }
        } else {
          strategiesWithoutPrediction++
          console.log(`⚪ ${strategy.name}: Sem previsão - ${result.reasoning || 'Padrão não encontrado'}`)
          // Log detalhado para estratégias que não retornam previsão
          if (candles.length >= 2) {
            const last2 = candles.slice(-2)
            console.log(`   📊 Últimas 2 velas: [${last2[0].color}, ${last2[1].color}]`)
          }
        }
      } catch (strategyError) {
        console.error(`❌ Erro na estratégia ${strategy.name}:`, strategyError)
        strategiesWithoutPrediction++
        // Continua com as outras estratégias mesmo se uma falhar
      }
    }

    console.log(`📊 Resumo: ${strategiesWithPrediction} estratégias com previsão, ${strategiesWithoutPrediction} sem previsão`)

    // Calcular consenso (mesmo se total for 0, salvar para indicar que análise foi executada)
    const total = predictions.length
    const consensusPrediction = greenCount > redCount ? 'green' : greenCount < redCount ? 'red' : null
    const consensusConfidence = total > 0 
      ? Math.round((Math.max(greenCount, redCount) / total) * 100)
      : 0

    console.log(`📈 Consenso calculado: ${consensusPrediction || 'indefinido'} (${consensusConfidence}%) - ${greenCount} verdes, ${redCount} vermelhas, ${total} total`)
    
    // Se nenhuma estratégia retornou previsão, logar aviso
    if (total === 0) {
      console.warn('⚠️ Nenhuma estratégia retornou previsão. Isso pode indicar:')
      console.warn('   - Dados históricos insuficientes para padrões')
      console.warn('   - Velas não apresentam padrões reconhecíveis')
      console.warn('   - Estratégias precisam de mais dados históricos')
    }

    // Calcular timestamp de revelação (próxima vela - 1 minuto)
    const currentTimestamp = new Date(currentCandle.timestamp)
    const revealTimestamp = new Date(currentTimestamp.getTime() + 60 * 1000) // +1 minuto

    // Salvar ou atualizar consenso (sempre salvar, mesmo se total for 0)
    console.log(`💾 Salvando consenso no banco...`)
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
      console.error('❌ Erro ao salvar consenso:', consensusError)
    } else if (consensus) {
      console.log(`✅ Consenso salvo com sucesso: ID ${consensus.id}`)
    } else {
      console.warn('⚠️ Consenso não retornado do banco')
    }

    const duration = Date.now() - startTime
    console.log(`✅ Análise concluída em ${duration}ms: ${predictions.length} previsões geradas`)
    console.log(`   🟩 Verdes: ${greenCount} | 🟥 Vermelhas: ${redCount}`)
    console.log(`   📊 Consenso: ${consensusPrediction} (${consensusConfidence}% confiança)`)
    console.log('📊 ========================================')

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
    const duration = Date.now() - startTime
    console.error('❌ ========================================')
    console.error('❌ Erro na análise após', duration, 'ms:', error)
    console.error('❌ Stack:', error.stack)
    console.error('❌ ========================================')
    return NextResponse.json(
      { error: error.message || 'Erro ao executar análise' },
      { status: 500 }
    )
  }
}

