type Status = 'playing' | 'next' | 'free' | 'closed'

type Court = {
  index: string
  name: string
  type: string
  surface: string
  status: Status
  detail: string
}

const COURTS: Court[] = [
  { index: '01', name: 'Central', type: 'Cubierta', surface: 'Césped', status: 'playing', detail: 'Final 1ª masc' },
  { index: '02', name: 'Pacífico', type: 'Cubierta', surface: 'Césped', status: 'playing', detail: '2ª fem · cuartos' },
  { index: '03', name: 'Atlántico', type: 'Cubierta', surface: 'Césped', status: 'next', detail: '17:00 · 3ª mixta' },
  { index: '04', name: 'Sirocco', type: 'Aire', surface: 'Césped', status: 'playing', detail: 'Vet +45' },
  { index: '05', name: 'Levante', type: 'Aire', surface: 'Césped', status: 'free', detail: 'libre 19:30' },
  { index: '06', name: 'Mistral', type: 'Aire', surface: 'Rápida', status: 'next', detail: '18:30 · 4ª masc' },
  { index: '07', name: 'Tramuntana', type: 'Aire', surface: 'Césped', status: 'free', detail: 'libre 18:00' },
  { index: '08', name: 'Garbí', type: 'Aire', surface: 'Césped', status: 'closed', detail: 'mantenimiento' },
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

export function Installations() {
  return (
    <section className="bg-cream px-6 py-16 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Instalaciones
            </p>
            <h2 className="mt-3 font-heading text-5xl leading-none text-ink md:text-6xl">
              Las <em className="italic">ocho</em> pistas.
            </h2>
            <p className="mt-4 font-serif text-base italic text-muted-foreground">
              Tres cubiertas con césped rápido y cinco al aire libre frente al puerto. Vista en
              tiempo real del estado de cada pista.
            </p>
          </div>

          <ul className="flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-wider text-ink">
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 bg-forest" />
              En juego
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 bg-ochre" />
              Próximo
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 border border-ink/30 bg-card" />
              Libre
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 bg-muted" />
              Cerrada
            </li>
          </ul>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COURTS.map((c) => (
            <article
              key={c.index}
              className={
                'relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-md p-5 ' +
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
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider opacity-70">
                    Pista {c.index}
                  </p>
                  <p className="mt-4 font-heading text-3xl leading-none">{c.name}</p>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-wider opacity-80">
                    {c.type} · {c.surface}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  <span className={'h-2 w-2 rounded-full ' + dotColor(c.status)} />
                  {STATUS_LABEL[c.status]}
                </span>
              </header>

              <p className="font-mono text-xs lowercase opacity-90">{c.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
