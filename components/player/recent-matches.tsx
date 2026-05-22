import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type SetScore = { a: number; b: number; tb?: number }

type MatchRow = {
  date: string
  competition: string
  round: string
  partner: string
  rival: string
  sets: SetScore[]
  won: boolean
}

const MATCHES: MatchRow[] = [
  { date: '24 jun', competition: 'Open de Verano', round: 'Cuartos', partner: 'D. Marín', rival: 'Lozano / Roig', sets: [{ a: 6, b: 4 }, { a: 6, b: 3 }], won: true },
  { date: '23 jun', competition: 'Open de Verano', round: 'Octavos', partner: 'D. Marín', rival: 'Climent / Toro', sets: [{ a: 6, b: 2 }, { a: 7, b: 5 }], won: true },
  { date: '14 jun', competition: 'Liga Mediterránea', round: 'J. 9', partner: 'D. Marín', rival: 'García / Ros', sets: [{ a: 4, b: 6 }, { a: 6, b: 7, tb: 4 }], won: false },
  { date: '07 jun', competition: 'Liga Mediterránea', round: 'J. 8', partner: 'A. Soler', rival: 'Verdú / Mas', sets: [{ a: 6, b: 1 }, { a: 6, b: 4 }], won: true },
  { date: '31 may', competition: 'Trofeo Olivar', round: 'Final', partner: 'D. Marín', rival: 'Asensi / Bru', sets: [{ a: 7, b: 6, tb: 7 }, { a: 6, b: 4 }], won: true },
  { date: '24 may', competition: 'Trofeo Olivar', round: 'Semis', partner: 'D. Marín', rival: 'Soler / Gil', sets: [{ a: 6, b: 3 }, { a: 3, b: 6 }, { a: 10, b: 8 }], won: true },
]

const COLS =
  'grid grid-cols-[80px_minmax(0,1.4fr)_90px_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_72px] items-center gap-4'

export function RecentMatches() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Resultados · Últimos partidos
          </p>
          <h2 className="mt-2 font-heading text-4xl leading-none tracking-tight text-ink md:text-5xl">
            Cómo le va <em className="italic">en pista.</em>
          </h2>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-forest" /> Victoria
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-terracotta" /> Derrota
          </span>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[860px]">
          <div
            className={`${COLS} border-b border-border bg-muted/40 px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground`}
          >
            <span>Fecha</span>
            <span>Competición</span>
            <span>Ronda</span>
            <span>Compañero</span>
            <span>Rival</span>
            <span>Marcador</span>
            <span className="text-right">Resultado</span>
          </div>

          {MATCHES.map((m, i) => (
            <div
              key={i}
              className={`${COLS} border-b border-border px-5 py-4 last:border-b-0`}
            >
              <span className="font-mono text-xs text-muted-foreground">
                {m.date}
              </span>
              <span className="font-heading text-base text-ink">
                {m.competition}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {m.round}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {m.partner}
              </span>
              <span className="font-serif text-base italic text-muted-foreground">
                {m.rival}
              </span>
              <span className="font-mono text-sm text-ink tabular-nums">
                {m.sets.map((s, idx) => (
                  <span key={idx}>
                    {idx > 0 && (
                      <span className="mx-1.5 text-muted-foreground">·</span>
                    )}
                    <span>
                      {s.a}·{s.b}
                      {s.tb !== undefined && (
                        <sup className="ml-0.5 text-[0.6em] text-muted-foreground">
                          {s.tb}
                        </sup>
                      )}
                    </span>
                  </span>
                ))}
              </span>
              <span
                className={cn(
                  'justify-self-end rounded-sm px-2 py-1 font-mono text-[11px] uppercase tracking-widest',
                  m.won
                    ? 'bg-forest text-cream'
                    : 'bg-terracotta text-cream',
                )}
              >
                {m.won ? 'Gana' : 'Pierde'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <span>6 de 184 partidos</span>
        <button className="flex items-center gap-2 transition-colors hover:text-ink">
          Ver historial completo
          <ArrowRight className="size-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </section>
  )
}
