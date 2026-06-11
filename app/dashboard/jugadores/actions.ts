'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import { playerSchema, type PlayerFieldErrors } from '@/lib/validations/player'

export type PlayerFormState = {
  success?: boolean
  error?: string
  fieldErrors?: PlayerFieldErrors
}

/** Lee y normaliza el formulario de jugador (vacío → undefined). */
function readForm(formData: FormData) {
  const str = (key: string) => {
    const v = formData.get(key)
    return typeof v === 'string' && v.trim() !== '' ? v : undefined
  }
  return {
    fullName: formData.get('fullName'),
    email: str('email'),
    phone: str('phone'),
    gender: str('gender'),
    skillLevel: str('skillLevel'),
    dominantHand: str('dominantHand'),
    birthDate: str('birthDate'),
  }
}

export async function createPlayer(
  _prevState: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const parsed = playerSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  const d = parsed.data

  await prisma.player.create({
    data: {
      clubId: club.id,
      fullName: d.fullName,
      email: d.email ?? null,
      phone: d.phone ?? null,
      gender: d.gender ?? null,
      skillLevel: d.skillLevel ?? 'unranked',
      dominantHand: d.dominantHand ?? null,
      birthDate: d.birthDate ? new Date(d.birthDate) : null,
    },
  })

  revalidatePath('/dashboard/jugadores')
  return { success: true }
}

export async function updatePlayer(
  playerId: string,
  _prevState: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const parsed = playerSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  const d = parsed.data

  // updateMany acota por clubId: solo afecta jugadores del club que administras.
  const res = await prisma.player.updateMany({
    where: { id: playerId, clubId: club.id },
    data: {
      fullName: d.fullName,
      email: d.email ?? null,
      phone: d.phone ?? null,
      gender: d.gender ?? null,
      skillLevel: d.skillLevel ?? 'unranked',
      dominantHand: d.dominantHand ?? null,
      birthDate: d.birthDate ? new Date(d.birthDate) : null,
    },
  })
  if (res.count === 0) return { error: 'No se encontró el jugador.' }

  revalidatePath('/dashboard/jugadores')
  return { success: true }
}

export async function deletePlayer(playerId: string) {
  const club = await getManagedClub()
  if (!club) return

  // No se elimina un jugador con participaciones (inscripciones, parejas,
  // equipos o partidos): rompería las claves foráneas. La UI ya deshabilita el
  // botón en ese caso; esto es la salvaguarda del servidor.
  const player = await prisma.player.findFirst({
    where: { id: playerId, clubId: club.id },
    select: {
      _count: {
        select: {
          leagueRegistrations: true,
          leaguePartnerRegistrations: true,
          teamMemberships: true,
          matchSidePlayers: true,
        },
      },
    },
  })
  if (!player) return
  const c = player._count
  if (
    c.leagueRegistrations +
      c.leaguePartnerRegistrations +
      c.teamMemberships +
      c.matchSidePlayers >
    0
  ) {
    return
  }

  await prisma.player.deleteMany({ where: { id: playerId, clubId: club.id } })
  revalidatePath('/dashboard/jugadores')
}
