import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type LiveMatch = {
  status: string
  court: string
  teamA: string
  teamB: string
  scoreA: number[]
  scoreB: number[]
  winner: 'a' | 'b'
}

type UpcomingMatch = {
  time: string
  teamA: string
  teamB: string
  meta: string
  court: string
}

const LIVE: LiveMatch[] = [
  {
    status: 'En juego · 1ª M · Cuartos',
    court: 'Pista Central',
    teamA: 'Puig / Marín',
    teamB: 'Lozano / Reig',
    scoreA: [6, 4, 3],
    scoreB: [3, 6, 4],
    winner: 'a',
  },
  {
    status: 'En juego · 1ª F · Cuartos',
    court: 'Pista Pacífico',
    teamA: 'Cruz / Mira',
    teamB: 'Soler / Gil',
    scoreA: [7, 2],
    scoreB: [5, 4],
    winner: 'a',
  },
  {
    status: 'En juego · 2ª M · Octavos',
    court: 'Pista Atlántico',
    teamA: 'García / Ros',
    teamB: 'Bru / Pla',
    scoreA: [6, 3],
    scoreB: [4, 5],
    winner: 'a',
  },
]

const UPCOMING: UpcomingMatch[] = [
  { time: '16:30', teamA: 'Verdú / Mas', teamB: 'Climent / B.', meta: '2ª F · Oct', court: 'Sirocco' },
  { time: '17:00', teamA: 'Asensi / Toro', teamB: 'Hidalgo / Ll.', meta: '1ª M · Cuartos', court: 'Central' },
  { time: '17:30', teamA: 'Mtz / Vidal', teamB: 'López / Sanz', meta: '2ª M · Oct', court: 'Mistral' },
  { time: '18:00', teamA: 'García / Mira', teamB: 'Bru / Toro', meta: 'Mixto · 1ª J.', court: 'Pacífico' },
  { time: '18:30', teamA: 'Bru / Pla', teamB: 'Asensi / Cruz', meta: '1ª F · Cuartos', court: 'Central' },
  { time: '19:30', teamA: 'Mira / Soler', teamB: 'Pla / Climent', meta: '2ª F · Oct', court: 'Atlántico' },
]

export function OnLive() {
  return (
    <section className="bg-ink text-cream">
      <div className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-lime">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              Jornada en curso · Martes 25 jun
            </p>
            <h2 className="mt-4 font-heading text-5xl leading-none text-cream md:text-6xl">
              Hoy <em className="italic text-cream/70">en este momento.</em>
            </h2>
          </div>
          <a
            href="/pistas"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-lime transition-colors hover:text-cream"
          >
            Ver todas las pistas <ArrowRight className="size-3.5" />
          </a>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-lime">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              En vivo · {LIVE.length} partidos
            </p>

            <div className="mt-4 rounded-md border border-cream/15 bg-cream/[0.02]">
              {LIVE.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex flex-col gap-3 px-6 py-6',
                    i > 0 && 'border-t border-cream/10',
                  )}
                >
                  <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider">
                    <p className="flex items-center gap-2 text-lime">
                      <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                      {m.status}
                    </p>
                    <p className="text-cream/60">{m.court}</p>
                  </div>

                  <div className="flex items-start justify-between gap-6">
                    <div className="flex flex-col font-serif text-2xl leading-tight">
                      <span className="text-cream">{m.teamA}</span>
                      <span className="italic text-cream/50">vs. {m.teamB}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 text-right font-mono text-2xl tabular-nums">
                      {m.scoreA.map((s, idx) => (
                        <span
                          key={`a${idx}`}
                          className={
                            m.winner === 'a' && idx === m.scoreA.length - 1
                              ? 'text-lime'
                              : 'text-cream'
                          }
                        >
                          {s}
                        </span>
                      ))}
                      {m.scoreB.map((s, idx) => (
                        <span key={`b${idx}`} className="text-cream/50">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/60">
              Siguientes · {UPCOMING.length} partidos
            </p>

            <ul className="mt-4 flex flex-col">
              {UPCOMING.map((m, i) => (
                <li
                  key={i}
                  className={cn(
                    'grid grid-cols-[60px_1fr_auto] items-center gap-6 py-4',
                    i > 0 && 'border-t border-cream/10',
                  )}
                >
                  <span className="font-mono text-sm text-cream/80">{m.time}</span>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm">
                      <span className="text-cream">{m.teamA}</span>{' '}
                      <span className="italic text-cream/40">vs.</span>{' '}
                      <span className="text-cream">{m.teamB}</span>
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-cream/40">
                      {m.meta}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-cream/60">
                    {m.court}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
