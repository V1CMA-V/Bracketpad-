import { AtSign, Clock, Navigation } from 'lucide-react'
import { formatDays } from '@/lib/clubs'
import { formatMoney } from '@/lib/money'

type ScheduleEntry = { day: string; hours: string }
type Surface = { label: string; count: number }
type ClassRate = { players: number; price: number }
type CourtRate = {
  id: string
  label: string | null
  days: number[]
  startTime: string
  endTime: string
  price: number
}

/**
 * Agrupa días consecutivos con el mismo horario en rangos legibles
 * (p.ej. «Lun – Vie · 07:00 — 23:00»). El horario llega ya en orden Lun → Dom.
 */
function groupSchedule(schedule: ScheduleEntry[]) {
  const groups: { start: string; end: string; hours: string }[] = []
  for (const entry of schedule) {
    const last = groups.at(-1)
    if (last && last.hours === entry.hours) last.end = entry.day
    else groups.push({ start: entry.day, end: entry.day, hours: entry.hours })
  }
  return groups.map((g) => ({
    label: g.start === g.end ? g.start : `${g.start} – ${g.end}`,
    hours: g.hours,
  }))
}

export function InfoClub({
  name,
  city,
  address,
  state,
  country,
  phone,
  email,
  website,
  instagram,
  description,
  latitude,
  longitude,
  schedule,
  surfaces,
  classRates,
  classCurrency,
  courtRates,
  courtRateCurrency,
  totalCourts,
  playersCount,
}: {
  name: string
  city?: string | null
  address?: string | null
  state?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  instagram?: string | null
  description?: string | null
  latitude?: number | null
  longitude?: number | null
  schedule: ScheduleEntry[]
  surfaces: Surface[]
  classRates: ClassRate[]
  classCurrency: string
  courtRates: CourtRate[]
  courtRateCurrency: string
  totalCourts: number
  playersCount: number
}) {
  const hasSchedule = schedule.length > 0
  const scheduleGroups = groupSchedule(schedule)
  // Resumen del horario para el encabezado (primer tramo conocido).
  const headerHours = hasSchedule ? schedule[0].hours : null

  const hasClassRates = classRates.length > 0
  const hasCourtRates = courtRates.length > 0
  const hasPricing = hasClassRates || hasCourtRates

  // Enlace «Cómo llegar» a Google Maps. Preferimos las coordenadas si están
  // cargadas (más preciso); si no, caemos a nombre + dirección + ciudad. Más
  // adelante esto se sustituirá por un mapa con marcador propio.
  const hasCoords = latitude != null && longitude != null
  const destination = hasCoords
    ? `${latitude},${longitude}`
    : [name, address, city, state, country].filter(Boolean).join(', ')
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination,
  )}`

  // Instagram: el campo se guarda sin la @.
  const instagramHandle = instagram?.replace(/^@/, '') ?? null
  // Web: etiqueta sin protocolo para una lectura más limpia.
  const websiteLabel = website?.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const websiteHref =
    website && !/^https?:\/\//.test(website) ? `https://${website}` : website

  const facts = [
    { label: 'Pistas', value: String(totalCourts) },
    { label: 'Jugadores', value: String(playersCount) },
    { label: 'Ciudad', value: city ?? '—' },
  ]

  return (
    <section className="bg-cream px-5 py-16 sm:px-6 md:px-12">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Tarjeta ubicación */}
        <article
          className="relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-md border border-border bg-card p-6 sm:aspect-[5/3] sm:min-h-0 sm:p-8"
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
            <h3 className="mt-3 font-heading text-3xl leading-tight text-ink [overflow-wrap:anywhere] sm:text-4xl">
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

          <footer className="relative flex items-end justify-between gap-4 sm:gap-6">
            <dl className="grid flex-1 grid-cols-3 gap-3 font-mono text-xs sm:gap-6">
              {facts.map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <dt className="uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="truncate text-ink">{item.value}</dd>
                </div>
              ))}
            </dl>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-cream transition-colors hover:bg-terracotta"
            >
              <Navigation className="h-3.5 w-3.5" />
              Cómo llegar
            </a>
          </footer>
        </article>

        {/* Tarjeta horario + contacto */}
        <article className="flex flex-col rounded-md border border-border bg-card p-6 sm:p-8">
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
            {description && (
              <p className="mt-3 max-w-md font-heading text-base italic leading-snug text-muted-foreground">
                {description}
              </p>
            )}
          </header>

          {/* Horario agrupado + superficies */}
          <div className="mt-7 grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
            <Block label="Horario">
              {hasSchedule ? (
                <dl className="flex flex-col gap-2.5">
                  {scheduleGroups.map((g) => (
                    <div
                      key={g.label}
                      className="flex items-baseline justify-between gap-3 border-b border-dashed border-border pb-2 last:border-0 last:pb-0"
                    >
                      <dt className="font-mono text-[13px] text-ink">
                        {g.label}
                      </dt>
                      <dd className="font-mono text-[13px] tabular-nums text-muted-foreground">
                        {g.hours}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="font-mono text-sm text-muted-foreground">
                  Sin horario publicado
                </p>
              )}
            </Block>

            <Block label="Superficies">
              {surfaces.length > 0 ? (
                <dl className="flex flex-col gap-2.5">
                  {surfaces.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-baseline justify-between gap-3 border-b border-dashed border-border pb-2 last:border-0 last:pb-0"
                    >
                      <dt className="font-mono text-[13px] text-ink">
                        {s.label}
                      </dt>
                      <dd className="font-mono text-[13px] tabular-nums text-muted-foreground">
                        {s.count} {s.count === 1 ? 'pista' : 'pistas'}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="font-mono text-sm text-muted-foreground">—</p>
              )}
            </Block>
          </div>

          {/* Bloque de precios: renta de pista (protagonista) + clases */}
          {hasPricing && (
            <div className="mt-7 overflow-hidden rounded-lg bg-ink/[0.03] ring-1 ring-ink/[0.06]">
              {hasCourtRates && (
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink">
                      <Clock className="h-3 w-3 text-terracotta" />
                      Renta de pista
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {courtRateCurrency} · por hora
                    </p>
                  </div>

                  <ul className="mt-4 flex flex-col divide-y divide-ink/[0.07]">
                    {courtRates.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-[13px] text-ink">
                            {formatDays(r.days)}
                            <span className="text-muted-foreground">
                              {'  ·  '}
                              {r.startTime}–{r.endTime}
                            </span>
                          </p>
                          {r.label && (
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {r.label}
                            </p>
                          )}
                        </div>
                        <p className="shrink-0 font-heading text-2xl leading-none text-ink">
                          {formatMoney(r.price, courtRateCurrency)}
                          <span className="ml-0.5 font-mono text-xs text-muted-foreground">
                            /h
                          </span>
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hasClassRates && (
                <div
                  className={
                    hasCourtRates
                      ? 'border-t border-ink/[0.07] bg-ink/[0.02] p-5'
                      : 'p-5'
                  }
                >
                  <p className="font-mono text-[11px] uppercase tracking-wider text-ink">
                    Clases particulares
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                    {classRates.map((r) => (
                      <div key={r.players} className="flex flex-col gap-1">
                        <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {r.players} {r.players === 1 ? 'jugador' : 'jugadores'}
                        </dt>
                        <dd className="font-heading text-lg leading-none text-ink">
                          {formatMoney(r.price, classCurrency)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {classCurrency} · por clase
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Contacto */}
          <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-6 md:grid-cols-4">
            <ContactItem label="Teléfono">
              {phone ? (
                <a href={`tel:${phone}`} className="hover:text-terracotta">
                  {phone}
                </a>
              ) : (
                '—'
              )}
            </ContactItem>

            <ContactItem label="Email">
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="block truncate hover:text-terracotta"
                >
                  {email}
                </a>
              ) : (
                '—'
              )}
            </ContactItem>

            <ContactItem label="Instagram">
              {instagramHandle ? (
                <a
                  href={`https://instagram.com/${instagramHandle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-terracotta"
                >
                  <AtSign className="h-3.5 w-3.5" />
                  {instagramHandle}
                </a>
              ) : (
                '—'
              )}
            </ContactItem>

            <ContactItem label="Web">
              {websiteHref ? (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate hover:text-terracotta"
                >
                  {websiteLabel}
                </a>
              ) : (
                '—'
              )}
            </ContactItem>
          </div>
        </article>
      </div>
    </section>
  )
}

function Block({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}

function ContactItem({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-mono text-sm text-ink">{children}</p>
    </div>
  )
}
