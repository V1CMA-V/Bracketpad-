import { prisma } from '@/lib/prisma'

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

/** Valor numérico (mayor = mejor) de un criterio de desempate. */
function tiebreakerValue(s: RankableStanding, criterion: string): number {
  switch (criterion) {
    case 'set_diff':
      return s.setsFor - s.setsAgainst
    case 'sets_won':
      return s.setsFor
    case 'game_diff':
      return s.gamesFor - s.gamesAgainst
    case 'games_won':
      return s.gamesFor
    // `head_to_head` requiere cruzar partidos entre ambos jugadores; no se
    // resuelve a nivel de fila, así que aquí no desempata.
    default:
      return 0
  }
}

/**
 * Comparador de clasificación. Criterio principal: **sets ganados** (decisión
 * de diseño de la liga, no por puntos de victoria). Los empates se rompen con
 * los desempates configurados (`tiebreaker1..3`), en orden, y como último
 * recurso por victorias y menos derrotas.
 */
export function compareStandings(
  a: RankableStanding,
  b: RankableStanding,
  tiebreakers: string[],
): number {
  if (b.setsFor !== a.setsFor) return b.setsFor - a.setsFor
  for (const t of tiebreakers) {
    const diff = tiebreakerValue(b, t) - tiebreakerValue(a, t)
    if (diff !== 0) return diff
  }
  if (b.wins !== a.wins) return b.wins - a.wins
  return a.losses - b.losses
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
