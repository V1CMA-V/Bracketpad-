type Status = 'playing' | 'next' | 'free' | 'closed'

type Court = {
  index: string
  name: string
  type: string
  surface: string
  status: Status
  detail: string
}

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
      return 'border border-border bg-card text-ink'
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
      return 'border border-ink/40 bg-transparent'
    case 'closed':
      return 'bg-ink/40'
  }
}

export function Installations({
  courts,
  indoorCourts,
  outdoorCourts,
}: {
  courts: Court[]
  indoorCourts: number
  outdoorCourts: number
}) {
  const total = courts.length

  return (
    <section
      id="instalaciones"
      className="scroll-mt-20 bg-cream px-5 py-16 sm:px-6 md:px-12"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Instalaciones
            </p>
            <h2 className="mt-3 font-heading text-5xl leading-none text-ink md:text-6xl">
              {total === 0 ? (
                <>
                  Sin pistas <em className="italic">publicadas.</em>
                </>
              ) : (
                <>
                  Las <em className="italic">{total}</em>{' '}
                  {total === 1 ? 'pista' : 'pistas'}.
                </>
              )}
            </h2>
            {total > 0 && (
              <p className="mt-4 font-serif text-base italic text-muted-foreground">
                {indoorCourts > 0 &&
                  `${indoorCourts} ${indoorCourts === 1 ? 'cubierta' : 'cubiertas'}`}
                {indoorCourts > 0 && outdoorCourts > 0 && ' y '}
                {outdoorCourts > 0 &&
                  `${outdoorCourts} al aire libre`}
                . Estado en tiempo real de cada pista.
              </p>
            )}
          </div>

          {total > 0 && (
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
          )}
        </div>

        {total === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card py-20 text-center">
            <p className="font-heading text-2xl text-ink">Sin instalaciones</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Este club aún no ha registrado sus pistas.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {courts.map((c) => (
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
        )}
      </div>
    </section>
  )
}
