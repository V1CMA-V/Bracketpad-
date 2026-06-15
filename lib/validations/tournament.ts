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

const currency = z.enum(['MXN', 'USD', 'EUR']).default('MXN')

// Importe opcional (el vacío se trata como «sin definir»).
const optionalFee = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : v),
  z.coerce
    .number()
    .min(0, 'El costo no puede ser negativo.')
    .max(1_000_000, 'El costo es demasiado alto.')
    .optional(),
)

/** Entero opcional desde un input de texto (vacío → undefined). */
function optionalInt(opts: { min: number; max: number; msg?: string }) {
  return z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce
      .number()
      .int()
      .min(opts.min, opts.msg)
      .max(opts.max, opts.msg)
      .optional(),
  )
}

const gender = z.enum(['M', 'F', 'mixed']).default('mixed')

const skillLevel = z
  .enum(['unranked', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth'])
  .default('unranked')

const drawType = z.enum(
  ['single_elim', 'double_elim', 'round_robin', 'groups_playoff'],
  { error: 'Elige un sistema de clasificación.' },
)

/* -------------------------------------------------------------------------- */
/*  Categoría                                                                 */
/* -------------------------------------------------------------------------- */

export const categorySchema = z.object({
  name,
  gender,
  skillLevel,
  drawType,
  // Cupo máximo de parejas inscritas (opcional).
  maxTeams: optionalInt({
    min: 2,
    max: 256,
    msg: 'El cupo debe estar entre 2 y 256 parejas.',
  }),
  bestOfSets: z.coerce
    .number()
    .int()
    .min(1, 'Mínimo 1 set.')
    .max(5, 'Máximo 5 sets.')
    .default(3),
  goldenPoint: z.boolean().default(true),
  tiebreakAt: z.coerce
    .number()
    .int()
    .min(1, 'Mínimo 1 juego.')
    .max(20, 'Máximo 20 juegos.')
    .default(6),
  // Fase de grupos (solo se guardan cuando drawType = groups_playoff).
  teamsPerGroup: optionalInt({
    min: 3,
    max: 16,
    msg: 'Entre 3 y 16 parejas por grupo.',
  }),
  advancePerGroup: optionalInt({
    min: 1,
    max: 8,
    msg: 'Entre 1 y 8 parejas avanzan por grupo.',
  }),
  prize: z.string().trim().max(1000, 'El premio es demasiado largo.').optional(),
  entryFee: optionalFee,
  currency,
})

export type CategoryInput = z.infer<typeof categorySchema>

/* -------------------------------------------------------------------------- */
/*  Torneo (edición de datos básicos)                                         */
/* -------------------------------------------------------------------------- */

export const updateTournamentSchema = z.object({
  name,
  status: z.enum([
    'draft',
    'registration_open',
    'in_progress',
    'finished',
    'archived',
  ]),
  startDate: optionalDate,
  endDate: optionalDate,
  location: z
    .string()
    .trim()
    .max(120, 'La ubicación es demasiado larga.')
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, 'La descripción es demasiado larga.')
    .optional(),
})

export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>
