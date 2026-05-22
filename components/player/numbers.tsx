type Stat = {
  label: string
  value: string
  detail: string
}

const STATS: Stat[] = [
  { label: 'Partidos', value: '184', detail: 'desde 2021' },
  { label: 'Victorias', value: '137', detail: '47 derrotas' },
  { label: 'Efectividad', value: '74%', detail: 'media de carrera' },
  { label: 'Títulos', value: '11', detail: '4 esta temporada' },
  { label: 'Mejor racha', value: '19', detail: 'victorias seguidas' },
]

export function Numbers() {
  return (
    <section className="border-y border-border bg-cream">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={
              'flex flex-col gap-2 px-6 py-8 md:px-8 ' +
              (i > 0 ? 'border-border lg:border-l' : '')
            }
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {stat.label}
            </p>
            <p className="font-heading text-5xl leading-none text-ink">
              {stat.value}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{stat.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
