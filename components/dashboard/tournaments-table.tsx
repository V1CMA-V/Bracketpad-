'use client'

import { cn } from '@/lib/utils'
import { ChevronDown, MoreHorizontal, Search } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

/* -------------------------------------------------------------------------- */
/*  Modelo + datos de ejemplo                                                 */
/* -------------------------------------------------------------------------- */

type Status = 'en-juego' | 'programado' | 'borrador' | 'finalizado'

export type Tournament = {
  id: string
  name: string
  format: string
  tag?: string
  dates: string
  status: Status
  entrants: number
  entryNote: string
  progress: number | null
  categories: number
  prize: string | null
  revenue: string | null
}

const tournaments: Tournament[] = [
  {
    id: 'O26',
    name: 'Open de Verano',
    format: 'Open · Masters 1000',
    dates: '15 — 28 jun 2026',
    status: 'en-juego',
    entrants: 128,
    entryNote: '64% disputado',
    progress: 64,
    categories: 6,
    prize: '€3.500',
    revenue: '€1.920',
  },
  {
    id: 'C26',
    name: 'Circuito Veteranos',
    format: 'Liga · Circuito',
    dates: 'May — Sep 2026',
    status: 'en-juego',
    entrants: 48,
    entryNote: '33% disputado',
    progress: 33,
    categories: 3,
    prize: '€800',
    revenue: '€720',
  },
  {
    id: 'S26',
    name: 'Torneo Solsticio',
    format: 'Open · 500',
    dates: '22 jun — 5 jul',
    status: 'programado',
    entrants: 64,
    entryNote: 'Inscripciones abiertas',
    progress: 48,
    categories: 4,
    prize: '€1.200',
    revenue: '€960',
  },
  {
    id: 'T26',
    name: 'Trofeo del Olivar XII',
    format: 'Insignia · 1000',
    dates: '10 — 14 jul',
    status: 'programado',
    entrants: 212,
    entryNote: 'Inscripciones abiertas',
    progress: 78,
    categories: 8,
    prize: '€6.000',
    revenue: '€3.180',
  },
  {
    id: 'M26',
    name: 'Mixto Nocturno',
    format: 'Express · Single',
    dates: '18 jul · 1 día',
    status: 'borrador',
    entrants: 16,
    entryNote: 'Cuadro no generado',
    progress: null,
    categories: 1,
    prize: null,
    revenue: null,
  },
  {
    id: 'P26',
    name: 'Padel Social Verano',
    format: 'Liga · Interna',
    dates: '01 jul — 30 ago',
    status: 'borrador',
    entrants: 32,
    entryNote: 'Cuadro no generado',
    progress: null,
    categories: 2,
    prize: null,
    revenue: null,
  },
  {
    id: 'R26',
    name: 'Mediterráneo Cup',
    format: 'Open · 250',
    dates: '05 — 09 sep',
    status: 'programado',
    entrants: 96,
    entryNote: 'Inscripciones abiertas',
    progress: 60,
    categories: 5,
    prize: '€2.000',
    revenue: '€1.440',
  },
  {
    id: 'P25',
    name: 'Padel Otoño 2025',
    format: 'Open · 500',
    tag: 'Oro / Pla',
    dates: '12 — 26 oct 2025',
    status: 'finalizado',
    entrants: 128,
    entryNote: '100% disputado',
    progress: 100,
    categories: 5,
    prize: '€2.800',
    revenue: '€2.240',
  },
  {
    id: 'O25',
    name: 'Trofeo del Olivar XI',
    format: 'Insignia · 1000',
    tag: 'Asens / Toro',
    dates: '07 — 11 jul 2025',
    status: 'finalizado',
    entrants: 288,
    entryNote: '100% disputado',
    progress: 100,
    categories: 8,
    prize: '€5.500',
    revenue: '€3.940',
  },
]

/* -------------------------------------------------------------------------- */
/*  Filtros                                                                   */
/* -------------------------------------------------------------------------- */

const tabs = [
  { key: 'todos', label: 'Todos' },
  { key: 'en-juego', label: 'En juego' },
  { key: 'programados', label: 'Programados' },
  { key: 'borradores', label: 'Borradores' },
  { key: 'archivo', label: 'Archivo' },
] as const

type TabKey = (typeof tabs)[number]['key']

function matchesTab(t: Tournament, tab: TabKey): boolean {
  switch (tab) {
    case 'en-juego':
      return t.status === 'en-juego'
    case 'programados':
      return t.status === 'programado'
    case 'borradores':
      return t.status === 'borrador'
    case 'archivo':
      return t.status === 'finalizado'
    default:
      return true
  }
}

const sortOptions = [
  { key: 'proximo', label: 'Próximo primero' },
  { key: 'inscritos', label: 'Más inscritos' },
  { key: 'premio', label: 'Premio mayor' },
] as const

