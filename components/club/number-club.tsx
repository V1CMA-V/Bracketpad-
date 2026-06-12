type Stat = {
  label: string
  value: string
  detail: string
}

export function NumberClub({
  joinedYear,
  foundedYear,
  totalCourts,
  indoorCourts,
  outdoorCourts,
  playersCount,
  leaguesCount,
  activeCompetitions,
  tournamentsCount,
}: {
  joinedYear: number
  foundedYear?: number | null
  totalCourts: number
  indoorCourts: number
  outdoorCourts: number
  playersCount: number
  leaguesCount: number
  activeCompetitions: number
  tournamentsCount: number
}) {
  const currentYear = new Date().getFullYear()
  const years = Math.max(0, currentYear - joinedYear)
  const joinedDetail =
    years === 0 ? 'este año' : `${years} ${years === 1 ? 'año' : 'años'}`

  // Si el club indicó su año de fundación, ese es el dato protagonista; el alta
  // en Bandeja pasa al detalle. Si no, mostramos solo la antigüedad en Bandeja.
  const foundingStat: Stat = foundedYear
    ? {
        label: 'Fundado',
        value: String(foundedYear),
        detail: `en Bandeja desde ${joinedYear}`,
      }
    : {
        label: 'En Bandeja',
        value: String(joinedYear),
        detail: joinedDetail,
      }

  const stats: Stat[] = [
    foundingStat,
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
