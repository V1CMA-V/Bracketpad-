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

// Costo de inscripción: importe opcional (el vacío se trata como «sin definir»)
// y su moneda. Se reutiliza en la creación y edición de ligas.
const optionalFee = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : v),
  z.coerce
    .number()
    .min(0, 'El costo no puede ser negativo.')
    .max(1_000_000, 'El costo es demasiado alto.')
    .optional(),
)

const currency = z.enum(['MXN', 'USD', 'EUR']).default('MXN')

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
    // Calendario de la temporada (informativo). Número de jornadas previstas,
    // días de juego (0=domingo … 6=sábado) y horarios recurrentes ("HH:MM").
    totalRounds: z.coerce
      .number()
      .int()
      .min(1, 'Mínimo 1 jornada.')
      .max(50, 'Máximo 50 jornadas.')
      .optional(),
    playWeekdays: z
      .array(z.coerce.number().int().min(0).max(6))
      .max(7)
      .optional()
      .default([]),
    playTimes: z
      .array(z.string().trim().regex(/^\d{2}:\d{2}$/, 'Hora inválida.'))
      .max(12, 'Demasiados horarios.')
      .optional()
      .default([]),
    // Por ahora la liga se enfoca en el formato de grupos (antes «divisiones»).
    format: z.literal('divisions', {
      error: 'El formato de liga debe ser por grupos.',
    }),
    playKind: z.enum(['individual', 'pairs'], {
      error: 'Elige si la liga es individual o por parejas.',
    }),
    bestOfSets: z.coerce
      .number()
      .int()
      .min(1, 'Mínimo 1 set.')
      .max(5, 'Máximo 5 sets.'),
    // Cómo se decide la clasificación: por sets, solo por juegos, o ambos.
    rankingBy: z.enum(['sets', 'games', 'both']).default('sets'),
    // Sanción por inasistencia: juegos en contra que se asignan a quien no se
    // presenta a su jornada. Cada club fija su política (9 por defecto).
    noShowGamesAgainst: z.coerce
      .number()
      .int()
      .min(0, 'No puede ser negativo.')
      .max(99, 'Máximo 99 juegos.')
      .default(9),
    // Costo de inscripción a la liga (opcional) y su moneda.
    entryFee: optionalFee,
    currency,
  }),
])

export type CreateEventInput = z.infer<typeof createEventSchema>
export type EventType = CreateEventInput['type']