type SortKey = (typeof sortOptions)[number]['key']

function prizeValue(prize: string | null): number {
  if (!prize) return 0
  return Number(prize.replace(/[^\d]/g, ''))
}

/* -------------------------------------------------------------------------- */
/*  Subcomponentes                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Plantilla de columnas de la tabla. Se aplica con `style` (en lugar de un
 * `grid-cols-[…]` arbitrario) para evitar que el `minmax()` rompa la rejilla.
 */
const COLS = 'grid items-center gap-4'
const colsGrid: React.CSSProperties = {
  gridTemplateColumns:
    '52px minmax(0, 1.7fr) 136px 124px minmax(0, 1.25fr) 48px 84px 84px 28px',
}

function StatusPill({ status }: { status: Status }) {
  const map = {
    'en-juego': { label: 'En juego', text: 'text-forest', dot: 'bg-forest' },
    programado: { label: 'Programado', text: 'text-ochre', dot: 'bg-ochre' },
    borrador: { label: 'Borrador', text: 'text-terracotta', dot: 'bg-terracotta' },
    finalizado: {
      label: 'Finalizado',
      text: 'text-muted-foreground',
      dot: 'bg-muted-foreground',
    },
  } as const
  const s = map[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest',
        s.text,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tabla                                                                     */
/* -------------------------------------------------------------------------- */

export function TournamentsTable() {
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
    [],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = tournaments.filter(
      (t) =>
        matchesTab(t, tab) &&
        (q === '' ||
          t.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)),
    )
    const sorted = [...filtered]
    if (sort === 'inscritos') sorted.sort((a, b) => b.entrants - a.entrants)
    if (sort === 'premio')
      sorted.sort((a, b) => prizeValue(b.prize) - prizeValue(a.prize))
    return sorted
  }, [tab, query, sort])

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
              placeholder="Buscar por nombre o ID..."
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
        <div className="min-w-[960px]">
          {/* Cabecera */}
          <div
            style={colsGrid}
            className={cn(
              COLS,
              'border-b border-border px-3 pb-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground',
            )}
          >
            <span>ID</span>
            <span>Torneo</span>
            <span>Fechas</span>
            <span>Estado</span>
            <span>Inscripción</span>
            <span className="text-center">Cat.</span>
            <span className="text-right">Premio</span>
            <span className="text-right">Ingresos</span>
            <span />
          </div>

          {/* Filas */}
          {rows.length === 0 ? (
            <p className="px-3 py-12 text-center text-sm text-muted-foreground">
              No hay torneos que coincidan con la búsqueda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/dashboard/torneos/${t.id.toLowerCase()}`}
                    style={colsGrid}
                    className={cn(
                      COLS,
                      'group rounded-md px-3 py-4 transition-colors hover:bg-muted/50',
                    )}
                  >
                    {/* ID */}
                    <span className="justify-self-start rounded border border-border px-1.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t.id}
                    </span>

                    {/* Torneo */}
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-sm text-foreground">
                        <span className="truncate font-serif text-base">
                          {t.name}
                        </span>
                        {t.tag && (
                          <span className="shrink-0 rounded-sm bg-ochre/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ochre">
                            {t.tag}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t.format}
                      </p>
                    </div>

                    {/* Fechas */}
                    <span className="font-mono text-xs text-foreground/80">
                      {t.dates}
                    </span>

                    {/* Estado */}
                    <StatusPill status={t.status} />

                    {/* Inscripción */}
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-foreground tabular-nums">
                        {t.entrants}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        {t.progress != null && (
                          <span className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                            <span
                              className={cn(
                                'block h-full rounded-full',
                                t.status === 'programado'
                                  ? 'bg-ochre'
                                  : 'bg-forest',
                              )}
                              style={{ width: `${t.progress}%` }}
                            />
                          </span>
                        )}
                        <span className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {t.entryNote}
                        </span>
                      </div>
                    </div>

                    {/* Categorías */}
                    <span className="text-center font-mono text-sm text-foreground tabular-nums">
                      {t.categories}
                    </span>

                    {/* Premio */}
                    <span className="text-right font-mono text-sm text-foreground tabular-nums">
                      {t.prize ?? '—'}
                    </span>

                    {/* Ingresos */}
                    <span className="text-right font-mono text-sm text-foreground tabular-nums">
                      {t.revenue ?? '—'}
                    </span>

                    {/* Acciones */}
                    <span className="flex justify-end text-muted-foreground/50 transition-colors group-hover:text-foreground">
                      <MoreHorizontal className="size-4" strokeWidth={1.5} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Pie */}
      <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>
          {rows.length} de {tournaments.length} mostrados
        </span>
        <span>Última actualización · hace 6 min</span>
      </div>
    </div>
  )
}
