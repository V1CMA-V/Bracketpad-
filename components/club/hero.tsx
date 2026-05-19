import { Button } from '@/components/ui/button'
import { MoreHorizontal, Plus } from 'lucide-react'

export function Hero({
  club,
  name = 'Club Marítimo del Olivar',
  initial = 'M',
  founded = 1978,
  city = 'Valencia',
  coords = '39.4699 °N · 0.3763 °W',
  description = 'Ocho pistas frente al puerto. Cuna del circuito mediterráneo de pádel y casa del Open de Verano desde 2008.',
  followers = 4180,
  quote = 'una de las mejores instalaciones de la costa',
  quoteSource = 'Padel Magazine, Marzo 2026',
  totalCourts = 8,
  courtNumber = 3,
  totalAreaM2 = 48218,
  indoorCourts = 3,
  outdoorCourts = 5,
}: {
  club: string
  name?: string
  initial?: string
  founded?: number
  city?: string
  coords?: string
  description?: string
  followers?: number
  quote?: string
  quoteSource?: string
  totalCourts?: number
  courtNumber?: number
  totalAreaM2?: number
  indoorCourts?: number
  outdoorCourts?: number
}) {
  void club
  const [first, ...rest] = name.split(' ')
  const tail = rest.join(' ')

  return (
    <section className="bg-cream px-6 py-12 md:px-12 md:py-16">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
        {/* Left column */}
        <div className="flex flex-col">
          <div className="flex items-start gap-6">
            <div className="relative shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink font-heading text-3xl text-cream">
                {initial}
              </div>
              <span className="absolute -bottom-1 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-[10px] text-cream">
                ★
              </span>
            </div>
            <div className="flex flex-col gap-1 pt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <p>Club Afiliado · Desde {founded}</p>
              <p>
                {city} · {coords}
              </p>
            </div>
          </div>

          <h1 className="mt-10 font-heading text-6xl italic leading-[1.05] tracking-tight text-ink md:text-7xl lg:text-[5.5rem]">
            {first}{' '}
            <span className="block">
              {tail}
              <span className="not-italic">.</span>
            </span>
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
              aria-label="More"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <span className="ml-auto font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {followers.toLocaleString('es-ES')} Seguidores
            </span>
          </div>
        </div>

        {/* Right column — court panel */}
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
              Vista cenital · {totalCourts} pistas
            </p>
            <p className="text-cream/70">
              n° {String(courtNumber).padStart(2, '0')} / {totalCourts + 4}
            </p>
          </div>

          <blockquote className="mt-8 max-w-md font-heading text-3xl italic leading-tight md:text-4xl">
            « {quote} »
          </blockquote>
          <p className="mt-3 font-mono text-xs uppercase tracking-wider text-cream/60">
            — {quoteSource}
          </p>

          {/* Court grid */}
          <div className="mt-10 grid aspect-[16/8] grid-cols-3 grid-rows-2 border border-cream/30">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-cream/20" />
            ))}
          </div>

          <div className="mt-8 flex items-end justify-between font-mono text-xs uppercase tracking-wider text-cream/70">
            <p>[ Imagen aérea del club ]</p>
            <p>
              {totalAreaM2.toLocaleString('es-ES')} m² · {indoorCourts} pistas cubiertas ·{' '}
              {outdoorCourts} al aire libre
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
