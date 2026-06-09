'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { Prisma } from '@/generated/client'
import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import { createGroupSchema, createMatchSchema } from '@/lib/validations/jornada'
import { MAX_GAMES_PER_SET } from '@/lib/league-rules'
import { compareStandings, recomputeStandings } from '@/lib/standings'

export type MatchState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<
    Record<
      'a1' | 'b1' | 'scheduledAt' | 'groupNumber' | 'p1' | 'p2' | 'p3' | 'p4',
      string[]
    >
  >
}

function revalidateRound(leagueId: string, roundId: string | null) {
  revalidatePath(`/dashboard/ligas/${leagueId}`)
  if (roundId) {
    revalidatePath(`/dashboard/ligas/${leagueId}/jornadas/${roundId}`)
  }
}

/* -------------------------------------------------------------------------- */
/*  Crear partido                                                             */
/* -------------------------------------------------------------------------- */

export async function createMatch(
  roundId: string,
  _prevState: MatchState,
  formData: FormData,
): Promise<MatchState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const round = await prisma.leagueRound.findFirst({
    where: { id: roundId, league: { clubId: club.id } },
    select: { id: true, leagueId: true },
  })
  if (!round) return { error: 'Jornada no encontrada.' }

  const parsed = createMatchSchema.safeParse({
    courtId: (formData.get('courtId') as string) || undefined,
    groupNumber: (formData.get('groupNumber') as string) || undefined,
    scheduledAt: (formData.get('scheduledAt') as string) || undefined,
    a1: formData.get('a1'),
    a2: (formData.get('a2') as string) || undefined,
    b1: formData.get('b1'),
    b2: (formData.get('b2') as string) || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const { courtId, groupNumber, scheduledAt, a1, a2, b1, b2 } = parsed.data
  const playerIds = [a1, a2, b1, b2].filter((x): x is string => !!x)

  if (new Set(playerIds).size !== playerIds.length) {
    return { error: 'Un mismo jugador no puede aparecer dos veces.' }
  }

  // Todos deben estar inscritos en la liga.
  const regCount = await prisma.leagueRegistration.count({
    where: { leagueId: round.leagueId, playerId: { in: playerIds } },
  })
  if (regCount !== playerIds.length) {
    return { error: 'Hay jugadores que no están inscritos en la liga.' }
  }

  // La cancha (si se indica) debe ser del club.
  if (courtId) {
    const court = await prisma.court.findFirst({
      where: { id: courtId, clubId: club.id },
      select: { id: true },
    })
    if (!court) return { error: 'Cancha no válida.' }
  }

  const sideA = [a1, a2].filter((x): x is string => !!x)
  const sideB = [b1, b2].filter((x): x is string => !!x)

  await prisma.match.create({
    data: {
      clubId: club.id,
      contextType: 'league',
      leagueId: round.leagueId,
      leagueRoundId: round.id,
      courtId: courtId || null,
      groupNumber: groupNumber ?? null,
      // datetime-local no lleva zona horaria; se interpreta en la hora del
      // servidor. Suficiente para programar partidos de la jornada.
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: 'scheduled',
      sides: {
        create: [
          { side: 'A', players: { create: sideA.map((playerId) => ({ playerId })) } },
          { side: 'B', players: { create: sideB.map((playerId) => ({ playerId })) } },
        ],
      },
    },
  })

  revalidateRound(round.leagueId, round.id)
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  Autogenerar grupos desde la clasificación                                 */
/* -------------------------------------------------------------------------- */

/**
 * Las 3 rotaciones de un grupo de 4 (formato individual). Cada jugador hace
 * pareja una vez con cada uno de los otros tres; cada enfrentamiento es a 1 set:
 * 1·2 vs 3·4, 1·3 vs 2·4, 1·4 vs 2·3.
 */
function rotatingPairings(
  p: string[],
): { a: [string, string]; b: [string, string] }[] {
  return [
    { a: [p[0], p[1]], b: [p[2], p[3]] },
    { a: [p[0], p[2]], b: [p[1], p[3]] },
    { a: [p[0], p[3]], b: [p[1], p[2]] },
  ]
}

/**
 * Persiste una lista de grupos ya ordenados (grupo 1 = más alto; dentro de cada
 * grupo los jugadores en orden de siembra) creando los 3 partidos rotativos y
 * sus `LeagueGroupSlot`. Agrupa en 4 `createMany` (match/side/player/slot) para
 * no agotar la transacción sobre el pooler de Supabase.
 *
 * Reutilizable: la primera jornada lo llama con grupos por clasificación; al
 * cerrar una jornada se llamará con los grupos resultantes del ascenso/descenso.
 *
 * No se exporta a propósito: en un módulo 'use server' todo export es un
 * endpoint invocable desde el cliente, y esta función no valida propiedad.
 */
async function persistGroups(
  clubId: string,
  leagueId: string,
  roundId: string,
  groups: { registrationId: string; playerId: string }[][],
) {
  const matchesData: Prisma.MatchCreateManyInput[] = []
  const sidesData: Prisma.MatchSideCreateManyInput[] = []
  const playersData: Prisma.MatchSidePlayerCreateManyInput[] = []
  const slotsData: Prisma.LeagueGroupSlotCreateManyInput[] = []

  groups.forEach((group, gi) => {
    const groupNumber = gi + 1

    for (const member of group) {
      slotsData.push({
        roundId,
        groupNumber,
        registrationId: member.registrationId,
      })
    }

    const playerIds = group.map((m) => m.playerId)
    rotatingPairings(playerIds).forEach((pairing, pi) => {
      const matchId = randomUUID()
      matchesData.push({
        id: matchId,
        clubId,
        contextType: 'league',
        leagueId,
        leagueRoundId: roundId,
        groupNumber,
        intraGroupOrder: pi + 1,
        status: 'scheduled',
      })
      for (const { side, ids } of [
        { side: 'A' as const, ids: pairing.a },
        { side: 'B' as const, ids: pairing.b },
      ]) {
        const sideId = randomUUID()
        sidesData.push({ id: sideId, matchId, side })
        for (const playerId of ids) {
          playersData.push({ matchSideId: sideId, playerId })
        }
      }
    })
  })

  await prisma.$transaction(
    [
      prisma.match.createMany({ data: matchesData }),
      prisma.matchSide.createMany({ data: sidesData }),
      prisma.matchSidePlayer.createMany({ data: playersData }),
      prisma.leagueGroupSlot.createMany({ data: slotsData }),
    ],
    { timeout: 15000 },
  )
}

// `useActionState` invoca la acción con (prevState, formData); aquí no se
// necesitan, así que se omiten (una función con menos parámetros es válida).
export async function generateGroupsFromStandings(
  roundId: string,
): Promise<MatchState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const round = await prisma.leagueRound.findFirst({
    where: { id: roundId, league: { clubId: club.id } },
    select: {
      id: true,
      leagueId: true,
      league: {
        select: {
          playKind: true,
          scoringConfig: { select: { rankingBy: true } },
        },
      },
      _count: { select: { matches: true } },
    },
  })
  if (!round) return { error: 'Jornada no encontrada.' }

  if (round.league.playKind !== 'individual') {
    return {
      error:
        'La autogeneración de grupos solo está disponible en ligas individuales.',
    }
  }

  if (round._count.matches > 0) {
    return {
      error:
        'La jornada ya tiene partidos. Elimínalos antes de autogenerar los grupos.',
    }
  }

  // Jugadores activos. El orden base (semilla, luego nombre) sirve de desempate
  // estable cuando aún no hay clasificación (p. ej. la primera jornada).
  const regs = await prisma.leagueRegistration.findMany({
    where: { leagueId: round.leagueId, status: 'active' },
    orderBy: [{ seed: 'asc' }, { player: { fullName: 'asc' } }],
    select: {
      id: true,
      player: { select: { id: true } },
      standing: {
        select: {
          wins: true,
          losses: true,
          setsFor: true,
          setsAgainst: true,
          gamesFor: true,
          gamesAgainst: true,
        },
      },
    },
  })

  // El formato individual exige grupos de 4 exactos.
  if (regs.length < 4 || regs.length % 4 !== 0) {
    return {
      error: `El formato individual requiere grupos de 4: el número de jugadores activos debe ser múltiplo de 4 (actualmente ${regs.length}).`,
    }
  }

  const rankingBy = round.league.scoringConfig?.rankingBy ?? 'sets'

  const zero = {
    wins: 0,
    losses: 0,
    setsFor: 0,
    setsAgainst: 0,
    gamesFor: 0,
    gamesAgainst: 0,
  }

  // Orden por clasificación (mejor → peor), mismo criterio que la tabla.
  const ordered = regs
    .map((r) => ({
      registrationId: r.id,
      playerId: r.player.id,
      s: r.standing ?? zero,
    }))
    .sort((a, b) => compareStandings(a.s, b.s, rankingBy))
    .map(({ registrationId, playerId }) => ({ registrationId, playerId }))

  // Grupos de 4 en orden de ranking: grupo 1 = mejores.
  const groups: { registrationId: string; playerId: string }[][] = []
  for (let i = 0; i < ordered.length; i += 4) {
    groups.push(ordered.slice(i, i + 4))
  }

  await persistGroups(club.id, round.leagueId, round.id, groups)

  revalidateRound(round.leagueId, round.id)
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  Crear un grupo de 4 (genera los 3 sets rotativos)                          */
/* -------------------------------------------------------------------------- */

export async function createGroup(
  roundId: string,
  _prevState: MatchState,
  formData: FormData,
): Promise<MatchState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const round = await prisma.leagueRound.findFirst({
    where: { id: roundId, league: { clubId: club.id } },
    select: { id: true, leagueId: true, league: { select: { playKind: true } } },
  })
  if (!round) return { error: 'Jornada no encontrada.' }
  if (round.league.playKind !== 'individual') {
    return { error: 'Los grupos solo aplican a ligas individuales.' }
  }

  const parsed = createGroupSchema.safeParse({
    courtId: (formData.get('courtId') as string) || undefined,
    groupNumber: (formData.get('groupNumber') as string) || undefined,
    scheduledAt: (formData.get('scheduledAt') as string) || undefined,
    p1: formData.get('p1'),
    p2: formData.get('p2'),
    p3: formData.get('p3'),
    p4: formData.get('p4'),
  })
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const { courtId, scheduledAt } = parsed.data
  const playerIds = [parsed.data.p1, parsed.data.p2, parsed.data.p3, parsed.data.p4]
  if (new Set(playerIds).size !== 4) {
    return { error: 'Un grupo debe tener 4 jugadores distintos.' }
  }

  // Los 4 deben estar inscritos y activos en la liga.
  const regs = await prisma.leagueRegistration.findMany({
    where: { leagueId: round.leagueId, status: 'active', playerId: { in: playerIds } },
    select: { id: true, playerId: true },
  })
  if (regs.length !== 4) {
    return { error: 'Hay jugadores que no están inscritos en la liga.' }
  }
  const regByPlayer = new Map(regs.map((r) => [r.playerId, r.id]))

  // Ningún jugador puede estar ya en otro grupo de esta jornada.
  const taken = await prisma.leagueGroupSlot.count({
    where: { roundId, registrationId: { in: regs.map((r) => r.id) } },
  })
  if (taken > 0) {
    return { error: 'Algún jugador ya pertenece a un grupo de esta jornada.' }
  }

  // La cancha (si se indica) debe ser del club.
  if (courtId) {
    const court = await prisma.court.findFirst({
      where: { id: courtId, clubId: club.id },
      select: { id: true },
    })
    if (!court) return { error: 'Cancha no válida.' }
  }

  // Número de grupo: el indicado (si está libre) o el siguiente disponible.
  let groupNumber = parsed.data.groupNumber ?? null
  if (groupNumber != null) {
    const used = await prisma.match.count({
      where: { leagueRoundId: roundId, groupNumber },
    })
    if (used > 0) {
      return {
        fieldErrors: {
          groupNumber: [`El grupo ${groupNumber} ya existe en esta jornada.`],
        },
      }
    }
  } else {
    const agg = await prisma.match.aggregate({
      where: { leagueRoundId: roundId },
      _max: { groupNumber: true },
    })
    groupNumber = (agg._max.groupNumber ?? 0) + 1
  }

  const when = scheduledAt ? new Date(scheduledAt) : null

  const matchesData: Prisma.MatchCreateManyInput[] = []
  const sidesData: Prisma.MatchSideCreateManyInput[] = []
  const playersData: Prisma.MatchSidePlayerCreateManyInput[] = []
  rotatingPairings(playerIds).forEach((pairing, pi) => {
    const matchId = randomUUID()
    matchesData.push({
      id: matchId,
      clubId: club.id,
      contextType: 'league',
      leagueId: round.leagueId,
      leagueRoundId: round.id,
      groupNumber,
      intraGroupOrder: pi + 1,
      courtId: courtId || null,
      scheduledAt: when,
      status: 'scheduled',
    })
    for (const { side, ids } of [
      { side: 'A' as const, ids: pairing.a },
      { side: 'B' as const, ids: pairing.b },
    ]) {
      const sideId = randomUUID()
      sidesData.push({ id: sideId, matchId, side })
      for (const playerId of ids) {
        playersData.push({ matchSideId: sideId, playerId })
      }
    }
  })
  const slotsData: Prisma.LeagueGroupSlotCreateManyInput[] = playerIds.map(
    (playerId) => ({
      roundId,
      groupNumber: groupNumber!,
      registrationId: regByPlayer.get(playerId)!,
    }),
  )

  await prisma.$transaction(
    [
      prisma.match.createMany({ data: matchesData }),
      prisma.matchSide.createMany({ data: sidesData }),
      prisma.matchSidePlayer.createMany({ data: playersData }),
      prisma.leagueGroupSlot.createMany({ data: slotsData }),
    ],
    { timeout: 15000 },
  )

  revalidateRound(round.leagueId, round.id)
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  Capturar los 3 sets de un grupo de una sola vez                            */
/* -------------------------------------------------------------------------- */

export async function captureGroupResults(
  roundId: string,
  _prevState: MatchState,
  formData: FormData,
): Promise<MatchState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const round = await prisma.leagueRound.findFirst({
    where: { id: roundId, league: { clubId: club.id } },
    select: { id: true, leagueId: true },
  })
  if (!round) return { error: 'Jornada no encontrada.' }

  const matchIds = formData.getAll('matchId').map((v) => String(v))
  const gamesA = formData.getAll('gamesA').map((v) => String(v).trim())
  const gamesB = formData.getAll('gamesB').map((v) => String(v).trim())

  // Solo partidos de esta jornada y de este club.
  const owned = await prisma.match.findMany({
    where: {
      id: { in: matchIds },
      clubId: club.id,
      leagueRoundId: roundId,
      contextType: 'league',
    },
    select: { id: true, groupNumber: true },
  })
  const valid = new Set(owned.map((m) => m.id))
  // Grupos afectados: al cambiar sus resultados, cualquier decisión manual de
  // empate previa queda obsoleta y se descarta para volver a evaluarse.
  const affectedGroups = [
    ...new Set(
      owned.map((m) => m.groupNumber).filter((g): g is number => g != null),
    ),
  ]

  const ops: Prisma.PrismaPromise<unknown>[] = []
  for (let i = 0; i < matchIds.length; i++) {
    const id = matchIds[i]
    if (!valid.has(id)) continue
    const a = gamesA[i] ?? ''
    const b = gamesB[i] ?? ''

    // Ambos vacíos → set sin jugar: limpia el marcador y vuelve a "programado".
    if (!a && !b) {
      ops.push(prisma.matchSet.deleteMany({ where: { matchId: id } }))
      ops.push(
        prisma.match.update({
          where: { id },
          data: { status: 'scheduled', winnerSide: null },
        }),
      )
      continue
    }

    const na = Number(a)
    const nb = Number(b)
    if (
      !Number.isInteger(na) ||
      !Number.isInteger(nb) ||
      na < 0 ||
      nb < 0 ||
      na > MAX_GAMES_PER_SET ||
      nb > MAX_GAMES_PER_SET
    ) {
      return { error: `Resultado inválido en el set ${i + 1}.` }
    }
    if (na === nb) {
      return { error: `El set ${i + 1} no puede quedar empatado.` }
    }

    ops.push(prisma.matchSet.deleteMany({ where: { matchId: id } }))
    ops.push(
      prisma.matchSet.create({
        data: { matchId: id, setNumber: 1, gamesA: na, gamesB: nb },
      }),
    )
    ops.push(
      prisma.match.update({
        where: { id },
        data: { status: 'finished', winnerSide: na > nb ? 'A' : 'B' },
      }),
    )
  }

  if (ops.length === 0) return { error: 'No hay resultados que guardar.' }

  if (affectedGroups.length > 0) {
    ops.push(
      prisma.leagueGroupSlot.updateMany({
        where: { roundId, groupNumber: { in: affectedGroups } },
        data: { manualMovement: null },
      }),
    )
  }

  await prisma.$transaction(ops)
  await recomputeStandings(round.leagueId)
  revalidateRound(round.leagueId, round.id)
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  Editar / eliminar un grupo completo                                        */
/* -------------------------------------------------------------------------- */

export async function updateGroupDetails(
  roundId: string,
  groupNumber: number,
  _prevState: MatchState,
  formData: FormData,
): Promise<MatchState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const round = await prisma.leagueRound.findFirst({
    where: { id: roundId, league: { clubId: club.id } },
    select: { id: true, leagueId: true },
  })
  if (!round) return { error: 'Jornada no encontrada.' }

  const raw = ((formData.get('scheduledAt') as string) || '').trim()
  if (raw && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    return { fieldErrors: { scheduledAt: ['Fecha y hora inválidas.'] } }
  }

  const rawCourt = ((formData.get('courtId') as string) || '').trim()
  if (rawCourt) {
    const court = await prisma.court.findFirst({
      where: { id: rawCourt, clubId: club.id },
      select: { id: true },
    })
    if (!court) return { error: 'Cancha no válida.' }
  }

  await prisma.match.updateMany({
    where: { leagueRoundId: roundId, groupNumber, clubId: club.id },
    data: {
      scheduledAt: raw ? new Date(raw) : null,
      courtId: rawCourt || null,
    },
  })

  revalidateRound(round.leagueId, round.id)
  return { success: true }
}

export async function deleteGroup(roundId: string, groupNumber: number) {
  const club = await getManagedClub()
  if (!club) return

  const round = await prisma.leagueRound.findFirst({
    where: { id: roundId, league: { clubId: club.id } },
    select: { id: true, leagueId: true },
  })
  if (!round) return

  const matches = await prisma.match.findMany({
    where: { leagueRoundId: roundId, groupNumber, clubId: club.id },
    select: { id: true, status: true },
  })
  if (matches.length === 0) return

  const hadFinished = matches.some((m) => m.status === 'finished')

  await prisma.$transaction([
    prisma.match.deleteMany({ where: { id: { in: matches.map((m) => m.id) } } }),
    prisma.leagueGroupSlot.deleteMany({ where: { roundId, groupNumber } }),
  ])

  if (hadFinished) await recomputeStandings(round.leagueId)
  revalidateRound(round.leagueId, round.id)
}

/* -------------------------------------------------------------------------- */
/*  Editar partido (horario, cancha, grupo)                                   */
/* -------------------------------------------------------------------------- */

export async function updateMatchDetails(
  matchId: string,
  _prevState: MatchState,
  formData: FormData,
): Promise<MatchState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const match = await prisma.match.findFirst({
    where: { id: matchId, clubId: club.id, contextType: 'league' },
    select: { id: true, leagueId: true, leagueRoundId: true },
  })
  if (!match) return { error: 'Partido no encontrado.' }

  // Campo vacío = quitar el horario.
  const raw = ((formData.get('scheduledAt') as string) || '').trim()
  if (raw && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    return { fieldErrors: { scheduledAt: ['Fecha y hora inválidas.'] } }
  }

  // Grupo (opcional). Vacío = sin grupo.
  const rawGroup = ((formData.get('groupNumber') as string) || '').trim()
  let groupNumber: number | null = null
  if (rawGroup) {
    const n = Number(rawGroup)
    if (!Number.isInteger(n) || n < 1 || n > 99) {
      return { fieldErrors: { groupNumber: ['Grupo inválido (1–99).'] } }
    }
    groupNumber = n
  }

  // Cancha (opcional). Vacío = sin cancha. Debe pertenecer al club.
  const rawCourt = ((formData.get('courtId') as string) || '').trim()
  if (rawCourt) {
    const court = await prisma.court.findFirst({
      where: { id: rawCourt, clubId: club.id },
      select: { id: true },
    })
    if (!court) return { error: 'Cancha no válida.' }
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      scheduledAt: raw ? new Date(raw) : null,
      groupNumber,
      courtId: rawCourt || null,
    },
  })

  if (match.leagueId) revalidateRound(match.leagueId, match.leagueRoundId)
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  Capturar resultado                                                        */
/* -------------------------------------------------------------------------- */

