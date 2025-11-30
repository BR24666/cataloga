import type { ForexCandle } from './supabase'

export interface Strategy {
  id: string
  name: string
  description: string
  winrate: number
  bestHour: number
  bestDay: number // 0 = domingo, 6 = sábado
  rules: (candles: ForexCandle[]) => {
    prediction: 'green' | 'red' | null
    confidence: number
    reasoning: string | null
  }
}

// Funções auxiliares
function getCandleBody(candle: ForexCandle): number {
  return Math.abs(candle.close - candle.open)
}

function getCandleWickUpper(candle: ForexCandle): number {
  return candle.high - Math.max(candle.open, candle.close)
}

function getCandleWickLower(candle: ForexCandle): number {
  return Math.min(candle.open, candle.close) - candle.low
}

function isDoji(candle: ForexCandle): boolean {
  const body = getCandleBody(candle)
  const totalRange = candle.high - candle.low
  return totalRange > 0 && body / totalRange < 0.1 // Corpo menor que 10% do range
}

function isStrongCandle(candle: ForexCandle): boolean {
  const body = getCandleBody(candle)
  const totalRange = candle.high - candle.low
  return totalRange > 0 && body / totalRange > 0.7 // Corpo maior que 70% do range
}

function getCurrentHour(): number {
  return new Date().getHours()
}

function getCurrentDay(): number {
  return new Date().getDay()
}

function calculateTimeBonus(strategy: Strategy): number {
  const currentHour = getCurrentHour()
  const currentDay = getCurrentDay()
  const hourDiff = Math.abs(currentHour - strategy.bestHour)
  const dayDiff = Math.abs(currentDay - strategy.bestDay)
  
  // Bônus máximo de 5% se estiver no horário/dia ideal
  const hourBonus = hourDiff === 0 ? 5 : Math.max(0, 5 - hourDiff * 0.5)
  const dayBonus = dayDiff === 0 ? 3 : Math.max(0, 3 - dayDiff * 0.5)
  
  return hourBonus + dayBonus
}

// ESTRATÉGIA 1: Engolfo de Cor Única (92.9%)
function engulfingStrategy(candles: ForexCandle[]): { prediction: 'green' | 'red' | null, confidence: number, reasoning: string | null } {
  if (candles.length < 2) return { prediction: null, confidence: 0, reasoning: 'Dados insuficientes' }
  
  const current = candles[candles.length - 1]
  const previous = candles[candles.length - 2]
  
  // Verifica se a vela atual engolfa a anterior
  const currentBody = getCandleBody(current)
  const previousBody = getCandleBody(previous)
  
  // Engolfo de alta: vela verde que engolfa a anterior (open < previous.open e close > previous.close)
  const bullishEngulf = current.color === 'green' && 
                        current.open < previous.open && 
                        current.close > previous.close &&
                        current.color === previous.color
  
  // Engolfo de baixa: vela vermelha que engolfa a anterior (open > previous.open e close < previous.close)
  const bearishEngulf = current.color === 'red' && 
                        current.open > previous.open && 
                        current.close < previous.close &&
                        current.color === previous.color
  
  if ((bullishEngulf || bearishEngulf) && currentBody > previousBody) {
    const baseConfidence = 92.9
    const timeBonus = calculateTimeBonus(STRATEGIES[0])
    return {
      prediction: current.color,
      confidence: Math.min(100, baseConfidence + timeBonus),
      reasoning: `Engolfo de ${current.color === 'green' ? 'alta' : 'baixa'} confirmado. Vela atual engolfa a anterior mantendo a tendência.`
    }
  }
  
  return { prediction: null, confidence: 0, reasoning: 'Padrão de engolfo não identificado' }
}

