import { z } from 'zod'

import { TIMEZONES } from '@/lib/clubs'

export const createClubSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre del club debe tener al menos 2 caracteres.')
    .max(80, 'El nombre es demasiado largo.'),
  city: z.string().trim().max(80, 'La ciudad es demasiado larga.').optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Introduce un correo electrónico válido.'))
    .optional(),
  phone: z.string().trim().max(30, 'El teléfono es demasiado largo.').optional(),
})

export type CreateClubInput = z.infer<typeof createClubSchema>

// Año de fundación razonable: desde la difusión del pádel hasta el año actual.
const currentYear = new Date().getFullYear()
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Datos editables de la ficha del club desde Ajustes. */
export const clubSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Indica el nombre del club.')
    .max(80, 'El nombre es demasiado largo.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'La dirección pública es demasiado corta.')
    .max(60, 'La dirección pública es demasiado larga.')
    .regex(SLUG_RE, 'Usa solo minúsculas, números y guiones (ej. mi-club).'),
  legalName: z.string().trim().max(120, 'La razón social es demasiado larga.').optional(),
  taxId: z.string().trim().max(20, 'El RFC es demasiado largo.').optional(),
  foundedYear: z
    .number()
    .int()
    .min(1960, 'Año no válido.')
    .max(currentYear, 'El año no puede ser futuro.')
    .optional(),
  description: z
    .string()
    .trim()
    .max(280, 'La descripción es demasiado larga (máx. 280 caracteres).')
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Introduce un correo electrónico válido.'))
    .optional(),
  phone: z.string().trim().max(30, 'El teléfono es demasiado largo.').optional(),
  website: z
    .string()
    .trim()
    .pipe(z.url('La web no es una URL válida (incluye https://).'))
    .optional(),
  instagram: z.string().trim().max(40, 'El usuario es demasiado largo.').optional(),
  address: z.string().trim().max(160, 'La dirección es demasiado larga.').optional(),
  city: z.string().trim().max(80, 'La ciudad es demasiado larga.').optional(),
  state: z.string().trim().max(80, 'El estado es demasiado largo.').optional(),
  postalCode: z.string().trim().max(12, 'El código postal no es válido.').optional(),
  country: z.string().trim().max(60, 'El país es demasiado largo.').optional(),
  latitude: z
    .number()
    .min(-90, 'La latitud debe estar entre -90 y 90.')
    .max(90, 'La latitud debe estar entre -90 y 90.')
    .optional(),
  longitude: z
    .number()
    .min(-180, 'La longitud debe estar entre -180 y 180.')
    .max(180, 'La longitud debe estar entre -180 y 180.')
    .optional(),
  timezone: z.enum(TIMEZONES, { error: 'Zona horaria no válida.' }),
})

export type ClubSettingsInput = z.infer<typeof clubSettingsSchema>

export type ClubFieldErrors = Partial<Record<keyof ClubSettingsInput, string[]>>
