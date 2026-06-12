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

/** Estado de la reserva (vigente o cancelada). */
export const RESERVATION_STATUSES = ['confirmed', 'cancelled'] as const
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number]

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
