type Stat = {
  label: string
  value: string
  detail: string
  highlight?: boolean
}

const STATS: Stat[] = [
  { label: 'Días', value: '14', detail: '15 — 28 jun' },
  { label: 'Categorías', value: '06', detail: 'masc · fem · mixto' },
  { label: 'Inscritos', value: '128', detail: '64 parejas' },
  { label: 'Partidos', value: '94', detail: '48 disputados' },
  { label: 'Pistas', value: '08', detail: '3 cubiertas' },
  { label: 'Premio', value: '€3.500', detail: '+ trofeos', highlight: true },
]

export function NumbersTournament() {
  return (
    <section className="border-y border-border bg-cream">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
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
            <p
              className={
                'font-heading text-5xl leading-none ' +
                (stat.highlight ? 'text-terracotta' : 'text-ink')
              }
            >
              {stat.value}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{stat.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
