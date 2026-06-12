'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import { DEFAULT_MATCH_MINUTES, leagueStaggerSlot } from '@/lib/league-rules'
import { createReservationSchema } from '@/lib/validations/reservation'

/** Date local → "HH:MM" para mensajes de conflicto. */
function hhmm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`
}

/** ¿Se solapan los intervalos [aStart, aEnd) y [bStart, bEnd)? (ms) */
function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd
}

export type ReservationFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<
    Record<
      | 'courtId'
      | 'holderName'
      | 'phone'
      | 'date'
      | 'time'
      | 'durationMinutes'
      | 'paymentStatus'
      | 'price'
      | 'amountPaid'
      | 'currency'
      | 'notes',
      string[]
    >
  >
}

/**
 * Normaliza el importe abonado según el estado de cobro elegido:
 *  · pagado   → se abona el total (price); si no hay precio, lo introducido.
 *  · pendiente → 0.
 *  · parcial  → lo que se haya escrito en "abonado".
 */
function resolveAmountPaid(
  status: 'paid' | 'pending' | 'partial',
  price: number | undefined,
  amountPaid: number | undefined,
): number {
  if (status === 'pending') return 0
  if (status === 'paid') return price ?? amountPaid ?? 0
  return amountPaid ?? 0
}

export async function createReservation(
  _prevState: ReservationFormState,
  formData: FormData,
): Promise<ReservationFormState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const parsed = createReservationSchema.safeParse({
    courtId: formData.get('courtId'),
    holderName: formData.get('holderName'),
    phone: formData.get('phone'),
    date: formData.get('date'),
    time: formData.get('time'),
    durationMinutes: formData.get('durationMinutes'),
    paymentStatus: formData.get('paymentStatus'),
    price: formData.get('price'),
    amountPaid: formData.get('amountPaid'),
    currency: formData.get('currency'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const d = parsed.data

  // La pista debe pertenecer al club que administras.
  const court = await prisma.court.findFirst({
    where: { id: d.courtId, clubId: club.id },
    select: { id: true },
  })
  if (!court) return { fieldErrors: { courtId: ['Pista no válida.'] } }

  // Hora local del club (consistente con el resto de la programación, que lee
  // scheduledAt en hora local sin conversión de zona horaria).
  const startAt = new Date(`${d.date}T${d.time}:00`)
  if (Number.isNaN(startAt.getTime())) {
    return { fieldErrors: { date: ['Fecha u hora inválida.'] } }
  }

  // Validación de solape: la pista no puede estar ocupada por otra reserva
  // vigente ni por un partido durante la ventana de la nueva reserva. Se acota
  // al día natural de la reserva (las ventanas no cruzan la medianoche).
  const newStart = startAt.getTime()
  const newEnd = newStart + d.durationMinutes * 60_000
  const dayStart = new Date(startAt)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const [otherReservations, dayMatches] = await Promise.all([
    prisma.courtReservation.findMany({
      where: {
        courtId: d.courtId,
        status: 'confirmed',
        startAt: { gte: dayStart, lt: dayEnd },
      },
      select: { startAt: true, durationMinutes: true, holderName: true },
    }),
    prisma.match.findMany({
      where: {
        courtId: d.courtId,
        scheduledAt: { gte: dayStart, lt: dayEnd },
        status: { notIn: ['cancelled'] },
      },
      select: {
        scheduledAt: true,
        durationMinutes: true,
        leagueId: true,
        intraGroupOrder: true,
        league: { select: { playKind: true } },
      },
    }),
  ])

  for (const r of otherReservations) {
    const s = r.startAt.getTime()
    const e = s + r.durationMinutes * 60_000
    if (overlaps(newStart, newEnd, s, e)) {
      return {
        error: `Esa pista ya tiene una reserva de ${r.holderName} a las ${hhmm(
          r.startAt,
        )}. Elige otra hora o pista.`,
      }
    }
  }

  for (const m of dayMatches) {
    if (!m.scheduledAt) continue
    const slot = m.leagueId
      ? leagueStaggerSlot(m.league?.playKind, m.intraGroupOrder)
      : 0
    const durMin = m.durationMinutes ?? DEFAULT_MATCH_MINUTES
    const s = m.scheduledAt.getTime() + slot * durMin * 60_000
    const e = s + durMin * 60_000
    if (overlaps(newStart, newEnd, s, e)) {
      return {
        error: `Esa pista tiene un partido programado a las ${hhmm(
          new Date(s),
        )}. Elige otra hora o pista.`,
      }
    }
  }

  await prisma.courtReservation.create({
    data: {
      clubId: club.id,
      courtId: d.courtId,
      holderName: d.holderName,
      phone: d.phone,
      startAt,
      durationMinutes: d.durationMinutes,
      paymentStatus: d.paymentStatus,
      price: d.price,
      amountPaid: resolveAmountPaid(d.paymentStatus, d.price, d.amountPaid),
      currency: d.currency,
      notes: d.notes,
    },
  })

  revalidatePath('/dashboard/programacion')
  return { success: true }
}

/** Marca una reserva como pagada por completo (abona el total). */
export async function markReservationPaid(reservationId: string) {
  const club = await getManagedClub()
  if (!club) return
  const reservation = await prisma.courtReservation.findFirst({
    where: { id: reservationId, clubId: club.id },
    select: { price: true, amountPaid: true },
  })
  if (!reservation) return
  await prisma.courtReservation.update({
    where: { id: reservationId },
    data: {
      paymentStatus: 'paid',
      // Si hay precio, se salda completo; si no, se conserva lo abonado.
      amountPaid: reservation.price ?? reservation.amountPaid,
    },
  })
  revalidatePath('/dashboard/programacion')
}

/** Cancela una reserva sin borrarla (conserva el registro de cobro). */
export async function cancelReservation(reservationId: string) {
  const club = await getManagedClub()
  if (!club) return
  await prisma.courtReservation.updateMany({
    where: { id: reservationId, clubId: club.id },
    data: { status: 'cancelled' },
  })
  revalidatePath('/dashboard/programacion')
}

/** Elimina definitivamente una reserva. */
export async function deleteReservation(reservationId: string) {
  const club = await getManagedClub()
  if (!club) return
  await prisma.courtReservation.deleteMany({
    where: { id: reservationId, clubId: club.id },
  })
  revalidatePath('/dashboard/programacion')
}
