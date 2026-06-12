'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import { currencyOptions } from '@/lib/money'
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

/* -------------------------------------------------------------------------- */
/*  Tarifario de clases                                                        */
/* -------------------------------------------------------------------------- */

// Importe opcional ("" → undefined; texto inválido → error).
const priceField = z
  .union([z.literal(''), z.coerce.number().min(0, 'Importe inválido.')])
  .transform((v) => (v === '' ? undefined : v))
  .optional()

const classPricingSchema = z.object({
  price1: priceField,
  price2: priceField,
  price3: priceField,
  price4: priceField,
  currency: z.enum(currencyOptions).default('MXN'),
})

export type ClassPricingState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<
    Record<'price1' | 'price2' | 'price3' | 'price4' | 'currency', string[]>
  >
}

/** Guarda el tarifario de clases del club (precio por nº de jugadores 1–4). */
export async function updateClassPricing(
  _prevState: ClassPricingState,
  formData: FormData,
): Promise<ClassPricingState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const parsed = classPricingSchema.safeParse({
    price1: formData.get('price1'),
    price2: formData.get('price2'),
    price3: formData.get('price3'),
    price4: formData.get('price4'),
    currency: formData.get('currency'),
  })
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  const d = parsed.data

  await prisma.clubClassPricing.upsert({
    where: { clubId: club.id },
    update: {
      price1: d.price1 ?? null,
      price2: d.price2 ?? null,
      price3: d.price3 ?? null,
      price4: d.price4 ?? null,
      currency: d.currency,
    },
    create: {
      clubId: club.id,
      price1: d.price1 ?? null,
      price2: d.price2 ?? null,
      price3: d.price3 ?? null,
      price4: d.price4 ?? null,
      currency: d.currency,
    },
  })

  revalidatePath('/dashboard/ajustes')
  revalidatePath('/dashboard/programacion')
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