export async function captureMatchResult(
  matchId: string,
  _prevState: MatchState,
  formData: FormData,
): Promise<MatchState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const match = await prisma.match.findFirst({
    where: { id: matchId, clubId: club.id, contextType: 'league' },
    select: { id: true, leagueId: true, leagueRoundId: true },
  })
  if (!match || !match.leagueId) return { error: 'Partido no encontrado.' }

  const gamesA = formData.getAll('gamesA').map((v) => String(v).trim())
  const gamesB = formData.getAll('gamesB').map((v) => String(v).trim())

  const sets: { setNumber: number; gamesA: number; gamesB: number }[] = []
  for (let i = 0; i < Math.max(gamesA.length, gamesB.length); i++) {
    const a = gamesA[i]
    const b = gamesB[i]
    if (!a && !b) continue
    const na = Number(a)
    const nb = Number(b)
    if (
      !Number.isInteger(na) ||
      !Number.isInteger(nb) ||
      na < 0 ||
      nb < 0 ||
      na > MAX_GAMES_PER_SET ||
      nb > MAX_GAMES_PER_SET
    ) {
      return { error: `Resultado inválido en el set ${sets.length + 1}.` }
    }
    if (na === nb) {
      return { error: `El set ${sets.length + 1} no puede quedar empatado.` }
    }
    sets.push({ setNumber: sets.length + 1, gamesA: na, gamesB: nb })
  }

  if (sets.length === 0) return { error: 'Captura al menos un set.' }

  let setsA = 0
  let setsB = 0
  for (const s of sets) {
    if (s.gamesA > s.gamesB) setsA += 1
    else setsB += 1
  }
  if (setsA === setsB) {
    return { error: 'El partido no puede terminar empatado en sets.' }
  }
  const winnerSide = setsA > setsB ? 'A' : 'B'

  await prisma.$transaction([
    prisma.matchSet.deleteMany({ where: { matchId } }),
    prisma.matchSet.createMany({
      data: sets.map((s) => ({
        matchId,
        setNumber: s.setNumber,
        gamesA: s.gamesA,
        gamesB: s.gamesB,
      })),
    }),
    prisma.match.update({
      where: { id: matchId },
      data: { status: 'finished', winnerSide },
    }),
  ])

  await recomputeStandings(match.leagueId)
  revalidateRound(match.leagueId, match.leagueRoundId)
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  Borrar partido                                                            */
/* -------------------------------------------------------------------------- */

