type Stat = {
  label: string
  value: string
  detail: string
}

const STATS: Stat[] = [
  { label: 'Fundado', value: '1978', detail: '48 años' },
  { label: 'Pistas', value: '08', detail: '3 cubiertas · 5 al aire libre' },
  { label: 'Socios', value: '612', detail: '+24 esta temporada' },
  { label: 'Torneos', value: '24', detail: 'en 2026' },
  { label: 'Ranking', value: '02', detail: 'comunidad valenciana' },
]

export function NumberClub() {
  return (
    <section className="border-y border-border bg-cream">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={
              'flex flex-col gap-2 px-6 py-8 md:px-8 ' +
              (i > 0 ? 'lg:border-l border-border' : '')
            }
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {stat.label}
            </p>
            <p className="font-heading text-5xl leading-none text-ink">{stat.value}</p>
            <p className="font-mono text-xs text-muted-foreground">{stat.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
