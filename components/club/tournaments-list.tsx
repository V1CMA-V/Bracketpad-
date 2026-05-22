'use client'

import { TournamentCard, type Tournament } from '@/components/home/tournament-card'
import { cn } from '@/lib/utils'
import { CalendarDays, Flame, Trophy, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

type State = 'abierto' | 'en-juego' | 'proximo' | 'finalizado'

type Item = Tournament & { state: State }

const FILTERS = [
  { label: 'Todos', value: 'todos' },
  { label: 'Inscripción abierta', value: 'abierto' },
  { label: 'En juego', value: 'en-juego' },
  { label: 'Próximos', value: 'proximo' },
  { label: 'Finalizados', value: 'finalizado' },
] as const

type FilterValue = (typeof FILTERS)[number]['value']

const STATS = [
  { icon: Trophy, label: 'Torneos en cartelera', value: '06' },
  { icon: Flame, label: 'En juego ahora', value: '02' },
  { icon: Users, label: 'Inscripción abierta', value: '02' },
  { icon: CalendarDays, label: 'En premios', value: '€16k' },
]

const VENUE = 'Club Marítimo del Olivar · Valencia'
const TOTAL = 6

const ITEMS: Item[] = [
  {
    index: 1,
    total: TOTAL,
    tag: 'destacado',
    state: 'en-juego',
    status: 'En juego · Cuartos',
    meta: 'Padel · 15 — 28 jun',
    title: 'Open de Verano',
    subtitle: '8 categorías · cuadro a 128',
    location: VENUE,
    inscritos: '128',
    premio: '€3.500',
    plazas: 'Completo',
    cta: 'Ver en directo',
    watermark: 'V',
  },
  {
    index: 2,
    total: TOTAL,
    tag: 'abierta',
    state: 'abierto',
    status: 'Cierra 04 jul',
    meta: 'Padel · 10 — 14 jul',
    title: 'Trofeo del Olivar XII',
    subtitle: '8 categorías · cuadro a 32',
    location: VENUE,
    inscritos: '142',
    premio: '€6.000',
    plazas: '18 libres',
    cta: 'Inscribirme',
  },
  {
    index: 3,
    total: TOTAL,
    tag: 'abierta',
    state: 'abierto',
    status: 'Cierra 19 jun',
    meta: 'Padel · 21 — 23 jun',
    title: 'Torneo Sant Joan',
    subtitle: '3ª — 4ª masculina',
    location: VENUE,
    inscritos: '48',
    premio: '€1.500',
    plazas: '16 libres',
    cta: 'Inscribirme',
  },
  {
    index: 4,
    total: TOTAL,
    tag: 'nuevo',
    state: 'en-juego',
    status: 'En curso · J6 de J9',
    meta: 'Liga · may — sep',
    title: 'Liga interna de socios',
    subtitle: '6 categorías · round robin',
    location: VENUE,
    inscritos: '96',
    premio: '€800',
    plazas: 'Completo',
    cta: 'Ver clasificación',
  },
  {
    index: 5,
    total: TOTAL,
    tag: 'nuevo',
    state: 'proximo',
    status: 'Programado · Sep',
    meta: 'Padel · 12 — 14 sep',
    title: 'Memorial Vicente Andreu',
    subtitle: 'Veteranos +45 · masc · fem',
    location: VENUE,
    inscritos: '—',
    premio: '€1.200',
    plazas: 'Abre 20 ago',
    cta: 'Avísame',
  },
  {
    index: 6,
    total: TOTAL,
    tag: 'destacado',
    state: 'finalizado',
    status: 'Finalizado · mar 2026',
    meta: 'Liga · ene — mar',
    title: 'Liga de Invierno',
    subtitle: '6 categorías · round robin',
    location: VENUE,
    inscritos: '96',
    premio: '€2.500',
    plazas: 'Cerrado',
    cta: 'Ver resultados',
  },
]

export function TournamentsList({
  clubSlug,
  clubName = 'Club Marítimo del Olivar',
}: {
  clubSlug: string
  clubName?: string
}) {
  void clubSlug
  const [filter, setFilter] = useState<FilterValue>('todos')

  const visible = useMemo(
    () =>
      filter === 'todos'
        ? ITEMS
        : ITEMS.filter((t) => t.state === filter),
    [filter],
  )

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
            Todos los torneos públicos que organiza el club esta temporada.
            Filtra por estado e inscríbete antes de que se cierren las plazas.
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8 md:grid-cols-4">
            {STATS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <Icon className="size-4 text-ink/40" strokeWidth={1.5} />
                <dd className="font-heading text-4xl leading-none text-ink">
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
              {visible.map((t) => (
                <TournamentCard key={t.index} tournament={t} />
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
              {visible.length} {visible.length === 1 ? 'torneo' : 'torneos'} en
              pantalla
            </span>
            <span>Actualizado hoy · 09:00</span>
          </div>
        </div>
      </section>
    </>
  )
}
