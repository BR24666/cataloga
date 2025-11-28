import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { supabase } from '@/lib/supabase'

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY
const ALPHA_VANTAGE_BASE_URL = 'https://alpha-vantage.p.rapidapi.com'

// Mapeamento de pares para símbolos Alpha Vantage
const PAIR_SYMBOLS: Record<string, string> = {
  'EUR/USD': 'EURUSD',
  'GBP/USD': 'GBPUSD',
  'USD/CHF': 'USDCHF',
  'USD/JPY': 'USDJPY',
  'AUD/USD': 'AUDUSD',
  'USD/CAD': 'USDCAD',
  'NZD/USD': 'NZDUSD',
  'EUR/GBP': 'EURGBP',
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pair = searchParams.get('pair') || 'EUR/USD'
    const symbol = PAIR_SYMBOLS[pair]

    if (!symbol) {
      return NextResponse.json(
        { error: 'Par de moeda não suportado' },
        { status: 400 }
      )
    }

    if (!ALPHA_VANTAGE_API_KEY) {
      return NextResponse.json(
        { error: 'API key não configurada' },
        { status: 500 }
      )
    }

    // Extrair símbolos (ex: EURUSD -> EUR e USD)
    const fromSymbol = symbol.substring(0, 3)
    const toSymbol = symbol.substring(3)

    // Buscar dados do Alpha Vantage
    const response = await axios.get(
      `${ALPHA_VANTAGE_BASE_URL}/query`,
      {
        params: {
          function: 'FX_INTRADAY',
          from_symbol: fromSymbol,
          to_symbol: toSymbol,
          interval: '1min',
          datatype: 'json',
        },
        headers: {
          'X-RapidAPI-Key': ALPHA_VANTAGE_API_KEY,
          'X-RapidAPI-Host': 'alpha-vantage.p.rapidapi.com',
        },
      }
    )

    const data = response.data

    console.log('📡 Resposta Alpha Vantage:', {
      hasError: !!data['Error Message'],
      hasNote: !!data['Note'],
      hasTimeSeries: !!data['Time Series FX (1min)'],
      keys: Object.keys(data).slice(0, 5),
    })

    if (data['Error Message'] || data['Note']) {
      const errorMsg = data['Error Message'] || data['Note'] || 'Limite de requisições atingido'
      console.error('❌ Erro Alpha Vantage:', errorMsg)
      
      // Se for limite de requisições, retornar erro específico
      if (errorMsg.includes('API call frequency') || errorMsg.includes('Thank you for using Alpha Vantage')) {
        return NextResponse.json(
          { 
            error: 'Limite de requisições da API Alpha Vantage atingido. Aguarde alguns minutos antes de tentar novamente.',
            code: 'RATE_LIMIT',
          },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: errorMsg },
        { status: 429 }
      )
    }

    const timeSeries = data['Time Series FX (1min)']
    if (!timeSeries) {
      console.error('❌ Time Series não encontrado. Dados recebidos:', Object.keys(data))
      return NextResponse.json(
        { error: 'Dados não disponíveis da API. Verifique se o mercado está aberto.' },
        { status: 404 }
      )
    }

    console.log('✅ Time Series encontrado com', Object.keys(timeSeries).length, 'velas')

    // Pegar a vela mais recente
    const timestamps = Object.keys(timeSeries).sort().reverse()
    const latestTimestamp = timestamps[0]
    const latestCandle = timeSeries[latestTimestamp]

    const candle = {
      pair,
      timestamp: latestTimestamp,
      open: parseFloat(latestCandle['1. open']),
      high: parseFloat(latestCandle['2. high']),
      low: parseFloat(latestCandle['3. low']),
      close: parseFloat(latestCandle['4. close']),
      color: parseFloat(latestCandle['4. close']) >= parseFloat(latestCandle['1. open']) ? 'green' : 'red' as 'green' | 'red',
    }

    // Salvar no Supabase
    console.log('💾 Salvando vela no Supabase:', {
      pair: candle.pair,
      timestamp: candle.timestamp,
      color: candle.color,
      values: {
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      },
    })

    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Variáveis de ambiente do Supabase não configuradas')
      return NextResponse.json(
        { 
          error: 'Configuração do banco de dados não encontrada. Verifique as variáveis de ambiente.',
          code: 'MISSING_ENV',
        },
        { status: 500 }
      )
    }

    // Converter timestamp para formato ISO se necessário
    let timestampValue = candle.timestamp
    try {
      // Tentar converter para ISO se não estiver no formato correto
      const date = new Date(candle.timestamp)
      if (!isNaN(date.getTime())) {
        timestampValue = date.toISOString()
      }
    } catch (e) {
      console.warn('⚠️ Erro ao converter timestamp:', e)
    }

    const { data: savedCandle, error: dbError } = await supabase
      .from('forex_candles')
      .upsert({
        pair: candle.pair,
        timestamp: timestampValue,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        color: candle.color,
      }, {
        onConflict: 'pair,timestamp',
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Erro ao salvar vela no Supabase:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
      })
      
      // Mensagem mais específica baseada no código do erro
      let errorMessage = 'Erro ao salvar vela no banco de dados.'
      let errorCode = 'DB_ERROR'
      
      if (dbError.code === '23505') {
        errorMessage = 'Vela já existe no banco (conflito de chave única).'
        errorCode = 'DUPLICATE_KEY'
      } else if (dbError.code === '23503') {
        errorMessage = 'Erro de integridade referencial. Verifique as configurações do banco.'
        errorCode = 'FOREIGN_KEY_VIOLATION'
      } else if (dbError.code === '42501') {
        errorMessage = 'Permissão negada. Verifique as políticas RLS (Row Level Security) do Supabase.'
        errorCode = 'PERMISSION_DENIED'
      } else if (dbError.message?.includes('relation') || dbError.message?.includes('does not exist')) {
        errorMessage = 'Tabela não encontrada. Verifique se a tabela forex_candles existe no banco.'
        errorCode = 'TABLE_NOT_FOUND'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          code: errorCode,
          details: dbError.message,
          hint: dbError.hint || 'Verifique as configurações do Supabase e as políticas RLS.',
        },
        { status: 500 }
      )
    }

    console.log('✅ Vela salva com sucesso. ID:', savedCandle?.id)

    return NextResponse.json({
      candle: savedCandle || candle,
      historical: timestamps.slice(0, 100).map(ts => ({
        timestamp: ts,
        open: parseFloat(timeSeries[ts]['1. open']),
        high: parseFloat(timeSeries[ts]['2. high']),
        low: parseFloat(timeSeries[ts]['3. low']),
        close: parseFloat(timeSeries[ts]['4. close']),
      })),
    })
  } catch (error: any) {
    console.error('Erro na API Forex:', error)
    
    // Verificar se é erro 429 do axios
    if (error.response?.status === 429 || error.message?.includes('429')) {
      return NextResponse.json(
        { 
          error: 'Limite de requisições da API Alpha Vantage atingido. Aguarde alguns minutos.',
          code: 'RATE_LIMIT',
        },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao buscar dados',
        details: error.response?.data || error.stack,
      },
      { status: error.response?.status || 500 }
    )
  }
}

