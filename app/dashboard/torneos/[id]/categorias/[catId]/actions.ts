'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { Prisma } from '@/generated/client'

import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import { registerTeamSchema } from '@/lib/validations/team'
import {
  clamp,
  computeGroupStandings,
  maxGroupCount,
  roundRobinPairs,
  snakeGroupNumber,
  type StandingFixture,
} from '@/lib/tournament-groups'
import {
  bracketProgression,
  buildBracketPlan,
  selectQualifiers,
  type TeamStanding,
} from '@/lib/tournament-bracket'
import { decideResult, type SetScore } from '@/lib/match-results'
import { clubDateAndTimeToUtc } from '@/lib/timezone'

export type TeamState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<
    Record<'player1Name' | 'player2Name' | 'teamName' | 'seed', string[]>
  >
}

/** Busca un jugador del club por nombre o lo crea. */
async function findOrCreatePlayer(clubId: string, fullName: string) {
  const existing = await prisma.player.findFirst({
    where: { clubId, fullName },
    select: { id: true },
  })
  if (existing) return existing
  return prisma.player.create({
    data: { clubId, fullName },
    select: { id: true },
  })
}

/** Categoría que pertenece a un torneo del club gestionado, o null. */
async function findOwnedCategory(categoryId: string) {
  const club = await getManagedClub()
  if (!club) return null
  const category = await prisma.tournamentCategory.findFirst({
    where: { id: categoryId, clubId: club.id },
    select: {
      id: true,
      tournamentId: true,
      clubId: true,
      maxTeams: true,
      drawType: true,
      advancePerGroup: true,
    },
  })
  return category ? { category, club } : null
}

/** Revalida la ficha de la categoría y la del torneo (cuenta de parejas). */
function revalidateCategory(tournamentId: string, categoryId: string) {
  revalidatePath(`/dashboard/torneos/${tournamentId}/categorias/${categoryId}`)
  revalidatePath(`/dashboard/torneos/${tournamentId}`)
}