export async function deleteMatch(matchId: string) {
  const club = await getManagedClub()
  if (!club) return
  const match = await prisma.match.findFirst({
    where: { id: matchId, clubId: club.id, contextType: 'league' },
    select: { id: true, leagueId: true, leagueRoundId: true, status: true },
  })
  if (!match) return

  await prisma.match.delete({ where: { id: match.id } })

  // Si estaba finalizado, recalcular clasificación.
  if (match.status === 'finished' && match.leagueId) {
    await recomputeStandings(match.leagueId)
  }
  if (match.leagueId) revalidateRound(match.leagueId, match.leagueRoundId)
}

/* -------------------------------------------------------------------------- */
/*  Pase de lista: asistencia / suplente de un jugador en su grupo            */
/* -------------------------------------------------------------------------- */

export async function setSlotAttendance(
  roundId: string,
  registrationId: string,
  attendance: 'pending' | 'present' | 'absent',
  substituteName: string | null,
): Promise<MatchState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  if (!['pending', 'present', 'absent'].includes(attendance)) {
    return { error: 'Estado de asistencia no válido.' }
  }

  const round = await prisma.leagueRound.findFirst({
    where: { id: roundId, league: { clubId: club.id } },
    select: { id: true, leagueId: true },
  })
  if (!round) return { error: 'Jornada no encontrada.' }

  // El slot debe existir en esta jornada.
  const slot = await prisma.leagueGroupSlot.findUnique({
    where: { roundId_registrationId: { roundId, registrationId } },
    select: { id: true, groupNumber: true },
  })
  if (!slot) return { error: 'Jugador no encontrado en esta jornada.' }

  // El nombre del suplente solo se conserva cuando el jugador está ausente.
  const sub =
    attendance === 'absent' ? (substituteName?.trim() || null) : null

  await prisma.$transaction([
    prisma.leagueGroupSlot.update({
      where: { roundId_registrationId: { roundId, registrationId } },
      data: { attendance, substituteName: sub },
    }),
    // La asistencia decide quién desciende: descarta cualquier decisión manual
    // de empate previa del grupo para volver a evaluarla.
    prisma.leagueGroupSlot.updateMany({
      where: { roundId, groupNumber: slot.groupNumber },
      data: { manualMovement: null },
    }),
  ])

  // La asistencia cambia qué resultados cuentan; recalcula la clasificación.
  await recomputeStandings(round.leagueId)
  revalidateRound(round.leagueId, round.id)
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  Cambiar el estado de un partido (o de todo un grupo) manualmente          */
/* -------------------------------------------------------------------------- */

