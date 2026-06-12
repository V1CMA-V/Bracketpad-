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
  // Coordenadas: texto → número (vacío → undefined). Un valor no numérico se
  // deja pasar como NaN para que la validación de rango lo rechace.
  const lat = str('latitude')
  const lng = str('longitude')
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
    latitude: lat ? Number(lat) : undefined,
    longitude: lng ? Number(lng) : undefined,
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
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      timezone: d.timezone,
    },
  })

  revalidatePath('/dashboard/ajustes')
  revalidatePath('/dashboard')
  // El slug puede haber cambiado: revalida la página pública en ambos.
  revalidatePath(`/clubs/${club.slug}`)
  if (d.slug !== club.slug) revalidatePath(`/clubs/${d.slug}`)
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

/* -------------------------------------------------------------------------- */
/*  Tarifas de renta de pista                                                  */
/* -------------------------------------------------------------------------- */

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

const courtRateRowSchema = z
  .object({
    label: z.string().trim().max(60, 'Etiqueta demasiado larga.').optional(),
    days: z
      .array(z.number().int().min(0).max(6))
      .min(1, 'Selecciona al menos un día.'),
    startTime: z.string().regex(HHMM, 'Hora de inicio inválida.'),
    endTime: z.string().regex(HHMM, 'Hora de fin inválida.'),
    price: z.coerce.number().gt(0, 'Indica un precio mayor que 0.'),
  })
  .refine((r) => r.startTime < r.endTime, {
    error: 'La hora de fin debe ser posterior a la de inicio.',
    path: ['endTime'],
  })

const courtRatesSchema = z.object({
  currency: z.enum(currencyOptions).default('MXN'),
  rates: z.array(courtRateRowSchema).max(20, 'Demasiadas tarifas (máx. 20).'),
})

export type CourtRatesState = {
  success?: boolean
  error?: string
}

/**
 * Guarda las tarifas de renta de pista del club. Sustituye todas las reglas por
 * las recibidas (estrategia borrar-y-crear dentro de una transacción). Las filas
 * llegan serializadas como JSON en el campo `rates`.
 */
export async function updateCourtRates(
  _prevState: CourtRatesState,
  formData: FormData,
): Promise<CourtRatesState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  let rawRates: unknown = []
  try {
    rawRates = JSON.parse(String(formData.get('rates') ?? '[]'))
  } catch {
    return { error: 'No se pudieron leer las tarifas.' }
  }

  const parsed = courtRatesSchema.safeParse({
    currency: formData.get('currency'),
    rates: rawRates,
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      error: first
        ? `Revisa las tarifas: ${first.message}`
        : 'Revisa las tarifas.',
    }
  }
  const d = parsed.data

  await prisma.$transaction([
    prisma.clubCourtRate.deleteMany({ where: { clubId: club.id } }),
    prisma.clubCourtRate.createMany({
      data: d.rates.map((r, i) => ({
        clubId: club.id,
        label: r.label?.trim() || null,
        days: r.days,
        startTime: r.startTime,
        endTime: r.endTime,
        price: r.price,
        currency: d.currency,
        sortOrder: i,
      })),
    }),
  ])

  revalidatePath('/dashboard/ajustes')
  revalidatePath(`/clubs/${club.slug}`)
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
