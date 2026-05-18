'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const filters = ['Todos', 'Abiertos', 'En juego', 'Veteranos', 'Mixto'] as const

type Filter = (typeof filters)[number]

export function TournamentTabs({
  onChange,
}: {
  onChange?: (value: Filter) => void
}) {
  const [active, setActive] = useState<Filter>('Todos')

  return (
    <div
      role="tablist"
      aria-label="Filtrar torneos"
      className="inline-flex flex-wrap items-center gap-1.5"
    >
      {filters.map((filter) => {
        const isActive = filter === active
        return (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              setActive(filter)
              onChange?.(filter)
            }}
            className={cn(
              'h-8 rounded-md border px-3 font-mono text-[11px] uppercase tracking-widest transition-colors',
              isActive
                ? 'border-ink bg-ink text-cream'
                : 'border-foreground/15 bg-transparent text-foreground hover:bg-foreground/5',
            )}
          >
            {filter}
          </button>
        )
      })}
    </div>
  )
}
