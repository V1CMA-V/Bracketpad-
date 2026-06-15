'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import {
  categorySchema,
  updateTournamentSchema,
} from '@/lib/validations/tournament'

/* -------------------------------------------------------------------------- */
/*  Tipos de estado                                                           */
/* -------------------------------------------------------------------------- */

type CategoryFieldErrors = Partial<
  Record<
    | 'name'
    | 'gender'
    | 'skillLevel'
    | 'drawType'
    | 'maxTeams'
    | 'bestOfSets'
    | 'tiebreakAt'
    | 'prize'
    | 'entryFee'
    | 'currency',
    string[]
  >
>

export type CategoryState = {
  success?: boolean
  error?: string
  fieldErrors?: CategoryFieldErrors
}

export type TournamentState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<
    Record<
      'name' | 'status' | 'startDate' | 'endDate' | 'location' | 'description',
      string[]
    >
  >
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function toDate(value: string | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00`) : null
}

/** Lee los campos de una categoría del FormData y los valida. */
function parseCategory(formData: FormData) {
  return categorySchema.safeParse({
    name: formData.get('name'),
    gender: formData.get('gender'),
    skillLevel: formData.get('skillLevel'),
    drawType: formData.get('drawType'),
    maxTeams: (formData.get('maxTeams') as string) || undefined,
    bestOfSets: (formData.get('bestOfSets') as string) || undefined,
    goldenPoint: formData.get('goldenPoint') === 'on',
    tiebreakAt: (formData.get('tiebreakAt') as string) || undefined,
    prize: (formData.get('prize') as string) || undefined,
    entryFee: (formData.get('entryFee') as string) || undefined,
    currency: formData.get('currency'),
  })
}

/** Verifica que el torneo pertenezca al club gestionado. */
async function findOwnedTournament(tournamentId: string) {
  const club = await getManagedClub()
  if (!club) return null
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, clubId: club.id },
    select: { id: true, clubId: true },
  })
  return tournament ? { tournament, club } : null
}

/* -------------------------------------------------------------------------- */
/*  Categorías                                                                */
/* -------------------------------------------------------------------------- */

export async function createCategory(
  tournamentId: string,
  _prevState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const owned = await findOwnedTournament(tournamentId)
  if (!owned) return { error: 'Torneo no encontrado.' }

  const parsed = parseCategory(formData)
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  const data = parsed.data

  const duplicate = await prisma.tournamentCategory.findUnique({
    where: { tournamentId_name: { tournamentId, name: data.name } },
    select: { id: true },
  })
  if (duplicate) {
    return { error: `Ya existe una categoría llamada «${data.name}».` }
  }

  await prisma.tournamentCategory.create({
    data: {
      tournamentId,
      clubId: owned.tournament.clubId,
      name: data.name,
      gender: data.gender,
      skillLevel: data.skillLevel,
      drawType: data.drawType,
      maxTeams: data.maxTeams ?? null,
      bestOfSets: data.bestOfSets,
      goldenPoint: data.goldenPoint,
      tiebreakAt: data.tiebreakAt,
      // teamsPerGroup / advancePerGroup quedan nulos: se definen al generar los
      // grupos, según las parejas inscritas.
      prize: data.prize ?? null,
      entryFee: data.entryFee ?? null,
      currency: data.currency,
    },
  })

  revalidatePath(`/dashboard/torneos/${tournamentId}`)
  return { success: true }
}

export async function updateCategory(
  categoryId: string,
  _prevState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const category = await prisma.tournamentCategory.findFirst({
    where: { id: categoryId, clubId: club.id },
    select: { id: true, tournamentId: true },
  })
  if (!category) return { error: 'Categoría no encontrada.' }

  const parsed = parseCategory(formData)
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  const data = parsed.data

  // Otra categoría del mismo torneo no puede tener este nombre.
  const duplicate = await prisma.tournamentCategory.findUnique({
    where: {
      tournamentId_name: { tournamentId: category.tournamentId, name: data.name },
    },
    select: { id: true },
  })
  if (duplicate && duplicate.id !== category.id) {
    return { error: `Ya existe una categoría llamada «${data.name}».` }
  }

  await prisma.tournamentCategory.update({
    where: { id: category.id },
    data: {
      name: data.name,
      gender: data.gender,
      skillLevel: data.skillLevel,
      drawType: data.drawType,
      maxTeams: data.maxTeams ?? null,
      bestOfSets: data.bestOfSets,
      goldenPoint: data.goldenPoint,
      tiebreakAt: data.tiebreakAt,
      // No se tocan teamsPerGroup / advancePerGroup: los gestiona la fase de
      // generación de grupos, así que editar la categoría los conserva.
      prize: data.prize ?? null,
      entryFee: data.entryFee ?? null,
      currency: data.currency,
    },
  })

  revalidatePath(`/dashboard/torneos/${category.tournamentId}`)
  return { success: true }
}

export async function deleteCategory(categoryId: string) {
  const club = await getManagedClub()
  if (!club) return
  const category = await prisma.tournamentCategory.findFirst({
    where: { id: categoryId, clubId: club.id },
    select: { id: true, tournamentId: true },
  })
  if (!category) return
  // Al borrar la categoría se borran en cascada sus equipos y partidos.
  await prisma.tournamentCategory.delete({ where: { id: category.id } })
  revalidatePath(`/dashboard/torneos/${category.tournamentId}`)
}

/* -------------------------------------------------------------------------- */
/*  Torneo                                                                    */
/* -------------------------------------------------------------------------- */

export async function updateTournament(
  tournamentId: string,
  _prevState: TournamentState,
  formData: FormData,
): Promise<TournamentState> {
  const owned = await findOwnedTournament(tournamentId)
  if (!owned) return { error: 'Torneo no encontrado.' }

  const parsed = updateTournamentSchema.safeParse({
    name: formData.get('name'),
    status: formData.get('status'),
    startDate: (formData.get('startDate') as string) || undefined,
    endDate: (formData.get('endDate') as string) || undefined,
    location: (formData.get('location') as string) || undefined,
    description: (formData.get('description') as string) || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  const data = parsed.data

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      name: data.name,
      status: data.status,
      startDate: toDate(data.startDate),
      endDate: toDate(data.endDate),
      location: data.location ?? null,
      description: data.description ?? null,
    },
  })

  revalidatePath(`/dashboard/torneos/${tournamentId}`)
  revalidatePath('/dashboard/torneos')
  return { success: true }
}

/**
 * Elimina un torneo en borrador por completo (categorías, equipos y partidos en
 * cascada). Fuera de borrador se debe archivar en lugar de borrarse.
 */
export async function deleteTournament(
  tournamentId: string,
): Promise<TournamentState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, clubId: club.id },
    select: { id: true, status: true },
  })
  if (!tournament) return { error: 'Torneo no encontrado.' }

  if (tournament.status !== 'draft') {
    return {
      error:
        'Solo se pueden eliminar torneos en borrador. Archívalo si ya no lo usas.',
    }
  }

  await prisma.tournament.delete({ where: { id: tournament.id } })

  revalidatePath('/dashboard/torneos')
  redirect('/dashboard/torneos')
}
