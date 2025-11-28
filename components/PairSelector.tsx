'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FOREX_PAIRS = [
  'EUR/USD',
  'GBP/USD',
  'USD/CHF',
  'USD/JPY',
  'AUD/USD',
  'USD/CAD',
  'NZD/USD',
  'EUR/GBP',
]

interface PairSelectorProps {
  selectedPair: string
  onPairChange: (pair: string) => void
}

export default function PairSelector({ selectedPair, onPairChange }: PairSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="card flex items-center justify-between gap-2 min-w-[140px] hover:bg-[#252525] transition-colors"
      >
        <span className="font-semibold">{selectedPair}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 z-20 card min-w-[140px] p-2">
            {FOREX_PAIRS.map((pair) => (
              <button
                key={pair}
                onClick={() => {
                  onPairChange(pair)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 rounded hover:bg-[#252525] transition-colors ${
                  selectedPair === pair ? 'bg-[#252525] font-semibold' : ''
                }`}
              >
                {pair}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