// ESTRATÉGIA 2: Três Soldados Brancos (92.0%)
function threeWhiteSoldiersStrategy(candles: ForexCandle[]): { prediction: 'green' | 'red' | null, confidence: number, reasoning: string | null } {
  if (candles.length < 3) return { prediction: null, confidence: 0, reasoning: 'Dados insuficientes' }
  
  const last3 = candles.slice(-3)
  const allGreen = last3.every(c => c.color === 'green')
  const allStrong = last3.every(c => isStrongCandle(c))
  
  if (allGreen && allStrong) {
    const baseConfidence = 92.0
    const timeBonus = calculateTimeBonus(STRATEGIES[1])
    return {
      prediction: 'green',
      confidence: Math.min(100, baseConfidence + timeBonus),
      reasoning: 'Três soldados brancos identificados: três velas verdes fortes consecutivas indicando reversão de baixa para alta.'
    }
  }
  
  return { prediction: null, confidence: 0, reasoning: 'Padrão de três soldados não identificado' }
}

// ESTRATÉGIA 3: Vela de Força (90.9%)
function strongCandleStrategy(candles: ForexCandle[]): { prediction: 'green' | 'red' | null, confidence: number, reasoning: string | null } {
  if (candles.length < 1) return { prediction: null, confidence: 0, reasoning: 'Dados insuficientes' }
  
  const current = candles[candles.length - 1]
  
  if (isStrongCandle(current)) {
    const baseConfidence = 90.9
    const timeBonus = calculateTimeBonus(STRATEGIES[2])
    return {
      prediction: current.color,
      confidence: Math.min(100, baseConfidence + timeBonus),
      reasoning: `Vela de força ${current.color === 'green' ? 'verde' : 'vermelha'} identificada. Corpo grande com pavio curto indica continuidade da tendência.`
    }
  }
  
  return { prediction: null, confidence: 0, reasoning: 'Vela de força não identificada' }
}

// ESTRATÉGIA 4: Três Vales/Picos (85.7%)
function threeValleysPeaksStrategy(candles: ForexCandle[]): { prediction: 'green' | 'red' | null, confidence: number, reasoning: string | null } {
  if (candles.length < 6) return { prediction: null, confidence: 0, reasoning: 'Dados insuficientes' }
  
  const recent = candles.slice(-6)
  const lows = recent.map(c => c.low)
  const highs = recent.map(c => c.high)
  
  // Verifica três vales ascendentes
  const valley1 = Math.min(...lows.slice(0, 2))
  const valley2 = Math.min(...lows.slice(2, 4))
  const valley3 = Math.min(...lows.slice(4, 6))
  
  if (valley1 < valley2 && valley2 < valley3) {
    const baseConfidence = 85.7
    const timeBonus = calculateTimeBonus(STRATEGIES[3])
    return {
      prediction: 'green',
      confidence: Math.min(100, baseConfidence + timeBonus),
      reasoning: 'Três vales ascendentes identificados. Padrão de reversão de baixa para alta.'
    }
  }
  
  // Verifica três picos descendentes
  const peak1 = Math.max(...highs.slice(0, 2))
  const peak2 = Math.max(...highs.slice(2, 4))
  const peak3 = Math.max(...highs.slice(4, 6))
  
  if (peak1 > peak2 && peak2 > peak3) {
    const baseConfidence = 85.7
    const timeBonus = calculateTimeBonus(STRATEGIES[3])
    return {
      prediction: 'red',
      confidence: Math.min(100, baseConfidence + timeBonus),
      reasoning: 'Três picos descendentes identificados. Padrão de reversão de alta para baixa.'
    }
  }
  
  return { prediction: null, confidence: 0, reasoning: 'Padrão de três vales/picos não identificado' }
}

// ESTRATÉGIA 5: MHI (85.0%)
function mhiStrategy(candles: ForexCandle[]): { prediction: 'green' | 'red' | null, confidence: number, reasoning: string | null } {
  if (candles.length < 3) return { prediction: null, confidence: 0, reasoning: 'Dados insuficientes' }
  
  const last3 = candles.slice(-3)
  const greenCount = last3.filter(c => c.color === 'green').length
  const redCount = last3.filter(c => c.color === 'red').length
  
  if (greenCount >= 2) {
    const baseConfidence = 85.0
    const timeBonus = calculateTimeBonus(STRATEGIES[4])
    return {
      prediction: 'red',
      confidence: Math.min(100, baseConfidence + timeBonus),
      reasoning: `MHI: ${greenCount} verdes nas últimas 3 velas. Entrada na cor oposta (vermelho).`
    }
  }
  
  if (redCount >= 2) {
    const baseConfidence = 85.0
    const timeBonus = calculateTimeBonus(STRATEGIES[4])
    return {
      prediction: 'green',
      confidence: Math.min(100, baseConfidence + timeBonus),
      reasoning: `MHI: ${redCount} vermelhas nas últimas 3 velas. Entrada na cor oposta (verde).`
    }
  }
  
  return { prediction: null, confidence: 0, reasoning: 'Padrão MHI não identificado (velas balanceadas)' }
}

