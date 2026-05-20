const duraciones = [
  { round: 'R32', value: '1h 2m', pct: 54 },
  { round: 'Octavos', value: '1h 24m', pct: 72 },
  { round: 'Cuartos', value: '1h 54m', pct: 100, active: true },
]

const clubs = [
  { name: 'C. Marítimo', count: 9, active: true },
  { name: 'Padel Nord', count: 7 },
  { name: 'Mediterráneo', count: 6 },
  { name: 'Olimpic', count: 5 },
  { name: 'Otros', count: 5 },
]

function Bar({ pct, active }: { pct: number; active?: boolean }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream/10">
      <div
        className={`h-full rounded-full ${active ? 'bg-lime' : 'bg-cream/40'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function Panel({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-lg border border-cream/10 p-6 ${className}`}>
      <p className="font-mono text-[11px] tracking-widest text-cream/45 uppercase">
        {title}
      </p>
      <div className="mt-5">{children}</div>
    </div>
  )
}

export function Analytics() {
  const maxClub = Math.max(...clubs.map((c) => c.count))

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      <div className="rounded-2xl bg-ink p-8 text-cream md:p-12">
        {/* Encabezado */}
        <p className="font-mono text-xs tracking-widest text-lime uppercase">
          Análisis · Datos del cuadro
        </p>
        <h2 className="mt-2 font-heading text-5xl leading-none tracking-tight md:text-6xl">
          Lo que <em className="italic text-cream/45">cuentan los números.</em>
        </h2>

        {/* Paneles */}
        <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1.2fr_1fr]">
          {/* Duración media */}
          <Panel title="Duración media · por ronda">
            <div className="flex flex-col gap-4">
              {duraciones.map((d) => (
                <div
                  key={d.round}
                  className="grid grid-cols-[88px_1fr_auto] items-center gap-4"
                >
                  <span
                    className={`font-mono text-xs ${
                      d.active ? 'text-lime' : 'text-cream/70'
                    }`}
                  >
                    {d.round}
                  </span>
                  <Bar pct={d.pct} active={d.active} />
                  <span
                    className={`font-mono text-xs ${
                      d.active ? 'text-lime' : 'text-cream/70'
                    }`}
                  >
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-cream/10 pt-4 font-mono text-xs tracking-widest uppercase">
              <span className="text-cream/45">Promedio total</span>
              <span className="text-cream/80">1h 22m</span>
            </div>
          </Panel>

          {/* Parejas por club */}
          <Panel title="Parejas por club">
            <div className="flex flex-col gap-3.5">
              {clubs.map((c) => (
                <div
                  key={c.name}
                  className="grid grid-cols-[96px_1fr_auto] items-center gap-4"
                >
                  <span
                    className={`font-mono text-xs ${
                      c.active ? 'text-lime' : 'text-cream/70'
                    }`}
                  >
                    {c.name}
                  </span>
                  <Bar
                    pct={(c.count / maxClub) * 100}
                    active={c.active}
                  />
                  <span className="font-mono text-xs text-cream/70">
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Columna derecha: dos tarjetas */}
          <div className="flex flex-col gap-5">
            <Panel title="Partido más largo">
              <h3 className="font-heading text-2xl leading-tight">
                García/Ros{' '}
                <em className="font-sans text-sm text-cream/50 italic">
                  vs.
                </em>{' '}
                Mtz/Vidal
              </h3>
              <p className="mt-2 font-mono text-[11px] tracking-widest text-cream/45 uppercase">
                2h 38m · QF · 25 jun
              </p>
              <p className="mt-2 font-mono text-sm text-lime">
                4·6 · 7·6³ · 10·8
              </p>
            </Panel>

            <Panel title="Más sorpresas en R1">
              <p className="font-heading text-6xl leading-none text-cream">
                5
                <span className="ml-1 font-mono text-sm text-cream/45">
                  de 16
                </span>
              </p>
              <p className="mt-3 font-mono text-[11px] tracking-widest text-cream/45 uppercase">
                Cabezas de serie eliminadas
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  )
}
