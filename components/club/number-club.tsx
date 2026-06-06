type Stat = {
  label: string
  value: string
  detail: string
}

export function NumberClub({
  foundedYear,
  totalCourts,
  indoorCourts,
  outdoorCourts,
  playersCount,
  leaguesCount,
  activeCompetitions,
  tournamentsCount,
}: {
  foundedYear: number
  totalCourts: number
  indoorCourts: number
  outdoorCourts: number
  playersCount: number
  leaguesCount: number
  activeCompetitions: number
  tournamentsCount: number
}) {
  const currentYear = new Date().getFullYear()
  const years = Math.max(0, currentYear - foundedYear)

  const stats: Stat[] = [
    {
      label: 'En Bandeja',
      value: String(foundedYear),
      detail: years === 0 ? 'este año' : `${years} ${years === 1 ? 'año' : 'años'}`,
    },
    {
      label: 'Pistas',
      value: String(totalCourts).padStart(2, '0'),
      detail: `${indoorCourts} cubiertas · ${outdoorCourts} al aire libre`,
    },
    {
      label: 'Jugadores',
      value: String(playersCount),
      detail: 'registrados en el club',
    },
    {
      label: 'Ligas',
      value: String(leaguesCount).padStart(2, '0'),
      detail:
        activeCompetitions > 0
          ? `${activeCompetitions} en juego ahora`
          : 'publicadas',
    },
    {
      label: 'Torneos',
      value: String(tournamentsCount).padStart(2, '0'),
      detail: 'en cartelera',
    },
  ]

  return (
    <section className="border-y border-border bg-cream">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat, i) => (
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
            <p className="font-heading text-5xl leading-none text-ink tabular-nums">
              {stat.value}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{stat.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