// ESTRATÉGIA 6: Reversão Pós-Doji (84.2%)
function dojiReversalStrategy(candles: ForexCandle[]): { prediction: 'green' | 'red' | null, confidence: number, reasoning: string | null } {
  if (candles.length < 2) return { prediction: null, confidence: 0, reasoning: 'Dados insuficientes' }
  
  const previous = candles[candles.length - 2]
  const current = candles[candles.length - 1]
  
  if (isDoji(previous)) {
    // Entra na direção contrária da vela após o Doji
    const baseConfidence = 84.2
    const timeBonus = calculateTimeBonus(STRATEGIES[5])
    const prediction = current.color === 'green' ? 'red' : 'green'
    return {
      prediction,
      confidence: Math.min(100, baseConfidence + timeBonus),
      reasoning: `Doji identificado na vela anterior. Reversão esperada na direção contrária à vela atual (${prediction}).`
    }
  }
  
  return { prediction: null, confidence: 0, reasoning: 'Doji não identificado' }
}

// ESTRATÉGIA 7: Minoria (80.0%)
function minorityStrategy(candles: ForexCandle[]): { prediction: 'green' | 'red' | null, confidence: number, reasoning: string | null } {
  if (candles.length < 3) return { prediction: null, confidence: 0, reasoning: 'Dados insuficientes' }
  
  const last3 = candles.slice(-3)
  const greenCount = last3.filter(c => c.color === 'green').length
  const redCount = last3.filter(c => c.color === 'red').length
  
  if (greenCount === 1 && redCount === 2) {
    const baseConfidence = 80.0
    const timeBonus = calculateTimeBonus(STRATEGIES[6])
    return {
      prediction: 'green',
      confidence: Math.min(100, baseConfidence + timeBonus),
      reasoning: 'Minoria: 1 verde e 2 vermelhas. Entrada a favor da minoria (verde).'
    }
  }
  
  if (redCount === 1 && greenCount === 2) {
    const baseConfidence = 80.0
    const timeBonus = calculateTimeBonus(STRATEGIES[6])
    return {
      prediction: 'red',
      confidence: Math.min(100, baseConfidence + timeBonus),
      reasoning: 'Minoria: 1 vermelha e 2 verdes. Entrada a favor da minoria (vermelho).'
    }
  }
  
  return { prediction: null, confidence: 0, reasoning: 'Padrão de minoria não identificado' }
}

// ESTRATÉGIA 8: Primeira Vela do Quadrante (75.0%)
function firstCandleQuadrantStrategy(candles: ForexCandle[]): { prediction: 'green' | 'red' | null, confidence: number, reasoning: string | null } {
  if (candles.length < 1) return { prediction: null, confidence: 0, reasoning: 'Dados insuficientes' }
  
  const current = candles[candles.length - 1]
  const currentMinute = new Date(current.timestamp).getMinutes()
  
  // Verifica se é a primeira vela do quadrante (a cada 15 minutos: 0, 15, 30, 45)
  const isQuadrantStart = currentMinute % 15 === 0
  
  if (isQuadrantStart && isStrongCandle(current)) {
    const baseConfidence = 75.0
    const timeBonus = calculateTimeBonus(STRATEGIES[7])
    return {
      prediction: current.color,
      confidence: Math.min(100, baseConfidence + timeBonus),
      reasoning: `Primeira vela do quadrante (${currentMinute}min) é forte. Entrada na direção da vela (${current.color}).`
    }
  }
  
  return { prediction: null, confidence: 0, reasoning: 'Não é primeira vela do quadrante ou vela não é forte' }
}

