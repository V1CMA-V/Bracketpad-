import { z } from 'zod'

// Inscripción de una pareja en una categoría de torneo: dos nombres de jugador
// (se crean/reutilizan como Player por nombre, igual que en ligas), más un
// nombre de equipo y un cabeza de serie opcionales.
export const registerTeamSchema = z.object({
  player1Name: z
    .string()
    .trim()
    .min(2, 'Indica el nombre del jugador 1.')
    .max(80, 'El nombre es demasiado largo.'),
  player2Name: z
    .string()
    .trim()
    .min(2, 'Indica el nombre del jugador 2.')
    .max(80, 'El nombre es demasiado largo.'),
  teamName: z.string().trim().max(80, 'El nombre es demasiado largo.').optional(),
  seed: z.coerce
    .number()
    .int('Debe ser un número entero.')
    .min(1, 'Mínimo 1.')
    .max(999, 'Máximo 999.')
    .optional(),
})

export type RegisterTeamInput = z.infer<typeof registerTeamSchema>