// Estados que se pueden fijar a mano. `finished` se deriva al capturar el
// resultado, así que no se ofrece aquí.
const MANUAL_STATUSES = [
  'scheduled',
  'in_progress',
  'suspended',
  'walkover',
  'cancelled',
] as const
type ManualStatus = (typeof MANUAL_STATUSES)[number]

function isManualStatus(v: string): v is ManualStatus {
  return (MANUAL_STATUSES as readonly string[]).includes(v)
}

export async function setMatchStatus(
  matchId: string,
  status: string,
): Promise<MatchState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }
  if (!isManualStatus(status)) return { error: 'Estado no válido.' }

  const match = await prisma.match.findFirst({
    where: { id: matchId, clubId: club.id, contextType: 'league' },
    select: { id: true, leagueId: true, leagueRoundId: true },
  })
  if (!match) return { error: 'Partido no encontrado.' }

  await prisma.match.update({ where: { id: matchId }, data: { status } })

  if (match.leagueId) revalidateRound(match.leagueId, match.leagueRoundId)
  return { success: true }
}

export async function setGroupStatus(
  roundId: string,
  groupNumber: number,
  status: string,
): Promise<MatchState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }
  if (!isManualStatus(status)) return { error: 'Estado no válido.' }

  const round = await prisma.leagueRound.findFirst({
    where: { id: roundId, league: { clubId: club.id } },
    select: { id: true, leagueId: true },
  })
  if (!round) return { error: 'Jornada no encontrada.' }

  await prisma.match.updateMany({
    where: { leagueRoundId: roundId, groupNumber, clubId: club.id },
    data: { status },
  })

  revalidateRound(round.leagueId, round.id)
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  Cerrar jornada → ascenso/descenso → generar la siguiente                  */
/* -------------------------------------------------------------------------- */

