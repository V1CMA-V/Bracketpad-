import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionHeader } from '../ui/section-header'

type SetScore = {
  a: number
  b: number
  tiebreak?: number
}

type Match = {
  status: string
  live: boolean
  teamA: string
  teamB: string
  sets: SetScore[]
  winner?: 'a' | 'b'
}

const matches: Match[] = [
  {
    status: 'En juego · 2ª M · Cuartos',
    live: true,
    teamA: 'García / Ros',
    teamB: 'Bru / Pla',
    sets: [
      { a: 6, b: 4 },
      { a: 3, b: 5 },
    ],
    winner: 'a',
  },
  {
    status: 'En juego · 3ª F · Semis',
    live: true,
    teamA: 'Cruz / Mira',
    teamB: 'Soler / Gil',
    sets: [
      { a: 7, b: 5 },
      { a: 2, b: 4 },
    ],
    winner: 'a',
  },
  {
    status: 'Final · 4ª M · 1/8',
    live: false,
    teamA: 'Verdú / Mas',
    teamB: 'Climent / B.',
    sets: [
      { a: 6, b: 3 },
      { a: 6, b: 4 },
    ],
  },
  {
    status: 'En juego · Mixto · Cuartos',
    live: true,
    teamA: 'Asensi / Toro',
    teamB: 'Hidalgo / Ll.',
    sets: [
      { a: 4, b: 6 },
      { a: 6, b: 6, tiebreak: 7 },
    ],
    winner: 'b',
  },
]

export function OnLive() {
  return (
    <section className="bg-ink text-cream">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="Ahora mismo · 6 pistas activas"
            title="En vivo"
            italic="en este momento"
            bullet
            variant="dark"
          />
          <a
            href="/pistas"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cream/80 transition-colors hover:text-lime"
          >
            Ver todas las pistas <ArrowRight className="size-3.5" />
          </a>
        </div>

        <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-cream/10">
          {matches.map((match, i) => (
            <li
              key={i}
              className={cn(
                'flex flex-col gap-4 py-6',
                'lg:px-6 sm:px-4',
                i > 0 && 'lg:border-l border-cream/10',
              )}
            >
              <MatchRow match={match} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function MatchRow({ match }: { match: Match }) {
  const muted = !match.live
  return (
    <>
      <p
        className={cn(
          'flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest',
          muted ? 'text-cream/40' : 'text-lime',
        )}
      >
        {match.live && <span className="size-1.5 rounded-full bg-lime" />}
        {match.status}
      </p>

      <div className="flex flex-col font-serif text-2xl leading-tight">
        <span className={muted ? 'text-cream/50' : 'text-cream'}>
          {match.teamA}
        </span>
        <span
          className={cn(
            'italic',
            muted ? 'text-cream/30' : 'text-cream/50',
          )}
        >
          vs. {match.teamB}
        </span>
      </div>

      <div className="flex items-baseline gap-4 font-mono text-2xl">
        {match.sets.map((set, idx) => (
          <span key={idx} className="flex items-baseline gap-2">
            {idx > 0 && <span className="text-cream/30">·</span>}
            <SetCell set={set} winner={match.winner} muted={muted} />
          </span>
        ))}
      </div>
    </>
  )
}

function SetCell({
  set,
  winner,
  muted,
}: {
  set: SetScore
  winner?: 'a' | 'b'
  muted: boolean
}) {
  const tone = (side: 'a' | 'b') => {
    if (muted) return 'text-cream/40'
    if (winner === side) return 'text-lime'
    return 'text-cream/60'
  }
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={tone('a')}>{set.a}</span>
      <span className="text-cream/30">·</span>
      <span className={tone('b')}>
        {set.b}
        {set.tiebreak !== undefined && (
          <sup className="ml-0.5 text-[0.55em] text-cream/60">
            {set.tiebreak}
          </sup>
        )}
      </span>
    </span>
  )
}
