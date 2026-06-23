'use client'

import { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'
import { currencyOptions } from '@/lib/money'
import {
  DEFAULT_PAYMENT_METHOD,
  DEFAULT_RESERVATION_MINUTES,
  DURATION_OPTIONS,
  PAYMENT_METHODS,
  paymentMethodLabels,
  paymentStatusLabels,
  RESERVATION_PAYMENT_STATUSES,
  reservationTimeSlots,
  type PaymentMethod,
  type ReservationKind,
  type ReservationPaymentStatus,
  type WeekHours,
} from '@/lib/reservations'

export type ReservationFieldErrors = Partial<
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
    | 'paymentMethod'
    | 'price'
    | 'amountPaid'
    | 'currency'
    | 'notes',
    string[]
  >
>

export type ReservationDefaults = {
  courtId?: string
  kind?: ReservationKind
  coachId?: string | null
  playerCount?: number | null
  holderName?: string
  phone?: string | null
  date?: string
  time?: string
  durationMinutes?: number
  paymentStatus?: ReservationPaymentStatus
  paymentMethod?: PaymentMethod | null
  price?: number | null
  amountPaid?: number | null
  currency?: string
  notes?: string | null
}

/** Tarifario de clases del club: precio sugerido por nº de jugadores (1–4). */
export type ClassPrices = {
  currency: string
  /** `byCount[n]` = precio para n jugadores (n = 1..4); null = sin definir. */
  byCount: (number | null)[]
}

export type CoachOption = { id: string; name: string }

const fieldCls =
  'h-10 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const labelCls =
  'font-mono text-[10px] uppercase tracking-widest text-muted-foreground'

function FieldErr({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null
  return <p className="mt-1.5 text-xs text-destructive">{messages[0]}</p>
}

type Court = { id: string; name: string }

/**
 * Campos compartidos del formulario de reserva (alta y edición). La mayoría de
 * inputs son no controlados (`defaultValue`); el estado de cobro lo controla el
 * padre (para mostrar «Abonado» solo en abono parcial). El tipo (juego libre /
 * clase), el nº de jugadores, el precio y la moneda se controlan aquí para poder
 * prerellenar el precio según el tarifario del club cuando es una clase.
 */
export function ReservationFields({
  courts,
  coaches = [],
  classPrices = { currency: 'MXN', byCount: [] },
  weekHours,
  defaults = {},
  errors,
  payment,
  onPaymentChange,
}: {
  courts: Court[]
  coaches?: CoachOption[]
  classPrices?: ClassPrices
  // Horario del club por día de la semana. Si se pasa, la hora se restringe a la
  // franja de apertura del día elegido; si se omite, se acepta cualquier hora.
  weekHours?: WeekHours
  defaults?: ReservationDefaults
  errors?: ReservationFieldErrors
  payment: ReservationPaymentStatus
  onPaymentChange: (value: ReservationPaymentStatus) => void
}) {
  const [kind, setKind] = useState<ReservationKind>(
    defaults.kind ?? 'free_play',
  )
  // Fecha controlada para recalcular las horas válidas según el día elegido.
  const [date, setDate] = useState<string>(defaults.date ?? '')

  // Día de la semana de la fecha elegida (0=domingo) y su franja de apertura.
  const dayOfWeek = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
    return new Date(`${date}T00:00:00`).getDay()
  }, [date])
  const dayHours =
    weekHours && dayOfWeek != null ? (weekHours[dayOfWeek] ?? null) : null
  // Horas de inicio ofrecidas (más la hora ya guardada al editar, por si cae
  // fuera de la rejilla).
  const timeSlots = useMemo(
    () =>
      dayHours
        ? reservationTimeSlots(dayHours, { include: defaults.time })
        : [],
    [dayHours, defaults.time],
  )
  const [playerCount, setPlayerCount] = useState<number>(
    defaults.playerCount ?? 1,
  )
  const [price, setPrice] = useState<string>(
    defaults.price != null ? String(defaults.price) : '',
  )
  const [currency, setCurrency] = useState<string>(
    defaults.currency ?? 'MXN',
  )
  // Forma de cobro. Se conserva aunque el campo se oculte (estado «pendiente»),
  // para no perder la elección al alternar el estado de cobro.
  const [method, setMethod] = useState<PaymentMethod>(
    defaults.paymentMethod ?? DEFAULT_PAYMENT_METHOD,
  )

  // Aplica el precio sugerido del tarifario para `count` jugadores (si existe).
  const applySuggestedPrice = (count: number) => {
    const suggested = classPrices.byCount[count]
    if (suggested != null) {
      setPrice(String(suggested))
      setCurrency(classPrices.currency)
    }
  }

  const onKindChange = (next: ReservationKind) => {
    setKind(next)
    if (next === 'class') applySuggestedPrice(playerCount)
  }

  const onPlayerCountChange = (count: number) => {
    setPlayerCount(count)
    applySuggestedPrice(count)
  }

  return (
    <>
      {/* Tipo de reserva */}
      <input type="hidden" name="kind" value={kind} />
      <div>
        <span className={labelCls}>Tipo</span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(['free_play', 'class'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onKindChange(k)}
              aria-pressed={kind === k}
              className={cn(
                'h-10 rounded-md border text-sm transition-colors',
                kind === k
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-input/30 text-muted-foreground hover:bg-muted/50',
              )}
            >
              {k === 'free_play' ? 'Juego libre' : 'Clase'}
            </button>
          ))}
        </div>
      </div>

      {/* Coach + nº de jugadores (solo en clase) */}
      {kind === 'class' && (
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div>
            <label htmlFor="coachId" className={labelCls}>
              Coach
            </label>
            <select
              id="coachId"
              name="coachId"
              defaultValue={defaults.coachId ?? ''}
              className={cn('mt-2', fieldCls)}
              aria-invalid={!!errors?.coachId}
            >
              <option value="">Elegir coach…</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldErr messages={errors?.coachId} />
            {coaches.length === 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                No hay coaches. Regístralos en la sección Coaches.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="playerCount" className={labelCls}>
              Jugadores
            </label>
            <select
              id="playerCount"
              name="playerCount"
              value={playerCount}
              onChange={(e) => onPlayerCountChange(Number(e.target.value))}
              className={cn('mt-2', fieldCls)}
              aria-invalid={!!errors?.playerCount}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <FieldErr messages={errors?.playerCount} />
          </div>
        </div>
      )}

      {/* Titular */}
      <div>
        <label htmlFor="holderName" className={labelCls}>
          A nombre de
        </label>
        <input
          id="holderName"
          name="holderName"
          type="text"
          placeholder="Ej. Juan Pérez"
          defaultValue={defaults.holderName ?? ''}
          className={cn('mt-2', fieldCls)}
          aria-invalid={!!errors?.holderName}
        />
        <FieldErr messages={errors?.holderName} />
      </div>

      {/* Pista + teléfono */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="courtId" className={labelCls}>
            Pista
          </label>
          <select
            id="courtId"
            name="courtId"
            defaultValue={defaults.courtId ?? courts[0]?.id}
            className={cn('mt-2', fieldCls)}
            aria-invalid={!!errors?.courtId}
          >
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldErr messages={errors?.courtId} />
        </div>
        <div>
          <label htmlFor="phone" className={labelCls}>
            Teléfono <span className="text-muted-foreground/70">(opcional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="55 1234 5678"
            defaultValue={defaults.phone ?? ''}
            className={cn('mt-2', fieldCls)}
            aria-invalid={!!errors?.phone}
          />
          <FieldErr messages={errors?.phone} />
        </div>
      </div>

      {/* Fecha + hora + duración */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="date" className={labelCls}>
            Fecha
          </label>
          <input
            id="date"
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn('mt-2', fieldCls)}
            aria-invalid={!!errors?.date}
          />
          <FieldErr messages={errors?.date} />
        </div>
        <div>
          <label htmlFor="time" className={labelCls}>
            Hora
          </label>
          {!weekHours ? (
            // Sin horario configurado: se acepta cualquier hora.
            <input
              id="time"
              name="time"
              type="time"
              defaultValue={defaults.time}
              className={cn('mt-2', fieldCls)}
              aria-invalid={!!errors?.time}
            />
          ) : dayHours ? (
            // Solo las horas dentro de la franja del club ese día. La `key` por
            // día reinicia la elección cuando cambia la fecha (otra franja).
            <select
              key={`time-${dayOfWeek}`}
              id="time"
              name="time"
              defaultValue={defaults.time ?? ''}
              className={cn('mt-2', fieldCls)}
              aria-invalid={!!errors?.time}
            >
              <option value="">Elige hora…</option>
              {timeSlots.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            // El club cierra ese día: no hay horas válidas que ofrecer.
            <select
              id="time"
              name="time"
              disabled
              defaultValue=""
              className={cn('mt-2', fieldCls)}
            >
              <option value="">—</option>
            </select>
          )}
          {dayHours ? (
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
              {dayHours.openTime}–{dayHours.closeTime}
            </p>
          ) : weekHours ? (
            <p className="mt-1.5 text-xs text-muted-foreground">
              El club cierra este día.
            </p>
          ) : null}
          <FieldErr messages={errors?.time} />
        </div>
        <div>
          <label htmlFor="durationMinutes" className={labelCls}>
            Duración
          </label>
          <select
            id="durationMinutes"
            name="durationMinutes"
            defaultValue={defaults.durationMinutes ?? DEFAULT_RESERVATION_MINUTES}
            className={cn('mt-2', fieldCls)}
            aria-invalid={!!errors?.durationMinutes}
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d.minutes} value={d.minutes}>
                {d.label}
              </option>
            ))}
          </select>
          <FieldErr messages={errors?.durationMinutes} />
        </div>
      </div>

      {/* Cobro */}
      <fieldset className="rounded-lg border border-border p-4">
        <legend className="px-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Cobro
        </legend>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="paymentStatus" className={labelCls}>
              Estado
            </label>
            <select
              id="paymentStatus"
              name="paymentStatus"
              value={payment}
              onChange={(e) =>
                onPaymentChange(e.target.value as ReservationPaymentStatus)
              }
              className={cn('mt-2', fieldCls)}
            >
              {RESERVATION_PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {paymentStatusLabels[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="currency" className={labelCls}>
              Moneda
            </label>
            <select
              id="currency"
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={cn('mt-2', fieldCls)}
            >
              {currencyOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Método de cobro: solo cuando hay un importe abonado (no «pendiente»). */}
        {payment !== 'pending' && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="paymentMethod" className={labelCls}>
                Método
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className={cn('mt-2', fieldCls)}
                aria-invalid={!!errors?.paymentMethod}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {paymentMethodLabels[m]}
                  </option>
                ))}
              </select>
              <FieldErr messages={errors?.paymentMethod} />
            </div>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="price" className={labelCls}>
              Precio total{' '}
              <span className="text-muted-foreground/70">(opcional)</span>
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={cn('mt-2', fieldCls)}
              aria-invalid={!!errors?.price}
            />
            <FieldErr messages={errors?.price} />
          </div>
          {/* El abono solo aplica cuando el estado es «Abono parcial». */}
          {payment === 'partial' && (
            <div>
              <label htmlFor="amountPaid" className={labelCls}>
                Abonado
              </label>
              <input
                id="amountPaid"
                name="amountPaid"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                defaultValue={defaults.amountPaid ?? ''}
                className={cn('mt-2', fieldCls)}
                aria-invalid={!!errors?.amountPaid}
              />
              <FieldErr messages={errors?.amountPaid} />
            </div>
          )}
        </div>
      </fieldset>

      {/* Notas */}
      <div>
        <label htmlFor="notes" className={labelCls}>
          Notas <span className="text-muted-foreground/70">(opcional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Clase con coach, trae invitados…"
          defaultValue={defaults.notes ?? ''}
          className="mt-2 w-full resize-none rounded-md border border-border bg-input/30 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-invalid={!!errors?.notes}
        />
        <FieldErr messages={errors?.notes} />
      </div>
    </>
  )
}
