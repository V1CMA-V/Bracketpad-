'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import {
  clubSettingsSchema,
  type ClubFieldErrors,
} from '@/lib/validations/club'

export type ClubSettingsState = {
  success?: boolean
  error?: string
  fieldErrors?: ClubFieldErrors
}

/** Lee y normaliza el formulario de ajustes (vacío → undefined). */
function readForm(formData: FormData) {
  const str = (key: string) => {
    const v = formData.get(key)
    return typeof v === 'string' && v.trim() !== '' ? v : undefined
  }
  const year = str('foundedYear')
  // Instagram: se guarda sin la @ inicial que pueda escribir el usuario.
  const ig = str('instagram')?.replace(/^@+/, '')
  return {
    name: formData.get('name'),
    slug: formData.get('slug'),
    legalName: str('legalName'),
    taxId: str('taxId'),
    foundedYear: year ? Number(year) : undefined,
    description: str('description'),
    email: str('email'),
    phone: str('phone'),
    website: str('website'),
    instagram: ig,
    address: str('address'),
    city: str('city'),
    state: str('state'),
    postalCode: str('postalCode'),
    country: str('country'),
    timezone: formData.get('timezone'),
  }
}

export async function updateClubSettings(
  _prevState: ClubSettingsState,
  formData: FormData,
): Promise<ClubSettingsState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const parsed = clubSettingsSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  const d = parsed.data

  // El slug es único entre clubs: si cambió, comprueba que no esté tomado.
  if (d.slug !== club.slug) {
    const taken = await prisma.club.findFirst({
      where: { slug: d.slug, NOT: { id: club.id } },
      select: { id: true },
    })
    if (taken) {
      return { fieldErrors: { slug: ['Esa dirección pública ya está en uso.'] } }
    }
  }

  // updateMany acota por id: solo afecta al club que administras.
  await prisma.club.updateMany({
    where: { id: club.id },
    data: {
      name: d.name,
      slug: d.slug,
      legalName: d.legalName ?? null,
      taxId: d.taxId ?? null,
      foundedYear: d.foundedYear ?? null,
      description: d.description ?? null,
      email: d.email ?? null,
      phone: d.phone ?? null,
      website: d.website ?? null,
      instagram: d.instagram ?? null,
      address: d.address ?? null,
      city: d.city ?? null,
      state: d.state ?? null,
      postalCode: d.postalCode ?? null,
      country: d.country ?? null,
      timezone: d.timezone,
    },
  })

  revalidatePath('/dashboard/ajustes')
  revalidatePath('/dashboard')
  return { success: true }
}

/** Activa o archiva el club (oculta el club y sus eventos). Reversible. */
export async function setClubActive(isActive: boolean) {
  const club = await getManagedClub()
  if (!club) return
  await prisma.club.updateMany({
    where: { id: club.id },
    data: { isActive },
  })
  revalidatePath('/dashboard/ajustes')
  revalidatePath('/dashboard')
}