/** Resultado de un jugador dentro de su grupo en una jornada. */
type GroupAcc = {
  registrationId: string
  playerId: string
  wins: number
  losses: number
  setsFor: number
  setsAgainst: number
  gamesFor: number
  gamesAgainst: number
}

/** Puntuación de un jugador para el ascenso/descenso del grupo: sets ganados
 *  (o diferencia de juegos en ligas «por juegos»). */
function groupScore(a: GroupAcc, rankingBy: string): number {
  return rankingBy === 'games' ? a.gamesFor - a.gamesAgainst : a.setsFor
}

/**
 * Candidatos al ascenso/descenso de un grupo según los resultados. Un puesto
 * está «empatado» cuando lo comparten 2+ jugadores: ya no se rompe con una
 * lista de prioridad, sino que lo decide el organizador (manualMovement).
 */
function groupBoundaries(
  members: GroupAcc[],
  groupNumber: number,
  maxGroup: number,
  absent: Set<string>,
  rankingBy: string,
) {
  const present = members.filter((m) => !absent.has(m.playerId))
  const hasAbsent = members.some((m) => absent.has(m.playerId))
  const score = (m: GroupAcc) => groupScore(m, rankingBy)
  let upCandidates: GroupAcc[] = []
  let downCandidates: GroupAcc[] = []
  // El grupo más alto no asciende; el más bajo no desciende.
  if (groupNumber > 1 && present.length > 0) {
    const top = Math.max(...present.map(score))
    upCandidates = present.filter((m) => score(m) === top)
  }
  // Si hay ausentes, el descenso lo ocupan ellos (pierden la jornada), así que
  // no hay empate por el descenso entre los presentes.
  if (groupNumber < maxGroup && !hasAbsent && present.length > 0) {
    const bottom = Math.min(...present.map(score))
    downCandidates = present.filter((m) => score(m) === bottom)
  }
  return { present, hasAbsent, upCandidates, downCandidates }
}

