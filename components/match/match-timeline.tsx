type Event = {
  set: string
  score: string
  text: string
  team: 0 | 1
  kind?: 'set' | 'break' | 'live'
}

const events: Event[] = [
  {
    set: 'Set 3',
    score: '4 — 2',
    text: 'Puig / Marín saca para ampliar la ventaja en el set decisivo.',
    team: 0,
    kind: 'live',
  },
  {
    set: 'Set 3',
    score: '3 — 2',
    text: 'Break decisivo de Puig / Marín resuelto en un punto de oro.',
    team: 0,
    kind: 'break',
  },
  {
    set: 'Set 2',
    score: '3 — 6',
    text: 'Lozano / Roig cierra el set y empata el partido.',
    team: 1,
    kind: 'set',
  },
  {
    set: 'Set 2',
    score: '2 — 5',
    text: 'Lozano / Roig encadena cuatro juegos seguidos con el resto.',
    team: 1,
    kind: 'break',
  },
  {
    set: 'Set 1',
    score: '6 — 4',
    text: 'Puig / Marín firma el primer set con un remate ganador.',
    team: 0,
    kind: 'set',
  },
  {
    set: 'Set 1',
    score: '1 — 0',
    text: 'Puig / Marín rompe el saque de salida del partido.',
    team: 0,
    kind: 'break',
  },
]

const kindLabel: Record<NonNullable<Event['kind']>, string> = {
  set: 'Set',
  break: 'Break',
  live: 'Ahora',
}

export function MatchTimeline() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      {/* Encabezado */}
      <div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Cronología · Momentos clave
        </p>
        <h2 className="mt-2 font-heading text-4xl leading-none tracking-tight text-ink md:text-5xl">
          Cómo se ha <em className="italic">decidido.</em>
        </h2>
      </div>

      {/* Línea de tiempo */}
      <ol className="mt-8 border-l border-border">
        {events.map((e, i) => {
          const live = e.kind === 'live'
          return (
            <li key={i} className="relative pl-8 pb-8 last:pb-0">
              {/* Marcador en la línea */}
              <span
                className={`absolute -left-[6.5px] top-1.5 size-3 rounded-full ring-4 ring-background ${
                  live
                    ? 'bg-terracotta'
                    : e.team === 0
                      ? 'bg-forest'
                      : 'bg-terracotta'
                }`}
              />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                  {e.set} · {e.score}
                </span>
                {e.kind && (
                  <span
                    className={`rounded-sm px-1.5 py-0.5 font-mono text-[9px] tracking-widest uppercase ${
                      live
                        ? 'bg-terracotta text-cream'
                        : 'border border-border text-muted-foreground'
                    }`}
                  >
                    {kindLabel[e.kind]}
                  </span>
                )}
              </div>
              <p className="mt-1.5 max-w-2xl font-heading text-lg text-ink">
                {e.text}
              </p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
