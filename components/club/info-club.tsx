type ScheduleEntry = { day: string; hours: string }
type Surface = { label: string; count: number }

export function InfoClub({
  name,
  city,
  address,
  phone,
  email,
  schedule,
  surfaces,
  totalCourts,
  playersCount,
}: {
  name: string
  city?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  schedule: ScheduleEntry[]
  surfaces: Surface[]
  totalCourts: number
  playersCount: number
}) {
  const hasSchedule = schedule.length > 0
  // Resumen del horario para el encabezado (primer tramo conocido).
  const headerHours = hasSchedule ? schedule[0].hours : null

  const facts = [
    { label: 'Pistas', value: String(totalCourts) },
    { label: 'Jugadores', value: String(playersCount) },
    {
      label: 'Ciudad',
      value: city ?? '—',
    },
  ]

  return (
    <section className="bg-cream px-6 py-16 md:px-12">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tarjeta ubicación */}
        <article
          className="relative flex aspect-[5/3] flex-col justify-between overflow-hidden rounded-md border border-border bg-card p-8"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent 0 39px, rgba(0,0,0,0.04) 39px 40px),' +
              'repeating-linear-gradient(90deg, transparent 0 39px, rgba(0,0,0,0.04) 39px 40px)',
          }}
        >
          <header>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Cómo llegar
            </p>
            <h3 className="mt-3 font-heading text-4xl leading-tight text-ink">
              {address ? (
                <em className="italic">{address}.</em>
              ) : (
                <em className="italic">{name}.</em>
              )}
            </h3>
            {city && (
              <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {city}
              </p>
            )}
          </header>

          {/* Pin decorativo */}
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2">
            <span
              className="absolute left-1/2 top-2 z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-terracotta text-cream"
              aria-hidden
            >
              <span className="h-2 w-2 rounded-full bg-cream" />
            </span>
            <svg
              viewBox="0 0 600 120"
              className="block h-24 w-full text-muted/60"
              preserveAspectRatio="none"
            >
              <path
                d="M0,70 C100,30 180,90 280,60 C380,30 460,90 600,55 L600,120 L0,120 Z"
                fill="currentColor"
                opacity="0.5"
              />
              <path
                d="M0,70 C100,30 180,90 280,60 C380,30 460,90 600,55"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.7"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
            </svg>
          </div>

          <footer className="relative grid grid-cols-3 gap-6 font-mono text-xs">
            {facts.map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </span>
                <span className="truncate text-ink">{item.value}</span>
              </div>
            ))}
          </footer>
        </article>

        {/* Tarjeta horario + contacto */}
        <article className="flex flex-col gap-6 rounded-md border border-border bg-card p-8">
          <header>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Horario · Contacto
            </p>
            <h3 className="mt-3 font-heading text-4xl leading-tight text-ink">
              {headerHours ? (
                <>
                  <em className="italic">Abierto</em> {headerHours}
                </>
              ) : (
                <em className="italic">Horario por confirmar</em>
              )}
            </h3>
          </header>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Horarios
              </p>
              {hasSchedule ? (
                <dl className="mt-3 flex flex-col gap-2 font-mono text-sm">
                  {schedule.map((s) => (
                    <div
                      key={s.day}
                      className="flex items-center justify-between text-ink"
                    >
                      <dt>{s.day}</dt>
                      <dd>{s.hours}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 font-mono text-sm text-muted-foreground">
                  Sin horario publicado
                </p>
              )}
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Superficies
              </p>
              {surfaces.length > 0 ? (
                <dl className="mt-3 flex flex-col gap-2 font-mono text-sm">
                  {surfaces.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between text-ink"
                    >
                      <dt>{s.label}</dt>
                      <dd>
                        {s.count} {s.count === 1 ? 'pista' : 'pistas'}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 font-mono text-sm text-muted-foreground">—</p>
              )}
            </div>
          </div>

          <hr className="border-border" />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Teléfono
              </p>
              <p className="mt-2 font-mono text-sm text-ink">
                {phone ? (
                  <a href={`tel:${phone}`} className="hover:text-terracotta">
                    {phone}
                  </a>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Email
              </p>
              <p className="mt-2 truncate font-mono text-sm text-ink">
                {email ? (
                  <a href={`mailto:${email}`} className="hover:text-terracotta">
                    {email}
                  </a>
                ) : (
                  '—'
                )}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
