type Stat = {
  label: string
  a: number
  b: number
  suffix?: string
  lowerBetter?: boolean
}

const stats: Stat[] = [
  { label: 'Puntos ganados', a: 92, b: 86 },
  { label: 'Winners', a: 31, b: 24 },
  { label: 'Errores no forzados', a: 18, b: 27, lowerBetter: true },
  { label: 'Remates ganadores', a: 14, b: 9 },
  { label: 'Bandejas acertadas', a: 22, b: 17 },
  { label: 'Puntos de oro ganados', a: 7, b: 5 },
  { label: 'Saques directos', a: 4, b: 2 },
  { label: '% primer saque', a: 68, b: 61, suffix: '%' },
]

function leader(s: Stat): 0 | 1 | null {
  if (s.a === s.b) return null
  const aWins = s.lowerBetter ? s.a < s.b : s.a > s.b
  return aWins ? 0 : 1
}

export function MatchStats() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Estadísticas · Comparativa
          </p>
          <h2 className="mt-2 font-heading text-4xl leading-none tracking-tight text-ink md:text-5xl">
            Lo que dicen los <em className="italic">datos.</em>
          </h2>
        </div>
        <div className="flex items-center gap-5 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-forest" /> Puig / Marín
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-terracotta" /> Lozano / Roig
          </span>
        </div>
      </div>

      {/* Filas de estadística */}
      <div className="mt-8 rounded-lg border border-border bg-card px-6 py-2 md:px-8">
        {stats.map((s) => {
          const total = s.a + s.b || 1
          const aPct = (s.a / total) * 100
          const win = leader(s)
          return (
            <div
              key={s.label}
              className="flex flex-col gap-2 border-b border-border py-5 last:border-b-0"
            >
              {/* Valores y etiqueta */}
              <div className="flex items-center justify-between gap-4">
                <span
                  className={`font-mono text-lg ${
                    win === 0 ? 'font-semibold text-ink' : 'text-muted-foreground'
                  }`}
                >
                  {s.a}
                  {s.suffix}
                </span>
                <span className="text-center font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                  {s.label}
                </span>
                <span
                  className={`font-mono text-lg ${
                    win === 1 ? 'font-semibold text-ink' : 'text-muted-foreground'
                  }`}
                >
                  {s.b}
                  {s.suffix}
                </span>
              </div>

              {/* Barra dividida */}
              <div className="flex h-2 overflow-hidden rounded-full">
                <div
                  className="bg-forest"
                  style={{ width: `${aPct}%` }}
                />
                <div className="w-px shrink-0 bg-card" />
                <div
                  className="flex-1 bg-terracotta"
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
