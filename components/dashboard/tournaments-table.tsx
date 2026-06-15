'use client'

import { cn } from '@/lib/utils'
import { tournamentStatusLabels, tournamentStatusStyles } from '@/lib/tournaments'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

/* -------------------------------------------------------------------------- */
/*  Modelo                                                                    */
/* -------------------------------------------------------------------------- */

export type TournamentRow = {
  id: string
  name: string
  status: string
  dateLabel: string
  // Marca de tiempo para ordenar por proximidad (ms epoch, o null sin fecha).
  startMs: number | null
  categoryCount: number
  teamCount: number
}

/* -------------------------------------------------------------------------- */
/*  Filtros                                                                   */
/* -------------------------------------------------------------------------- */

const tabs = [
  { key: 'todos', label: 'Todos' },
  { key: 'en-juego', label: 'En juego' },
  { key: 'inscripcion', label: 'Inscripción' },
  { key: 'borradores', label: 'Borradores' },
  { key: 'archivo', label: 'Archivo' },
] as const

type TabKey = (typeof tabs)[number]['key']

function matchesTab(t: TournamentRow, tab: TabKey): boolean {
  switch (tab) {
    case 'en-juego':
      return t.status === 'in_progress'
    case 'inscripcion':
      return t.status === 'registration_open'
    case 'borradores':
      return t.status === 'draft'
    case 'archivo':
      return t.status === 'finished' || t.status === 'archived'
    default:
      return true
  }
}

const sortOptions = [
  { key: 'proximo', label: 'Próximo primero' },
  { key: 'parejas', label: 'Más parejas' },
] as const

type SortKey = (typeof sortOptions)[number]['key']

/* -------------------------------------------------------------------------- */
/*  Subcomponentes                                                            */
/* -------------------------------------------------------------------------- */

const COLS = 'grid items-center gap-4'
const colsGrid: React.CSSProperties = {
  gridTemplateColumns: 'minmax(0, 2fr) 160px 150px 72px 72px 28px',
}

function StatusPill({ status }: { status: string }) {
  const s = tournamentStatusStyles[status] ?? tournamentStatusStyles.draft
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest',
        s.text,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {tournamentStatusLabels[status] ?? status}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tabla                                                                     */
/* -------------------------------------------------------------------------- */

export function TournamentsTable({ tournaments }: { tournaments: TournamentRow[] }) {
  const [tab, setTab] = useState<TabKey>('todos')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('proximo')

  const counts = useMemo(
    () =>
      Object.fromEntries(
        tabs.map((t) => [
          t.key,
          tournaments.filter((row) => matchesTab(row, t.key)).length,
        ]),
      ) as Record<TabKey, number>,
    [tournaments],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = tournaments.filter(
      (t) =>
        matchesTab(t, tab) &&
        (q === '' || t.name.toLowerCase().includes(q)),
    )
    const sorted = [...filtered]
    if (sort === 'parejas') {
      sorted.sort((a, b) => b.teamCount - a.teamCount)
    } else {
      // Próximo primero: por fecha de inicio ascendente; sin fecha al final.
      sorted.sort((a, b) => {
        if (a.startMs == null) return 1
        if (b.startMs == null) return -1
        return a.startMs - b.startMs
      })
    }
    return sorted
  }, [tournaments, tab, query, sort])

  return (
    <div>
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1">
          {tabs.map((t) => {
            const active = t.key === tab
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors',
                  active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {t.label}
                <span
                  className={cn(
                    'tabular-nums',
                    active ? 'text-background/60' : 'text-muted-foreground/60',
                  )}
                >
                  {counts[t.key]}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre..."
              className="h-9 w-60 rounded-md border border-border bg-input/30 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Orden
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 appearance-none rounded-md border border-border bg-input/30 py-0 pl-[68px] pr-9 font-mono text-xs text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {sortOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Cabecera */}
          <div
            style={colsGrid}
            className={cn(
              COLS,
              'border-b border-border px-3 pb-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground',
            )}
          >
            <span>Torneo</span>
            <span>Fechas</span>
            <span>Estado</span>
            <span className="text-right">Cat.</span>
            <span className="text-right">Parejas</span>
            <span />
          </div>

          {/* Filas */}
          {rows.length === 0 ? (
            <p className="px-3 py-12 text-center text-sm text-muted-foreground">
              {tournaments.length === 0
                ? 'Aún no has creado ningún torneo.'
                : 'No hay torneos que coincidan con la búsqueda.'}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/dashboard/torneos/${t.id}`}
                    style={colsGrid}
                    className={cn(
                      COLS,
                      'group rounded-md px-3 py-4 transition-colors hover:bg-muted/50',
                    )}
                  >
                    {/* Torneo */}
                    <div className="min-w-0">
                      <p className="truncate font-serif text-base text-foreground">
                        {t.name}
                      </p>
                    </div>

                    {/* Fechas */}
                    <span className="font-mono text-xs text-foreground/80">
                      {t.dateLabel}
                    </span>

                    {/* Estado */}
                    <StatusPill status={t.status} />

                    {/* Categorías */}
                    <span className="text-right font-mono text-sm text-foreground tabular-nums">
                      {t.categoryCount}
                    </span>

                    {/* Parejas */}
                    <span className="text-right font-mono text-sm text-foreground tabular-nums">
                      {t.teamCount}
                    </span>

                    {/* Acción */}
                    <span className="flex justify-end text-muted-foreground/50 transition-colors group-hover:text-foreground">
                      <ChevronRight className="size-4" strokeWidth={1.5} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Pie */}
      <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {rows.length} de {tournaments.length} mostrados
      </div>
    </div>
  )
}
