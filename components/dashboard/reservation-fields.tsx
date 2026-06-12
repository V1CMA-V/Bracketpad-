'use client'

import { cn } from '@/lib/utils'
import { currencyOptions } from '@/lib/money'
import {
  DEFAULT_RESERVATION_MINUTES,
  DURATION_OPTIONS,
  paymentStatusLabels,
  RESERVATION_PAYMENT_STATUSES,
  type ReservationPaymentStatus,
} from '@/lib/reservations'

export type ReservationFieldErrors = Partial<
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

export type ReservationDefaults = {
  courtId?: string
  holderName?: string
  phone?: string | null
  date?: string
  time?: string
  durationMinutes?: number
  paymentStatus?: ReservationPaymentStatus
  price?: number | null
  amountPaid?: number | null
  currency?: string
  notes?: string | null
}

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
 * Campos compartidos del formulario de reserva (alta y edición). Los inputs son
 * no controlados (usan `defaultValue`); el estado de cobro sí es controlado por
 * el padre para mostrar el campo «Abonado» solo en abono parcial.
 */
export function ReservationFields({
  courts,
  defaults = {},
  errors,
  payment,
  onPaymentChange,
}: {
  courts: Court[]
  defaults?: ReservationDefaults
  errors?: ReservationFieldErrors
  payment: ReservationPaymentStatus
  onPaymentChange: (value: ReservationPaymentStatus) => void
}) {
  return (
    <>
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
            defaultValue={defaults.date}
            className={cn('mt-2', fieldCls)}
            aria-invalid={!!errors?.date}
          />
          <FieldErr messages={errors?.date} />
        </div>
        <div>
          <label htmlFor="time" className={labelCls}>
            Hora
          </label>
          <input
            id="time"
            name="time"
            type="time"
            defaultValue={defaults.time}
            className={cn('mt-2', fieldCls)}
            aria-invalid={!!errors?.time}
          />
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
              defaultValue={defaults.currency ?? 'MXN'}
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
              defaultValue={defaults.price ?? ''}
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
