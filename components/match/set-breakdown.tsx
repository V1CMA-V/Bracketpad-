type SetData = {
  label: string
  score: string
  winner: string | null
  duration: string
  status: string
  live?: boolean
  // Ganador de cada juego del set: 0 = teamA, 1 = teamB
  games: (0 | 1)[]
}

const setsData: SetData[] = [
  {
    label: 'Set 1',
    score: '6 — 4',
    winner: 'Puig / Marín',
    duration: '48m',
    status: 'Finalizado',
    games: [0, 1, 0, 0, 1, 0, 1, 0, 1, 0],
  },
  {
    label: 'Set 2',
    score: '3 — 6',
    winner: 'Lozano / Roig',
    duration: '52m',
    status: 'Finalizado',
    games: [1, 0, 1, 1, 0, 1, 0, 1, 1],
  },
  {
    label: 'Set 3',
    score: '4 — 2',
    winner: null,
    duration: '38m',
    status: 'En juego',
    live: true,
    games: [0, 1, 0, 0, 1, 0],
  },
]

export function SetBreakdown() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Marcador · Set a set
          </p>
          <h2 className="mt-2 font-heading text-4xl leading-none tracking-tight text-ink md:text-5xl">
            Cómo cae cada <em className="italic">set.</em>
          </h2>
        </div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          1 — 1 · al mejor de 3
        </p>
      </div>

      {/* Tarjetas de set */}
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {setsData.map((s) => (
          <article
            key={s.label}
            className={`rounded-lg border bg-card p-6 ${
              s.live ? 'border-terracotta' : 'border-border'
            }`}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between font-mono text-[11px] tracking-widest uppercase">
              <span className="text-muted-foreground">{s.label}</span>
              <span
                className={`flex items-center gap-1.5 ${
                  s.live ? 'text-terracotta' : 'text-muted-foreground'
                }`}
              >
                {s.live && <span className="text-[0.7em]">●</span>}
                {s.status}
              </span>
            </div>

            {/* Marcador */}
            <p className="mt-3 font-heading text-5xl leading-none text-ink">
              {s.score}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {s.winner ? `Set para ${s.winner}` : 'En disputa'} · {s.duration}
            </p>

            {/* Tira de juegos */}
            <div className="mt-5 border-t border-border pt-4">
              <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                Juegos
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {s.games.map((g, i) => (
                  <span
                    key={i}
                    className={`size-5 rounded-sm ${
                      g === 0 ? 'bg-forest' : 'bg-terracotta'
                    }`}
                    title={`Juego ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex items-center gap-5 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-forest" /> Puig / Marín
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-terracotta" /> Lozano / Roig
        </span>
      </div>
    </section>
  )
}
