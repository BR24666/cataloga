import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { STRATEGIES } from '@/lib/strategies'

export async function POST() {
  try {
    // Inserir ou atualizar estratégias no banco
    const strategiesToInsert = STRATEGIES.map(strategy => ({
      id: strategy.id,
      name: strategy.name,
      description: strategy.description,
      enabled: true,
      weight: strategy.winrate / 100, // Normalizar winrate para peso
      historical_winrate: strategy.winrate,
    }))

    const { data, error } = await supabase
      .from('strategies_config')
      .upsert(strategiesToInsert, {
        onConflict: 'id',
      })
      .select()

    if (error) {
      console.error('Erro ao inicializar estratégias:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      strategies: data,
      message: `${data?.length || 0} estratégias inicializadas com sucesso`,
    })
  } catch (error: any) {
    console.error('Erro ao inicializar estratégias:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao inicializar estratégias' },
      { status: 500 }
    )
  }
}

