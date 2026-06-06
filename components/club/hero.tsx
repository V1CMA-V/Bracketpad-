import { Button } from '@/components/ui/button'
import { MoreHorizontal, Plus } from 'lucide-react'

type CourtStatus = 'playing' | 'next' | 'free' | 'closed'

type Court = {
  index: string
  name: string
  type: string
  surface: string
  status: CourtStatus
  detail: string
}

// Color de cada celda en el mapa cenital de pistas.
function cellColor(status: CourtStatus) {
  switch (status) {
    case 'playing':
      return 'border-lime/60 bg-lime/25'
    case 'next':
      return 'border-ochre/60 bg-ochre/25'
    case 'free':
      return 'border-cream/30 bg-transparent'
    case 'closed':
      return 'border-cream/15 bg-cream/[0.03]'
  }
}

export function Hero({
  name,
  city,
  address,
  foundedYear,
  playersCount,
  leaguesCount,
  tournamentsCount,
  totalCourts,
  indoorCourts,
  outdoorCourts,
  courts,
}: {
  name: string
  city?: string | null
  address?: string | null
  foundedYear: number
  playersCount: number
  leaguesCount: number
  tournamentsCount: number
  totalCourts: number
  indoorCourts: number
  outdoorCourts: number
  courts: Court[]
}) {
  const initial = name.trim().charAt(0).toUpperCase() || 'C'
  const [first, ...rest] = name.split(' ')
  const tail = rest.join(' ')

  // Descripción tejida con datos reales del club.
  const pieces: string[] = []
  pieces.push(
    `${totalCourts} ${totalCourts === 1 ? 'pista' : 'pistas'}` +
      (indoorCourts > 0 && outdoorCourts > 0
        ? ` (${indoorCourts} cubiertas · ${outdoorCourts} al aire libre)`
        : ''),
  )
  if (leaguesCount > 0)
    pieces.push(`${leaguesCount} ${leaguesCount === 1 ? 'liga' : 'ligas'}`)
  if (tournamentsCount > 0)
    pieces.push(
      `${tournamentsCount} ${tournamentsCount === 1 ? 'torneo' : 'torneos'}`,
    )
  const description =
    pieces.join(' · ') + (city ? `. Pádel en ${city}.` : '.')

  return (
    <section className="bg-cream px-6 py-12 md:px-12 md:py-16">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
        {/* Columna izquierda */}
        <div className="flex flex-col">
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-ink font-heading text-3xl text-cream">
              {initial}
            </div>
            <div className="flex flex-col gap-1 pt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <p>Club afiliado · en Bandeja desde {foundedYear}</p>
              {(address || city) && <p>{[address, city].filter(Boolean).join(' · ')}</p>}
            </div>
          </div>

          <h1 className="mt-10 font-heading text-6xl italic leading-[1.05] tracking-tight text-ink md:text-7xl lg:text-[5.5rem]">
            {first}{' '}
            {tail && (
              <span className="block">
                {tail}
                <span className="not-italic">.</span>
              </span>
            )}
          </h1>

          <p className="mt-8 max-w-md font-serif text-lg italic leading-relaxed text-ink/80">
            {description}
          </p>

          <div className="mt-12 flex items-center gap-4">
            <Button className="gap-2 bg-terracotta px-5 py-2.5 text-cream hover:bg-terracotta/90">
              Seguir al club <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="border-ink/20 bg-transparent px-5 py-2.5 text-ink hover:bg-ink/5"
            >
              Reservar pista
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-ink/20 bg-transparent text-ink hover:bg-ink/5"
              aria-label="Más opciones"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <span className="ml-auto font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {playersCount.toLocaleString('es-ES')}{' '}
              {playersCount === 1 ? 'jugador' : 'jugadores'}
            </span>
          </div>
        </div>

        {/* Columna derecha — mapa de pistas */}
        <div
          className="relative overflow-hidden rounded-sm bg-forest p-8 text-cream"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent 0 14px, rgba(255,255,255,0.04) 14px 15px)',
          }}
        >
          <div className="flex items-start justify-between font-mono text-xs uppercase tracking-wider">
            <p className="text-lime">
              <span className="mr-2">●</span>
              Vista cenital · {totalCourts} {totalCourts === 1 ? 'pista' : 'pistas'}
            </p>
            <p className="text-cream/70">
              {indoorCourts} cubiertas / {outdoorCourts} aire libre
            </p>
          </div>

          {courts.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {courts.map((c) => (
                <div
                  key={c.index}
                  className={
                    'flex aspect-[3/4] flex-col justify-between rounded-sm border p-2.5 ' +
                    cellColor(c.status)
                  }
                  title={`${c.name} · ${c.type} · ${c.detail}`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-cream/60">
                    {c.index}
                  </span>
                  <div className="grid grid-cols-2 gap-0.5 opacity-50">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <span key={j} className="aspect-square border border-cream/30" />
                    ))}
                  </div>
                  <span className="truncate font-heading text-sm leading-none">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-10 font-serif text-base italic text-cream/70">
              Este club todavía no ha publicado sus pistas.
            </p>
          )}

          <div className="mt-8 flex items-end justify-between font-mono text-xs uppercase tracking-wider text-cream/70">
            <p className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-lime" /> En juego
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-ochre" /> Próximo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full border border-cream/40" /> Libre
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
