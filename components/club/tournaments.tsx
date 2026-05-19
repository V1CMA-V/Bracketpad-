import { ChevronRight } from 'lucide-react'

type Tournament = {
  index: string
  name: string
  meta: string
  status: string
  live: boolean
  dates: string
  registered: number
  prize: string
}

const TOURNAMENTS: Tournament[] = [
  {
    index: '01',
    name: 'Open de Verano',
    meta: '1ª — 4ª · masc · fem · mixto',
    status: 'En juego · Cuartos',
    live: true,
    dates: '15 — 28 Jun',
    registered: 128,
    prize: '€3.500',
  },
  {
    index: '02',
    name: 'Trofeo del Olivar XII',
    meta: '8 categorías · cuadro a 32',
    status: 'Inscripciones · Cierra 04 Jul',
    live: true,
    dates: '10 — 14 Jul',
    registered: 142,
    prize: '€6.000',
  },
  {
    index: '03',
    name: 'Circuito Veteranos',
    meta: '+45 · liga mensual',
    status: 'En curso · J6 de J9',
    live: true,
    dates: 'May — Sep',
    registered: 48,
    prize: '€800',
  },
  {
    index: '04',
    name: 'Trofeo Sant Joan',
    meta: '3ª — 4ª masculina',
    status: 'Programado',
    live: true,
    dates: '21 — 23 Jun',
    registered: 64,
    prize: '€1.500',
  },
]

const FILTERS = ['Todos', 'En juego', 'Próximos', 'Histórico'] as const

export function Tournaments() {
  return (
    <section className="bg-cream px-6 py-16 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Cartelera del club · 2026
            </p>
            <h2 className="mt-3 font-heading text-5xl leading-none text-ink md:text-6xl">
              Cuatro torneos <em className="italic">activos.</em>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {FILTERS.map((f, i) => (
              <button
                key={f}
                className={
                  'rounded-sm px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ' +
                  (i === 0
                    ? 'bg-ink text-cream'
                    : 'border border-ink/15 bg-transparent text-ink hover:bg-ink/5')
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-md border border-border bg-card">
          {TOURNAMENTS.map((t, i) => (
            <button
              key={t.index}
              className={
                'group flex w-full items-center gap-6 px-6 py-6 text-left transition-colors hover:bg-muted/40 ' +
                (i > 0 ? 'border-t border-border' : '')
              }
            >
              <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground">
                {t.index}
              </span>

              <div className="min-w-0 flex-[2]">
                <p className="font-heading text-2xl leading-tight text-ink">{t.name}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{t.meta}</p>
              </div>

              <div className="flex min-w-0 flex-[2] flex-col gap-2">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-muted/70 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-ink">
                  {t.live && <span className="text-forest">●</span>}
                  {t.status}
                </span>
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {t.dates}
                </span>
              </div>

              <div className="flex w-28 shrink-0 flex-col items-start">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Inscritos
                </span>
                <span className="font-heading text-2xl text-ink">{t.registered}</span>
              </div>

              <div className="flex w-28 shrink-0 flex-col items-end">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Premio
                </span>
                <span className="font-heading text-2xl text-terracotta">{t.prize}</span>
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
