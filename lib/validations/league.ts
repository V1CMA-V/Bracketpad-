import { z } from 'zod'

// <input type="date"> entrega "" o "YYYY-MM-DD"
const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.')
  .optional()

/**
 * Edición de una liga. Los campos se dividen en dos grupos:
 *  - «menores»: nombre, estado y fechas. Siempre editables; no alteran los
 *    datos competitivos ya registrados.
 *  - «estructurales»: formato, tipo de juego y configuración de puntuación.
 *    Solo deben aplicarse mientras la liga está en borrador, porque cambiarlos
 *    invalidaría partidos y clasificaciones existentes (se valida en el server
 *    action, no aquí, ya que depende del estado actual de la liga).
 */
export const updateLeagueSchema = z
  .object({
    // --- menores ---
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres.')
      .max(120, 'El nombre es demasiado largo.'),
    status: z.enum(['draft', 'active', 'finished', 'archived'], {
      error: 'Estado no válido.',
    }),
    startDate: optionalDate,
    endDate: optionalDate,
    // Premios (texto libre). Siempre editable; no afecta a la competición.
    prizes: z
      .string()
      .trim()
      .max(2000, 'La descripción de premios es demasiado larga.')
      .optional(),

    // --- estructurales (solo se persisten en borrador) ---
    format: z.enum(['round_robin', 'divisions', 'ladder'], {
      error: 'Elige un formato de liga.',
    }),
    playKind: z.enum(['individual', 'pairs'], {
      error: 'Elige si la liga es individual o por parejas.',
    }),
    bestOfSets: z.coerce
      .number()
      .int()
      .min(1, 'Mínimo 1 set.')
      .max(5, 'Máximo 5 sets.'),
    goldenPoint: z.boolean(),
    tiebreakAt: z.coerce
      .number()
      .int()
      .min(1, 'Mínimo 1 juego.')
      .max(20, 'Máximo 20 juegos.'),
    // Cómo se decide la clasificación: por sets, solo por juegos, o ambos.
    rankingBy: z.enum(['sets', 'games', 'both']),
  })
  .refine(
    (d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
    {
      error: 'La fecha de fin no puede ser anterior a la de inicio.',
      path: ['endDate'],
    },
  )

export type UpdateLeagueInput = z.infer<typeof updateLeagueSchema>