type MatchForAcc = {
  winnerSide: 'A' | 'B' | null
  sides: { side: string; players: { playerId: string }[] }[]
  sets: { gamesA: number; gamesB: number }[]
}

/**
 * Acumula el resultado por jugador (registración) de una jornada a partir de sus
 * partidos. El jugador ausente no recibe los resultados que jugó su suplente.
 */
function buildGroupAccs(
  slots: { registrationId: string; registration: { playerId: string } }[],
  matches: MatchForAcc[],
  absent: Set<string>,
): Map<string, GroupAcc> {
  const acc = new Map<string, GroupAcc>()
  for (const s of slots) {
    acc.set(s.registration.playerId, {
      registrationId: s.registrationId,
      playerId: s.registration.playerId,
      wins: 0,
      losses: 0,
      setsFor: 0,
      setsAgainst: 0,
      gamesFor: 0,
      gamesAgainst: 0,
    })
  }
  for (const m of matches) {
    const sideA = m.sides.find((x) => x.side === 'A')
    const sideB = m.sides.find((x) => x.side === 'B')
    if (!sideA || !sideB) continue
    let setsA = 0
    let setsB = 0
    let gamesA = 0
    let gamesB = 0
    for (const set of m.sets) {
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
        if (absent.has(p.playerId)) continue
        const a = acc.get(p.playerId)
        if (!a) continue
        a.setsFor += ownSets
        a.setsAgainst += oppSets
        a.gamesFor += ownGames
        a.gamesAgainst += oppGames
        if (won) a.wins += 1
        else a.losses += 1
      }
    }
    apply(sideA.players, setsA, setsB, gamesA, gamesB, m.winnerSide === 'A')
    apply(sideB.players, setsB, setsA, gamesB, gamesA, m.winnerSide === 'B')
  }
  return acc
}

