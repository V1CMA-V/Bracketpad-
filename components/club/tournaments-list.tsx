'use client'

import {
  PublicTournamentCard,
  type FilterState,
  type PublicTournamentItem,
} from '@/components/tournaments/public-tournament-card'
import { cn } from '@/lib/utils'
import { CalendarDays, Flame, Trophy, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

// Alias retrocompatible: la página del club usa este nombre para sus items.
export type TournamentListItem = PublicTournamentItem
export type { FilterState }

const FILTERS = [
  { label: 'Todos', value: 'todos' },
  { label: 'Inscripción abierta', value: 'abierto' },
  { label: 'En juego', value: 'en-juego' },
  { label: 'Finalizados', value: 'finalizado' },
] as const

type FilterValue = (typeof FILTERS)[number]['value']

export function TournamentsList({
  items,
  clubName,
}: {
  items: PublicTournamentItem[]
  clubName: string
}) {
  const [filter, setFilter] = useState<FilterValue>('todos')

  const visible = useMemo(
    () => (filter === 'todos' ? items : items.filter((t) => t.state === filter)),
    [filter, items],
  )

  const liveCount = items.filter((t) => t.state === 'en-juego').length
  const openCount = items.filter((t) => t.state === 'abierto').length
  const totalTeams = items.reduce((n, t) => n + t.teamCount, 0)

  const stats = [
    { icon: Trophy, label: 'Torneos en cartelera', value: String(items.length) },
    { icon: Flame, label: 'En juego ahora', value: String(liveCount) },
    { icon: Users, label: 'Inscripción abierta', value: String(openCount) },
    { icon: CalendarDays, label: 'Parejas inscritas', value: String(totalTeams) },
  ]

  return (
    <>
      {/* Encabezado */}
      <section className="border-b border-border bg-cream px-6 py-14 md:px-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {clubName} · Torneos
          </p>
          <h1 className="mt-4 font-heading text-6xl leading-[1.02] tracking-tight text-ink md:text-7xl">
            La cartelera <em className="italic">del club.</em>
          </h1>
          <p className="mt-5 max-w-xl font-serif text-lg italic leading-relaxed text-ink/80">
            Todos los torneos que organiza el club. Filtra por estado, abre el
            que te interese y revisa categorías, cuadros y resultados.
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8 md:grid-cols-4">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <Icon className="size-4 text-ink/40" strokeWidth={1.5} />
                <dd className="font-heading text-4xl leading-none text-ink tabular-nums">
                  {value}
                </dd>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Listado */}
      <section className="bg-background px-6 py-16 md:px-12">
        <div className="mx-auto max-w-[1400px]">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
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
              <p className="font-heading text-2xl text-ink">Nada por aquí</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                El club no tiene torneos en este estado. Prueba con otro filtro.
              </p>
            </div>
          )}

          {/* Pie */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <span>
              {visible.length} {visible.length === 1 ? 'torneo' : 'torneos'} en pantalla
            </span>
          </div>
        </div>
      </section>
    </>
  )
}
