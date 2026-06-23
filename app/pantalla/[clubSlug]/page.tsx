import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

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

  const now = new Date()
  const todayKey = clubDateKey(now)
  const { start, end } = clubDayRange(todayKey)

  // Partidos de hoy del club que están en juego o programados (con hora). Los
  // resultados ya finalizados o cancelados no interesan en la pantalla.
  const matches = await prisma.match.findMany({
    where: {
      clubId: club.id,
      scheduledAt: { gte: start, lt: end },
      status: { in: ['in_progress', 'scheduled'] },
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
    const startMs = (m.scheduledAt as Date).getTime() + slot * durMin * 60_000
    return {
      id: m.id,
      live: m.status === 'in_progress',
      startMs,
      timeLabel: clubTimeLabel(new Date(startMs)),
      court: m.court?.name ?? null,
      sideA: sideLabel(m.sides[0]),
      sideB: sideLabel(m.sides[1]),
      competition: competitionLabel(m),
    }
  })

  const live = rows
    .filter((r) => r.live)
    .sort((a, b) => a.startMs - b.startMs)
  const upcoming = rows
    .filter((r) => !r.live)
    .sort((a, b) => a.startMs - b.startMs)

  const dateLabel = formatInClubTz(now, "EEEE d 'de' LLLL")

  return (
    <div className="flex min-h-screen flex-col bg-ink text-cream">
      {/* ---- Cabecera ---- */}
      <header className="flex items-center justify-between gap-6 border-b border-cream/10 px-8 py-6 lg:px-12">
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

      <main className="flex flex-1 flex-col gap-10 px-8 py-8 lg:px-12 lg:py-10">
        {rows.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="font-mono text-sm uppercase tracking-[0.3em] text-cream/40">
              Sin partidos
            </p>
            <p className="mt-4 font-serif text-4xl tracking-tight text-cream/70">
              No hay partidos programados para hoy.
            </p>
          </div>
        ) : (
          <>
            {/* ---- En juego ---- */}
            {live.length > 0 && (
              <section>
                <SectionTitle
                  dot="bg-lime"
                  label="En juego"
                  count={live.length}
                />
                <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {live.map((r) => (
                    <MatchCard key={r.id} row={r} live />
                  ))}
                </div>
              </section>
            )}

            {/* ---- Próximos ---- */}
            {upcoming.length > 0 && (
              <section>
                <SectionTitle
                  dot="bg-ochre"
                  label="A continuación"
                  count={upcoming.length}
                />
                <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {upcoming.map((r) => (
                    <MatchCard key={r.id} row={r} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* ---- Pie ---- */}
      <footer className="flex items-center justify-between border-t border-cream/10 px-8 py-4 font-mono text-[11px] uppercase tracking-[0.25em] text-cream/35 lg:px-12">
        <span>bandeja</span>
        <span>Se actualiza solo</span>
      </footer>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Subcomponentes                                                             */
/* -------------------------------------------------------------------------- */

function SectionTitle({
  dot,
  label,
  count,
}: {
  dot: string
  label: string
  count: number
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`size-2.5 rounded-full ${dot}`} />
      <h2 className="font-mono text-sm uppercase tracking-[0.3em] text-cream/80">
        {label}
      </h2>
      <span className="font-mono text-sm tabular-nums text-cream/35">
        {String(count).padStart(2, '0')}
      </span>
      <span className="ml-1 h-px flex-1 bg-cream/10" />
    </div>
  )
}

type Row = {
  id: string
  live: boolean
  timeLabel: string
  court: string | null
  sideA: string
  sideB: string
  competition: string
}

function MatchCard({ row, live = false }: { row: Row; live?: boolean }) {
  return (
    <div
      className={
        live
          ? 'flex items-stretch gap-5 rounded-2xl border border-lime/30 bg-forest/40 p-5 lg:p-6'
          : 'flex items-stretch gap-5 rounded-2xl border border-cream/10 bg-cream/[0.03] p-5 lg:p-6'
      }
    >
      {/* Hora + cancha */}
      <div className="flex w-32 shrink-0 flex-col justify-center border-r border-cream/10 pr-5">
        <span className="font-mono text-3xl leading-none tabular-nums lg:text-4xl">
          {row.timeLabel}
        </span>
        <span
          className={
            live
              ? 'mt-2 font-mono text-[11px] uppercase tracking-widest text-lime'
              : 'mt-2 font-mono text-[11px] uppercase tracking-widest text-cream/45'
          }
        >
          {live ? 'En juego' : 'Próximo'}
        </span>
      </div>

      {/* Enfrentamiento + competición */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="truncate font-serif text-3xl leading-tight tracking-tight lg:text-4xl">
          {row.sideA}
        </p>
        <p className="my-1 font-mono text-xs uppercase tracking-[0.3em] text-cream/35">
          vs
        </p>
        <p className="truncate font-serif text-3xl leading-tight tracking-tight lg:text-4xl">
          {row.sideB}
        </p>
        <p className="mt-3 truncate font-mono text-xs uppercase tracking-widest text-cream/45">
          {row.competition}
        </p>
      </div>

      {/* Cancha */}
      <div className="flex w-28 shrink-0 flex-col items-end justify-center border-l border-cream/10 pl-5 text-right">
        <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
          Cancha
        </span>
        <span className="mt-1 font-serif text-2xl leading-tight tracking-tight lg:text-3xl">
          {row.court ?? '—'}
        </span>
      </div>
    </div>
  )
}
