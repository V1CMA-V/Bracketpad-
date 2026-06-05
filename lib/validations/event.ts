import { z } from 'zod'

const name = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres.')
  .max(120, 'El nombre es demasiado largo.')

// <input type="date"> entrega "" o "YYYY-MM-DD"
const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.')
  .optional()

export const createEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('torneo'),
    name,
    startDate: optionalDate,
    endDate: optionalDate,
    location: z.string().trim().max(120, 'La ubicación es demasiado larga.').optional(),
    description: z
      .string()
      .trim()
      .max(2000, 'La descripción es demasiado larga.')
      .optional(),
  }),
  z.object({
    type: z.literal('liga'),
    name,
    startDate: optionalDate,
    endDate: optionalDate,
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
  }),
])

export type CreateEventInput = z.infer<typeof createEventSchema>
export type EventType = CreateEventInput['type']
