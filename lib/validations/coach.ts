import { z } from 'zod'

export const coachSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Indica el nombre del coach.')
    .max(80, 'El nombre es demasiado largo.'),
  email: z.string().trim().email('Email no válido.').max(120).optional(),
  phone: z.string().trim().max(30, 'El teléfono es demasiado largo.').optional(),
})

export type CoachInput = z.infer<typeof coachSchema>

export type CoachFieldErrors = Partial<Record<keyof CoachInput, string[]>>
