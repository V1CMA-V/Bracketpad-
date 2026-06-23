import { z } from 'zod'

import { currencyOptions } from '@/lib/money'
import {
  PAYMENT_METHODS,
  RESERVATION_PAYMENT_STATUSES,
} from '@/lib/reservations'

const HHMM = /^\d{2}:\d{2}$/
const YMD = /^\d{4}-\d{2}-\d{2}$/

// Importe opcional ("" → undefined; texto inválido → error). Se usa para el
// precio total y lo abonado.
const moneyField = z
  .union([z.literal(''), z.coerce.number().min(0, 'Importe inválido.')])
  .transform((v) => (v === '' ? undefined : v))
  .optional()

export const createReservationSchema = z
  .object({
    courtId: z.string().uuid('Elige una pista.'),
    // Tipo de reserva: juego libre (defecto) o clase con coach.
    kind: z.enum(['free_play', 'class']).default('free_play'),
    // En una clase se elige un coach del club y cuántos jugadores asisten (1–4).
    coachId: z
      .union([z.literal(''), z.string().uuid('Coach no válido.')])
      .transform((v) => (v === '' ? undefined : v))
      .optional(),
    playerCount: z
      .union([z.literal(''), z.coerce.number().int().min(1).max(4)])
      .transform((v) => (v === '' ? undefined : v))
      .optional(),
    holderName: z
      .string()
      .trim()
      .min(1, 'Indica a nombre de quién es la reserva.')
      .max(80, 'El nombre es demasiado largo.'),
    phone: z
      .string()
      .trim()
      .max(30, 'Teléfono demasiado largo.')
      .optional()
      .transform((v) => v || undefined),
    date: z.string().regex(YMD, 'Fecha inválida.'),
    time: z.string().regex(HHMM, 'Hora inválida.'),
    durationMinutes: z.coerce
      .number()
      .int()
      .min(15, 'Duración mínima 15 min.')
      .max(600, 'Duración demasiado larga.'),
    paymentStatus: z.enum(RESERVATION_PAYMENT_STATUSES),
    // Forma de cobro. Solo aplica cuando hay un importe abonado (pagado o abono
    // parcial); el action lo descarta cuando el estado es «pendiente».
    paymentMethod: z
      .union([z.literal(''), z.enum(PAYMENT_METHODS)])
      .transform((v) => (v === '' ? undefined : v))
      .optional(),
    price: moneyField,
    amountPaid: moneyField,
    currency: z.enum(currencyOptions).default('MXN'),
    notes: z
      .string()
      .trim()
      .max(500, 'La nota es demasiado larga.')
      .optional()
      .transform((v) => v || undefined),
  })
  .refine(
    // En abono parcial lo abonado no puede superar el precio total.
    (d) =>
      d.paymentStatus !== 'partial' ||
      d.price == null ||
      d.amountPaid == null ||
      d.amountPaid <= d.price,
    { path: ['amountPaid'], error: 'El abono no puede superar el total.' },
  )
  .refine(
    // Una clase exige elegir un coach.
    (d) => d.kind !== 'class' || !!d.coachId,
    { path: ['coachId'], error: 'Elige el coach de la clase.' },
  )
  .refine(
    // Una clase exige indicar cuántos jugadores asisten (1–4).
    (d) => d.kind !== 'class' || (d.playerCount != null && d.playerCount >= 1),
    { path: ['playerCount'], error: 'Indica cuántos jugadores (1–4).' },
  )

export type CreateReservationInput = z.infer<typeof createReservationSchema>
