'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import { registerPlayerSchema } from '@/lib/validations/registration'
import { createRoundSchema } from '@/lib/validations/jornada'

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
