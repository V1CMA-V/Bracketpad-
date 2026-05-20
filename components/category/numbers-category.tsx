const metrics = [
  { label: 'Parejas', value: '32', caption: '5 confirmadas eliminadas hoy' },
  { label: 'Partidos', value: '25', caption: '31 totales · 81%' },
  { label: 'Sets jugados', value: '58', caption: 'avg. 2.32 por partido' },
  { label: 'Más largo', value: '2h 38m', caption: 'García/Ros vs. Verdú/Mas' },
  { label: 'Pto. oro', value: '42', caption: '7 decidieron set' },
  { label: 'Tiebreaks', value: '11', caption: 'incl. 2 super TB', accent: true },
]

export function NumbersCategory() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      <dl className="grid grid-cols-2 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map(({ label, value, caption, accent }) => (
          <div
            key={label}
            className="flex flex-col gap-2 border-border px-5 first:pl-0 lg:border-l lg:[&:nth-child(7n+1)]:border-l-0"
          >
            <dt className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              {label}
            </dt>
            <dd
              className={`font-heading text-5xl leading-none ${
                accent ? 'text-terracotta' : 'text-ink'
              }`}
            >
              {value}
            </dd>
            <p className="font-mono text-xs text-muted-foreground">{caption}</p>
          </div>
        ))}
      </dl>
    </section>
  )
}
