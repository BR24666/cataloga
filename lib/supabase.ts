import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface ForexCandle {
  id: string
  pair: string
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  color: 'green' | 'red'
  created_at: string
}

export interface StrategyPrediction {
  id: string
  candle_id: string
  pair: string
  timestamp: string
  strategy_name: string
  prediction: 'green' | 'red'
  confidence: number
  reasoning: string | null
  created_at: string
}

export interface ConsensusAnalysis {
  id: string
  candle_id: string
  pair: string
  entry_timestamp: string
  reveal_timestamp: string
  total_strategies: number
  green_predictions: number
  red_predictions: number
  consensus_prediction: 'green' | 'red' | null
  consensus_confidence: number | null
  actual_color: 'green' | 'red' | null
  result: 'WIN' | 'LOSS' | 'PENDING' | null
  created_at: string
}

export interface StrategyConfig {
  id: string
  name: string
  description: string | null
  enabled: boolean
  weight: number
  historical_winrate: number | null
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  selected_pair: string
  min_consensus_threshold: number
  show_all_strategies: boolean
  created_at: string
  updated_at: string
}

