import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import {
  RoundMatches,
  type GlobalStanding,
  type GroupRoster,
  type MatchItem,
} from '@/components/dashboard/round-matches'
import { RoundSettings } from '@/components/dashboard/round-settings'
import { Button } from '@/components/ui/button'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'

const dateFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const dateTimeFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Convierte un `Date` al formato de `<input type="datetime-local">`
 * (`YYYY-MM-DDTHH:MM`) usando la hora local del servidor, igual que se
 * interpretó al guardarlo, para que el valor haga ida y vuelta sin desfase.
 */
function toDateTimeLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; roundId: string }>
}): Promise<Metadata> {
  const { roundId } = await params
  const round = await prisma.leagueRound.findUnique({
    where: { id: roundId },
    select: { roundNumber: true, name: true },
  })
  const label = round?.name ?? `Jornada ${round?.roundNumber ?? ''}`.trim()
  return { title: `${label} · Bandeja` }
}

export default async function JornadaDetailPage({
  params,
}: {
  params: Promise<{ id: string; roundId: string }>
}) {
  const { id, roundId } = await params
  const club = await getManagedClub()
  if (!club) notFound()

  // La jornada debe pertenecer a una liga del club gestionado.
  const round = await prisma.leagueRound.findFirst({
    where: { id: roundId, leagueId: id, league: { clubId: club.id } },
    include: {
      league: {
        select: {
          id: true,
          name: true,
          playKind: true,
          scoringConfig: { select: { bestOfSets: true } },
        },
      },
    },
  })
  if (!round) notFound()

  const [registrations, courts, matches, slots, standings] = await Promise.all([
    prisma.leagueRegistration.findMany({
      where: { leagueId: id, status: 'active' },
      orderBy: { player: { fullName: 'asc' } },
      select: { player: { select: { id: true, fullName: true } } },
    }),
    prisma.court.findMany({
      where: { clubId: club.id, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.match.findMany({
      where: { leagueRoundId: roundId },
      // Grupo 1 primero; dentro del grupo, el set 1/2/3 por intraGroupOrder.
      // Los partidos sin grupo/orden van al final (NULLS LAST en PG).
      orderBy: [
        { groupNumber: 'asc' },
        { intraGroupOrder: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        court: { select: { name: true } },
        sides: {
          orderBy: { side: 'asc' },
          include: {
            players: {
              include: { player: { select: { fullName: true } } },
            },
          },
        },
        sets: { orderBy: { setNumber: 'asc' } },
      },
    }),
    prisma.leagueGroupSlot.findMany({
      where: { roundId },
      orderBy: { groupNumber: 'asc' },
      select: {
        groupNumber: true,
        registrationId: true,
        attendance: true,
        substituteName: true,
        registration: {
          select: { playerId: true, player: { select: { fullName: true } } },
        },
      },
    }),
    // Clasificación acumulada de la liga: último criterio de desempate del
    // movimiento de grupo cuando dos jugadores empatan en todo (sets, juegos,
    // diferencia) y su enfrentamiento directo queda igualado.
    prisma.leagueStanding.findMany({
      where: { leagueId: id },
      select: {
        setsFor: true,
        setsAgainst: true,
        gamesFor: true,
        gamesAgainst: true,
        registration: { select: { playerId: true } },
      },
    }),
  ])

  const players = registrations.map((r) => ({
    id: r.player.id,
    name: r.player.fullName,
  }))

  // playerId -> totales acumulados en la liga (para desempatar el movimiento).
  const globalStandings: Record<string, GlobalStanding> = {}
  for (const s of standings) {
    globalStandings[s.registration.playerId] = {
      setsFor: s.setsFor,
      setsAgainst: s.setsAgainst,
      gamesFor: s.gamesFor,
      gamesAgainst: s.gamesAgainst,
    }
  }

  const matchItems: MatchItem[] = matches.map((m) => {
    const side = (s: 'A' | 'B') =>
      m.sides
        .find((x) => x.side === s)
        ?.players.map((p) => ({ id: p.playerId, name: p.player.fullName })) ??
      []
    return {
      id: m.id,
      status: m.status,
      winnerSide: m.winnerSide,
      groupNumber: m.groupNumber ?? null,
      intraGroupOrder: m.intraGroupOrder ?? null,
      courtId: m.courtId ?? null,
      courtName: m.court?.name ?? null,
      scheduledLabel: m.scheduledAt ? dateTimeFmt.format(m.scheduledAt) : null,
      scheduledValue: m.scheduledAt ? toDateTimeLocal(m.scheduledAt) : null,
      sideA: side('A'),
      sideB: side('B'),
      sets: m.sets.map((s) => ({ gamesA: s.gamesA, gamesB: s.gamesB })),
    }
  })

  // Pase de lista por grupo: jugador, asistencia y suplente (si no llegó).
  const rosters: GroupRoster[] = [
    ...slots
      .reduce((map, s) => {
        const list = map.get(s.groupNumber) ?? []
        list.push({
          registrationId: s.registrationId,
          playerId: s.registration.playerId,
          fullName: s.registration.player.fullName,
          attendance: s.attendance,
          substituteName: s.substituteName,
        })
        map.set(s.groupNumber, list)
        return map
      }, new Map<number, GroupRoster['members']>())
      .entries(),
  ]
    .sort((a, b) => a[0] - b[0])
    .map(([groupNumber, members]) => ({ groupNumber, members }))

  const bestOfSets = round.league.scoringConfig?.bestOfSets ?? 3
  const roundLabel = round.name ?? `Jornada ${round.roundNumber}`

  // Prefija el día de la jornada en el campo de horario (12:00 por defecto),
  // para que solo haya que ajustar la hora.
  const defaultDateTime = round.scheduledDate
    ? `${round.scheduledDate.toISOString().slice(0, 10)}T12:00`
    : undefined

  return (
    <>
      <DashboardTopbar>
        <Button
          asChild
          variant="outline"
          className="h-9 gap-1.5 rounded-md px-4 text-sm"
        >
          <Link href={`/dashboard/ligas/${round.league.id}`}>
            <ArrowLeft className="size-4" strokeWidth={2} />
            {round.league.name}
          </Link>
        </Button>
      </DashboardTopbar>

      <div className="mx-auto max-w-[1100px] px-8 py-10">
        <section>
          <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <span>{round.league.name}</span>
            <span className="text-foreground/25">·</span>
            <span>Jornada {round.roundNumber}</span>
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
            {roundLabel}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {round.scheduledDate
              ? dateFmt.format(round.scheduledDate)
              : 'Sin fecha programada'}
            {' · '}
            {matchItems.length}{' '}
            {matchItems.length === 1 ? 'partido' : 'partidos'} · Al mejor de{' '}
            {bestOfSets} sets.
          </p>
        </section>

        <div className="mt-8">
          <RoundSettings
            roundId={round.id}
            roundNumber={round.roundNumber}
            status={round.status}
            name={round.name}
            scheduledDate={
              round.scheduledDate
                ? round.scheduledDate.toISOString().slice(0, 10)
                : ''
            }
          />
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <RoundMatches
            roundId={roundId}
            players={players}
            courts={courts}
            matches={matchItems}
            rosters={rosters}
            globalStandings={globalStandings}
            playKind={round.league.playKind}
            bestOfSets={bestOfSets}
            defaultDateTime={defaultDateTime}
          />
        </div>
      </div>
    </>
  )
}
