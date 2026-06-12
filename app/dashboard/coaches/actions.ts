'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import { coachSchema, type CoachFieldErrors } from '@/lib/validations/coach'

export type CoachFormState = {
  success?: boolean
  error?: string
  fieldErrors?: CoachFieldErrors
}

/** Lee y normaliza el formulario de coach (vacío → undefined). */
function readForm(formData: FormData) {
  const str = (key: string) => {
    const v = formData.get(key)
    return typeof v === 'string' && v.trim() !== '' ? v : undefined
  }
  return {
    fullName: formData.get('fullName'),
    email: str('email'),
    phone: str('phone'),
  }
}

export async function createCoach(
  _prevState: CoachFormState,
  formData: FormData,
): Promise<CoachFormState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const parsed = coachSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  const d = parsed.data

  await prisma.coach.create({
    data: {
      clubId: club.id,
      fullName: d.fullName,
      email: d.email ?? null,
      phone: d.phone ?? null,
    },
  })

  revalidatePath('/dashboard/coaches')
  return { success: true }
}

export async function updateCoach(
  coachId: string,
  _prevState: CoachFormState,
  formData: FormData,
): Promise<CoachFormState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const parsed = coachSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  const d = parsed.data

  // updateMany acota por clubId: solo afecta coaches del club que administras.
  const res = await prisma.coach.updateMany({
    where: { id: coachId, clubId: club.id },
    data: {
      fullName: d.fullName,
      email: d.email ?? null,
      phone: d.phone ?? null,
    },
  })
  if (res.count === 0) return { error: 'No se encontró el coach.' }

  revalidatePath('/dashboard/coaches')
  return { success: true }
}

export async function deleteCoach(coachId: string) {
  const club = await getManagedClub()
  if (!club) return

  // Las reservas que apuntan al coach quedan con coachId = null (onDelete: SetNull),
  // conservando el registro histórico de la clase.
  await prisma.coach.deleteMany({ where: { id: coachId, clubId: club.id } })
  revalidatePath('/dashboard/coaches')
}
