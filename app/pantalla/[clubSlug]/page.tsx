import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { auth } from '@/auth'
import { PantallaBoard } from '@/components/pantalla/pantalla-board'
import { PantallaLive } from '@/components/pantalla/pantalla-live'
import { prisma } from '@/lib/prisma'
import { DEFAULT_MATCH_MINUTES, leagueStaggerSlot } from '@/lib/league-rules'
import {
  CLUB_TIME_ZONE,
  clubDateKey,
  clubDayRange,
  clubTimeLabel,
  formatInClubTz,
} from '@/lib/timezone'

// La pantalla se refresca sola en el navegador; pedimos que el contenido no se
// cachee para que cada refresco traiga el estado real de los partidos.
export const dynamic = 'force-dynamic'

/* -------------------------------------------------------------------------- */
/*  Datos                                                                      */
/* -------------------------------------------------------------------------- */

async function getClub(slug: string) {
  return prisma.club.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, city: true },
  })
}

/** Apellido (último token) de un nombre completo, para etiquetas compactas. */
function surname(full: string): string {
  const parts = full.trim().split(/\s+/)
  return parts[parts.length - 1] || full
}

type RawSide = {
  team: {
    name: string | null
    members: { player: { fullName: string } }[]
  } | null
  players: { player: { fullName: string } }[]
}

/** Etiqueta de un lado del partido: apellidos de la pareja o nombre del equipo. */
function sideLabel(side: RawSide | undefined): string {
  if (!side) return 'Por definir'
  if (side.players.length > 0) {
    return side.players.map((p) => surname(p.player.fullName)).join(' / ')
  }
  if (side.team) {
    if (side.team.members.length > 0) {
      return side.team.members.map((m) => surname(m.player.fullName)).join(' / ')
    }
    if (side.team.name) return side.team.name
  }
  return 'Por definir'
}

type RawMatch = {
  leagueId: string | null
  groupNumber: number | null
  bracketRound: string | null
  league: { name: string; playKind: string } | null
  leagueRound: { roundNumber: number } | null
  category: { name: string; tournament: { name: string } } | null
}

/** Subtítulo de competición de un partido (liga/jornada o torneo/categoría). */
function competitionLabel(m: RawMatch): string {
  if (m.leagueId) {
    const parts = [m.league?.name ?? 'Liga']
    if (m.leagueRound) parts.push(`Jornada ${m.leagueRound.roundNumber}`)
    if (m.groupNumber != null) parts.push(`Grupo ${m.groupNumber}`)
    return parts.join(' · ')
  }
  if (m.category) {
    const parts = [m.category.tournament.name, m.category.name]
    if (m.bracketRound) parts.push(m.bracketRound)
    return parts.join(' · ')
  }
  return 'Partido'
}

const matchInclude = {
  court: { select: { name: true } },
  league: { select: { name: true, playKind: true } },
  leagueRound: { select: { roundNumber: true } },
  category: {
    select: { name: true, tournament: { select: { name: true } } },
  },
  sides: {
    orderBy: { side: 'asc' as const },
    include: {
      team: {
        select: {
          name: true,
          members: { include: { player: { select: { fullName: true } } } },
        },
      },
      players: { include: { player: { select: { fullName: true } } } },
    },
  },
} as const

/* -------------------------------------------------------------------------- */
/*  Metadatos                                                                  */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>
}): Promise<Metadata> {
  const { clubSlug } = await params
  const club = await getClub(clubSlug)
  return {
    title: club ? `${club.name} · En vivo` : 'Pantalla',
    // Es una utilidad para las pantallas del club: nunca debe indexarse.
    robots: { index: false, follow: false },
  }
}

/* -------------------------------------------------------------------------- */
/*  Página                                                                     */
/* -------------------------------------------------------------------------- */