export async function closeRoundAndAdvance(
  roundId: string,
): Promise<MatchState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const round = await prisma.leagueRound.findFirst({
    where: { id: roundId, league: { clubId: club.id } },
    select: {
      id: true,
      leagueId: true,
      roundNumber: true,
      league: {
        select: {
          playKind: true,
          scoringConfig: { select: { rankingBy: true } },
        },
      },
    },
  })
  if (!round) return { error: 'Jornada no encontrada.' }
  if (round.league.playKind !== 'individual') {
    return { error: 'El ascenso/descenso solo aplica a ligas individuales.' }
  }

  // Grupos generados para esta jornada.
  const slots = await prisma.leagueGroupSlot.findMany({
    where: { roundId },
    select: {
      registrationId: true,
      groupNumber: true,
      attendance: true,
      manualMovement: true,
      registration: { select: { playerId: true } },
    },
  })
  if (slots.length === 0) {
    return {
      error:
        'Esta jornada no tiene grupos generados. Usa «Generar grupos» antes de cerrarla.',
    }
  }

  // Todos los partidos deben estar finalizados.
  const matches = await prisma.match.findMany({
    where: { leagueRoundId: roundId },
    select: {
      status: true,
      winnerSide: true,
      sides: {
        select: { side: true, players: { select: { playerId: true } } },
      },
      sets: { select: { gamesA: true, gamesB: true } },
    },
  })
  if (matches.length === 0) return { error: 'La jornada no tiene partidos.' }
  const pending = matches.filter((m) => m.status !== 'finished').length
  if (pending > 0) {
    return {
      error: `Faltan ${pending} partido(s) por finalizar antes de cerrar la jornada.`,
    }
  }

  // La jornada siguiente debe estar vacía para poder regenerarla.
  const nextRoundNumber = round.roundNumber + 1
  const existingNext = await prisma.leagueRound.findUnique({
    where: {
      leagueId_roundNumber: {
        leagueId: round.leagueId,
        roundNumber: nextRoundNumber,
      },
    },
    select: { id: true, _count: { select: { matches: true } } },
  })
  if (existingNext && existingNext._count.matches > 0) {
    return {
      error:
        'La jornada siguiente ya tiene partidos. Elimínalos antes de cerrar esta jornada.',
    }
  }

  // Jugadores que no llegaron: su participación la cubrió un suplente externo,
  // así que sus resultados no cuentan y pierden la jornada (van al fondo del
  // grupo y descienden). Los rivales sí conservan lo que jugaron.
  const absent = new Set(
    slots
      .filter((s) => s.attendance === 'absent')
      .map((s) => s.registration.playerId),
  )

  // Acumula el resultado de cada jugador (solo juega en su grupo esta jornada).
  const acc = buildGroupAccs(slots, matches, absent)

  const rankingBy = round.league.scoringConfig?.rankingBy ?? 'sets'
  // Decisión manual del organizador para los empates (por registración).
  const manualByReg = new Map(
    slots.map((s) => [s.registrationId, s.manualMovement]),
  )

  // Agrupa por grupo y comprueba que cada grupo tenga exactamente 4.
  const byGroup = new Map<number, GroupAcc[]>()
  for (const s of slots) {
    const a = acc.get(s.registration.playerId)
    if (!a) continue
    const list = byGroup.get(s.groupNumber) ?? []
    list.push(a)
    byGroup.set(s.groupNumber, list)
  }
  for (const [g, members] of byGroup) {
    if (members.length !== 4) {
      return {
        error: `El grupo ${g} no tiene 4 jugadores. El ascenso/descenso requiere grupos de 4.`,
      }
    }
  }
  const maxGroup = Math.max(...slots.map((s) => s.groupNumber))

  type NextMember = {
    registrationId: string
    playerId: string
    newGroup: number
  }
  const slotUpdates: {
    registrationId: string
    setsWon: number
    rankInGroup: number
    movement: 'up' | 'down' | 'stay'
  }[] = []
  const nextMembers: NextMember[] = []
  // Grupos con empate por el ascenso/descenso que el organizador aún no resolvió.
  const unresolved: string[] = []

  for (const [groupNumber, members] of byGroup) {
    const { present, upCandidates, downCandidates } = groupBoundaries(
      members,
      groupNumber,
      maxGroup,
      absent,
      rankingBy,
    )
    const score = (m: GroupAcc) => groupScore(m, rankingBy)

    // Quién sube: único candidato → automático; varios → decisión manual.
    let upReg: string | null = null
    let groupUnresolved = false
    if (upCandidates.length === 1) {
      upReg = upCandidates[0].registrationId
    } else if (upCandidates.length > 1) {
      const chosen = upCandidates.find(
        (m) => manualByReg.get(m.registrationId) === 'up',
      )
      if (chosen) upReg = chosen.registrationId
      else {
        unresolved.push(`Grupo ${groupNumber} (ascenso)`)
        groupUnresolved = true
      }
    }

    // Quién baja (solo si no hay ausentes; con ausentes, bajan ellos).
    let downReg: string | null = null
    if (downCandidates.length === 1) {
      downReg = downCandidates[0].registrationId
    } else if (downCandidates.length > 1) {
      const chosen = downCandidates.find(
        (m) => manualByReg.get(m.registrationId) === 'down',
      )
      if (chosen) downReg = chosen.registrationId
      else {
        unresolved.push(`Grupo ${groupNumber} (descenso)`)
        groupUnresolved = true
      }
    }

    // No fijamos movimiento de un grupo con empates pendientes; se acumulan
    // todos para un único aviso al final.
    if (groupUnresolved) continue

    // Orden del grupo: el que sube primero, el resto por puntuación, el que baja
    // al final y los ausentes después (pierden la jornada).
    const upM = upReg
      ? members.find((m) => m.registrationId === upReg)
      : undefined
    const downM = downReg
      ? members.find((m) => m.registrationId === downReg)
      : undefined
    const middle = present
      .filter((m) => m !== upM && m !== downM)
      .sort((x, y) => score(y) - score(x))
    const missing = members.filter((m) => absent.has(m.playerId))
    const ordered = [
      ...(upM ? [upM] : []),
      ...middle,
      ...(downM ? [downM] : []),
      ...missing,
    ]
    ordered.forEach((mem, i) => {
      const isAbsent = absent.has(mem.playerId)
      let movement: 'up' | 'down' | 'stay' = 'stay'
      if (isAbsent) {
        // Pierde la jornada: desciende salvo que ya esté en el grupo más bajo.
        if (groupNumber < maxGroup) movement = 'down'
      } else if (mem.registrationId === upReg) movement = 'up'
      else if (mem.registrationId === downReg) movement = 'down'
      const newGroup =
        movement === 'up'
          ? groupNumber - 1
          : movement === 'down'
            ? groupNumber + 1
            : groupNumber
      slotUpdates.push({
        registrationId: mem.registrationId,
        setsWon: mem.setsFor,
        rankInGroup: i + 1,
        movement,
      })
      nextMembers.push({
        registrationId: mem.registrationId,
        playerId: mem.playerId,
        newGroup,
      })
    })
  }

  // Empates sin resolver: no se cierra la jornada hasta que el organizador
  // decida quién sube/baja en cada grupo afectado (aviso en su tarjeta).
  if (unresolved.length > 0) {
    return {
      error: `Hay empates sin resolver: ${unresolved.join(
        ', ',
      )}. Decide quién sube y quién baja en cada grupo (verás un aviso de empate) antes de cerrar la jornada.`,
    }
  }

  // Orden dentro de cada nuevo grupo: por clasificación acumulada (siembra).
  const standings = await prisma.leagueStanding.findMany({
    where: { leagueId: round.leagueId },
    select: {
      registrationId: true,
      wins: true,
      losses: true,
      setsFor: true,
      setsAgainst: true,
      gamesFor: true,
      gamesAgainst: true,
    },
  })
  const standMap = new Map(standings.map((s) => [s.registrationId, s]))
  const zero = {
    wins: 0,
    losses: 0,
    setsFor: 0,
    setsAgainst: 0,
    gamesFor: 0,
    gamesAgainst: 0,
  }

  const nextByGroup = new Map<number, NextMember[]>()
  for (const nm of nextMembers) {
    const list = nextByGroup.get(nm.newGroup) ?? []
    list.push(nm)
    nextByGroup.set(nm.newGroup, list)
  }
  const nextGroups: { registrationId: string; playerId: string }[][] = [
    ...nextByGroup.keys(),
  ]
    .sort((a, b) => a - b)
    .map((g) =>
      nextByGroup
        .get(g)!
        .sort((x, y) =>
          compareStandings(
            standMap.get(x.registrationId) ?? zero,
            standMap.get(y.registrationId) ?? zero,
            rankingBy,
          ),
        )
        .map((m) => ({ registrationId: m.registrationId, playerId: m.playerId })),
    )

  // 1) Guarda el resultado de los slots de ESTA jornada (sets, rank, movimiento)
  //    y marca la jornada como cerrada (queda bloqueada para edición).
  await prisma.$transaction([
    ...slotUpdates.map((u) =>
      prisma.leagueGroupSlot.update({
        where: {
          roundId_registrationId: { roundId, registrationId: u.registrationId },
        },
        data: {
          setsWon: u.setsWon,
          rankInGroup: u.rankInGroup,
          movement: u.movement,
        },
      }),
    ),
    prisma.leagueRound.update({
      where: { id: roundId },
      data: { status: 'closed' },
    }),
  ])

  // 2) Crea o reutiliza (si está vacía) la jornada siguiente y genera sus grupos.
  const nextRoundId =
    existingNext?.id ??
    (
      await prisma.leagueRound.create({
        data: { leagueId: round.leagueId, roundNumber: nextRoundNumber },
        select: { id: true },
      })
    ).id

  // Si reutilizamos una jornada pre-creada, descarta slots viejos.
  await prisma.leagueGroupSlot.deleteMany({ where: { roundId: nextRoundId } })

  await persistGroups(club.id, round.leagueId, nextRoundId, nextGroups)

  revalidatePath(`/dashboard/ligas/${round.leagueId}`)
  revalidatePath(`/dashboard/ligas/${round.leagueId}/jornadas/${roundId}`)
  revalidatePath(`/dashboard/ligas/${round.leagueId}/jornadas/${nextRoundId}`)
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  Resolver empate de ascenso/descenso en un grupo (decisión manual)         */
/* -------------------------------------------------------------------------- */

