'use client'

import { cn } from '@/lib/utils'
import { CalendarDays, ChevronRight, Flame, MapPin, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

export type FilterState = 'abierto' | 'en-juego' | 'finalizado'

export type TournamentListItem = {
  id: string
  name: string
  status: string
  statusLabel: string
  state: FilterState
  categoryCount: number
  teamCount: number
  dates: string
  location: string | null
  href: string
  watermark: string
}

const FILTERS = [
  { label: 'Todos', value: 'todos' },
  { label: 'Inscripción abierta', value: 'abierto' },
  { label: 'En juego', value: 'en-juego' },
  { label: 'Finalizados', value: 'finalizado' },
] as const

type FilterValue = (typeof FILTERS)[number]['value']

// Acento de la portada de cada tarjeta según el estado del torneo.
const coverStyles: Record<FilterState, { bg: string; ink: string; chip: string; dot: string }> = {
  abierto: {
    bg: 'bg-terracotta',
    ink: 'text-cream',
    chip: 'bg-cream/15 text-cream',
    dot: 'bg-cream',
  },
  'en-juego': {
    bg: 'bg-forest',
    ink: 'text-cream',
    chip: 'bg-lime/20 text-lime',
    dot: 'bg-lime',
  },
  finalizado: {
    bg: 'bg-ink',
    ink: 'text-cream',
    chip: 'bg-cream/10 text-cream/80',
    dot: 'bg-cream/60',
  },
}

export function TournamentsList({
  items,
  clubName,
}: {
  items: TournamentListItem[]
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
                <TournamentCard key={t.id} item={t} index={i + 1} total={items.length} />
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

function TournamentCard({
  item,
  index,
  total,
}: {
  item: TournamentListItem
  index: number
  total: number
}) {
  const styles = coverStyles[item.state]
  return (
    <Link
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-lg border border-foreground/10 bg-card transition-colors hover:border-terracotta/40"
    >
      {/* Portada */}
      <div
        className={cn('relative flex min-h-[180px] flex-col justify-between p-5', styles.bg, styles.ink)}
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent 0 22px, rgba(255,255,255,0.04) 22px 23px)',
        }}
      >
        <div className="flex items-start justify-between font-mono text-[10px] uppercase tracking-widest">
          <span className="opacity-80">Torneo</span>
          <span className="opacity-70">
            {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="select-none font-heading text-8xl italic opacity-20">
            {item.watermark}
          </span>
        </div>

        <span
          className={cn(
            'relative inline-flex w-fit items-center gap-2 rounded-sm px-2 py-1 font-mono text-[10px] uppercase tracking-widest',
            styles.chip,
          )}
        >
          <span className={cn('size-1.5 rounded-full', styles.dot)} />
          {item.statusLabel}
        </span>
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {item.categoryCount} {item.categoryCount === 1 ? 'categoría' : 'categorías'} · {item.dates}
        </p>

        <h3 className="font-heading text-3xl leading-tight tracking-tight text-foreground">
          {item.name}
        </h3>

        {item.location && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" strokeWidth={1.5} />
            {item.location}
          </p>
        )}

        <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-foreground/10 pt-4">
          <div className="flex flex-col gap-1">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Parejas
            </dt>
            <dd className="font-mono text-base text-foreground tabular-nums">{item.teamCount}</dd>
          </div>
          <div className="flex items-end justify-end">
            <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-ink transition-colors group-hover:text-terracotta">
              Ver torneo
              <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </dl>
      </div>
    </Link>
  )
}
