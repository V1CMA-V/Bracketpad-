import { z } from 'zod'

export const createRoundSchema = z.object({
  name: z.string().trim().max(60, 'El nombre es demasiado largo.').optional(),
  scheduledDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.')
    .optional(),
})

export const createMatchSchema = z.object({
  courtId: z.string().trim().optional(),
  a1: z.string().trim().min(1, 'Selecciona al menos un jugador para el lado A.'),
  a2: z.string().trim().optional(),
  b1: z.string().trim().min(1, 'Selecciona al menos un jugador para el lado B.'),
  b2: z.string().trim().optional(),
})

export type CreateRoundInput = z.infer<typeof createRoundSchema>
export type CreateMatchInput = z.infer<typeof createMatchSchema>