export async function registerTeam(
  categoryId: string,
  _prevState: TeamState,
  formData: FormData,
): Promise<TeamState> {
  const owned = await findOwnedCategory(categoryId)
  if (!owned) return { error: 'Categoría no encontrada.' }
  const { category, club } = owned

  const parsed = registerTeamSchema.safeParse({
    player1Name: formData.get('player1Name'),
    player2Name: formData.get('player2Name'),
    teamName: (formData.get('teamName') as string) || undefined,
    seed: (formData.get('seed') as string) || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  const { player1Name, player2Name, teamName, seed } = parsed.data

  if (player1Name.toLowerCase() === player2Name.toLowerCase()) {
    return { error: 'Los dos jugadores de la pareja deben ser distintos.' }
  }

  // Cupo: solo cuentan las parejas no retiradas.
  if (category.maxTeams != null) {
    const activeCount = await prisma.tournamentTeam.count({
      where: { categoryId, status: { not: 'withdrawn' } },
    })
    if (activeCount >= category.maxTeams) {
      return {
        error: `La categoría está llena (cupo de ${category.maxTeams} parejas).`,
      }
    }
  }

  const player1 = await findOrCreatePlayer(club.id, player1Name)
  const player2 = await findOrCreatePlayer(club.id, player2Name)

  // Ninguno de los dos puede estar ya en otra pareja de esta categoría.
  const clash = await prisma.tournamentTeam.findFirst({
    where: {
      categoryId,
      members: { some: { playerId: { in: [player1.id, player2.id] } } },
    },
    select: { id: true },
  })
  if (clash) {
    return {
      error: 'Alguno de los dos jugadores ya está inscrito en esta categoría.',
    }
  }

  await prisma.tournamentTeam.create({
    data: {
      categoryId,
      clubId: club.id,
      name: teamName ?? null,
      seed: seed ?? null,
      members: {
        create: [{ playerId: player1.id }, { playerId: player2.id }],
      },
    },
  })

  revalidateCategory(category.tournamentId, categoryId)
  return { success: true }
}

/** Verifica que la pareja pertenezca a una categoría del club gestionado. */
async function findOwnedTeam(teamId: string) {
  const club = await getManagedClub()
  if (!club) return null
  return prisma.tournamentTeam.findFirst({
    where: { id: teamId, clubId: club.id },
    select: {
      id: true,
      categoryId: true,
      clubId: true,
      groupNumber: true,
      status: true,
      category: { select: { tournamentId: true } },
    },
  })
}

export async function setTeamStatus(
  teamId: string,
  status: 'registered' | 'confirmed' | 'withdrawn',
) {
  if (!['registered', 'confirmed', 'withdrawn'].includes(status)) return
  const team = await findOwnedTeam(teamId)
  if (!team) return
  await prisma.tournamentTeam.update({ where: { id: team.id }, data: { status } })
  revalidateCategory(team.category.tournamentId, team.categoryId)
}

export async function removeTeam(teamId: string) {
  const team = await findOwnedTeam(teamId)
  if (!team) return
  // Al borrar la pareja se borran en cascada sus integrantes (members).
  await prisma.tournamentTeam.delete({ where: { id: team.id } })
  revalidateCategory(team.category.tournamentId, team.categoryId)
}

/* -------------------------------------------------------------------------- */
/*  Fase de grupos                                                            */
/* -------------------------------------------------------------------------- */

export type GroupState = { success?: boolean; error?: string }

/**
 * Genera la fase de grupos de la categoría: reparte las parejas activas (no
 * retiradas) en `numGroups` grupos por siembra serpenteante, guarda el tamaño
 * y cuántas avanzan, y crea todos los partidos round-robin de cada grupo.
 */
export async function generateGroups(
  categoryId: string,
  input: { numGroups: number; advancePerGroup: number },
): Promise<GroupState> {
  const owned = await findOwnedCategory(categoryId)
  if (!owned) return { error: 'Categoría no encontrada.' }
  const { category } = owned

  if (category.drawType !== 'groups_playoff') {
    return { error: 'Esta categoría no usa fase de grupos.' }
  }

  // Si ya hay grupos generados, hay que borrarlos antes de regenerar.
  const existing = await prisma.match.count({
    where: { categoryId, groupNumber: { not: null } },
  })
  if (existing > 0) {
    return { error: 'Ya hay grupos generados. Bórralos antes de regenerar.' }
  }

  // Parejas que entran al sorteo: no retiradas, ordenadas por cabeza de serie.
  const teams = await prisma.tournamentTeam.findMany({
    where: { categoryId, status: { not: 'withdrawn' } },
    orderBy: [{ seed: 'asc' }, { createdAt: 'asc' }],
    select: { id: true },
  })
  if (teams.length < 2) {
    return { error: 'Se necesitan al menos 2 parejas activas para generar grupos.' }
  }

  const numGroups = clamp(
    Math.round(input.numGroups),
    1,
    maxGroupCount(teams.length),
  )

  // Reparto serpenteante: cada pareja recibe su nº de grupo según su posición.
  const buckets = new Map<number, string[]>()
  teams.forEach((t, k) => {
    const g = snakeGroupNumber(k, numGroups)
    const bucket = buckets.get(g) ?? []
    bucket.push(t.id)
    buckets.set(g, bucket)
  })

  const maxSize = Math.max(...[...buckets.values()].map((b) => b.length))
  const advancePerGroup = clamp(Math.round(input.advancePerGroup), 1, maxSize)

  await prisma.$transaction(async (tx) => {
    // Asigna el grupo a cada pareja.
    for (const [g, ids] of buckets) {
      await tx.tournamentTeam.updateMany({
        where: { id: { in: ids } },
        data: { groupNumber: g },
      })
      // Partidos round-robin del grupo.
      const pairs = roundRobinPairs(ids.length)
      for (const [i, j] of pairs) {
        await tx.match.create({
          data: {
            clubId: category.clubId,
            contextType: 'tournament',
            categoryId,
            groupNumber: g,
            status: 'scheduled',
            sides: {
              create: [
                { side: 'A', teamId: ids[i] },
                { side: 'B', teamId: ids[j] },
              ],
            },
          },
        })
      }
    }
    await tx.tournamentCategory.update({
      where: { id: categoryId },
      data: { teamsPerGroup: maxSize, advancePerGroup },
    })
  })

  revalidateCategory(category.tournamentId, categoryId)
  return { success: true }
}

/** Borra la fase de grupos (partidos + asignaciones) para poder regenerarla. */
export async function clearGroups(categoryId: string): Promise<GroupState> {
  const owned = await findOwnedCategory(categoryId)
  if (!owned) return { error: 'Categoría no encontrada.' }
  const { category } = owned

  // No se borran grupos si ya hay partidos con resultado para no perder datos.
  const finished = await prisma.match.count({
    where: { categoryId, groupNumber: { not: null }, status: 'finished' },
  })
  if (finished > 0) {
    return {
      error:
        'Hay partidos de grupo con resultado registrado; no se pueden borrar los grupos.',
    }
  }

  await prisma.$transaction([
    prisma.match.deleteMany({
      where: { categoryId, groupNumber: { not: null } },
    }),
    prisma.tournamentTeam.updateMany({
      where: { categoryId },
      data: { groupNumber: null },
    }),
    prisma.tournamentCategory.update({
      where: { id: categoryId },
      data: { teamsPerGroup: null, advancePerGroup: null },
    }),
  ])

  revalidateCategory(category.tournamentId, categoryId)
  return { success: true }
}

/**
 * Recalcula `teamsPerGroup` (tamaño del grupo más grande) tras un cambio manual
 * de composición. Si ya no queda ninguna pareja agrupada, deja la categoría
 * como «sin generar» (ambos campos nulos). Se ejecuta dentro de la transacción.
 */
async function syncGroupSizes(
  tx: Prisma.TransactionClient,
  categoryId: string,
) {
  const grouped = await tx.tournamentTeam.findMany({
    where: { categoryId, groupNumber: { not: null }, status: { not: 'withdrawn' } },
    select: { groupNumber: true },
  })
  if (grouped.length === 0) {
    await tx.tournamentCategory.update({
      where: { id: categoryId },
      data: { teamsPerGroup: null, advancePerGroup: null },
    })
    return
  }
  const sizes = new Map<number, number>()
  for (const t of grouped) {
    const g = t.groupNumber as number
    sizes.set(g, (sizes.get(g) ?? 0) + 1)
  }
  await tx.tournamentCategory.update({
    where: { id: categoryId },
    data: { teamsPerGroup: Math.max(...sizes.values()) },
  })
}

/**
 * Mueve una pareja a otro grupo, la quita (target = null) o la asigna a un grupo
 * (incluido uno nuevo). Recomputa los partidos round-robin afectados: borra los
 * de la pareja en su grupo actual y crea los suyos en el grupo destino contra
 * las parejas que ya están ahí. Se niega si la pareja ya jugó algún partido de
 * grupo con resultado, para no perder datos.
 */
export async function setTeamGroup(
  teamId: string,
  target: number | null,
): Promise<GroupState> {
  const team = await findOwnedTeam(teamId)
  if (!team) return { error: 'Pareja no encontrada.' }

  const targetGroup =
    target == null ? null : clamp(Math.round(target), 1, 99)

  if (targetGroup === team.groupNumber) return { success: true }

  if (team.status === 'withdrawn') {
    return { error: 'La pareja está retirada; reactívala antes de agruparla.' }
  }

  // Guarda: no mover si la pareja ya tiene un partido de grupo con resultado.
  const finished = await prisma.match.count({
    where: {
      categoryId: team.categoryId,
      groupNumber: { not: null },
      status: 'finished',
      sides: { some: { teamId } },
    },
  })
  if (finished > 0) {
    return {
      error:
        'Esta pareja ya jugó un partido de grupo con resultado; no se puede mover.',
    }
  }

  await prisma.$transaction(async (tx) => {
    // 1) Borra los partidos de la pareja en su grupo actual.
    if (team.groupNumber != null) {
      await tx.match.deleteMany({
        where: {
          categoryId: team.categoryId,
          groupNumber: team.groupNumber,
          sides: { some: { teamId } },
        },
      })
    }

    // 2) En el grupo destino, crea un partido contra cada pareja ya presente.
    if (targetGroup != null) {
      const opponents = await tx.tournamentTeam.findMany({
        where: {
          categoryId: team.categoryId,
          groupNumber: targetGroup,
          status: { not: 'withdrawn' },
          id: { not: teamId },
        },
        select: { id: true },
      })
      for (const opp of opponents) {
        await tx.match.create({
          data: {
            clubId: team.clubId,
            contextType: 'tournament',
            categoryId: team.categoryId,
            groupNumber: targetGroup,
            status: 'scheduled',
            sides: {
              create: [
                { side: 'A', teamId },
                { side: 'B', teamId: opp.id },
              ],
            },
          },
        })
      }
    }

    // 3) Reasigna la pareja y recalcula los tamaños de grupo.
    await tx.tournamentTeam.update({
      where: { id: teamId },
      data: { groupNumber: targetGroup },
    })
    await syncGroupSizes(tx, team.categoryId)
  })

  revalidateCategory(team.category.tournamentId, team.categoryId)
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  Fase eliminatoria (llave)                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Calcula las posiciones (rank, victorias, dif. de sets y juegos) de cada pareja
 * activa dentro de su grupo, a partir de los partidos de grupo finalizados.
 * Reusa `computeGroupStandings`; devuelve una lista plana lista para la llave.
 */
async function computeCategoryStandings(
  categoryId: string,
): Promise<TeamStanding[]> {
  const teams = await prisma.tournamentTeam.findMany({
    where: { categoryId, groupNumber: { not: null }, status: { not: 'withdrawn' } },
    select: { id: true, groupNumber: true },
  })
  const matches = await prisma.match.findMany({
    where: { categoryId, groupNumber: { not: null } },
    select: {
      groupNumber: true,
      status: true,
      winnerSide: true,
      sides: { select: { side: true, teamId: true } },
      sets: { select: { gamesA: true, gamesB: true } },
    },
  })

  // Parejas e índice posición→id por grupo (la posición solo nombra las filas).
  const teamsByGroup = new Map<number, string[]>()
  for (const t of teams) {
    if (t.groupNumber == null) continue
    const arr = teamsByGroup.get(t.groupNumber) ?? []
    arr.push(t.id)
    teamsByGroup.set(t.groupNumber, arr)
  }

  const result: TeamStanding[] = []
  for (const [groupNumber, ids] of teamsByGroup) {
    const posByTeam = new Map<string, number>()
    ids.forEach((id, i) => posByTeam.set(id, i + 1))
    const positions = ids.map((_, i) => i + 1)

    const fixtures: StandingFixture[] = []
    for (const m of matches) {
      if (m.groupNumber !== groupNumber) continue
      const a = m.sides.find((s) => s.side === 'A')?.teamId
      const b = m.sides.find((s) => s.side === 'B')?.teamId
      const aPos = a ? posByTeam.get(a) : undefined
      const bPos = b ? posByTeam.get(b) : undefined
      if (aPos == null || bPos == null) continue
      fixtures.push({
        aPos,
        bPos,
        status: m.status,
        winner: m.winnerSide ?? null,
        sets: m.sets.map((s) => ({ gamesA: s.gamesA, gamesB: s.gamesB })),
      })
    }

    const rows = computeGroupStandings(positions, fixtures)
    const teamByPos = new Map<number, string>()
    posByTeam.forEach((pos, id) => teamByPos.set(pos, id))
    rows.forEach((row, i) => {
      const teamId = teamByPos.get(row.pos)
      if (!teamId) return
      result.push({
        teamId,
        groupNumber,
        rankInGroup: i + 1,
        wins: row.wins,
        setDiff: row.setsFor - row.setsAgainst,
        gameDiff: row.gamesFor - row.gamesAgainst,
      })
    })
  }
  return result
}

export type GenerateBracketInput = {
  advancePerGroup: number
  wildcardSlots: number
  wildcardTeamIds: string[]
  thirdPlace: boolean
}

/**
 * Genera la fase eliminatoria: toma los clasificados directos de cada grupo + los
 * comodines elegidos, los siembra en una llave de potencia de 2 (con byes para
 * los mejores cuando no cuadra) y crea todos los partidos de la llave. Marca como
 * eliminadas en grupos a las parejas que no clasificaron. Requiere que la fase de
 * grupos esté completa y que no exista ya una llave.
 */
export async function generateBracket(
  categoryId: string,
  input: GenerateBracketInput,
): Promise<GroupState> {
  const owned = await findOwnedCategory(categoryId)
  if (!owned) return { error: 'Categoría no encontrada.' }
  const { category } = owned

  if (category.drawType !== 'groups_playoff') {
    return { error: 'Esta categoría no usa fase de grupos.' }
  }

  const groupMatches = await prisma.match.count({
    where: { categoryId, groupNumber: { not: null } },
  })
  if (groupMatches === 0) {
    return { error: 'Genera y juega la fase de grupos antes de armar la llave.' }
  }
  const pendingGroup = await prisma.match.count({
    where: { categoryId, groupNumber: { not: null }, status: { not: 'finished' } },
  })
  if (pendingGroup > 0) {
    return {
      error: 'Faltan resultados de la fase de grupos; termínala antes de la llave.',
    }
  }
  const existingBracket = await prisma.match.count({
    where: { categoryId, bracketRound: { not: null } },
  })
  if (existingBracket > 0) {
    return { error: 'Ya hay una llave generada. Bórrala antes de regenerar.' }
  }

  const advancePerGroup = clamp(Math.round(input.advancePerGroup), 1, 16)
  const wildcardSlots = clamp(Math.round(input.wildcardSlots), 0, 64)

  const standings = await computeCategoryStandings(categoryId)
  if (standings.length < 2) {
    return { error: 'Se necesitan al menos 2 parejas con grupos para armar la llave.' }
  }

  const sel = selectQualifiers(
    standings,
    advancePerGroup,
    wildcardSlots,
    input.wildcardTeamIds,
  )
  const qualifiers = [...sel.direct, ...sel.wildcards]
  if (qualifiers.length < 2) {
    return { error: 'Se necesitan al menos 2 clasificados para armar la llave.' }
  }

  const plan = buildBracketPlan({
    direct: sel.direct,
    wildcards: sel.wildcards,
    bracketSize: sel.bracketSize,
    thirdPlace: input.thirdPlace,
  })

  const qualifierIds = new Set(qualifiers.map((q) => q.teamId))
  const activeTeams = await prisma.tournamentTeam.findMany({
    where: { categoryId, status: { not: 'withdrawn' } },
    select: { id: true },
  })
  const nonQualifiedIds = activeTeams
    .map((t) => t.id)
    .filter((id) => !qualifierIds.has(id))

  await prisma.$transaction(async (tx) => {
    for (const m of plan.matches) {
      await tx.match.create({
        data: {
          clubId: category.clubId,
          contextType: 'tournament',
          categoryId,
          bracketRound: m.round,
          bracketSlot: m.slot,
          status: 'scheduled',
          sides: {
            create: [
              { side: 'A', teamId: m.teamA },
              { side: 'B', teamId: m.teamB },
            ],
          },
        },
      })
    }
    await tx.tournamentCategory.update({
      where: { id: categoryId },
      data: {
        wildcardSlots,
        thirdPlaceMatch: input.thirdPlace && plan.rounds.includes('SF'),
      },
    })
    if (nonQualifiedIds.length > 0) {
      await tx.tournamentTeam.updateMany({
        where: { id: { in: nonQualifiedIds } },
        data: { eliminatedInRound: 'groups' },
      })
    }
    await tx.tournamentTeam.updateMany({
      where: { id: { in: [...qualifierIds] } },
      data: { eliminatedInRound: null },
    })
  })

  revalidateCategory(category.tournamentId, categoryId)
  return { success: true }
}

/** Borra la fase eliminatoria (partidos + estado de avance) para regenerarla. */
export async function clearBracket(categoryId: string): Promise<GroupState> {
  const owned = await findOwnedCategory(categoryId)
  if (!owned) return { error: 'Categoría no encontrada.' }
  const { category } = owned

  const finished = await prisma.match.count({
    where: { categoryId, bracketRound: { not: null }, status: 'finished' },
  })
  if (finished > 0) {
    return {
      error: 'Hay partidos de la llave con resultado; no se puede borrar la llave.',
    }
  }

  await prisma.$transaction([
    prisma.match.deleteMany({
      where: { categoryId, bracketRound: { not: null } },
    }),
    prisma.tournamentTeam.updateMany({
      where: { categoryId },
      data: { eliminatedInRound: null },
    }),
    prisma.tournamentCategory.update({
      where: { id: categoryId },
      data: { wildcardSlots: 0, thirdPlaceMatch: false },
    }),
  ])

  revalidateCategory(category.tournamentId, categoryId)
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  Captura de resultados                                                     */
/* -------------------------------------------------------------------------- */

/** Partido de torneo del club gestionado, con su config de sets y sus lados. */
async function findOwnedMatch(matchId: string) {
  const club = await getManagedClub()
  if (!club) return null
  return prisma.match.findFirst({
    where: { id: matchId, clubId: club.id, contextType: 'tournament' },
    select: {
      id: true,
      clubId: true,
      categoryId: true,
      bracketRound: true,
      bracketSlot: true,
      winnerSide: true,
      sides: { select: { side: true, teamId: true } },
      category: { select: { tournamentId: true, bestOfSets: true } },
    },
  })
}

/**
 * Guarda el resultado de un partido (set por set). Valida que el marcador defina
 * un ganador al mejor de N sets de la categoría; reemplaza los sets previos y
 * marca el partido como finalizado con su pareja ganadora.
 */
export async function saveMatchResult(
  matchId: string,
  sets: SetScore[],
): Promise<GroupState> {
  const match = await findOwnedMatch(matchId)
  if (!match) return { error: 'Partido no encontrado.' }
  if (!match.category || !match.categoryId) {
    return { error: 'El partido no pertenece a una categoría.' }
  }

  // Normaliza el marcador y descarta filas vacías (ambos juegos en 0).
  const cleaned: SetScore[] = sets
    .map((s) => ({
      gamesA: Math.trunc(Number(s.gamesA)),
      gamesB: Math.trunc(Number(s.gamesB)),
      tiebreakA: s.tiebreakA == null ? null : Math.trunc(Number(s.tiebreakA)),
      tiebreakB: s.tiebreakB == null ? null : Math.trunc(Number(s.tiebreakB)),
    }))
    .filter((s) => !(s.gamesA === 0 && s.gamesB === 0))

  const decided = decideResult(cleaned, match.category.bestOfSets)
  if (!decided.ok) return { error: decided.error }

  // Tie-break opcional: si se captura, debe ser coherente con el set.
  for (let i = 0; i < cleaned.length; i++) {
    const s = cleaned[i]
    if (s.tiebreakA == null && s.tiebreakB == null) continue
    if (s.tiebreakA == null || s.tiebreakB == null) {
      return { error: `Set ${i + 1}: captura los dos puntos del tie-break.` }
    }
    if (
      !Number.isInteger(s.tiebreakA) ||
      !Number.isInteger(s.tiebreakB) ||
      s.tiebreakA < 0 ||
      s.tiebreakB < 0 ||
      s.tiebreakA > 99 ||
      s.tiebreakB > 99
    ) {
      return { error: `Set ${i + 1}: tie-break inválido.` }
    }
    if (s.tiebreakA === s.tiebreakB) {
      return { error: `Set ${i + 1}: el tie-break no puede quedar empatado.` }
    }
    // Quien ganó el set (más juegos) debe tener el tie-break más alto.
    if (s.gamesA > s.gamesB !== s.tiebreakA > s.tiebreakB) {
      return {
        error: `Set ${i + 1}: el tie-break no coincide con el ganador del set.`,
      }
    }
  }

  const categoryId = match.categoryId
  const sideA = match.sides.find((s) => s.side === 'A')?.teamId ?? null
  const sideB = match.sides.find((s) => s.side === 'B')?.teamId ?? null
  const winnerTeamId = decided.winner === 'A' ? sideA : sideB
  const loserTeamId = decided.winner === 'A' ? sideB : sideA

  await prisma.$transaction(async (tx) => {
    await tx.matchSet.deleteMany({ where: { matchId } })
    await tx.matchSet.createMany({
      data: cleaned.map((s, i) => ({
        matchId,
        setNumber: i + 1,
        gamesA: s.gamesA,
        gamesB: s.gamesB,
        tiebreakA: s.tiebreakA ?? null,
        tiebreakB: s.tiebreakB ?? null,
      })),
    })
    await tx.match.update({
      where: { id: matchId },
      data: { status: 'finished', winnerSide: decided.winner },
    })

    // Partido de llave: el ganador avanza y el perdedor queda eliminado.
    if (match.bracketRound && match.bracketSlot != null) {
      const prog = bracketProgression(match.bracketRound, match.bracketSlot)
      if (prog.winner && winnerTeamId) {
        const next = await tx.match.findFirst({
          where: {
            categoryId,
            bracketRound: prog.winner.round,
            bracketSlot: prog.winner.slot,
          },
          select: { id: true },
        })
        if (next) {
          await tx.matchSide.updateMany({
            where: { matchId: next.id, side: prog.winner.side },
            data: { teamId: winnerTeamId },
          })
        }
      }
      // El perdedor de semifinal baja al partido por el 3er lugar.
      if (prog.loserToThirdPlace && loserTeamId) {
        const tp = await tx.match.findFirst({
          where: { categoryId, bracketRound: '3P', bracketSlot: 0 },
          select: { id: true },
        })
        if (tp) {
          await tx.matchSide.updateMany({
            where: { matchId: tp.id, side: prog.loserToThirdPlace.side },
            data: { teamId: loserTeamId },
          })
        }
      }
      // Estado eliminada: el perdedor cae en esta ronda. El 3er lugar solo
      // reparte bronce, así que no cambia el estado (ya cayeron en semifinal).
      if (loserTeamId && match.bracketRound !== '3P') {
        await tx.tournamentTeam.update({
          where: { id: loserTeamId },
          data: { eliminatedInRound: match.bracketRound },
        })
      }
    }
  })

  revalidateCategory(match.category.tournamentId, match.categoryId)
  return { success: true }
}

/** Borra el resultado de un partido: vuelve a «programado» y quita sus sets. */
export async function clearMatchResult(matchId: string): Promise<GroupState> {
  const match = await findOwnedMatch(matchId)
  if (!match) return { error: 'Partido no encontrado.' }
  if (!match.category || !match.categoryId) {
    return { error: 'El partido no pertenece a una categoría.' }
  }

  const categoryId = match.categoryId

  // Partido de llave: revertir el avance del ganador y la eliminación del
  // perdedor. No se puede borrar si el siguiente partido ya tiene resultado.
  let nextMatchId: string | null = null
  let thirdPlaceId: string | null = null
  let loserTeamId: string | null = null
  if (match.bracketRound && match.bracketSlot != null && match.winnerSide) {
    const prog = bracketProgression(match.bracketRound, match.bracketSlot)
    const loserSide = match.winnerSide === 'A' ? 'B' : 'A'
    loserTeamId = match.sides.find((s) => s.side === loserSide)?.teamId ?? null

    if (prog.winner) {
      const next = await prisma.match.findFirst({
        where: {
          categoryId,
          bracketRound: prog.winner.round,
          bracketSlot: prog.winner.slot,
        },
        select: { id: true, status: true },
      })
      if (next?.status === 'finished') {
        return {
          error: 'El siguiente partido ya tiene resultado; bórralo antes.',
        }
      }
      nextMatchId = next?.id ?? null
    }
    if (prog.loserToThirdPlace) {
      const tp = await prisma.match.findFirst({
        where: { categoryId, bracketRound: '3P', bracketSlot: 0 },
        select: { id: true, status: true },
      })
      if (tp?.status === 'finished') {
        return {
          error: 'El partido por el 3er lugar ya tiene resultado; bórralo antes.',
        }
      }
      thirdPlaceId = tp?.id ?? null
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.matchSet.deleteMany({ where: { matchId } })
    await tx.match.update({
      where: { id: matchId },
      data: { status: 'scheduled', winnerSide: null },
    })
    // Quita al ganador del siguiente partido y al perdedor del 3er lugar.
    if (nextMatchId && match.bracketRound && match.bracketSlot != null) {
      const prog = bracketProgression(match.bracketRound, match.bracketSlot)
      if (prog.winner) {
        await tx.matchSide.updateMany({
          where: { matchId: nextMatchId, side: prog.winner.side },
          data: { teamId: null },
        })
      }
    }
    if (thirdPlaceId && match.bracketRound && match.bracketSlot != null) {
      const prog = bracketProgression(match.bracketRound, match.bracketSlot)
      if (prog.loserToThirdPlace) {
        await tx.matchSide.updateMany({
          where: { matchId: thirdPlaceId, side: prog.loserToThirdPlace.side },
          data: { teamId: null },
        })
      }
    }
    // El perdedor vuelve a estar «en competencia».
    if (loserTeamId && match.bracketRound && match.bracketRound !== '3P') {
      await tx.tournamentTeam.update({
        where: { id: loserTeamId },
        data: { eliminatedInRound: null },
      })
    }
  })

  revalidateCategory(match.category.tournamentId, match.categoryId)
  return { success: true }
}

/**
 * Fija (o limpia) la fecha, hora y cancha de un partido. La fecha y hora se
 * interpretan en la zona horaria del club. Fecha y hora van juntas: ambas vacías
 * dejan el partido sin programar; vacíar la cancha lo deja sin cancha asignada.
 */
export async function setMatchSchedule(
  matchId: string,
  input: { date: string; time: string; courtId: string; timeTbd?: boolean },
): Promise<GroupState> {
  const match = await findOwnedMatch(matchId)
  if (!match) return { error: 'Partido no encontrado.' }
  if (!match.category || !match.categoryId) {
    return { error: 'El partido no pertenece a una categoría.' }
  }

  const date = (input.date ?? '').trim()
  const time = (input.time ?? '').trim()
  if ((date && !time) || (!date && time)) {
    return { error: 'Indica la fecha y la hora juntas.' }
  }
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: 'Fecha inválida.' }
  }
  if (time && !/^\d{2}:\d{2}$/.test(time)) {
    return { error: 'Hora inválida.' }
  }
  const scheduledAt = date && time ? clubDateAndTimeToUtc(date, time) : null

  // Cancha opcional: si se indica, debe ser una pista del club.
  const courtId = (input.courtId ?? '').trim() || null
  if (courtId) {
    const court = await prisma.court.findFirst({
      where: { id: courtId, clubId: match.clubId },
      select: { id: true },
    })
    if (!court) return { error: 'Cancha no válida.' }
  }

  // La hora tentativa solo tiene sentido si hay una estimación (scheduledAt).
  const timeTbd = !!input.timeTbd && scheduledAt != null

  await prisma.match.update({
    where: { id: matchId },
    data: { scheduledAt, courtId, timeTbd },
  })

  revalidateCategory(match.category.tournamentId, match.categoryId)
  return { success: true }
}
