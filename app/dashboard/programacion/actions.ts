'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getManagedClub } from '@/lib/club'
import { DEFAULT_MATCH_MINUTES, leagueStaggerSlot } from '@/lib/league-rules'
import { createReservationSchema } from '@/lib/validations/reservation'

/** Las reservas se muestran en la programación y en el resumen del club. */
function revalidateSchedules() {
  revalidatePath('/dashboard/programacion')
  revalidatePath('/dashboard')
}

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

/**
 * Busca un choque de pista para una ventana de reserva: ni otra reserva vigente
 * ni un partido pueden ocupar la misma pista durante [startAt, startAt+dur). Se
 * acota al día natural (las ventanas no cruzan la medianoche). Al editar se
 * excluye la propia reserva con `excludeReservationId`. Devuelve un mensaje de
 * conflicto o `null` si la pista está libre.
 */
async function findCourtConflict(opts: {
  courtId: string
  startAt: Date
  durationMinutes: number
  excludeReservationId?: string
}): Promise<string | null> {
  const { courtId, startAt, durationMinutes, excludeReservationId } = opts
  const newStart = startAt.getTime()
  const newEnd = newStart + durationMinutes * 60_000
  const dayStart = new Date(startAt)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const [otherReservations, dayMatches] = await Promise.all([
    prisma.courtReservation.findMany({
      where: {
        courtId,
        status: 'confirmed',
        startAt: { gte: dayStart, lt: dayEnd },
        ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
      },
      select: { startAt: true, durationMinutes: true, holderName: true },
    }),
    prisma.match.findMany({
      where: {
        courtId,
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
      return `Esa pista ya tiene una reserva de ${r.holderName} a las ${hhmm(
        r.startAt,
      )}. Elige otra hora o pista.`
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
      return `Esa pista tiene un partido programado a las ${hhmm(
        new Date(s),
      )}. Elige otra hora o pista.`
    }
  }

  return null
}

/**
 * Un coach no puede impartir dos clases solapadas a la vez (aunque sean en pistas
 * distintas). Busca otra clase del coach que pise [startAt, startAt+dur) en el día.
 * Devuelve un mensaje de conflicto o `null`.
 */
async function findCoachConflict(opts: {
  coachId: string
  startAt: Date
  durationMinutes: number
  excludeReservationId?: string
}): Promise<string | null> {
  const { coachId, startAt, durationMinutes, excludeReservationId } = opts
  const newStart = startAt.getTime()
  const newEnd = newStart + durationMinutes * 60_000
  const dayStart = new Date(startAt)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const others = await prisma.courtReservation.findMany({
    where: {
      coachId,
      status: 'confirmed',
      startAt: { gte: dayStart, lt: dayEnd },
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
    },
    select: { startAt: true, durationMinutes: true },
  })
  for (const r of others) {
    const s = r.startAt.getTime()
    const e = s + r.durationMinutes * 60_000
    if (overlaps(newStart, newEnd, s, e)) {
      return `El coach ya tiene una clase a las ${hhmm(
        r.startAt,
      )}. Elige otra hora.`
    }
  }
  return null
}

export type ReservationFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<
    Record<
      | 'courtId'
      | 'kind'
      | 'coachId'
      | 'playerCount'
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

/**
 * Valida los campos de clase: el coach pertenece al club y no tiene otra clase
 * solapada. Devuelve los valores a persistir (`coachId`/`playerCount`) o un
 * estado de error. En juego libre devuelve ambos nulos.
 */
async function resolveClassFields(
  d: { kind: 'free_play' | 'class'; coachId?: string; playerCount?: number },
  clubId: string,
  startAt: Date,
  durationMinutes: number,
  excludeReservationId?: string,
): Promise<
  | { error: ReservationFormState }
  | { coachId: string | null; playerCount: number | null }
> {
  if (d.kind !== 'class') return { coachId: null, playerCount: null }
  // El schema ya garantiza coachId/playerCount presentes cuando kind = class.
  const coach = await prisma.coach.findFirst({
    where: { id: d.coachId, clubId },
    select: { id: true },
  })
  if (!coach) {
    return { error: { fieldErrors: { coachId: ['Coach no válido.'] } } }
  }
  const conflict = await findCoachConflict({
    coachId: d.coachId!,
    startAt,
    durationMinutes,
    excludeReservationId,
  })
  if (conflict) return { error: { error: conflict } }
  return { coachId: d.coachId!, playerCount: d.playerCount ?? null }
}

/** Lee y valida los campos de reserva de un FormData. */
function parseReservationForm(formData: FormData) {
  return createReservationSchema.safeParse({
    courtId: formData.get('courtId'),
    kind: formData.get('kind'),
    coachId: formData.get('coachId'),
    playerCount: formData.get('playerCount'),
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
}

export async function createReservation(
  _prevState: ReservationFormState,
  formData: FormData,
): Promise<ReservationFormState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  const parsed = parseReservationForm(formData)
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

  const conflict = await findCourtConflict({
    courtId: d.courtId,
    startAt,
    durationMinutes: d.durationMinutes,
  })
  if (conflict) return { error: conflict }

  const cls = await resolveClassFields(d, club.id, startAt, d.durationMinutes)
  if ('error' in cls) return cls.error

  await prisma.courtReservation.create({
    data: {
      clubId: club.id,
      courtId: d.courtId,
      kind: d.kind,
      coachId: cls.coachId,
      playerCount: cls.playerCount,
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

  revalidateSchedules()
  return { success: true }
}

/** Edita una reserva existente (titular, pista, hora, duración, cobro, notas). */
export async function updateReservation(
  reservationId: string,
  _prevState: ReservationFormState,
  formData: FormData,
): Promise<ReservationFormState> {
  const club = await getManagedClub()
  if (!club) return { error: 'No administras ningún club.' }

  // La reserva debe existir y pertenecer al club.
  const existing = await prisma.courtReservation.findFirst({
    where: { id: reservationId, clubId: club.id },
    select: { id: true },
  })
  if (!existing) return { error: 'No se encontró la reserva.' }

  const parsed = parseReservationForm(formData)
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  const d = parsed.data

  const court = await prisma.court.findFirst({
    where: { id: d.courtId, clubId: club.id },
    select: { id: true },
  })
  if (!court) return { fieldErrors: { courtId: ['Pista no válida.'] } }

  const startAt = new Date(`${d.date}T${d.time}:00`)
  if (Number.isNaN(startAt.getTime())) {
    return { fieldErrors: { date: ['Fecha u hora inválida.'] } }
  }

  // Se excluye la propia reserva del chequeo de solape.
  const conflict = await findCourtConflict({
    courtId: d.courtId,
    startAt,
    durationMinutes: d.durationMinutes,
    excludeReservationId: reservationId,
  })
  if (conflict) return { error: conflict }

  const cls = await resolveClassFields(
    d,
    club.id,
    startAt,
    d.durationMinutes,
    reservationId,
  )
  if ('error' in cls) return cls.error

  await prisma.courtReservation.update({
    where: { id: reservationId },
    data: {
      courtId: d.courtId,
      kind: d.kind,
      coachId: cls.coachId,
      playerCount: cls.playerCount,
      holderName: d.holderName,
      phone: d.phone ?? null,
      startAt,
      durationMinutes: d.durationMinutes,
      paymentStatus: d.paymentStatus,
      price: d.price ?? null,
      amountPaid: resolveAmountPaid(d.paymentStatus, d.price, d.amountPaid),
      currency: d.currency,
      notes: d.notes ?? null,
    },
  })

  revalidateSchedules()
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
  revalidateSchedules()
}

/** Cancela una reserva sin borrarla (conserva el registro de cobro). */
export async function cancelReservation(reservationId: string) {
  const club = await getManagedClub()
  if (!club) return
  await prisma.courtReservation.updateMany({
    where: { id: reservationId, clubId: club.id },
    data: { status: 'cancelled' },
  })
  revalidateSchedules()
}

/** Reactiva una reserva cancelada (vuelve a apartar la pista). */
export async function reactivateReservation(reservationId: string) {
  const club = await getManagedClub()
  if (!club) return
  await prisma.courtReservation.updateMany({
    where: { id: reservationId, clubId: club.id },
    data: { status: 'confirmed' },
  })
  revalidateSchedules()
}

/** Elimina definitivamente una reserva. */
export async function deleteReservation(reservationId: string) {
  const club = await getManagedClub()
  if (!club) return
  await prisma.courtReservation.deleteMany({
    where: { id: reservationId, clubId: club.id },
  })
  revalidateSchedules()
}