/**
 * Fija quién sube y/o quién baja cuando un grupo terminó con empate por el
 * ascenso o el descenso. Valida que los elegidos estén entre los empatados y
 * guarda la decisión en `manualMovement`; el cierre de la jornada la respeta.
 * Si los resultados ya no producen empate, descarta cualquier decisión previa.
 */
export async function setGroupTieDecision(
  roundId: string,
  groupNumber: number,
  upRegistrationId: string | null,
  downRegistrationId: string | null,
): Promise<MatchState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const round = await prisma.leagueRound.findFirst({
    where: { id: roundId, league: { clubId: club.id } },
    select: {
      id: true,
      leagueId: true,
      league: { select: { scoringConfig: { select: { rankingBy: true } } } },
    },
  })
  if (!round) return { error: 'Jornada no encontrada.' }
  const rankingBy = round.league.scoringConfig?.rankingBy ?? 'sets'

  const slots = await prisma.leagueGroupSlot.findMany({
    where: { roundId },
    select: {
      registrationId: true,
      groupNumber: true,
      attendance: true,
      registration: { select: { playerId: true } },
    },
  })
  const groupSlots = slots.filter((s) => s.groupNumber === groupNumber)
  if (groupSlots.length === 0) {
    return { error: 'Grupo no encontrado en esta jornada.' }
  }
  const maxGroup = Math.max(...slots.map((s) => s.groupNumber))

  const matches = await prisma.match.findMany({
    where: { leagueRoundId: roundId, groupNumber },
    select: {
      status: true,
      winnerSide: true,
      sides: {
        select: { side: true, players: { select: { playerId: true } } },
      },
      sets: { select: { gamesA: true, gamesB: true } },
    },
  })
  if (matches.length === 0 || matches.some((m) => m.status !== 'finished')) {
    return {
      error: 'Termina todos los sets del grupo antes de resolver el empate.',
    }
  }

  const absent = new Set(
    slots
      .filter((s) => s.attendance === 'absent')
      .map((s) => s.registration.playerId),
  )
  const acc = buildGroupAccs(slots, matches, absent)
  const members = groupSlots
    .map((s) => acc.get(s.registration.playerId))
    .filter((a): a is GroupAcc => !!a)
  const { upCandidates, downCandidates } = groupBoundaries(
    members,
    groupNumber,
    maxGroup,
    absent,
    rankingBy,
  )
  const upTie = upCandidates.length > 1
  const downTie = downCandidates.length > 1

  // El empate desapareció (cambiaron resultados): limpia y termina.
  if (!upTie && !downTie) {
    await prisma.leagueGroupSlot.updateMany({
      where: { roundId, groupNumber },
      data: { manualMovement: null },
    })
    revalidateRound(round.leagueId, round.id)
    return { success: true }
  }

  const upIds = new Set(upCandidates.map((m) => m.registrationId))
  const downIds = new Set(downCandidates.map((m) => m.registrationId))
  if (upTie && (!upRegistrationId || !upIds.has(upRegistrationId))) {
    return { error: 'Elige quién sube entre los jugadores empatados.' }
  }
  if (downTie && (!downRegistrationId || !downIds.has(downRegistrationId))) {
    return { error: 'Elige quién baja entre los jugadores empatados.' }
  }
  if (upTie && downTie && upRegistrationId === downRegistrationId) {
    return { error: 'El mismo jugador no puede subir y bajar.' }
  }

  await prisma.$transaction(
    groupSlots.map((s) => {
      const movement: 'up' | 'down' | null =
        upTie && s.registrationId === upRegistrationId
          ? 'up'
          : downTie && s.registrationId === downRegistrationId
            ? 'down'
            : null
      return prisma.leagueGroupSlot.update({
        where: {
          roundId_registrationId: { roundId, registrationId: s.registrationId },
        },
        data: { manualMovement: movement },
      })
    }),
  )

  revalidateRound(round.leagueId, round.id)
  return { success: true }
}
