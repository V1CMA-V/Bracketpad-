'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import { createCourtSchema } from '@/lib/validations/court'

export type CourtFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<Record<'name' | 'surface' | 'isIndoor', string[]>>
}

export async function createCourt(
  _prevState: CourtFormState,
  formData: FormData,
): Promise<CourtFormState> {
  const club = await getManagedClub()
  if (!club) {
    return { error: 'No administras ningún club.' }
  }

  const parsed = createCourtSchema.safeParse({
    name: formData.get('name'),
    surface: formData.get('surface'),
    isIndoor: formData.get('isIndoor') === 'on',
  })

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  // Sin nombre → "Pista N", siendo N el siguiente número a las ya creadas.
  let name = parsed.data.name
  if (!name) {
    const count = await prisma.court.count({ where: { clubId: club.id } })
    name = `Pista ${count + 1}`
  }

  await prisma.court.create({
    data: {
      clubId: club.id,
      name,
      surface: parsed.data.surface,
      isIndoor: parsed.data.isIndoor,
    },
  })

  revalidatePath('/dashboard/pistas')
  return { success: true }
}

export async function updateCourt(
  courtId: string,
  _prevState: CourtFormState,
  formData: FormData,
): Promise<CourtFormState> {
  const club = await getManagedClub()
  if (!club) {
    return { error: 'No administras ningún club.' }
  }

  const parsed = createCourtSchema.safeParse({
    name: formData.get('name'),
    surface: formData.get('surface'),
    isIndoor: formData.get('isIndoor') === 'on',
  })

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  // Al editar, si se vacía el nombre se conserva el actual (no se autogenera).
  let name = parsed.data.name
  if (!name) {
    const existing = await prisma.court.findFirst({
      where: { id: courtId, clubId: club.id },
      select: { name: true },
    })
    if (!existing) return { error: 'No se encontró la pista.' }
    name = existing.name
  }

  await prisma.court.updateMany({
    where: { id: courtId, clubId: club.id },
    data: {
      name,
      surface: parsed.data.surface,
      isIndoor: parsed.data.isIndoor,
    },
  })

  revalidatePath('/dashboard/pistas')
  return { success: true }
}

export async function setCourtActive(courtId: string, isActive: boolean) {
  const club = await getManagedClub()
  if (!club) return
  // updateMany acota por clubId: solo afecta pistas del club que administras.
  await prisma.court.updateMany({
    where: { id: courtId, clubId: club.id },
    data: { isActive },
  })
  revalidatePath('/dashboard/pistas')
}

export async function deleteCourt(courtId: string) {
  const club = await getManagedClub()
  if (!club) return
  await prisma.court.deleteMany({ where: { id: courtId, clubId: club.id } })
  revalidatePath('/dashboard/pistas')
}

/* -------------------------------------------------------------------------- */
/*  Horario del club por día de la semana                                     */
/* -------------------------------------------------------------------------- */

export type ClubHoursState = {
  success?: boolean
  error?: string
}

const HHMM = /^\d{2}:\d{2}$/
const weekdayNames = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

/**
 * Guarda el horario del club por día de la semana. Cada día llega como tres
 * campos: `closed-{d}` (checkbox), `open-{d}` y `close-{d}` ("HH:MM"). Un día
 * cerrado (o sin horas) no genera fila. Reemplaza todo el horario del club.
 */
export async function updateClubHours(
  _prevState: ClubHoursState,
  formData: FormData,
): Promise<ClubHoursState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const rows: { clubId: string; dayOfWeek: number; openTime: string; closeTime: string }[] = []
  for (let d = 0; d < 7; d++) {
    if (formData.get(`closed-${d}`) === 'on') continue
    const open = ((formData.get(`open-${d}`) as string) || '').trim()
    const close = ((formData.get(`close-${d}`) as string) || '').trim()
    // Día abierto sin horas completas → se trata como cerrado.
    if (!open && !close) continue
    if (!HHMM.test(open) || !HHMM.test(close)) {
      return { error: `Horario inválido en ${weekdayNames[d]}.` }
    }
    if (close <= open) {
      return {
        error: `En ${weekdayNames[d]} el cierre debe ser posterior a la apertura.`,
      }
    }
    rows.push({ clubId: club.id, dayOfWeek: d, openTime: open, closeTime: close })
  }

  await prisma.$transaction([
    prisma.clubHours.deleteMany({ where: { clubId: club.id } }),
    prisma.clubHours.createMany({ data: rows }),
  ])

  revalidatePath('/dashboard/pistas')
  revalidatePath('/dashboard/programacion')
  return { success: true }
}
