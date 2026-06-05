import { z } from 'zod'

export const registerPlayerSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(2, 'Indica el nombre del jugador.')
    .max(80, 'El nombre es demasiado largo.'),
  division: z.string().trim().max(30, 'Demasiado largo.').optional(),
  seed: z.coerce
    .number()
    .int('Debe ser un número entero.')
    .min(1, 'Mínimo 1.')
    .max(999, 'Máximo 999.')
    .optional(),
})

export type RegisterPlayerInput = z.infer<typeof registerPlayerSchema>
