import { prisma } from '@/lib/prisma'

type Acc = {
  registrationId: string
  matchesPlayed: number
  wins: number
  losses: number
  setsFor: number
  setsAgainst: number
  gamesFor: number
  gamesAgainst: number
}

/**
 * Recalcula la clasificación de una liga a partir de los partidos finalizados.
 * El ranking se basa en sets ganados (setsFor). Se invoca tras capturar o
 * borrar resultados.
 */
export async function recomputeStandings(leagueId: string) {
  const registrations = await prisma.leagueRegistration.findMany({
    where: { leagueId },
    select: { id: true, playerId: true },
  })

  // playerId -> acumulador de su inscripción
  const byPlayer = new Map<string, Acc>()
  for (const r of registrations) {
    byPlayer.set(r.playerId, {
      registrationId: r.id,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      setsFor: 0,
      setsAgainst: 0,
      gamesFor: 0,
      gamesAgainst: 0,
    })
  }

  const matches = await prisma.match.findMany({
    where: { leagueId, status: 'finished' },
    include: {
      sides: { include: { players: { select: { playerId: true } } } },
      sets: true,
    },
  })

  for (const match of matches) {
    const sideA = match.sides.find((s) => s.side === 'A')
    const sideB = match.sides.find((s) => s.side === 'B')
    if (!sideA || !sideB) continue

    let setsA = 0
    let setsB = 0
    let gamesA = 0
    let gamesB = 0
    for (const set of match.sets) {
      gamesA += set.gamesA
      gamesB += set.gamesB
      if (set.gamesA > set.gamesB) setsA += 1
      else if (set.gamesB > set.gamesA) setsB += 1
    }

    const apply = (
      players: { playerId: string }[],
      ownSets: number,
      oppSets: number,
      ownGames: number,
      oppGames: number,
      won: boolean,
    ) => {
      for (const p of players) {
        const acc = byPlayer.get(p.playerId)
        if (!acc) continue
        acc.matchesPlayed += 1
        acc.setsFor += ownSets
        acc.setsAgainst += oppSets
        acc.gamesFor += ownGames
        acc.gamesAgainst += oppGames
        if (won) acc.wins += 1
        else acc.losses += 1
      }
    }

    apply(sideA.players, setsA, setsB, gamesA, gamesB, match.winnerSide === 'A')
    apply(sideB.players, setsB, setsA, gamesB, gamesA, match.winnerSide === 'B')
  }

  await prisma.$transaction(
    [...byPlayer.values()].map((acc) =>
      prisma.leagueStanding.upsert({
        where: {
          leagueId_registrationId: {
            leagueId,
            registrationId: acc.registrationId,
          },
        },
        update: {
          matchesPlayed: acc.matchesPlayed,
          wins: acc.wins,
          losses: acc.losses,
          setsFor: acc.setsFor,
          setsAgainst: acc.setsAgainst,
          gamesFor: acc.gamesFor,
          gamesAgainst: acc.gamesAgainst,
        },
        create: {
          leagueId,
          registrationId: acc.registrationId,
          matchesPlayed: acc.matchesPlayed,
          wins: acc.wins,
          losses: acc.losses,
          setsFor: acc.setsFor,
          setsAgainst: acc.setsAgainst,
          gamesFor: acc.gamesFor,
          gamesAgainst: acc.gamesAgainst,
        },
      }),
    ),
  )
}
