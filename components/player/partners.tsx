type Partner = {
  name: string
  initials: string
  matches: number
  wins: number
  current?: boolean
}

const PARTNERS: Partner[] = [
  { name: 'Diego Marín', initials: 'DM', matches: 96, wins: 78, current: true },
  { name: 'Adrián Soler', initials: 'AS', matches: 54, wins: 36 },
  { name: 'Bruno Lozano', initials: 'BL', matches: 21, wins: 13 },
  { name: 'Marc Roig', initials: 'MR', matches: 13, wins: 10 },
]

export function Partners() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Compañeros · Parejas habituales
        </p>
        <h2 className="mt-2 font-heading text-4xl leading-none tracking-tight text-ink md:text-5xl">
          Con quién <em className="italic">juega.</em>
        </h2>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PARTNERS.map((p) => {
          const rate = Math.round((p.wins / p.matches) * 100)
          return (
            <div
              key={p.name}
              className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-full bg-forest font-mono text-sm text-cream">
                  {p.initials}
                </span>
                {p.current && (
                  <span className="rounded-sm bg-lime/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-forest">
                    Pareja actual
                  </span>
                )}
              </div>

              <div>
                <p className="font-heading text-xl text-ink">{p.name}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {p.matches} partidos juntos
                </p>
              </div>

              <div className="mt-auto">
                <div className="flex items-baseline justify-between">
                  <span className="font-heading text-3xl text-ink">{rate}%</span>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    {p.wins} V · {p.matches - p.wins} D
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-terracotta"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
