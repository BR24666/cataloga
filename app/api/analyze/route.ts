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
      console.warn('⚠️ ========================================')
      console.warn('⚠️ ATENÇÃO: Apenas 1 vela disponível!')
      console.warn('⚠️ A maioria das estratégias precisa de 2-6 velas para funcionar.')
      console.warn('⚠️ Apenas "Vela de Força" pode funcionar com 1 vela.')
      console.warn('⚠️ Aguarde mais velas serem coletadas (1-2 minutos).')
      console.warn('⚠️ ========================================')
    } else if (historicalCandles.length < 3) {
      console.warn(`⚠️ Apenas ${historicalCandles.length} velas disponíveis.`)
      console.warn('⚠️ Algumas estratégias precisam de 3+ velas para funcionar.')
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

    console.log(`🔍 Executando ${STRATEGIES.length} estratégias (5 selecionadas) com ${candles.length} velas...`)
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
        console.log(`\n🔍 [${strategy.name}] Executando estratégia...`)
        console.log(`   📊 Velas disponíveis: ${candles.length}`)
        
        const result = strategy.rules(candles)
        
        console.log(`   📋 Resultado:`, {
          prediction: result.prediction,
          confidence: result.confidence,
          reasoning: result.reasoning
        })

        if (result.prediction) {
          strategiesWithPrediction++
          console.log(`✅ [${strategy.name}] PREVISÃO: ${result.prediction.toUpperCase()} (${result.confidence}%)`)
          console.log(`   💡 Motivo: ${result.reasoning}`)
          
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
            console.error(`❌ [${strategy.name}] Erro ao salvar previsão:`, error)
            console.error(`   Código: ${error.code}, Mensagem: ${error.message}`)
          } else if (prediction) {
            predictions.push(prediction)
            
            if (result.prediction === 'green') {
              greenCount++
            } else {
              redCount++
            }
            console.log(`💾 [${strategy.name}] Previsão salva no banco: ${result.prediction}`)
          } else {
            console.warn(`⚠️ [${strategy.name}] Previsão não retornada do banco`)
          }
        } else {
          strategiesWithoutPrediction++
          console.log(`⚪ [${strategy.name}] SEM PREVISÃO`)
          console.log(`   📝 Motivo: ${result.reasoning || 'Padrão não encontrado'}`)
          
          // Log detalhado para estratégias que não retornam previsão
          if (candles.length >= 2) {
            const last2 = candles.slice(-2)
            console.log(`   📊 Últimas 2 velas: [${last2[0].color}, ${last2[1].color}]`)
            console.log(`   📊 Valores:`, {
              vela1: { open: last2[0].open, close: last2[0].close, high: last2[0].high, low: last2[0].low },
              vela2: { open: last2[1].open, close: last2[1].close, high: last2[1].high, low: last2[1].low }
            })
          } else {
            console.log(`   ⚠️ Apenas ${candles.length} vela(s) disponível(is) - estratégia precisa de mais dados`)
          }
        }
      } catch (strategyError: any) {
        console.error(`❌ [${strategy.name}] ERRO na estratégia:`, strategyError)
        console.error(`   Stack:`, strategyError.stack)
        strategiesWithoutPrediction++
        // Continua com as outras estratégias mesmo se uma falhar
      }
    }

    console.log(`📊 ========================================`)
    console.log(`📊 RESUMO DA ANÁLISE:`)
    console.log(`📊 Total de estratégias executadas: ${STRATEGIES.length}`)
    console.log(`📊 Estratégias com previsão: ${strategiesWithPrediction}`)
    console.log(`📊 Estratégias sem previsão: ${strategiesWithoutPrediction}`)
    console.log(`📊 Verdes: ${greenCount} | Vermelhas: ${redCount}`)
    console.log(`📊 ========================================`)

    // Calcular consenso (mesmo se total for 0, salvar para indicar que análise foi executada)
    const total = predictions.length
    const consensusPrediction = greenCount > redCount ? 'green' : greenCount < redCount ? 'red' : null
    const consensusConfidence = total > 0 
      ? Math.round((Math.max(greenCount, redCount) / total) * 100)
      : 0

    console.log(`📈 Consenso calculado: ${consensusPrediction || 'indefinido'} (${consensusConfidence}%) - ${greenCount} verdes, ${redCount} vermelhas, ${total} total`)
    
    // Se nenhuma estratégia retornou previsão, logar aviso detalhado
    if (total === 0) {
      console.warn('\n⚠️ ========================================')
      console.warn('⚠️ ATENÇÃO: Nenhuma estratégia retornou previsão!')
      console.warn('⚠️ ========================================')
      console.warn(`📊 Velas disponíveis: ${candles.length}`)
      console.warn(`📊 Estratégias executadas: ${STRATEGIES.length}`)
      console.warn(`📊 Estratégias com previsão: ${strategiesWithPrediction}`)
      console.warn(`📊 Estratégias sem previsão: ${strategiesWithoutPrediction}`)
      console.warn('\n💡 Possíveis causas:')
      console.warn('   1. Dados históricos insuficientes')
      console.warn('      - Engolfo precisa de 2+ velas')
      console.warn('      - Três Soldados precisa de 3+ velas')
      console.warn('      - Três Vales/Picos precisa de 6+ velas')
      console.warn('      - MHI precisa de 3+ velas')
      console.warn('   2. Velas não apresentam padrões reconhecíveis')
      console.warn('      - Vela de Força só funciona se a vela tiver corpo > 70% do range')
      console.warn('   3. Aguarde mais velas serem coletadas (1-2 minutos)')
      console.warn('\n✅ Isso é NORMAL no início!')
      console.warn('   O sistema precisa de histórico para identificar padrões.')
      console.warn('   Aguarde alguns minutos e as previsões começarão a aparecer.')
      console.warn('⚠️ ========================================\n')
    } else if (total < 5) {
      console.warn(`\n⚠️ Apenas ${total} de 5 estratégias retornaram previsão`)
      console.warn(`⚠️ ${strategiesWithoutPrediction} estratégias não identificaram padrões`)
      console.warn(`💡 Isso é normal - nem sempre há padrões em todas as estratégias\n`)
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

