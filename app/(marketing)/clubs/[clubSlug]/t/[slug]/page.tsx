import { Breadcrumb } from '@/components/club/breadcrumb'
import { formatMoney } from '@/lib/money'
import { prisma } from '@/lib/prisma'
import {
  categoryGenderLabels,
  categoryLabel,
  drawTypeLabels,
  tournamentStatusLabels,
  tournamentStatusStyles,
} from '@/lib/tournaments'
import {
  categoryPhaseLabels,
  deriveCategoryPhase,
  registrationState,
  setScores,
  teamInitials,
  teamLabel,
  type CategoryPhase,
  type TeamLite,
} from '@/lib/tournament-public'
import {
  AtSign,
  CalendarDays,
  ChevronRight,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Ticket,
  Trophy,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

/* -------------------------------------------------------------------------- */
/*  Formato de fechas                                                          */
/* -------------------------------------------------------------------------- */

// Fechas de calendario (`@db.Date`): en UTC para no restar un día en zonas con desfase.
const dateFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
// Timestamps reales (`registrationOpensAt`, `scheduledAt`): en hora local.
const dateTimeFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})
const dayTimeFmt = new Intl.DateTimeFormat('es', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function formatRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${dateFmt.format(start)} — ${dateFmt.format(end)}`
  if (start) return `Desde ${dateFmt.format(start)}`
  if (end) return `Hasta ${dateFmt.format(end)}`
  return 'Fechas por confirmar'
}

/** Etiqueta de cuándo se juega un partido (hora exacta o tentativa). */
function matchWhen(scheduledAt: Date | null, timeTbd: boolean): string | null {
  if (!scheduledAt) return null
  if (timeTbd) return `${dateFmt.format(scheduledAt)} · hora por confirmar`
  return dayTimeFmt.format(scheduledAt)
}

const phaseDot: Record<CategoryPhase, string> = {
  upcoming: 'bg-ochre',
  live: 'bg-forest',
  finished: 'bg-muted-foreground',
}

/* -------------------------------------------------------------------------- */
/*  Carga de datos                                                             */
/* -------------------------------------------------------------------------- */

async function getTournament(clubSlug: string, tournamentId: string) {
  const club = await prisma.club.findUnique({
    where: { slug: clubSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      address: true,
      state: true,
      country: true,
      email: true,
      phone: true,
      website: true,
      instagram: true,
      latitude: true,
      longitude: true,
      logoUrl: true,
    },
  })
  if (!club) return null

  const tournament = await prisma.tournament.findFirst({
    // Los borradores no son públicos.
    where: { id: tournamentId, clubId: club.id, status: { not: 'draft' } },
    include: {
      categories: {
        orderBy: { name: 'asc' },
        include: { _count: { select: { teams: true } } },
      },
    },
  })
  if (!tournament) return null

  const categoryIds = tournament.categories.map((c) => c.id)
  const matches =
    categoryIds.length > 0
      ? await prisma.match.findMany({
          where: { categoryId: { in: categoryIds } },
          orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            categoryId: true,
            status: true,
            winnerSide: true,
            scheduledAt: true,
            timeTbd: true,
            bracketRound: true,
            groupNumber: true,
            court: { select: { name: true } },
            sides: {
              orderBy: { side: 'asc' },
              select: {
                side: true,
                team: {
                  select: {
                    name: true,
                    members: {
                      select: { player: { select: { fullName: true } } },
                    },
                  },
                },
              },
            },
            sets: {
              orderBy: { setNumber: 'asc' },
              select: {
                setNumber: true,
                gamesA: true,
                gamesB: true,
                tiebreakA: true,
                tiebreakB: true,
              },
            },
          },
        })
      : []

  return { club, tournament, matches }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string; slug: string }>
}): Promise<Metadata> {
  const { clubSlug, slug } = await params
  const data = await getTournament(clubSlug, slug)
  if (!data) return { title: 'Torneo no encontrado' }
  const title = `${data.tournament.name} · ${data.club.name}`
  const description =
    data.tournament.description?.slice(0, 160) ??
    `Inscripción, categorías, cuadros y resultados de ${data.tournament.name} en ${data.club.name}.`
  const canonical = `/clubs/${clubSlug}/t/${slug}`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title, description },
  }
}

/* -------------------------------------------------------------------------- */
/*  Página                                                                     */
/* -------------------------------------------------------------------------- */

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ clubSlug: string; slug: string }>
}) {
  const { clubSlug, slug } = await params
  const data = await getTournament(clubSlug, slug)
  if (!data) notFound()
  const { club, tournament, matches } = data

  const sideTeam = (
    m: { sides: { side: 'A' | 'B'; team: TeamLite | null }[] },
    s: 'A' | 'B',
  ): TeamLite | null => m.sides.find((x) => x.side === s)?.team ?? null

  const statusStyle =
    tournamentStatusStyles[tournament.status] ?? tournamentStatusStyles.draft
  const statusLabel = tournamentStatusLabels[tournament.status] ?? tournament.status

  const totalTeams = tournament.categories.reduce((n, c) => n + c._count.teams, 0)
  const liveMatches = matches.filter((m) => m.status === 'in_progress')
  const finishedMatches = matches.filter((m) => m.status === 'finished')

  // Partido destacado: el primero en juego, o si no, el próximo programado.
  const featured =
    liveMatches[0] ??
    matches.find((m) => m.status === 'scheduled' && m.scheduledAt) ??
    null

  // Inscripción.
  const reg = registrationState(tournament)
  const fees = tournament.categories
    .map((c) => (c.entryFee != null ? Number(c.entryFee) : null))
    .filter((f): f is number => f != null)
  const currency = tournament.categories[0]?.currency ?? 'MXN'
  const feeLabel =
    fees.length === 0
      ? 'Gratuita / por confirmar'
      : Math.min(...fees) === Math.max(...fees)
        ? formatMoney(Math.min(...fees), currency)
        : `${formatMoney(Math.min(...fees), currency)} — ${formatMoney(Math.max(...fees), currency)}`

  // Datos de contacto del club (misma lógica que la página pública de liga).
  const hasCoords = club.latitude != null && club.longitude != null
  const mapsDestination = hasCoords
    ? `${club.latitude},${club.longitude}`
    : [club.name, club.address, club.city, club.state, club.country]
        .filter(Boolean)
        .join(', ')
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    mapsDestination,
  )}`
  const instagramHandle = club.instagram?.replace(/^@/, '') ?? null
  const websiteLabel = club.website?.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const websiteHref =
    club.website && !/^https?:\/\//.test(club.website)
      ? `https://${club.website}`
      : club.website
  const whatsappDigits = club.phone?.replace(/[^\d]/g, '') ?? null

  // JSON-LD (schema.org SportsEvent) para enriquecer el resultado en buscadores.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: tournament.name,
    sport: 'Padel',
    ...(tournament.description ? { description: tournament.description } : {}),
    ...(tournament.startDate
      ? { startDate: tournament.startDate.toISOString().slice(0, 10) }
      : {}),
    ...(tournament.endDate
      ? { endDate: tournament.endDate.toISOString().slice(0, 10) }
      : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    organizer: { '@type': 'Organization', name: club.name },
    location: {
      '@type': 'Place',
      name: tournament.location ?? club.name,
      address: [club.address, club.city, club.state, club.country]
        .filter(Boolean)
        .join(', '),
    },
  }

  const numbers = [
    { label: 'Categorías', value: String(tournament.categories.length) },
    { label: 'Parejas inscritas', value: String(totalTeams) },
    { label: 'Partidos', value: String(matches.length) },
    { label: 'En juego', value: String(liveMatches.length) },
  ]

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[
          { label: 'Clubes', href: '/clubs' },
          { label: club.name, href: `/clubs/${club.slug}` },
          { label: 'Torneos', href: `/clubs/${club.slug}/torneos` },
          { label: tournament.name },
        ]}
        liveHref="#en-vivo"
        liveCount={liveMatches.length}
      />

      {/* Hero */}
      <section className="border-b border-border bg-cream px-6 py-12 md:px-12 md:py-16">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Izquierda */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <span className="h-px w-10 bg-muted-foreground/60" />
              <span className={`flex items-center gap-2 ${statusStyle.text}`}>
                <span className={`size-1.5 rounded-full ${statusStyle.dot}`} />
                {statusLabel}
              </span>
              <span className="text-ink/25">·</span>
              <span>
                {tournament.categories.length}{' '}
                {tournament.categories.length === 1 ? 'categoría' : 'categorías'}
              </span>
            </div>

            <h1 className="mt-8 font-heading text-6xl font-bold leading-[0.95] tracking-tight text-ink md:text-7xl lg:text-8xl">
              {tournament.name}
            </h1>

            {tournament.description && (
              <p className="mt-8 max-w-md font-serif text-lg italic leading-relaxed text-ink/80">
                {tournament.description}
              </p>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              <Chip
                icon={<CalendarDays className="size-3.5" />}
                label={formatRange(tournament.startDate, tournament.endDate)}
              />
              {tournament.location && (
                <Chip icon={<MapPin className="size-3.5" />} label={tournament.location} />
              )}
              <Chip
                icon={<Trophy className="size-3.5" />}
                label={`${totalTeams} ${totalTeams === 1 ? 'pareja' : 'parejas'}`}
              />
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href="#inscripcion"
                className="inline-flex items-center gap-2 rounded-md bg-terracotta px-5 py-2.5 font-medium text-cream transition-colors hover:bg-terracotta/90"
              >
                {reg.state === 'open' ? 'Cómo inscribirme' : reg.label}
                <ChevronRight className="size-4" />
              </a>
              <a
                href="#categorias"
                className="inline-flex items-center rounded-md border border-ink/20 px-5 py-2.5 text-ink transition-colors hover:bg-ink/5"
              >
                Ver categorías
              </a>
            </div>
          </div>

          {/* Derecha — partido destacado */}
          <FeaturedMatch
            match={featured}
            sideTeam={sideTeam}
            href={featured ? `/clubs/${club.slug}/t/${slug}/partidos/${featured.id}` : null}
          />
        </div>
      </section>

      {/* Números */}
      <section className="border-b border-border bg-background px-6 py-10 md:px-12">
        <dl className="mx-auto grid max-w-[1400px] grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
          {numbers.map((n) => (
            <div key={n.label} className="flex flex-col gap-1.5">
              <dd className="font-heading text-5xl leading-none text-ink tabular-nums">
                {n.value}
              </dd>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {n.label}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Categorías */}
      <section id="categorias" className="bg-cream px-6 py-16 md:px-12">
        <div className="mx-auto max-w-[1400px]">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {tournament.categories.length}{' '}
              {tournament.categories.length === 1 ? 'categoría' : 'categorías'} · {totalTeams} parejas
            </p>
            <h2 className="mt-3 font-heading text-5xl leading-none text-ink md:text-6xl">
              Los <em className="italic">cuadros.</em>
            </h2>
            <p className="mt-4 font-serif text-base italic text-muted-foreground">
              Elige tu categoría según fuerza y modalidad. Cada una tiene su propio
              cuadro, premio y reglas de juego.
            </p>
          </div>

          {tournament.categories.length === 0 ? (
            <div className="mt-10 rounded-md border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Las categorías de este torneo aún no se han publicado.
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tournament.categories.map((c) => {
                const catMatches = matches.filter((m) => m.categoryId === c.id)
                const phase = deriveCategoryPhase(catMatches)
                const letter = c.gender === 'F' ? 'F' : c.gender === 'M' ? 'M' : 'X'
                return (
                  <Link
                    key={c.id}
                    href={`/clubs/${club.slug}/t/${slug}/${c.id}`}
                    className="group relative flex flex-col overflow-hidden rounded-md border border-border bg-card p-6 transition-colors hover:border-terracotta/40"
                  >
                    <span
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none font-heading text-[10rem] italic leading-none text-ink/[0.04]"
                      aria-hidden
                    >
                      {letter}
                    </span>

                    <header className="relative flex items-start justify-between font-mono text-xs uppercase tracking-wider">
                      <p className="text-muted-foreground">
                        {categoryGenderLabels[c.gender] ?? c.gender}
                      </p>
                      <p className="flex items-center gap-2 text-ink">
                        <span className={`size-1.5 rounded-full ${phaseDot[phase]}`} />
                        {categoryPhaseLabels[phase]}
                      </p>
                    </header>

                    <span className="relative mt-4 w-fit rounded-sm bg-muted/70 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-ink">
                      {drawTypeLabels[c.drawType] ?? c.drawType}
                    </span>

                    <h3 className="relative mt-3 font-heading text-3xl leading-tight text-ink">
                      {c.name}
                    </h3>
                    <p className="relative mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      {categoryLabel(c.gender, c.skillLevel)}
                    </p>

                    <hr className="relative my-5 border-border" />

                    <div className="relative flex items-end justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          Inscritas
                        </span>
                        <span className="font-mono text-xl text-ink tabular-nums">
                          {c._count.teams}
                          {c.maxTeams ? `/${c.maxTeams}` : ''}
                        </span>
                      </div>

                      {c.prize ? (
                        <div className="flex max-w-[45%] flex-col gap-1 text-right">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                            Premio
                          </span>
                          <span className="truncate font-mono text-sm text-terracotta">
                            {c.prize}
                          </span>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-ink transition-colors group-hover:text-terracotta">
                          Ver cuadro <ChevronRight className="size-3.5" />
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* En vivo y resultados */}
      {(liveMatches.length > 0 || finishedMatches.length > 0) && (
        <section id="en-vivo" className="border-y border-border bg-background px-6 py-16 md:px-12">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-2">
            <MatchColumn
              title="En juego"
              caption="Partidos disputándose ahora"
              live
              empty="Ahora mismo no hay partidos en juego."
              matches={liveMatches}
              sideTeam={sideTeam}
              baseHref={`/clubs/${club.slug}/t/${slug}/partidos`}
            />
            <MatchColumn
              title="Resultados"
              caption="Últimos partidos finalizados"
              empty="Todavía no hay resultados."
              matches={[...finishedMatches].reverse().slice(0, 8)}
              sideTeam={sideTeam}
              baseHref={`/clubs/${club.slug}/t/${slug}/partidos`}
            />
          </div>
        </section>
      )}

      {/* Inscripción + Organiza */}
      <section id="inscripcion" className="bg-cream px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Inscripción */}
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Inscripción
            </p>
            <h2 className="mt-3 font-heading text-5xl leading-none text-ink md:text-6xl">
              Apúntate al <em className="italic">torneo.</em>
            </h2>
            <p className="mt-4 max-w-xl font-serif text-base italic text-muted-foreground">
              La inscripción se gestiona directamente con el club. Escríbeles por
              WhatsApp, llámalos o pásate por recepción para reservar tu plaza.
            </p>

            <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InfoCard
                icon={<Ticket className="size-5" strokeWidth={1.5} />}
                label="Estado"
                value={reg.label}
              />
              <InfoCard
                icon={<Trophy className="size-5" strokeWidth={1.5} />}
                label="Costo por categoría"
                value={feeLabel}
              />
              <InfoCard
                icon={<CalendarDays className="size-5" strokeWidth={1.5} />}
                label={tournament.registrationClosesAt ? 'Cierra' : 'Fechas'}
                value={
                  tournament.registrationClosesAt
                    ? dateTimeFmt.format(tournament.registrationClosesAt)
                    : tournament.registrationOpensAt
                      ? `Abre ${dateTimeFmt.format(tournament.registrationOpensAt)}`
                      : formatRange(tournament.startDate, tournament.endDate)
                }
              />
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              {whatsappDigits && (
                <a
                  href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                    `Hola, quiero inscribirme al torneo ${tournament.name}.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-forest px-5 py-2.5 font-medium text-cream transition-colors hover:bg-forest/90"
                >
                  <MessageCircle className="size-4" strokeWidth={1.5} />
                  Inscribirme por WhatsApp
                </a>
              )}
              {club.phone && (
                <a
                  href={`tel:${club.phone}`}
                  className="inline-flex items-center gap-2 rounded-md border border-ink/20 px-5 py-2.5 text-ink transition-colors hover:bg-ink/5"
                >
                  <Phone className="size-4" strokeWidth={1.5} />
                  Llamar
                </a>
              )}
              {club.email && (
                <a
                  href={`mailto:${club.email}?subject=${encodeURIComponent(
                    `Inscripción ${tournament.name}`,
                  )}`}
                  className="inline-flex items-center gap-2 rounded-md border border-ink/20 px-5 py-2.5 text-ink transition-colors hover:bg-ink/5"
                >
                  <Mail className="size-4" strokeWidth={1.5} />
                  Escribir
                </a>
              )}
            </div>
          </div>

          {/* Organiza */}
          <aside className="rounded-sm border border-border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Organiza
            </p>
            <div className="mt-3 flex items-center gap-3">
              {club.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={club.logoUrl}
                  alt={club.name}
                  className="size-12 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-12 items-center justify-center rounded-full bg-ink font-heading text-xl text-cream">
                  {club.name.charAt(0)}
                </span>
              )}
              <div className="min-w-0">
                <Link
                  href={`/clubs/${club.slug}`}
                  className="block truncate font-heading text-lg text-ink hover:text-terracotta"
                >
                  {club.name}
                </Link>
                {club.city && (
                  <p className="truncate text-xs text-muted-foreground">{club.city}</p>
                )}
              </div>
            </div>

            <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
              {club.address && (
                <div className="flex items-start gap-2 text-ink/80">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <span>{club.address}</span>
                </div>
              )}
              {club.phone && (
                <div className="flex items-center gap-2 text-ink/80">
                  <Phone className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <a href={`tel:${club.phone}`} className="hover:text-terracotta">
                    {club.phone}
                  </a>
                </div>
              )}
              {club.email && (
                <div className="flex items-center gap-2 text-ink/80">
                  <Mail className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <a href={`mailto:${club.email}`} className="truncate hover:text-terracotta">
                    {club.email}
                  </a>
                </div>
              )}
              {websiteHref && (
                <div className="flex items-center gap-2 text-ink/80">
                  <Globe className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:text-terracotta"
                  >
                    {websiteLabel}
                  </a>
                </div>
              )}
              {instagramHandle && (
                <div className="flex items-center gap-2 text-ink/80">
                  <AtSign className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <a
                    href={`https://instagram.com/${instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:text-terracotta"
                  >
                    {instagramHandle}
                  </a>
                </div>
              )}
            </dl>

            {(club.address || hasCoords) && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-sm border border-border bg-background py-2 font-mono text-[10px] uppercase tracking-widest text-ink transition-colors hover:border-terracotta/40 hover:text-terracotta"
              >
                <Navigation className="size-3.5" strokeWidth={1.5} />
                Cómo llegar
              </a>
            )}
          </aside>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-background px-6 py-16 md:px-12">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="font-heading text-4xl leading-none text-ink md:text-5xl">
            Antes de <em className="italic">jugar.</em>
          </h2>
          <dl className="mt-8 grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="font-heading text-xl text-ink">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Subcomponentes (server)                                                    */
/* -------------------------------------------------------------------------- */

const FAQ = [
  {
    q: '¿Cómo me inscribo?',
    a: 'La inscripción se confirma con el club por WhatsApp, teléfono o en recepción. Indica tu categoría y el nombre de tu pareja.',
  },
  {
    q: '¿Necesito pareja fija?',
    a: 'Sí, el pádel de torneo se juega en parejas. Inscríbete junto a tu compañero/a en la categoría que mejor se ajuste a vuestro nivel.',
  },
  {
    q: '¿Qué categoría me toca?',
    a: 'Las categorías se separan por modalidad (varonil, femenil o mixta) y fuerza. Si tienes dudas, el club te orienta según tu nivel.',
  },
  {
    q: '¿Dónde veo cuadros y resultados?',
    a: 'En la sección de categorías encuentras el cuadro y los grupos de cada una; cada partido tiene su detalle con el marcador set a set.',
  },
]

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 font-mono text-xs text-ink">
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </span>
  )
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-sm border border-border bg-card p-4">
      <span className="flex size-9 items-center justify-center rounded-full bg-forest/10 text-forest">
        {icon}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="font-heading text-lg leading-tight text-ink">{value}</span>
    </div>
  )
}

type MatchRowLite = {
  id: string
  status: string
  winnerSide: 'A' | 'B' | null
  scheduledAt: Date | null
  timeTbd: boolean
  bracketRound: string | null
  groupNumber: number | null
  court: { name: string } | null
  sets: {
    setNumber: number
    gamesA: number
    gamesB: number
    tiebreakA: number | null
    tiebreakB: number | null
  }[]
}

/** Tira de marcador «6-4 3-6» a partir de los sets capturados. */
function scoreString(
  sets: MatchRowLite['sets'],
  side: 'A' | 'B',
): string {
  const scores = setScores(sets)
  if (scores.length === 0) return '—'
  return scores
    .map((s) => {
      const own = side === 'A' ? s.a : s.b
      const tb = side === 'A' ? s.tbA : s.tbB
      return tb != null ? `${own}(${tb})` : `${own}`
    })
    .join(' ')
}

function FeaturedMatch({
  match,
  sideTeam,
  href,
}: {
  match:
    | (MatchRowLite & {
        sides: { side: 'A' | 'B'; team: TeamLite | null }[]
      })
    | null
  sideTeam: (m: { sides: { side: 'A' | 'B'; team: TeamLite | null }[] }, s: 'A' | 'B') => TeamLite | null
  href: string | null
}) {
  if (!match || !href) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-sm border border-dashed border-border bg-card/50 p-8 text-center">
        <p className="font-heading text-2xl text-ink">Aún no hay partidos</p>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Cuando arranque el torneo, aquí aparecerá el partido destacado en juego.
        </p>
      </div>
    )
  }

  const live = match.status === 'in_progress'
  const teamA = sideTeam(match, 'A')
  const teamB = sideTeam(match, 'B')
  const when = matchWhen(match.scheduledAt, match.timeTbd)
  const context =
    match.bracketRound != null
      ? 'Fase final'
      : match.groupNumber != null
        ? `Grupo ${match.groupNumber}`
        : 'Partido'

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-sm bg-forest p-8 text-cream"
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, transparent 0 14px, rgba(255,255,255,0.04) 14px 15px)',
      }}
    >
      <header className="flex items-center justify-between font-mono text-xs uppercase tracking-wider">
        <p className="flex items-center gap-2 text-lime">
          <span className="size-1.5 rounded-full bg-lime" />
          {live ? 'Partido en juego' : 'Próximo partido'}
        </p>
        <p className="text-cream/70">
          {match.court?.name ?? context}
        </p>
      </header>

      <h3 className="mt-6 font-heading text-3xl italic leading-tight md:text-4xl">{context}</h3>

      <div className="mt-8 flex flex-col gap-5">
        {(['A', 'B'] as const).map((s) => {
          const team = s === 'A' ? teamA : teamB
          const initials = teamInitials(team)
          const won = match.winnerSide === s
          return (
            <div key={s} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex -space-x-2">
                  <span className="z-10 flex size-8 items-center justify-center rounded-full border border-forest bg-terracotta font-mono text-xs text-cream">
                    {initials[0]}
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-full border border-forest bg-ochre font-mono text-xs text-ink">
                    {initials[1]}
                  </span>
                </div>
                <p className="min-w-0 truncate font-mono text-sm text-cream">
                  {teamLabel(team)}
                </p>
              </div>
              <div className="flex items-baseline gap-3 font-heading text-2xl tabular-nums">
                <span className={won ? 'text-lime' : 'text-cream'}>
                  {scoreString(match.sets, s)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="my-6 border-t border-cream/15" />
      <footer className="flex items-center justify-between font-mono text-xs uppercase tracking-wider">
        <p className="text-cream/70">{when ?? 'Horario por confirmar'}</p>
        <span className="flex items-center gap-2 text-cream transition-colors group-hover:text-lime">
          Ver partido <ChevronRight className="size-3.5" />
        </span>
      </footer>
    </Link>
  )
}

function MatchColumn({
  title,
  caption,
  matches,
  sideTeam,
  baseHref,
  empty,
  live,
}: {
  title: string
  caption: string
  matches: (MatchRowLite & { sides: { side: 'A' | 'B'; team: TeamLite | null }[] })[]
  sideTeam: (m: { sides: { side: 'A' | 'B'; team: TeamLite | null }[] }, s: 'A' | 'B') => TeamLite | null
  baseHref: string
  empty: string
  live?: boolean
}) {
  return (
    <div>
      <div className="flex items-end justify-between border-b border-border pb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {caption}
          </p>
          <h2 className="mt-1.5 flex items-center gap-2 font-heading text-3xl text-ink">
            {live && <span className="size-2 rounded-full bg-forest" />}
            {title}
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {matches.length}
        </span>
      </div>

      {matches.length === 0 ? (
        <p className="mt-5 rounded-sm border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {matches.map((m) => {
            const teamA = sideTeam(m, 'A')
            const teamB = sideTeam(m, 'B')
            const when = matchWhen(m.scheduledAt, m.timeTbd)
            return (
              <li key={m.id}>
                <Link
                  href={`${baseHref}/${m.id}`}
                  className="group flex items-center gap-4 py-3.5 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <TeamLine
                      label={teamLabel(teamA)}
                      score={scoreString(m.sets, 'A')}
                      won={m.winnerSide === 'A'}
                    />
                    <TeamLine
                      label={teamLabel(teamB)}
                      score={scoreString(m.sets, 'B')}
                      won={m.winnerSide === 'B'}
                    />
                  </div>
                  <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:block">
                    {m.court?.name ?? when ?? ''}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function TeamLine({
  label,
  score,
  won,
}: {
  label: string
  score: string
  won: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className={`size-1.5 shrink-0 rounded-full ${won ? 'bg-terracotta' : 'bg-transparent'}`} />
        <span className={`truncate text-sm ${won ? 'font-medium text-ink' : 'text-muted-foreground'}`}>
          {label}
        </span>
      </span>
      <span className={`shrink-0 font-mono text-sm tabular-nums ${won ? 'text-ink' : 'text-muted-foreground'}`}>
        {score}
      </span>
    </div>
  )
}
