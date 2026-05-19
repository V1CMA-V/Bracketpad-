import { ArrowRight } from 'lucide-react'

type Status = 'playing' | 'upcoming' | 'finished'

type Category = {
  index: string
  badge: string
  name: string
  round: string
  drawCurrent: number
  drawTotal: number
  prize: string
  status: Status
  letter: string
}

const CATEGORIES: Category[] = [
  { index: '01 / 06', badge: 'M · 1ª', name: '1ª masculina', round: 'Cuartos · 4/8', drawCurrent: 32, drawTotal: 32, prize: '€1.200', status: 'playing', letter: 'M' },
  { index: '02 / 06', badge: 'F · 1ª', name: '1ª femenina', round: 'Cuartos · 6/8', drawCurrent: 32, drawTotal: 32, prize: '€1.200', status: 'playing', letter: 'F' },
  { index: '03 / 06', badge: 'M · 2ª', name: '2ª masculina', round: 'Octavos · 12/16', drawCurrent: 32, drawTotal: 32, prize: '€500', status: 'playing', letter: 'M' },
  { index: '04 / 06', badge: 'F · 2ª', name: '2ª femenina', round: 'Octavos · 9/14', drawCurrent: 28, drawTotal: 32, prize: '€500', status: 'playing', letter: 'F' },
  { index: '05 / 06', badge: 'X · —', name: 'Mixto', round: 'Inicia mañana', drawCurrent: 24, drawTotal: 32, prize: '€600', status: 'upcoming', letter: 'X' },
  { index: '06 / 06', badge: 'M · 4ª', name: '4ª masculina · vet +45', round: 'Finalizada', drawCurrent: 12, drawTotal: 16, prize: '€200', status: 'finished', letter: 'M' },
]

const FILTERS = ['Todas', 'En juego', 'Próximas', 'Finalizadas'] as const

const STATUS_LABEL: Record<Status, string> = {
  playing: 'En juego',
  upcoming: 'Próxima',
  finished: 'Finalizada',
}

function dotColor(status: Status) {
  switch (status) {
    case 'playing':
      return 'bg-forest'
    case 'upcoming':
      return 'bg-ochre'
    case 'finished':
      return 'bg-muted-foreground'
  }
}

function barColor(status: Status) {
  switch (status) {
    case 'playing':
      return 'bg-forest'
    case 'upcoming':
      return 'bg-ochre'
    case 'finished':
      return 'bg-ink/40'
  }
}

export function Categories() {
  return (
    <section className="bg-cream px-6 py-16 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Seis categorías · 128 jugadores
            </p>
            <h2 className="mt-3 font-heading text-5xl leading-none text-ink md:text-6xl">
              Los <em className="italic">cuadros.</em>
            </h2>
            <p className="mt-4 font-serif text-base italic text-muted-foreground">
              Cuatro cuadros en juego, uno arranca mañana y la 4ª masculina de veteranos ya tiene
              campeones — Climent / Beneyto del Padel Nord.
            </p>
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

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => {
            const pct = Math.round((c.drawCurrent / c.drawTotal) * 100)
            return (
              <article
                key={c.index}
                className="relative flex flex-col overflow-hidden rounded-md border border-border bg-card p-6"
              >
                <span
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none font-heading text-[10rem] italic leading-none text-ink/[0.04]"
                  aria-hidden
                >
                  {c.letter}
                </span>

                <header className="relative flex items-start justify-between font-mono text-xs uppercase tracking-wider">
                  <p className="text-muted-foreground">{c.index}</p>
                  <p className="flex items-center gap-2 text-ink">
                    <span className={'h-1.5 w-1.5 rounded-full ' + dotColor(c.status)} />
                    {STATUS_LABEL[c.status]}
                  </p>
                </header>

                <span className="relative mt-4 w-fit rounded-sm bg-muted/70 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-ink">
                  {c.badge}
                </span>

                <h3 className="relative mt-3 font-heading text-3xl leading-tight text-ink">
                  {c.name}
                </h3>

                <p className="relative mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {c.round}
                </p>

                <hr className="relative my-5 border-border" />

                <div className="relative flex items-end justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      Cuadro
                    </span>
                    <span className="font-mono text-xl text-ink">
                      {c.drawCurrent}/{c.drawTotal}
                    </span>
                    <span className="mt-1 block h-[3px] w-24 bg-muted">
                      <span
                        className={'block h-full ' + barColor(c.status)}
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      Premio
                    </span>
                    <span className="font-mono text-xl text-terracotta">{c.prize}</span>
                  </div>

                  <button className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-ink hover:text-terracotta transition-colors">
                    Cuadro <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
