'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import { registerTeamSchema } from '@/lib/validations/team'

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
    select: { id: true, tournamentId: true, clubId: true, maxTeams: true },
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
    select: { id: true, categoryId: true, category: { select: { tournamentId: true } } },
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