export default async function PantallaPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>
}) {
  const { clubSlug } = await params
  const club = await getClub(clubSlug)
  if (!club) notFound()

  // Acceso restringido: la pantalla es privada del club. Solo entran los miembros
  // del club (cualquier rol: owner/admin/staff/viewer) y el super_admin de la
  // plataforma. Sin sesión → login; con sesión pero ajeno al club → 404 (no se
  // revela que la pantalla existe a quien no pertenece al club).
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')
  if (session.user.accountType !== 'super_admin') {
    const membership = await prisma.clubMembership.findUnique({
      where: {
        clubId_userId: { clubId: club.id, userId: session.user.id },
      },
      select: { role: true },
    })
    if (!membership) notFound()
  }

  const now = new Date()
  const todayKey = clubDateKey(now)
  const { start, end } = clubDayRange(todayKey)

  // Partidos del club a mostrar: los que están EN JUEGO (estén o no con hora, para
  // que siempre se vean mientras se disputan) y los PROGRAMADOS de hoy. Los ya
  // finalizados o cancelados no interesan en la pantalla.
  const matches = await prisma.match.findMany({
    where: {
      clubId: club.id,
      status: { in: ['in_progress', 'scheduled'] },
      OR: [
        { status: 'in_progress' },
        { scheduledAt: { gte: start, lt: end } },
      ],
    },
    include: matchInclude,
  })

  // Hora de inicio efectiva: en ligas las rondas de un grupo se escalonan a partir
  // de la hora del grupo; en el resto coincide con `scheduledAt`.
  const rows = matches.map((m) => {
    const slot = m.leagueId
      ? leagueStaggerSlot(m.league?.playKind, m.intraGroupOrder)
      : 0
    const durMin = m.durationMinutes ?? DEFAULT_MATCH_MINUTES
    // Un partido en juego puede no tener hora registrada; en ese caso se etiqueta
    // como «Ahora» y se ordena al final de los que sí la tienen.
    const startMs = m.scheduledAt
      ? m.scheduledAt.getTime() + slot * durMin * 60_000
      : null
    const live = m.status === 'in_progress'
    return {
      id: m.id,
      live,
      startMs,
      timeLabel:
        startMs != null ? clubTimeLabel(new Date(startMs)) : live ? 'Ahora' : '—',
      court: m.court?.name ?? null,
      sideA: sideLabel(m.sides[0]),
      sideB: sideLabel(m.sides[1]),
      competition: competitionLabel(m),
    }
  })

  const byStart = (a: { startMs: number | null }, b: { startMs: number | null }) =>
    (a.startMs ?? Number.POSITIVE_INFINITY) - (b.startMs ?? Number.POSITIVE_INFINITY)
  const live = rows.filter((r) => r.live).sort(byStart)
  const upcoming = rows.filter((r) => !r.live).sort(byStart)

  const dateLabel = formatInClubTz(now, "EEEE d 'de' LLLL")

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ink text-cream">
      {/* ---- Cabecera ---- */}
      <header className="flex shrink-0 items-center justify-between gap-6 border-b border-cream/10 px-8 py-5 lg:px-12">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-cream/45">
            {club.city ? `${club.city} · ` : ''}Partidos de hoy
          </p>
          <h1 className="mt-1 truncate font-serif text-4xl leading-none tracking-tight lg:text-5xl">
            {club.name}
          </h1>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-5xl leading-none tracking-tight lg:text-6xl">
            <PantallaLive timeZone={CLUB_TIME_ZONE} />
          </p>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-cream/45">
            <span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-lime align-middle" />
            <span className="first-letter:uppercase">{dateLabel}</span>
          </p>
        </div>
      </header>

      {/* El tablero ocupa el alto restante y rota los próximos sin scroll. */}
      <main className="min-h-0 flex-1 overflow-hidden px-8 py-6 lg:px-12 lg:py-8">
        <PantallaBoard live={live} upcoming={upcoming} />
      </main>

      {/* ---- Pie ---- */}
      <footer className="flex shrink-0 items-center justify-between border-t border-cream/10 px-8 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-cream/35 lg:px-12">
        <span>bandeja</span>
        <span>Se actualiza solo</span>
      </footer>
    </div>
  )
}
