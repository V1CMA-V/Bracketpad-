import { Hand, MapPin, Plus, Share2, Target, TrendingUp } from 'lucide-react'

type Form = 'W' | 'L'

const META = [
  { icon: MapPin, label: 'Valencia · Comunidad Valenciana' },
  { icon: Hand, label: 'Diestro · revés' },
  { icon: Target, label: '1ª masculina · 27 años' },
  { icon: TrendingUp, label: 'En activo desde 2021' },
]

export function Hero({
  playerId,
  name = 'Iván Puig',
  alias = 'El Muro',
  initials = 'IP',
  club = 'Club Marítimo del Olivar',
  description = 'Defensa incansable y bandeja quirúrgica. Tres temporadas firmando los puntos largos en pista central del Olivar.',
  rank = 7,
  rankDelta = 3,
  points = 2480,
  followers = 1840,
  form = ['W', 'W', 'L', 'W', 'W'] as Form[],
}: {
  playerId: string
  name?: string
  alias?: string
  initials?: string
  club?: string
  description?: string
  rank?: number
  rankDelta?: number
  points?: number
  followers?: number
  form?: Form[]
}) {
  void playerId
  const [first, ...rest] = name.split(' ')
  const tail = rest.join(' ')

  return (
    <section className="bg-cream px-6 py-12 md:px-12 md:py-16">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
        {/* Columna izquierda — identidad */}
        <div className="flex flex-col">
          <div className="flex items-start gap-6">
            <div className="relative shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink font-heading text-3xl text-cream">
                {initials}
              </div>
              <span className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-terracotta font-mono text-[10px] text-cream ring-2 ring-cream">
                {rank}
              </span>
            </div>
            <div className="flex flex-col gap-1 pt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <p>Jugador federado · Ranking #{rank}</p>
              <p>{club}</p>
            </div>
          </div>

          <h1 className="mt-10 font-heading text-6xl leading-[1.05] tracking-tight text-ink md:text-7xl lg:text-[5.5rem]">
            {first}{' '}
            <span className="block">
              {tail}
              <span>.</span>
            </span>
          </h1>

          <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
            « {alias} »
          </p>

          <p className="mt-6 max-w-md font-serif text-lg italic leading-relaxed text-ink/80">
            {description}
          </p>

          {/* Datos */}
          <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-3 font-mono text-[13px] sm:grid-cols-2">
            {META.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-ink/75">
                <Icon className="size-4 shrink-0 text-ink/40" strokeWidth={1.5} />
                <span>{label}</span>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button className="flex items-center gap-2 rounded-md bg-terracotta px-5 py-2.5 font-mono text-sm text-cream transition-colors hover:bg-terracotta/90">
              Seguir jugador <Plus className="size-4" strokeWidth={1.5} />
            </button>
            <button className="flex items-center gap-2 rounded-md border border-ink/20 px-5 py-2.5 font-mono text-sm text-ink transition-colors hover:bg-ink/5">
              Compartir ficha <Share2 className="size-4" strokeWidth={1.5} />
            </button>
            <span className="ml-auto font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {followers.toLocaleString('es-ES')} Seguidores
            </span>
          </div>
        </div>

        {/* Columna derecha — tarjeta de ranking */}
        <div className="flex flex-col rounded-xl bg-forest p-7 text-cream md:p-9">
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest">
            <span className="text-lime">Ranking · Temporada 2026</span>
            <span className="text-cream/55">Comunidad Valenciana</span>
          </div>

          <div className="mt-6 flex items-end gap-4">
            <span className="font-heading text-8xl leading-none text-lime md:text-9xl">
              {String(rank).padStart(2, '0')}
            </span>
            <div className="mb-2 flex flex-col gap-1 font-mono text-xs uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-lime">
                <TrendingUp className="size-3.5" strokeWidth={1.5} />+{rankDelta} puestos
              </span>
              <span className="text-cream/55">{points.toLocaleString('es-ES')} pts</span>
            </div>
          </div>

          {/* Forma reciente */}
          <div className="mt-8 border-t border-cream/12 pt-6">
            <p className="font-mono text-xs uppercase tracking-widest text-cream/55">
              Forma reciente · Últimos 5 partidos
            </p>
            <div className="mt-3 flex gap-2">
              {form.map((r, i) => (
                <span
                  key={i}
                  className={`flex size-10 items-center justify-center rounded-md font-mono text-sm ${
                    r === 'W'
                      ? 'bg-lime/15 text-lime'
                      : 'border border-cream/20 text-cream/50'
                  }`}
                >
                  {r === 'W' ? 'V' : 'D'}
                </span>
              ))}
            </div>
          </div>

          {/* Pie */}
          <div className="mt-auto flex items-center justify-between border-t border-cream/12 pt-6 font-mono text-xs uppercase tracking-widest">
            <span className="flex items-center gap-2 text-lime">
              <span className="text-[0.7em]">●</span> Próximo: Cuartos · 17:00
            </span>
            <span className="text-cream/50">Open de Verano</span>
          </div>
        </div>
      </div>
    </section>
  )
}
