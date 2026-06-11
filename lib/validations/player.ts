import { z } from 'zod'

import { GENDERS, HANDS, SKILL_LEVELS } from '@/lib/players'

export const playerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Indica el nombre del jugador.')
    .max(80, 'El nombre es demasiado largo.'),
  email: z.string().trim().email('Email no válido.').max(120).optional(),
  phone: z.string().trim().max(30, 'El teléfono es demasiado largo.').optional(),
  gender: z.enum(GENDERS).optional(),
  skillLevel: z.enum(SKILL_LEVELS).optional(),
  dominantHand: z.enum(HANDS).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida.')
    .optional(),
})

export type PlayerInput = z.infer<typeof playerSchema>

export type PlayerFieldErrors = Partial<
  Record<keyof PlayerInput, string[]>
>
