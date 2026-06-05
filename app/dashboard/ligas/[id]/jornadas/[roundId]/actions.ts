'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { Prisma } from '@/generated/client'
import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import { createMatchSchema } from '@/lib/validations/jornada'
import { compareStandings, recomputeStandings } from '@/lib/standings'

export type MatchState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<
    Record<'a1' | 'b1' | 'scheduledAt' | 'groupNumber', string[]>
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

/** Empareja un grupo (en orden de ranking) en dos lados equilibrados. */
function pairGroup(g: string[]): { a: string[]; b: string[] } {
  // 1º+4º vs 2º+3º para equilibrar; parciales reparten lo que haya.
  if (g.length >= 4) return { a: [g[0], g[3]], b: [g[1], g[2]] }
  if (g.length === 3) return { a: [g[0], g[2]], b: [g[1]] }
  return { a: [g[0]], b: [g[1]] } // length 2
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
          scoringConfig: {
            select: {
              tiebreaker1: true,
              tiebreaker2: true,
              tiebreaker3: true,
            },
          },
        },
      },
      _count: { select: { matches: true } },
    },
  })
  if (!round) return { error: 'Jornada no encontrada.' }
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

  if (regs.length < 2) {
    return {
      error: 'Necesitas al menos 2 jugadores activos para generar grupos.',
    }
  }

  const cfg = round.league.scoringConfig
  const tiebreakers = cfg
    ? [cfg.tiebreaker1, cfg.tiebreaker2, cfg.tiebreaker3]
    : ['set_diff', 'sets_won', 'game_diff']

  const zero = {
    wins: 0,
    losses: 0,
    setsFor: 0,
    setsAgainst: 0,
    gamesFor: 0,
    gamesAgainst: 0,
  }

  // Orden por clasificación (mejor → peor), mismo criterio que la tabla.
  const playerIds = regs
    .map((r) => ({ playerId: r.player.id, s: r.standing ?? zero }))
    .sort((a, b) => compareStandings(a.s, b.s, tiebreakers))
    .map((r) => r.playerId)

  // Grupos de 4 en orden de ranking: grupo 1 = mejores.
  const groups: string[][] = []
  for (let i = 0; i < playerIds.length; i += 4) {
    groups.push(playerIds.slice(i, i + 4))
  }

  const formable = groups.filter((g) => g.length >= 2) // un suelto descansa
  if (formable.length === 0) {
    return { error: 'No hay suficientes jugadores para formar un grupo.' }
  }

  // Pre-generamos los UUID y agrupamos en 3 `createMany` (3 viajes a la BD) en
  // lugar de decenas de inserts anidados: así no se agota el tiempo de la
  // transacción sobre el pooler de Supabase.
  const matchesData: Prisma.MatchCreateManyInput[] = []
  const sidesData: Prisma.MatchSideCreateManyInput[] = []
  const playersData: Prisma.MatchSidePlayerCreateManyInput[] = []

  formable.forEach((g, idx) => {
    const matchId = randomUUID()
    matchesData.push({
      id: matchId,
      clubId: club.id,
      contextType: 'league',
      leagueId: round.leagueId,
      leagueRoundId: round.id,
      groupNumber: idx + 1,
      status: 'scheduled',
    })

    const { a, b } = pairGroup(g)
    for (const { side, ids } of [
      { side: 'A' as const, ids: a },
      { side: 'B' as const, ids: b },
    ]) {
      const sideId = randomUUID()
      sidesData.push({ id: sideId, matchId, side })
      for (const playerId of ids) {
        playersData.push({ matchSideId: sideId, playerId })
      }
    }
  })

  await prisma.$transaction(
    [
      prisma.match.createMany({ data: matchesData }),
      prisma.matchSide.createMany({ data: sidesData }),
      prisma.matchSidePlayer.createMany({ data: playersData }),
    ],
    { timeout: 15000 },
  )

  revalidateRound(round.leagueId, round.id)
  return { success: true }
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
      na > 99 ||
      nb > 99
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
