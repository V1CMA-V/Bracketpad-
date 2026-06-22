import { Hero } from '@/components/club/hero'
import { InfoClub } from '@/components/club/info-club'
import { Installations } from '@/components/club/installations'
import { NumberClub } from '@/components/club/number-club'
import { Competitions } from '@/components/club/tournaments'
import { courtSurfaceLabels, type CourtSurface } from '@/lib/courts'
import { leagueFormatLabels } from '@/lib/leagues'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

/* -------------------------------------------------------------------------- */
/*  Formato                                                                    */
/* -------------------------------------------------------------------------- */

const dateFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const shortRangeFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
})

const timeFmt = new Intl.DateTimeFormat('es', {
  hour: '2-digit',
  minute: '2-digit',
})

function formatRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${shortRangeFmt.format(start)} — ${shortRangeFmt.format(end)}`
  if (start) return `Desde ${dateFmt.format(start)}`
  if (end) return `Hasta ${dateFmt.format(end)}`
  return 'Fechas por confirmar'
}

// Etiquetas de estado de torneo (las de liga viven en lib/leagues).
const tournamentStatusLabels: Record<string, string> = {
  draft: 'Borrador',
  registration_open: 'Inscripción abierta',
  in_progress: 'En juego',
  finished: 'Finalizado',
  archived: 'Archivado',
}

// 0 = domingo … 6 = sábado. Orden de presentación Lun → Dom.
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

/* -------------------------------------------------------------------------- */
/*  Datos                                                                      */
/* -------------------------------------------------------------------------- */

async function getClub(slug: string) {
  const club = await prisma.club.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      address: true,
      phone: true,
      email: true,
      logoUrl: true,
      description: true,
      website: true,
      instagram: true,
      foundedYear: true,
      state: true,
      country: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      _count: { select: { players: true } },
      classPricing: {
        select: {
          price1: true,
          price2: true,
          price3: true,
          price4: true,
          currency: true,
        },
      },
      courtRates: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          label: true,
          days: true,
          startTime: true,
          endTime: true,
          price: true,
          currency: true,
        },
      },
      // Horario publicado del club (Ajustes › Horario). Es la fuente principal
      // del horario público; las pistas son solo respaldo.
      hours: {
        select: { dayOfWeek: true, openTime: true, closeTime: true },
      },
      courts: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          surface: true,
          isIndoor: true,
          isActive: true,
          availability: {
            select: { dayOfWeek: true, openTime: true, closeTime: true },
          },
        },
      },
      leagues: {
        where: { status: { not: 'draft' } },
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          name: true,
          format: true,
          status: true,
          startDate: true,
          endDate: true,
          _count: { select: { registrations: true, rounds: true } },
        },
      },
      tournaments: {
        where: { status: { not: 'draft' } },
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
          categories: { select: { _count: { select: { teams: true } } } },
        },
      },
    },
  })
  if (!club) return null

  // Estado en vivo de las pistas: partido en curso o próximo programado.
  const courtMatches = await prisma.match.findMany({
    where: {
      clubId: club.id,
      courtId: { not: null },
      status: { in: ['in_progress', 'scheduled'] },
    },
    orderBy: { scheduledAt: 'asc' },
    select: { courtId: true, status: true, scheduledAt: true },
  })

  // Reservas y clases que ocupan pista ahora o en breve. La ventana arranca unas
  // horas antes para captar las que siguen en curso (duran 60–90 min).
  const now = Date.now()
  const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000)
  const reservations = await prisma.courtReservation.findMany({
    where: {
      clubId: club.id,
      status: 'confirmed',
      startAt: { gte: sixHoursAgo },
    },
    orderBy: { startAt: 'asc' },
    select: { courtId: true, startAt: true, durationMinutes: true, kind: true },
  })

  return { club, courtMatches, reservations, now }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>
}): Promise<Metadata> {
  const { clubSlug } = await params
  const data = await getClub(clubSlug)
  if (!data) return { title: 'Club no encontrado' }
  const { club } = data
  const title = club.name
  const description = `Pistas, ligas y torneos del ${club.name}${
    club.city ? ` en ${club.city}` : ''
  }.`
  const canonical = `/clubs/${clubSlug}`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  Página                                                                     */
/* -------------------------------------------------------------------------- */

type CourtStatus = 'playing' | 'next' | 'free' | 'closed'

export default async function ClubPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>
}) {
  const { clubSlug } = await params
  const data = await getClub(clubSlug)
  if (!data) notFound()
  const { club, courtMatches, reservations, now } = data

  /* --- Pistas + estado en vivo --- */
  // La ocupación combina partidos, reservas de juego libre y clases. Una pista
  // está «en juego» si algo la ocupa ahora mismo; «próxima» si tiene el siguiente
  // turno programado (lo más cercano entre partido, reserva o clase).
  const occupied = new Map<string, string>() // courtId → detalle («… en curso»)
  const nextByCourt = new Map<string, Date>() // courtId → inicio del próximo turno

  const considerNext = (courtId: string | null, at: Date | null) => {
    if (!courtId || !at || at.getTime() <= now) return
    const current = nextByCourt.get(courtId)
    if (!current || at < current) nextByCourt.set(courtId, at)
  }

  // Partidos: en curso ocupan; programados cuentan como próximo turno.
  for (const m of courtMatches) {
    if (!m.courtId) continue
    if (m.status === 'in_progress') {
      if (!occupied.has(m.courtId)) occupied.set(m.courtId, 'partido en curso')
    } else if (m.status === 'scheduled') {
      considerNext(m.courtId, m.scheduledAt)
    }
  }

  // Reservas y clases: ocupan si el momento actual cae dentro de su franja.
  for (const r of reservations) {
    const start = r.startAt.getTime()
    const end = start + r.durationMinutes * 60_000
    const label = r.kind === 'class' ? 'clase en curso' : 'reserva en curso'
    if (start <= now && now < end) {
      if (!occupied.has(r.courtId)) occupied.set(r.courtId, label)
    } else {
      considerNext(r.courtId, r.startAt)
    }
  }

  const courts = club.courts.map((c, i) => {
    let status: CourtStatus
    let detail: string
    if (!c.isActive) {
      status = 'closed'
      detail = 'fuera de servicio'
    } else if (occupied.has(c.id)) {
      status = 'playing'
      detail = occupied.get(c.id)!
    } else if (nextByCourt.has(c.id)) {
      status = 'next'
      detail = `próx. ${timeFmt.format(nextByCourt.get(c.id)!)}`
    } else {
      status = 'free'
      detail = 'disponible'
    }
    return {
      index: String(i + 1).padStart(2, '0'),
      name: c.name,
      type: c.isIndoor ? 'Cubierta' : 'Aire libre',
      surface: courtSurfaceLabels[c.surface as CourtSurface] ?? c.surface,
      status,
      detail,
    }
  })

  const indoorCourts = club.courts.filter((c) => c.isIndoor).length
  const outdoorCourts = club.courts.length - indoorCourts
  const liveCourts = courts.filter((c) => c.status === 'playing').length

  // Desglose por superficie (real).
  const surfaceCounts = new Map<string, number>()
  for (const c of club.courts) {
    const label = courtSurfaceLabels[c.surface as CourtSurface] ?? c.surface
    surfaceCounts.set(label, (surfaceCounts.get(label) ?? 0) + 1)
  }
  const surfaces = [...surfaceCounts.entries()].map(([label, count]) => ({
    label,
    count,
  }))

  /* --- Horario público del club --- */
  // Fuente principal: el horario publicado del club (Ajustes › Horario). Si no
  // hay ninguno, se agrega la disponibilidad de las pistas (apertura más
  // temprana y cierre más tardío de cada día) como respaldo.
  const dayOpen = new Map<number, string>()
  const dayClose = new Map<number, string>()
  if (club.hours.length > 0) {
    for (const h of club.hours) {
      dayOpen.set(h.dayOfWeek, h.openTime)
      dayClose.set(h.dayOfWeek, h.closeTime)
    }
  } else {
    for (const c of club.courts) {
      for (const a of c.availability) {
        const open = dayOpen.get(a.dayOfWeek)
        const close = dayClose.get(a.dayOfWeek)
        if (!open || a.openTime < open) dayOpen.set(a.dayOfWeek, a.openTime)
        if (!close || a.closeTime > close) dayClose.set(a.dayOfWeek, a.closeTime)
      }
    }
  }
  const schedule = WEEK_ORDER.filter((d) => dayOpen.has(d)).map((d) => ({
    day: DAY_LABELS[d],
    hours: `${dayOpen.get(d)} — ${dayClose.get(d)}`,
  }))

  /* --- Competiciones: ligas + torneos --- */
  const leagueItems = club.leagues.map((l) => ({
    id: l.id,
    kind: 'liga' as const,
    name: l.name,
    meta: `${leagueFormatLabels[l.format] ?? l.format} · ${l._count.rounds} ${
      l._count.rounds === 1 ? 'jornada' : 'jornadas'
    }`,
    statusLabel:
      l.status === 'active'
        ? 'En juego'
        : l.status === 'finished'
          ? 'Finalizada'
          : 'Archivada',
    live: l.status === 'active',
    dates: formatRange(l.startDate, l.endDate),
    countLabel: 'Inscritos',
    countValue: l._count.registrations,
    href: `/clubs/${club.slug}/l/${l.id}`,
    sortKey: l.startDate ? l.startDate.getTime() : 0,
  }))

  const tournamentItems = club.tournaments.map((t) => {
    const teams = t.categories.reduce((n, c) => n + c._count.teams, 0)
    return {
      id: t.id,
      kind: 'torneo' as const,
      name: t.name,
      meta: `${t.categories.length} ${
        t.categories.length === 1 ? 'categoría' : 'categorías'
      }`,
      statusLabel: tournamentStatusLabels[t.status] ?? t.status,
      live: t.status === 'in_progress',
      dates: formatRange(t.startDate, t.endDate),
      countLabel: 'Parejas',
      countValue: teams,
      href: `/clubs/${club.slug}/t/${t.id}`,
      sortKey: t.startDate ? t.startDate.getTime() : 0,
    }
  })

  const competitions = [...leagueItems, ...tournamentItems].sort((a, b) => {
    if (a.live !== b.live) return a.live ? -1 : 1
    return b.sortKey - a.sortKey
  })

  const activeCompetitions = competitions.filter((c) => c.live).length
  // Año en que el club se dio de alta en Bandeja (distinto de su fundación).
  const joinedYear = club.createdAt.getFullYear()
  // Año de fundación real del club (lo edita en Ajustes), si lo ha indicado.
  const foundedYear = club.foundedYear ?? null

  /* --- Tarifas de clases (precio por nº de jugadores) --- */
  const classRates = club.classPricing
    ? [
        { players: 1, price: club.classPricing.price1 },
        { players: 2, price: club.classPricing.price2 },
        { players: 3, price: club.classPricing.price3 },
        { players: 4, price: club.classPricing.price4 },
      ]
        .filter((r) => r.price != null)
        .map((r) => ({ players: r.players, price: Number(r.price) }))
    : []
  const classCurrency = club.classPricing?.currency ?? 'MXN'

  /* --- Tarifas de renta de pista (por franja y días) --- */
  const courtRates = club.courtRates.map((r) => ({
    id: r.id,
    label: r.label,
    days: r.days,
    startTime: r.startTime,
    endTime: r.endTime,
    price: Number(r.price),
  }))
  const courtRateCurrency = club.courtRates[0]?.currency ?? 'MXN'

  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-cream">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink sm:px-6 md:px-12">
          <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/clubs"
              className="shrink-0 text-muted-foreground transition-colors hover:text-ink"
            >
              Clubes
            </Link>
            {club.city && (
              <>
                <span className="shrink-0 text-muted-foreground">/</span>
                <span className="shrink-0 text-muted-foreground">{club.city}</span>
              </>
            )}
            <span className="shrink-0 text-muted-foreground">/</span>
            <span className="shrink-0 font-semibold text-ink">{club.name}</span>
          </nav>

          {liveCourts > 0 ? (
            <Link
              href="#instalaciones"
              className="flex shrink-0 items-center gap-2 text-terracotta transition-opacity hover:opacity-80"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-terracotta" />
              </span>
              <span className="underline decoration-1 underline-offset-4">
                {liveCourts} {liveCourts === 1 ? 'pista ocupada' : 'pistas ocupadas'}
              </span>
            </Link>
          ) : (
            <Link
              href={`/clubs/${club.slug}/torneos`}
              className="shrink-0 text-muted-foreground transition-colors hover:text-ink"
            >
              Ver torneos
            </Link>
          )}
        </div>
      </div>

      <Hero
        name={club.name}
        city={club.city}
        address={club.address}
        joinedYear={joinedYear}
        foundedYear={foundedYear}
        playersCount={club._count.players}
        leaguesCount={club.leagues.length}
        tournamentsCount={club.tournaments.length}
        totalCourts={club.courts.length}
        indoorCourts={indoorCourts}
        outdoorCourts={outdoorCourts}
        courts={courts}
      />
      <NumberClub
        joinedYear={joinedYear}
        foundedYear={foundedYear}
        totalCourts={club.courts.length}
        indoorCourts={indoorCourts}
        outdoorCourts={outdoorCourts}
        playersCount={club._count.players}
        leaguesCount={club.leagues.length}
        activeCompetitions={activeCompetitions}
        tournamentsCount={club.tournaments.length}
      />
      <Competitions
        items={competitions}
        activeCount={activeCompetitions}
        clubSlug={club.slug}
      />
      <Installations
        courts={courts}
        indoorCourts={indoorCourts}
        outdoorCourts={outdoorCourts}
      />
      <InfoClub
        name={club.name}
        city={club.city}
        address={club.address}
        state={club.state}
        country={club.country}
        phone={club.phone}
        email={club.email}
        website={club.website}
        instagram={club.instagram}
        description={club.description}
        latitude={club.latitude}
        longitude={club.longitude}
        schedule={schedule}
        surfaces={surfaces}
        classRates={classRates}
        classCurrency={classCurrency}
        courtRates={courtRates}
        courtRateCurrency={courtRateCurrency}
        totalCourts={club.courts.length}
        playersCount={club._count.players}
      />
    </div>
  )
}
