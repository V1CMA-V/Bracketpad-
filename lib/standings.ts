import { prisma } from '@/lib/prisma'
import { NO_SHOW_GAMES_AGAINST, NO_SHOW_SETS } from '@/lib/league-rules'

/* -------------------------------------------------------------------------- */
/*  Orden de la clasificación                                                  */
/* -------------------------------------------------------------------------- */

/** Campos mínimos necesarios para ordenar una fila de clasificación. */
export type RankableStanding = {
  wins: number
  losses: number
  setsFor: number
  setsAgainst: number
  gamesFor: number
  gamesAgainst: number
}

/** Criterio principal de la clasificación. */
export type RankingBasis = 'sets' | 'games' | 'both'

/**
 * Comparador de clasificación. El criterio principal depende de `rankingBy`:
 * **diferencia de juegos** (ligas que solo cuentan juegos: ordena por ±Jue) o
 * **sets ganados** (resto, incluido `both`, que solo cambia las columnas
 * mostradas, no el orden). No hay lista de desempates: los empates quedan sin
 * romper (orden estable). El ascenso/descenso de un grupo empatado lo resuelve
 * el organizador manualmente al cerrar la jornada.
 */
export function compareStandings(
  a: RankableStanding,
  b: RankableStanding,
  rankingBy: RankingBasis = 'sets',
): number {
  return rankingBy === 'games'
    ? b.gamesFor - b.gamesAgainst - (a.gamesFor - a.gamesAgainst)
    : b.setsFor - a.setsFor
}

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

  // Jugadores ausentes (no llegaron) por jornada: su participación la cubrió un
  // suplente externo, así que sus resultados no cuentan para su clasificación
  // (los rivales sí conservan lo que jugaron). Clave: `${roundId}:${playerId}`.
  const absentSlots = await prisma.leagueGroupSlot.findMany({
    where: { attendance: 'absent', round: { leagueId } },
    select: { roundId: true, registration: { select: { playerId: true } } },
  })
  const absent = new Set(
    absentSlots.map((s) => `${s.roundId}:${s.registration.playerId}`),
  )

  // Sanción por inasistencia que fijó el club (juegos en contra). Por defecto 9.
  const scoringConfig = await prisma.leagueScoringConfig.findUnique({
    where: { leagueId },
    select: { noShowGamesAgainst: true },
  })
  const noShowGamesAgainst =
    scoringConfig?.noShowGamesAgainst ?? NO_SHOW_GAMES_AGAINST

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
        // El jugador ausente de esta jornada no recibe los resultados que jugó
        // su suplente.
        if (absent.has(`${match.leagueRoundId}:${p.playerId}`)) continue
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

  // Penalización por no presentarse: el jugador pierde la jornada como un forfeit
  // de sus 3 sets rotativos. Los juegos en contra los fija el club
  // (`noShowGamesAgainst`, 9 por defecto). Se aplica una vez por jornada ausente.
  for (const s of absentSlots) {
    const acc = byPlayer.get(s.registration.playerId)
    if (!acc) continue
    acc.matchesPlayed += NO_SHOW_SETS
    acc.losses += NO_SHOW_SETS
    acc.setsAgainst += NO_SHOW_SETS
    acc.gamesAgainst += noShowGamesAgainst
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
