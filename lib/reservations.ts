// Reglas y etiquetas de las reservas de pista (uso privado del club).
// Sin dependencias de servidor para poder importarse desde componentes cliente.

import type { Currency } from '@/lib/money'

/** Estados de cobro de una reserva. */
export const RESERVATION_PAYMENT_STATUSES = ['paid', 'pending', 'partial'] as const
export type ReservationPaymentStatus =
  (typeof RESERVATION_PAYMENT_STATUSES)[number]

export const paymentStatusLabels: Record<ReservationPaymentStatus, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  partial: 'Abono parcial',
}

/** Forma de cobro de una reserva (cuando hay algún importe abonado). */
export const PAYMENT_METHODS = ['cash', 'card'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
}

/** Método de cobro por defecto al registrar un pago. */
export const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'cash'

/** Estado de la reserva (vigente o cancelada). */
export const RESERVATION_STATUSES = ['confirmed', 'cancelled'] as const
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number]

/** Tipo de reserva: juego libre (normal) o clase con coach. */
export const RESERVATION_KINDS = ['free_play', 'class'] as const
export type ReservationKind = (typeof RESERVATION_KINDS)[number]

export const reservationKindLabels: Record<ReservationKind, string> = {
  free_play: 'Juego libre',
  class: 'Clase',
}

/** Duración por defecto de una reserva nueva (minutos). */
export const DEFAULT_RESERVATION_MINUTES = 90

/** Duraciones ofrecidas en el formulario (minutos → etiqueta). */
export const DURATION_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 h' },
  { minutes: 90, label: '1 h 30 min' },
  { minutes: 120, label: '2 h' },
  { minutes: 150, label: '2 h 30 min' },
  { minutes: 180, label: '3 h' },
]

/** Paso (en minutos) entre las horas de inicio ofrecidas al reservar. */
export const RESERVATION_SLOT_MINUTES = 30

/** Franja horaria de un día del club. */
export type ClubDayHours = { openTime: string; closeTime: string }

/**
 * Horario del club por día de la semana: índice = `dayOfWeek` (0=domingo …
 * 6=sábado), `null` = el club cierra ese día.
 */
export type WeekHours = (ClubDayHours | null)[]

/** "HH:MM" → minutos desde medianoche, o `null` si no es válida. */
export function parseTimeToMinutes(
  hhmm: string | null | undefined,
): number | null {
  if (!hhmm) return null
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/** Minutos desde medianoche → "HH:MM". */
export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Horas de inicio ofrecidas al reservar dentro de la franja [open, close) en
 * pasos de `step` minutos. `include` (la hora de una reserva ya guardada) se
 * añade aunque caiga fuera de la rejilla para no perder el valor al editar.
 */
export function reservationTimeSlots(
  hours: ClubDayHours,
  opts: { step?: number; include?: string | null } = {},
): string[] {
  const step = opts.step ?? RESERVATION_SLOT_MINUTES
  const open = parseTimeToMinutes(hours.openTime)
  const close = parseTimeToMinutes(hours.closeTime)
  if (open == null || close == null || close <= open) return []
  const slots: string[] = []
  for (let t = open; t < close; t += step) slots.push(minutesToTime(t))
  const inc = parseTimeToMinutes(opts.include)
  if (inc != null && !slots.includes(minutesToTime(inc))) {
    slots.push(minutesToTime(inc))
    slots.sort()
  }
  return slots
}

/** "90" → "1 h 30 min" para mostrar una duración arbitraria. */
export function formatDuration(minutes: number): string {
  const known = DURATION_OPTIONS.find((d) => d.minutes === minutes)
  if (known) return known.label
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export const DEFAULT_CURRENCY: Currency = 'MXN'
