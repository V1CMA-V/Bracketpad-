'use client'

import { TournamentCard, type Tournament } from '@/components/home/tournament-card'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
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

const TOTAL = 18

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
    location: 'Club Marítimo del Olivar · Valencia',
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
    location: 'Club Marítimo del Olivar · Valencia',
    inscritos: '142',
    premio: '€6.000',
    plazas: '18 libres',
    cta: 'Inscribirme',
  },
  {
    index: 3,
    total: TOTAL,
    tag: 'nuevo',
    state: 'abierto',
    status: 'Cierra 11 jul',
    meta: 'Padel · 18 — 20 jul',
    title: 'Open Costa Azahar',
    subtitle: '1ª — 3ª · masc · fem',
    location: 'Club Mediterráneo · Castellón',
    inscritos: '64',
    premio: '€2.000',
    plazas: '32 libres',
    cta: 'Inscribirme',
  },
  {
    index: 4,
    total: TOTAL,
    tag: 'destacado',
    state: 'proximo',
    status: 'Programado · Sep',
    meta: 'Padel · 12 — 15 sep',
    title: 'Máster Comunidad Valenciana',
    subtitle: 'Solo 1ª · por invitación',
    location: 'Ciudad del Pádel · Alicante',
    inscritos: '—',
    premio: '€12.000',
    plazas: 'Por sorteo',
    cta: 'Ver detalles',
    watermark: 'M',
  },
  {
    index: 5,
    total: TOTAL,
    tag: 'abierta',
    state: 'abierto',
    status: 'Cierra 19 jun',
    meta: 'Padel · 21 — 23 jun',
    title: 'Torneo Sant Joan',
    subtitle: '3ª — 4ª masculina',
    location: 'Padel Nord · Valencia',
    inscritos: '48',
    premio: '€1.500',
    plazas: '16 libres',
    cta: 'Inscribirme',
  },
  {
    index: 6,
    total: TOTAL,
    tag: 'nuevo',
    state: 'en-juego',
    status: 'En curso · J6 de J9',
    meta: 'Liga · may — sep',
    title: 'Circuito Veteranos +45',
    subtitle: 'Liga mensual · 9 jornadas',
    location: 'Olimpic Padel · Valencia',
    inscritos: '48',
    premio: '€800',
    plazas: 'Completo',
    cta: 'Ver clasificación',
  },
  {
    index: 7,
    total: TOTAL,
    tag: 'abierta',
    state: 'proximo',
    status: 'Abre 01 jul',
    meta: 'Padel · 25 — 27 jul',
    title: 'Mixto Nocturno de Verano',
    subtitle: 'Parejas mixtas · nivel libre',
    location: 'Club Mediterráneo · Castellón',
    inscritos: '—',
    premio: '€1.000',
    plazas: '40 plazas',
    cta: 'Avísame',
  },
  {
    index: 8,
    total: TOTAL,
    tag: 'destacado',
    state: 'finalizado',
    status: 'Finalizado · mar 2026',
    meta: 'Liga · ene — mar',
    title: 'Liga de Invierno',
    subtitle: '6 categorías · round robin',
    location: 'Club Marítimo del Olivar · Valencia',
    inscritos: '96',
    premio: '€2.500',
    plazas: 'Cerrado',
    cta: 'Ver resultados',
  },
  {
    index: 9,
    total: TOTAL,
    tag: 'nuevo',
    state: 'finalizado',
    status: 'Finalizado · ene 2026',
    meta: 'Padel · 03 — 06 ene',
    title: 'Trofeo Reyes',
    subtitle: '2ª — 4ª · masc · fem',
    location: 'Ciudad del Pádel · Alicante',
    inscritos: '72',
    premio: '€1.800',
    plazas: 'Cerrado',
    cta: 'Ver resultados',
  },
]

export function Directory() {
  const [filter, setFilter] = useState<FilterValue>('todos')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ITEMS.filter((t) => {
      const matchesState = filter === 'todos' || t.state === filter
      const matchesQuery =
        q === '' ||
        `${t.title} ${t.subtitle} ${t.location}`.toLowerCase().includes(q)
      return matchesState && matchesQuery
    })
  }, [filter, query])

  return (
    <section className="bg-background px-6 py-16 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        {/* Encabezado */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Cartelera · {ITEMS.length} de {TOTAL} torneos
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
            {visible.map((t) => (
              <TournamentCard key={t.index} tournament={t} />
            ))}
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card py-20 text-center">
            <p className="font-heading text-2xl text-ink">Sin resultados</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              No hay torneos que coincidan con tu búsqueda. Prueba con otro
              filtro o limpia el buscador.
            </p>
          </div>
        )}

        {/* Pie */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span>
            {visible.length}{' '}
            {visible.length === 1 ? 'torneo' : 'torneos'} en pantalla
          </span>
          <span>Actualizado hoy · 09:00</span>
        </div>
      </div>
    </section>
  )
}
