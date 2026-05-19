type Status = 'playing' | 'next' | 'free' | 'closed'

type Court = {
  index: string
  name: string
  status: Status
  detail: string
}

const COURTS: Court[] = [
  { index: '01', name: 'Central', status: 'playing', detail: '1ª M · cuartos' },
  { index: '02', name: 'Pacífico', status: 'playing', detail: '1ª F · cuartos' },
  { index: '03', name: 'Atlántico', status: 'playing', detail: '2ª M · octavos' },
  { index: '04', name: 'Sirocco', status: 'next', detail: '16:30 · 2ª F' },
  { index: '05', name: 'Levante', status: 'free', detail: 'libre 18:00' },
  { index: '06', name: 'Mistral', status: 'next', detail: '17:30 · 2ª M' },
  { index: '07', name: 'Tramuntana', status: 'next', detail: '18:00 · Mixto' },
  { index: '08', name: 'Garbí', status: 'closed', detail: 'mantenimiento' },
]

const STATUS_LABEL: Record<Status, string> = {
  playing: 'En juego',
  next: 'Próximo',
  free: 'Libre',
  closed: 'Cerrada',
}

function cardStyles(status: Status) {
  switch (status) {
    case 'playing':
      return 'bg-forest text-cream'
    case 'next':
      return 'bg-ochre text-ink'
    case 'free':
      return 'bg-card text-ink border border-border'
    case 'closed':
      return 'bg-muted text-ink/50'
  }
}

function dotColor(status: Status) {
  switch (status) {
    case 'playing':
      return 'bg-lime'
    case 'next':
      return 'bg-ink'
    case 'free':
      return 'bg-transparent border border-ink/40'
    case 'closed':
      return 'bg-ink/40'
  }
}

export function ClubInfo() {
  return (
    <section className="bg-cream px-6 py-16 md:px-12">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
        {/* Left */}
        <div className="flex flex-col">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Sede · Club Marítimo del Olivar
          </p>
          <h2 className="mt-3 font-heading text-5xl leading-[1.05] text-ink md:text-6xl">
            Ocho pistas <em className="italic">frente al</em> puerto.
          </h2>
          <p className="mt-5 max-w-md font-mono text-sm text-muted-foreground">
            Tres pistas cubiertas con césped rápido y cinco al aire libre. La pista central se
            reserva los días 27 y 28 para semifinales y finales.
          </p>

          <div className="mt-8 rounded-md border border-border bg-card p-6">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Cómo llegar
            </p>
            <p className="mt-2 font-heading text-2xl text-ink">
              Av. del Puerto, <em className="italic">238</em>
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              46011 Valencia · Metro Marítim
            </p>
          </div>

          <ul className="mt-6 flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-wider text-ink">
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 bg-forest" /> En juego
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 bg-ochre" /> Próximo
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 border border-ink/30 bg-card" /> Libre
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 bg-muted" /> Cerrada
            </li>
          </ul>
        </div>

        {/* Right — court grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COURTS.map((c) => (
            <article
              key={c.index}
              className={
                'relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-md p-4 ' +
                cardStyles(c.status)
              }
              style={{
                backgroundImage:
                  c.status === 'playing' || c.status === 'next' || c.status === 'closed'
                    ? 'repeating-linear-gradient(90deg, transparent 0 calc(25% - 1px), rgba(255,255,255,0.08) calc(25% - 1px) 25%)'
                    : 'repeating-linear-gradient(90deg, transparent 0 calc(25% - 1px), rgba(0,0,0,0.05) calc(25% - 1px) 25%)',
              }}
            >
              <header className="flex items-start justify-between">
                <p className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                  P {c.index}
                </p>
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                  <span className={'h-1.5 w-1.5 rounded-full ' + dotColor(c.status)} />
                  {STATUS_LABEL[c.status]}
                </span>
              </header>

              <p className="font-heading text-2xl leading-tight">{c.name}</p>

              <p className="font-mono text-[11px] lowercase opacity-90">{c.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
