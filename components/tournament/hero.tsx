import { Button } from '@/components/ui/button'
import { ArrowRight, Bell, Calendar, MapPin, Trophy, Users } from 'lucide-react'

type Player = {
  initials: [string, string]
  names: string
  seed: number
  serving?: boolean
  sets: [number, number, number]
}

export function Hero({
  tournament,
  name = 'Open de Verano',
  year = 2026,
  edition = 'XVIII',
  category = 'Masters 1000',
  status = 'En juego — Cuartos',
  description = 'Catorce días, ocho pistas, seis categorías. La cita más esperada del calendario mediterráneo, en el Club Marítimo del Olivar.',
  dates = '15 — 28 Jun 2026',
  venue = 'C. Marítimo del Olivar · Valencia',
  participants = '128 inscritos · 6 categorías',
  prize = 'Premio total €3.500',
  followers = 2840,
  match = {
    court: 'Pista Central',
    elapsed: '1h 38m',
    title: '1ª masculina · cuartos',
    players: [
      {
        initials: ['P', 'M'],
        names: 'Puig / Marín',
        seed: 3,
        serving: true,
        sets: [6, 4, 3],
      },
      {
        initials: ['L', 'R'],
        names: 'Lozano / Reig',
        seed: 6,
        sets: [3, 6, 4],
      },
    ] as [Player, Player],
    goldenPoint: '40 — 40',
  },
}: {
  tournament: string
  name?: string
  year?: number
  edition?: string
  category?: string
  status?: string
  description?: string
  dates?: string
  venue?: string
  participants?: string
  prize?: string
  followers?: number
  match?: {
    court: string
    elapsed: string
    title: string
    players: [Player, Player]
    goldenPoint: string
  }
}) {
  void tournament
  const [first, ...rest] = name.split(' ')
  const tail = rest.join(' ')

  return (
    <section className="bg-cream px-6 py-12 md:px-12 md:py-16">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
        {/* Left */}
        <div className="flex flex-col">
          <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-px w-10 bg-muted-foreground/60" />
            <span>Ed. {edition}</span>
            <span>·</span>
            <span>{category}</span>
            <span>·</span>
            <span className="flex items-center gap-2 text-terracotta">
              <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
              {status}
            </span>
          </div>

          <h1 className="mt-8 font-bold font-heading text-6xl leading-none tracking-tight text-ink md:text-7xl lg:text-[8.5rem]">
            <span className="block">{first}</span>
            <span className="inline-flex items-baseline gap-4">
              <span className="italic">{tail || ''}</span>
              <span className="inline-flex translate-y-[-0.6em] items-center rounded-sm border border-terracotta px-2 py-1 font-mono text-xs font-normal not-italic uppercase tracking-wider text-terracotta">
                {year}
              </span>
            </span>
          </h1>

          <p className="mt-8 max-w-md font-serif text-lg italic leading-relaxed text-ink/80">
            {description}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Chip icon={<Calendar className="h-3.5 w-3.5" />} label={dates} />
            <Chip icon={<MapPin className="h-3.5 w-3.5" />} label={venue} />
            <Chip
              icon={<Users className="h-3.5 w-3.5" />}
              label={participants}
            />
            <Chip icon={<Trophy className="h-3.5 w-3.5" />} label={prize} />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button className="gap-2 bg-terracotta px-5 py-2.5 text-cream hover:bg-terracotta/90">
              Inscripciones cerradas <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="border-ink/20 bg-transparent px-5 py-2.5 text-ink hover:bg-ink/5"
            >
              Ver cuadro completo
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-ink/20 bg-transparent text-ink hover:bg-ink/5"
              aria-label="Notify"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <span className="ml-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {followers.toLocaleString('es-ES')} Siguen el torneo
            </span>
          </div>
        </div>

        {/* Right — live match panel */}
        <div
          className="relative flex flex-col overflow-hidden rounded-sm bg-forest p-8 text-cream"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent 0 14px, rgba(255,255,255,0.04) 14px 15px)',
          }}
        >
          <header className="flex items-center justify-between font-mono text-xs uppercase tracking-wider">
            <p className="flex items-center gap-2 text-lime">
              <span>●</span>
              Partido destacado · En vivo
            </p>
            <p className="text-cream/70">
              {match.court} · {match.elapsed}
            </p>
          </header>

          <h3 className="mt-6 font-heading text-3xl italic leading-tight md:text-4xl">
            {match.title}
          </h3>

          <div className="mt-8 flex flex-col gap-5">
            {match.players.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <span className="z-10 flex h-8 w-8 items-center justify-center rounded-full border border-forest bg-terracotta font-mono text-xs text-cream">
                      {p.initials[0]}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-forest bg-ochre font-mono text-xs text-ink">
                      {p.initials[1]}
                    </span>
                  </div>
                  <div className="font-mono text-sm">
                    <p>
                      <span className="text-cream">{p.names}</span>{' '}
                      <span className="text-cream/60">({p.seed})</span>
                    </p>
                    {p.serving && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-lime">
                        <span>●</span> Al saque
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-6 font-heading text-3xl">
                  {p.sets.map((s, i) => (
                    <span
                      key={i}
                      className={
                        i === p.sets.length - 1 ? 'text-lime' : 'text-cream'
                      }
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="my-6 border-t border-cream/15" />

          <div className="flex-1" />

          <footer className="flex items-center justify-between font-mono text-xs uppercase tracking-wider">
            <p className="text-cream/70">Punto oro · {match.goldenPoint}</p>
            <button className="flex items-center gap-2 text-cream hover:text-lime transition-colors">
              Seguir partido <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </footer>
        </div>
      </div>
    </section>
  )
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 font-mono text-xs text-ink">
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </span>
  )
}
