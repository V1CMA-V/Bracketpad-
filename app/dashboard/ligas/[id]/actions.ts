'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import { registerPlayerSchema } from '@/lib/validations/registration'
import { createRoundSchema, updateRoundSchema } from '@/lib/validations/jornada'
import { updateLeagueSchema } from '@/lib/validations/league'

export type RegistrationState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<Record<'playerName' | 'division' | 'seed', string[]>>
}

export async function registerPlayer(
  leagueId: string,
  _prevState: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const club = await getManagedClub()
  if (!club) {
    return { error: 'No administras ningún club.' }
  }

  const league = await prisma.league.findFirst({
    where: { id: leagueId, clubId: club.id },
    select: { id: true },
  })
  if (!league) {
    return { error: 'Liga no encontrada.' }
  }

  const parsed = registerPlayerSchema.safeParse({
    playerName: formData.get('playerName'),
    division: (formData.get('division') as string) || undefined,
    seed: (formData.get('seed') as string) || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const { playerName, division, seed } = parsed.data

  // Reutiliza el jugador del club si ya existe por nombre; si no, lo crea.
  let player = await prisma.player.findFirst({
    where: { clubId: club.id, fullName: playerName },
    select: { id: true },
  })
  if (!player) {
    player = await prisma.player.create({
      data: { clubId: club.id, fullName: playerName },
      select: { id: true },
    })
  }

  const existing = await prisma.leagueRegistration.findUnique({
    where: { leagueId_playerId: { leagueId, playerId: player.id } },
    select: { id: true },
  })
  if (existing) {
    return { error: `${playerName} ya está inscrito en esta liga.` }
  }

  // Inscripción + su fila de clasificación (en ceros) para que aparezca ya.
  await prisma.leagueRegistration.create({
    data: {
      leagueId,
      playerId: player.id,
      division: division ?? null,
      seed: seed ?? null,
      standing: {
        create: { leagueId, division: division ?? null },
      },
    },
  })

  revalidatePath(`/dashboard/ligas/${leagueId}`)
  return { success: true }
}

/** Verifica que la inscripción pertenezca a una liga del club gestionado. */
async function findOwnedRegistration(registrationId: string) {
  const club = await getManagedClub()
  if (!club) return null
  return prisma.leagueRegistration.findFirst({
    where: { id: registrationId, league: { clubId: club.id } },
    select: { id: true, leagueId: true },
  })
}

export async function setRegistrationStatus(
  registrationId: string,
  status: 'active' | 'withdrawn',
) {
  const reg = await findOwnedRegistration(registrationId)
  if (!reg) return
  await prisma.leagueRegistration.update({
    where: { id: reg.id },
    data: { status },
  })
  revalidatePath(`/dashboard/ligas/${reg.leagueId}`)
}

export async function removeRegistration(registrationId: string) {
  const reg = await findOwnedRegistration(registrationId)
  if (!reg) return
  // Borra la inscripción; su LeagueStanding se elimina en cascada.
  await prisma.leagueRegistration.delete({ where: { id: reg.id } })
  revalidatePath(`/dashboard/ligas/${reg.leagueId}`)
}

/* -------------------------------------------------------------------------- */
/*  Jornadas                                                                  */
/* -------------------------------------------------------------------------- */

export type RoundState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<Record<'name' | 'scheduledDate', string[]>>
}

export async function createRound(
  leagueId: string,
  _prevState: RoundState,
  formData: FormData,
): Promise<RoundState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const league = await prisma.league.findFirst({
    where: { id: leagueId, clubId: club.id },
    select: { id: true },
  })
  if (!league) return { error: 'Liga no encontrada.' }

  const parsed = createRoundSchema.safeParse({
    name: (formData.get('name') as string) || undefined,
    scheduledDate: (formData.get('scheduledDate') as string) || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const last = await prisma.leagueRound.findFirst({
    where: { leagueId },
    orderBy: { roundNumber: 'desc' },
    select: { roundNumber: true },
  })
  const roundNumber = (last?.roundNumber ?? 0) + 1

  await prisma.leagueRound.create({
    data: {
      leagueId,
      roundNumber,
      name: parsed.data.name ?? null,
      scheduledDate: parsed.data.scheduledDate
        ? new Date(`${parsed.data.scheduledDate}T00:00:00`)
        : null,
    },
  })

  revalidatePath(`/dashboard/ligas/${leagueId}`)
  return { success: true }
}

export async function deleteRound(roundId: string) {
  const club = await getManagedClub()
  if (!club) return
  const round = await prisma.leagueRound.findFirst({
    where: { id: roundId, league: { clubId: club.id } },
    select: { id: true, leagueId: true },
  })
  if (!round) return
  // Los partidos de la jornada quedan con leagueRoundId = null (onDelete: SetNull).
  await prisma.leagueRound.delete({ where: { id: round.id } })
  revalidatePath(`/dashboard/ligas/${round.leagueId}`)
}

/** Edita el nombre y la fecha de una jornada (no su estado). */
export async function updateRound(
  roundId: string,
  _prevState: RoundState,
  formData: FormData,
): Promise<RoundState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const round = await prisma.leagueRound.findFirst({
    where: { id: roundId, league: { clubId: club.id } },
    select: { id: true, leagueId: true, status: true },
  })
  if (!round) return { error: 'Jornada no encontrada.' }

  // Una jornada cerrada queda bloqueada: ya no admite cambios de nombre/fecha.
  if (round.status === 'closed') {
    return {
      error: 'La jornada está cerrada y ya no se puede modificar.',
    }
  }

  const parsed = updateRoundSchema.safeParse({
    name: (formData.get('name') as string) || undefined,
    scheduledDate: (formData.get('scheduledDate') as string) || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  await prisma.leagueRound.update({
    where: { id: round.id },
    data: {
      name: parsed.data.name ?? null,
      scheduledDate: parsed.data.scheduledDate
        ? new Date(`${parsed.data.scheduledDate}T00:00:00`)
        : null,
    },
  })

  revalidatePath(`/dashboard/ligas/${round.leagueId}`)
  revalidatePath(`/dashboard/ligas/${round.leagueId}/jornadas/${round.id}`)
  return { success: true }
}

/** Cambia el estado de publicación de una jornada (draft/published/closed). */
export async function setRoundStatus(
  roundId: string,
  status: 'draft' | 'published' | 'closed',
): Promise<RoundState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }
  if (!['draft', 'published', 'closed'].includes(status)) {
    return { error: 'Estado no válido.' }
  }

  const round = await prisma.leagueRound.findFirst({
    where: { id: roundId, league: { clubId: club.id } },
    select: { id: true, leagueId: true },
  })
  if (!round) return { error: 'Jornada no encontrada.' }

  await prisma.leagueRound.update({
    where: { id: round.id },
    data: { status },
  })

  revalidatePath(`/dashboard/ligas/${round.leagueId}`)
  revalidatePath(`/dashboard/ligas/${round.leagueId}/jornadas/${round.id}`)
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  Editar liga                                                               */
/* -------------------------------------------------------------------------- */

export type LeagueSettingsState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<
    Record<
      | 'name'
      | 'status'
      | 'startDate'
      | 'endDate'
      | 'prizes'
      | 'format'
      | 'playKind'
      | 'bestOfSets'
      | 'tiebreakAt'
      | 'rankingBy',
      string[]
    >
  >
}

/** Convierte "YYYY-MM-DD" (o vacío) en un Date a medianoche, o null. */
function toDate(value: string | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00`) : null
}

export async function updateLeague(
  leagueId: string,
  _prevState: LeagueSettingsState,
  formData: FormData,
): Promise<LeagueSettingsState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const league = await prisma.league.findFirst({
    where: { id: leagueId, clubId: club.id },
    select: { id: true, status: true },
  })
  if (!league) return { error: 'Liga no encontrada.' }

  const parsed = updateLeagueSchema.safeParse({
    name: formData.get('name'),
    status: formData.get('status'),
    startDate: (formData.get('startDate') as string) || undefined,
    endDate: (formData.get('endDate') as string) || undefined,
    prizes: (formData.get('prizes') as string) || undefined,
    format: formData.get('format'),
    playKind: formData.get('playKind'),
    bestOfSets: (formData.get('bestOfSets') as string) || undefined,
    goldenPoint: formData.get('goldenPoint') === 'on',
    tiebreakAt: (formData.get('tiebreakAt') as string) || undefined,
    rankingBy: formData.get('rankingBy'),
  })
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const data = parsed.data
  // Una liga solo es «estructuralmente» editable mientras está en borrador.
  // Si ya salió de borrador, ignoramos formato/tipo/puntuación para no
  // invalidar partidos y clasificaciones existentes.
  const isDraft = league.status === 'draft'

  await prisma.league.update({
    where: { id: league.id },
    data: {
      // Campos menores: siempre editables.
      name: data.name,
      status: data.status,
      startDate: toDate(data.startDate),
      endDate: toDate(data.endDate),
      prizes: data.prizes ?? null,
      // Campos estructurales: solo en borrador.
      ...(isDraft
        ? {
            format: data.format,
            playKind: data.playKind,
            scoringConfig: {
              upsert: {
                create: {
                  bestOfSets: data.bestOfSets,
                  goldenPoint: data.goldenPoint,
                  tiebreakAt: data.tiebreakAt,
                  rankingBy: data.rankingBy,
                },
                update: {
                  bestOfSets: data.bestOfSets,
                  goldenPoint: data.goldenPoint,
                  tiebreakAt: data.tiebreakAt,
                  rankingBy: data.rankingBy,
                },
              },
            },
          }
        : {}),
    },
  })

  revalidatePath(`/dashboard/ligas/${leagueId}`)
  // La página pública también muestra estos datos.
  revalidatePath(`/clubs/${club.slug}/l/${leagueId}`)
  return { success: true }
}
