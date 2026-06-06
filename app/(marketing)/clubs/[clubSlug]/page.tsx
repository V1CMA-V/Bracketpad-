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
      createdAt: true,
      _count: { select: { players: true } },
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

  return { club, courtMatches }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>
}): Promise<Metadata> {
  const { clubSlug } = await params
  const data = await getClub(clubSlug)
  if (!data) return { title: 'Club no encontrado · Bandeja' }
  const { club } = data
  return {
    title: `${club.name} · Bandeja`,
    description: `Pistas, ligas y torneos del ${club.name}${
      club.city ? ` en ${club.city}` : ''
    }.`,
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
  const { club, courtMatches } = data

  /* --- Pistas + estado en vivo --- */
  const playingCourts = new Set(
    courtMatches.filter((m) => m.status === 'in_progress').map((m) => m.courtId),
  )
  // Primer partido programado por pista (ya viene ordenado por scheduledAt).
  const nextByCourt = new Map<string, Date | null>()
  for (const m of courtMatches) {
    if (m.status === 'scheduled' && m.courtId && !nextByCourt.has(m.courtId)) {
      nextByCourt.set(m.courtId, m.scheduledAt)
    }
  }

  const courts = club.courts.map((c, i) => {
    let status: CourtStatus
    let detail: string
    if (!c.isActive) {
      status = 'closed'
      detail = 'fuera de servicio'
    } else if (playingCourts.has(c.id)) {
      status = 'playing'
      detail = 'partido en curso'
    } else if (nextByCourt.has(c.id)) {
      status = 'next'
      const at = nextByCourt.get(c.id) ?? null
      detail = at ? `próx. ${timeFmt.format(at)}` : 'partido programado'
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

  /* --- Horario agregado de las pistas --- */
  // Por cada día: apertura más temprana y cierre más tardío entre todas las pistas.
  const dayOpen = new Map<number, string>()
  const dayClose = new Map<number, string>()
  for (const c of club.courts) {
    for (const a of c.availability) {
      const open = dayOpen.get(a.dayOfWeek)
      const close = dayClose.get(a.dayOfWeek)
      if (!open || a.openTime < open) dayOpen.set(a.dayOfWeek, a.openTime)
      if (!close || a.closeTime > close) dayClose.set(a.dayOfWeek, a.closeTime)
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
  const foundedYear = club.createdAt.getFullYear()

  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-cream">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3 font-mono text-xs uppercase tracking-wider text-ink md:px-12">
          <nav className="flex items-center gap-2">
            <Link
              href="/clubs"
              className="text-muted-foreground transition-colors hover:text-ink"
            >
              Clubes
            </Link>
            {club.city && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{club.city}</span>
              </>
            )}
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold text-ink">{club.name}</span>
          </nav>

          {liveCourts > 0 ? (
            <Link
              href="#instalaciones"
              className="flex items-center gap-2 text-terracotta transition-opacity hover:opacity-80"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-terracotta" />
              </span>
              <span className="underline decoration-1 underline-offset-4">
                {liveCourts} {liveCourts === 1 ? 'pista' : 'pistas'} en juego
              </span>
            </Link>
          ) : (
            <Link
              href={`/clubs/${club.slug}/torneos`}
              className="text-muted-foreground transition-colors hover:text-ink"
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
        phone={club.phone}
        email={club.email}
        schedule={schedule}
        surfaces={surfaces}
        totalCourts={club.courts.length}
        playersCount={club._count.players}
      />
    </div>
  )
}
