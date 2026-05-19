const RULES = [
  { label: 'Sets', value: '2 ganados', highlight: false },
  { label: '3er set', value: 'Super TB · 10', highlight: false },
  { label: 'Punto', value: 'Oro · 40-40', highlight: false },
  { label: 'Cambio', value: 'Tras juegos impares', highlight: false },
  { label: 'WO', value: '15 min', highlight: true },
]

const SPONSORS = [
  { name: 'Olivar', tier: 'Principal' },
  { name: 'Mediterráneo Wines', tier: 'Oficial' },
  { name: 'Bullpadel', tier: 'Material' },
  { name: 'Tonics Co.', tier: 'Oficial' },
  { name: 'Estrella Levant', tier: 'Oficial' },
  { name: 'Vidal Sport', tier: 'Colab' },
]

export function Organizers() {
  return (
    <section className="bg-cream px-6 py-16 md:px-12">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Organización */}
        <div className="flex flex-col">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Organización
          </p>
          <h3 className="mt-3 font-heading text-3xl leading-tight text-ink">
            Director de torneo
            <br />
            <em className="italic">Carla Giménez.</em>
          </h3>
          <p className="mt-5 max-w-sm font-mono text-sm text-muted-foreground">
            Directora deportiva del Club Marítimo desde 2019. Organizadora de la XII edición del
            Trofeo del Olivar y del circuito mediterráneo de veteranos.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-6">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Email
              </p>
              <p className="mt-2 font-mono text-sm text-ink">open@maritimoolivar.es</p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Teléfono
              </p>
              <p className="mt-2 font-mono text-sm text-ink">96 365 18 24</p>
            </div>
          </div>
        </div>

        {/* Reglamento */}
        <div className="flex flex-col">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Reglamento
          </p>
          <h3 className="mt-3 font-heading text-3xl leading-tight text-ink">
            Cómo se <em className="italic">juega.</em>
          </h3>

          <dl className="mt-6 flex flex-col gap-3 font-mono text-sm">
            {RULES.map((r) => (
              <div
                key={r.label}
                className={
                  'flex items-center justify-between border-b border-border/60 pb-2 ' +
                  (r.highlight ? 'text-terracotta' : 'text-ink')
                }
              >
                <dt
                  className={
                    'uppercase tracking-wider text-xs ' +
                    (r.highlight ? 'text-terracotta' : 'text-muted-foreground')
                  }
                >
                  {r.label}
                </dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Patrocinadores */}
        <div className="flex flex-col">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Patrocinadores
          </p>
          <h3 className="mt-3 font-heading text-3xl leading-tight text-ink">
            Hacen <em className="italic">posible.</em>
          </h3>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {SPONSORS.map((s) => (
              <div
                key={s.name}
                className="rounded-md border border-border bg-card px-4 py-3"
              >
                <p className="font-heading text-lg italic text-ink">{s.name}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.tier}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
