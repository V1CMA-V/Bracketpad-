import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type MatchState = 'live' | 'finished' | 'scheduled' | 'pending' | 'tbd'

type Player = {
  name: string
  seed?: number
  winner?: boolean
}

type BracketMatch = {
  state: MatchState
  players: [Player, Player]
  detail: string
  liveScore?: string
}

const QUARTERS: BracketMatch[] = [
  {
    state: 'live',
    players: [
      { name: 'Puig / Marín', seed: 1, winner: true },
      { name: 'Lozano / Reig', seed: 8 },
    ],
    detail: '',
    liveScore: '6·3 · 4·6 · 6·4',
  },
  {
    state: 'finished',
    players: [
      { name: 'García / Ros', seed: 4 },
      { name: 'Mtz / Vidal', seed: 5, winner: true },
    ],
    detail: '4·6 · 6·7',
  },
  {
    state: 'pending',
    players: [
      { name: 'Bru / Pla', seed: 3 },
      { name: 'Verdú / Mas', seed: 6 },
    ],
    detail: 'Pendiente',
  },
  {
    state: 'scheduled',
    players: [
      { name: 'Asensi / Toro', seed: 2 },
      { name: 'Hidalgo / Ll.', seed: 7 },
    ],
    detail: '17:00',
  },
]

const SEMIS: BracketMatch[] = [
  {
    state: 'scheduled',
    players: [
      { name: 'Puig / Marín' },
      { name: 'Mtz / Vidal' },
    ],
    detail: '27 jun · 18:00',
  },
  {
    state: 'tbd',
    players: [{ name: '?' }, { name: '?' }],
    detail: '27 jun · 19:30',
  },
]

const FINAL: BracketMatch = {
  state: 'tbd',
  players: [{ name: '?' }, { name: '?' }],
  detail: '28 jun · 19:00 · Pista Central',
}

export function CategoriesDetails() {
  return (
    <section className="bg-cream px-6 py-16 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Cuadro destacado · 1ª masculina
            </p>
            <h2 className="mt-3 font-heading text-5xl leading-none text-ink md:text-6xl">
              Camino a <em className="italic">la final.</em>
            </h2>
            <p className="mt-4 font-mono text-sm text-muted-foreground">
              Hoy se disputan los cuartos. La final se jugará el domingo 28 en pista central —
              entrada libre desde las 17:30.
            </p>
          </div>

          <button className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink hover:text-terracotta transition-colors">
            Cambiar categoría <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-10 rounded-md border border-border bg-card p-6 md:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cuartos */}
            <BracketColumn date="25 jun" title="Cuartos">
              {QUARTERS.map((m, i) => (
                <MatchCard key={i} match={m} />
              ))}
            </BracketColumn>

            {/* Semifinales */}
            <BracketColumn date="27 jun" title="Semifinales">
              <div className="flex h-full flex-col justify-around gap-6">
                {SEMIS.map((m, i) => (
                  <MatchCard key={i} match={m} />
                ))}
              </div>
            </BracketColumn>

            {/* Final */}
            <BracketColumn date="28 jun" title="Final">
              <div className="flex h-full flex-col justify-center gap-6">
                <MatchCard match={FINAL} isFinal />
                <div className="rounded-md bg-ink p-6 text-center text-cream">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime">
                    Premio
                  </p>
                  <p className="mt-2 font-heading text-4xl">€1.200</p>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-cream/60">
                    + Trofeo Olivar
                  </p>
                </div>
              </div>
            </BracketColumn>
          </div>
        </div>
      </div>
    </section>
  )
}

function BracketColumn({
  date,
  title,
  children,
}: {
  date: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {date}
      </p>
      <h3 className="mt-1 font-heading text-2xl italic text-ink">{title}</h3>
      <hr className="mt-3 border-border" />
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </div>
  )
}

function MatchCard({ match, isFinal }: { match: BracketMatch; isFinal?: boolean }) {
  const isLive = match.state === 'live'
  const isTbd = match.state === 'tbd'

  return (
    <div
      className={cn(
        'relative rounded-sm border px-4 pb-3 pt-4 transition-colors',
        isLive
          ? 'border-terracotta bg-card'
          : isTbd
            ? 'border-border bg-muted/30 text-muted-foreground'
            : 'border-border bg-card',
      )}
    >
      {isLive && (
        <span className="absolute -top-2.5 right-3 flex items-center gap-1.5 rounded-sm bg-terracotta px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cream">
          <span className="h-1 w-1 rounded-full bg-cream" /> En vivo
        </span>
      )}

      {match.players.map((p, idx) => (
        <div
          key={idx}
          className={cn(
            'flex items-center justify-between font-mono text-sm',
            idx === 1 && 'mt-1',
          )}
        >
          <span
            className={cn(
              'flex items-center gap-2',
              p.winner ? 'text-ink' : 'text-ink/80',
              isTbd && 'italic text-muted-foreground/60',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                p.winner ? 'bg-terracotta' : 'bg-transparent',
              )}
            />
            {p.name}
          </span>
          {p.seed !== undefined && (
            <span className="font-mono text-xs text-muted-foreground">({p.seed})</span>
          )}
        </div>
      ))}

      {(match.liveScore || match.detail) && (
        <p
          className={cn(
            'mt-2 font-mono text-xs uppercase tracking-wider',
            isLive ? 'text-terracotta' : 'text-muted-foreground',
          )}
        >
          {match.liveScore ?? match.detail}
          {isFinal && (
            <span className="ml-2 text-terracotta">
              <span className="mr-1">★</span>Final
            </span>
          )}
        </p>
      )}
    </div>
  )
}