// ESTRATÉGIA 9: Alternância de Cores (72.2%)
function colorAlternationStrategy(candles: ForexCandle[]): { prediction: 'green' | 'red' | null, confidence: number, reasoning: string | null } {
  if (candles.length < 3) return { prediction: null, confidence: 0, reasoning: 'Dados insuficientes' }
  
  const last3 = candles.slice(-3)
  const colors = last3.map(c => c.color)
  
  // Verifica alternância: verde, vermelho, verde ou vermelho, verde, vermelho
  const isAlternating = 
    (colors[0] === 'green' && colors[1] === 'red' && colors[2] === 'green') ||
    (colors[0] === 'red' && colors[1] === 'green' && colors[2] === 'red')
  
  if (isAlternating) {
    const baseConfidence = 72.2
    const timeBonus = calculateTimeBonus(STRATEGIES[8])
    // Mantém a alternância: se última foi verde, próxima será vermelha
    const prediction = colors[2] === 'green' ? 'red' : 'green'
    return {
      prediction,
      confidence: Math.min(100, baseConfidence + timeBonus),
      reasoning: `Alternância de cores identificada. Mantendo padrão: próxima vela ${prediction === 'green' ? 'verde' : 'vermelha'}.`
    }
  }
  
  return { prediction: null, confidence: 0, reasoning: 'Padrão de alternância não identificado' }
}

// ESTRATÉGIA 10: Sequência Ímpar (71.4%)
function oddSequenceStrategy(candles: ForexCandle[]): { prediction: 'green' | 'red' | null, confidence: number, reasoning: string | null } {
  if (candles.length < 3) return { prediction: null, confidence: 0, reasoning: 'Dados insuficientes' }
  
  const last3 = candles.slice(-3)
  const allSame = last3.every(c => c.color === last3[0].color)
  
  if (allSame) {
    const baseConfidence = 71.4
    const timeBonus = calculateTimeBonus(STRATEGIES[9])
    // Entra contra a sequência
    const prediction = last3[0].color === 'green' ? 'red' : 'green'
    return {
      prediction,
      confidence: Math.min(100, baseConfidence + timeBonus),
      reasoning: `Sequência ímpar de 3 velas ${last3[0].color === 'green' ? 'verdes' : 'vermelhas'} identificada. Entrada contra a sequência (${prediction}).`
    }
  }
  
  return { prediction: null, confidence: 0, reasoning: 'Sequência ímpar não identificada' }
}

// Configuração das estratégias - APENAS 5 ESTRATÉGIAS (as melhores)
export const STRATEGIES: Strategy[] = [
  {
    id: '1',
    name: 'Engolfo de Cor Única',
    description: 'Vela grande que engolfa a anterior mantendo a mesma cor',
    winrate: 92.9,
    bestHour: 8,
    bestDay: 6, // Sábado
    rules: engulfingStrategy,
  },
  {
    id: '2',
    name: 'Três Soldados Brancos',
    description: 'Três velas verdes fortes consecutivas',
    winrate: 92.0,
    bestHour: 14,
    bestDay: 3, // Quarta-feira
    rules: threeWhiteSoldiersStrategy,
  },
  {
    id: '3',
    name: 'Vela de Força',
    description: 'Vela com corpo grande e pavio curto',
    winrate: 90.9,
    bestHour: 13,
    bestDay: 5, // Sexta-feira
    rules: strongCandleStrategy,
  },
  {
    id: '4',
    name: 'Três Vales/Picos',
    description: 'Três fundos ascendentes ou três topos descendentes',
    winrate: 85.7,
    bestHour: 12,
    bestDay: 3, // Quarta-feira
    rules: threeValleysPeaksStrategy,
  },
  {
    id: '5',
    name: 'MHI',
    description: 'Entrada na cor oposta quando há 2+ velas da mesma cor',
    winrate: 85.0,
    bestHour: 10,
    bestDay: 1, // Segunda-feira
    rules: mhiStrategy,
  },
]

