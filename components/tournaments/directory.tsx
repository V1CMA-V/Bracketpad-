'use client'

import {
  PublicTournamentCard,
  type PublicTournamentItem,
} from '@/components/tournaments/public-tournament-card'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

const FILTERS = [
  { label: 'Todos', value: 'todos' },
  { label: 'Inscripción abierta', value: 'abierto' },
  { label: 'En juego', value: 'en-juego' },
  { label: 'Finalizados', value: 'finalizado' },
] as const

type FilterValue = (typeof FILTERS)[number]['value']

export function Directory({ items }: { items: PublicTournamentItem[] }) {
  const [filter, setFilter] = useState<FilterValue>('todos')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((t) => {
      const matchesState = filter === 'todos' || t.state === filter
      const haystack =
        `${t.name} ${t.clubName ?? ''} ${t.location ?? ''}`.toLowerCase()
      const matchesQuery = q === '' || haystack.includes(q)
      return matchesState && matchesQuery
    })
  }, [filter, query, items])

  return (
    <section className="bg-background px-6 py-16 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        {/* Encabezado */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Cartelera · {items.length} {items.length === 1 ? 'torneo' : 'torneos'}
            </p>
            <h2 className="mt-3 font-heading text-5xl leading-none text-ink md:text-6xl">
              Encuentra tu <em className="italic">cuadro.</em>
            </h2>
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar torneo, club o ciudad..."
              className="h-10 w-full rounded-md border border-input bg-card pr-3 pl-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-border pt-6">
          {FILTERS.map((f) => {
            const isActive = f.value === filter
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={isActive}
                className={cn(
                  'rounded-sm px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors',
                  isActive
                    ? 'bg-ink text-cream'
                    : 'border border-ink/15 bg-transparent text-ink hover:bg-ink/5',
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Rejilla */}
        {visible.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((t, i) => (
              <PublicTournamentCard
                key={t.id}
                item={t}
                index={i + 1}
                total={items.length}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card py-20 text-center">
            <p className="font-heading text-2xl text-ink">
              {items.length === 0 ? 'Sin torneos todavía' : 'Sin resultados'}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {items.length === 0
                ? 'Cuando los clubes publiquen sus torneos, aparecerán aquí.'
                : 'No hay torneos que coincidan con tu búsqueda. Prueba con otro filtro o limpia el buscador.'}
            </p>
          </div>
        )}

        {/* Pie */}
        {items.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <span>
              {visible.length} {visible.length === 1 ? 'torneo' : 'torneos'} en pantalla
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
