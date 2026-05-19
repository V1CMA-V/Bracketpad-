import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type SetScore = {
  a: number
  b: number
  tb?: number
}

type Result = {
  date: string
  category: string
  champions?: boolean
  winnerInitials: [string, string]
  winner: string
  loser: string
  sets: SetScore[]
  superTb?: boolean
  duration: string
}

const RESULTS: Result[] = [
  { date: '24 jun · 21:45', category: '1ª M · oct', winnerInitials: ['P', 'M'], winner: 'Puig / Marín', loser: 'Climent / Toro', sets: [{ a: 6, b: 2 }, { a: 6, b: 3 }], duration: '1h 12m' },
  { date: '24 jun · 20:30', category: '1ª F · oct', winnerInitials: ['C', 'M'], winner: 'Cruz / Mira', loser: 'Pla / Bru', sets: [{ a: 7, b: 5 }, { a: 6, b: 4 }], duration: '1h 38m' },
  { date: '24 jun · 19:00', category: '2ª M · oct', winnerInitials: ['G', 'R'], winner: 'García / Ros', loser: 'Verdú / Mas', sets: [{ a: 6, b: 4 }, { a: 4, b: 6 }, { a: 7, b: 6, tb: 5 }], duration: '2h 24m' },
  { date: '24 jun · 18:30', category: '1ª M · oct', winnerInitials: ['L', 'R'], winner: 'Lozano / Reig', loser: 'Asensi / Bru', sets: [{ a: 6, b: 1 }, { a: 6, b: 2 }], duration: '58m' },
  { date: '24 jun · 17:00', category: '2ª F · oct', winnerInitials: ['S', 'G'], winner: 'Soler / Gil', loser: 'Hidalgo / Ros', sets: [{ a: 6, b: 3 }, { a: 3, b: 6 }, { a: 10, b: 8 }], superTb: true, duration: '2h 04m' },
  { date: '24 jun · 16:00', category: 'Vet +45 · final', champions: true, winnerInitials: ['C', 'B'], winner: 'Climent / Beneyto', loser: 'Mtz / Pla', sets: [{ a: 7, b: 6, tb: 7 }, { a: 6, b: 4 }], duration: '1h 54m' },
]

const FILTERS = ['Todas las cat.', '1ª masc', '1ª fem', '2ª masc', 'Mixto', 'Vet'] as const

export function Results() {
  return (
    <section className="bg-cream px-6 py-16 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Resultados · Últimas 24 horas
            </p>
            <h2 className="mt-3 font-heading text-5xl leading-none text-ink md:text-6xl">
              Marcadores <em className="italic">recientes.</em>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f, i) => (
              <button
                key={f}
                className={cn(
                  'rounded-sm px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors',
                  i === 0
                    ? 'bg-ink text-cream'
                    : 'border border-ink/15 bg-transparent text-ink hover:bg-ink/5',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-md border border-border bg-card">
          {/* Header */}
          <div className="grid grid-cols-[140px_140px_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_90px] items-center gap-4 border-b border-border bg-muted/40 px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>Fecha</span>
            <span>Categoría</span>
            <span>Gana</span>
            <span>Pierde</span>
            <span className="text-right">Marcador</span>
            <span className="text-right">Duración</span>
          </div>

          {RESULTS.map((r, i) => (
            <div
              key={i}
              className={cn(
                'grid grid-cols-[140px_140px_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_90px] items-center gap-4 px-6 py-5',
                i > 0 && 'border-t border-border',
              )}
            >
              <span className="font-mono text-xs text-muted-foreground">{r.date}</span>

              <div className="flex flex-col gap-1">
                <span className="w-fit rounded-sm bg-muted/70 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-ink">
                  {r.category}
                </span>
                {r.champions && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-terracotta">
                    ★ Campeones
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <span className="z-10 flex h-7 w-7 items-center justify-center rounded-full border border-card bg-terracotta font-mono text-[11px] text-cream">
                    {r.winnerInitials[0]}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-card bg-forest font-mono text-[11px] text-cream">
                    {r.winnerInitials[1]}
                  </span>
                </div>
                <span className="font-serif text-base text-ink">{r.winner}</span>
              </div>

              <span className="font-serif text-base italic text-muted-foreground">
                {r.loser}
              </span>

              <div className="flex flex-col items-end">
                <span className="font-mono text-base text-ink tabular-nums">
                  {r.sets.map((s, idx) => (
                    <span key={idx}>
                      {idx > 0 && <span className="mx-2 text-muted-foreground">·</span>}
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
                {r.superTb && (
                  <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-terracotta">
                    Super TB
                  </span>
                )}
              </div>

              <span className="text-right font-mono text-xs text-muted-foreground">
                {r.duration}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <p>48 partidos disputados · 46 restantes</p>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-ink hover:text-terracotta transition-colors"
          >
            Ver todos los resultados <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  )
}
