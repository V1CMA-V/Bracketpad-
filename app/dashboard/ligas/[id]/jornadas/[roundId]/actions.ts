'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import { createMatchSchema } from '@/lib/validations/jornada'
import { recomputeStandings } from '@/lib/standings'

export type MatchState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<Record<'a1' | 'b1' | 'scheduledAt', string[]>>
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
    scheduledAt: (formData.get('scheduledAt') as string) || undefined,
    a1: formData.get('a1'),
    a2: (formData.get('a2') as string) || undefined,
    b1: formData.get('b1'),
    b2: (formData.get('b2') as string) || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const { courtId, scheduledAt, a1, a2, b1, b2 } = parsed.data
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
/*  Editar horario                                                            */
/* -------------------------------------------------------------------------- */

export async function updateMatchSchedule(
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
