'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { currencyOptions } from '@/lib/money'
import {
  DEFAULT_RESERVATION_MINUTES,
  DURATION_OPTIONS,
  paymentStatusLabels,
  RESERVATION_PAYMENT_STATUSES,
  type ReservationPaymentStatus,
} from '@/lib/reservations'
import {
  createReservation,
  type ReservationFormState,
} from '@/app/dashboard/programacion/actions'

const initialState: ReservationFormState = {}

const fieldCls =
  'h-10 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const labelCls =
  'font-mono text-[10px] uppercase tracking-widest text-muted-foreground'

function FieldErr({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null
  return <p className="mt-1.5 text-xs text-destructive">{messages[0]}</p>
}

type Court = { id: string; name: string }

export function NewReservationButton({
  courts,
  defaultDate,
}: {
  courts: Court[]
  // Día seleccionado en la programación ("YYYY-MM-DD"), para prerellenar la fecha.
  defaultDate: string
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    createReservation,
    initialState,
  )
  const [payment, setPayment] = useState<ReservationPaymentStatus>('pending')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      setPayment('pending')
      setOpen(false)
    }
  }, [state.success])

  const noCourts = courts.length === 0

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="h-9 gap-1.5 rounded-md px-4 text-sm"
          disabled={noCourts}
          title={noCourts ? 'Añade pistas para reservar' : undefined}
        >
          <Plus className="size-4" strokeWidth={2} />
          Reserva
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="font-serif text-2xl tracking-tight">
            Nueva reserva
          </SheetTitle>
          <SheetDescription>
            Aparta una pista para juego libre. Solo necesitas el titular, la hora
            y la duración.
          </SheetDescription>
        </SheetHeader>

        <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-5 p-6">
          {state.error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
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
              className={cn('mt-2', fieldCls)}
              aria-invalid={!!state.fieldErrors?.holderName}
            />
            <FieldErr messages={state.fieldErrors?.holderName} />
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
                defaultValue={courts[0]?.id}
                className={cn('mt-2', fieldCls)}
                aria-invalid={!!state.fieldErrors?.courtId}
              >
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <FieldErr messages={state.fieldErrors?.courtId} />
            </div>
            <div>
              <label htmlFor="phone" className={labelCls}>
                Teléfono{' '}
                <span className="text-muted-foreground/70">(opcional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="55 1234 5678"
                className={cn('mt-2', fieldCls)}
                aria-invalid={!!state.fieldErrors?.phone}
              />
              <FieldErr messages={state.fieldErrors?.phone} />
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
                defaultValue={defaultDate}
                className={cn('mt-2', fieldCls)}
                aria-invalid={!!state.fieldErrors?.date}
              />
              <FieldErr messages={state.fieldErrors?.date} />
            </div>
            <div>
              <label htmlFor="time" className={labelCls}>
                Hora
              </label>
              <input
                id="time"
                name="time"
                type="time"
                className={cn('mt-2', fieldCls)}
                aria-invalid={!!state.fieldErrors?.time}
              />
              <FieldErr messages={state.fieldErrors?.time} />
            </div>
            <div>
              <label htmlFor="durationMinutes" className={labelCls}>
                Duración
              </label>
              <select
                id="durationMinutes"
                name="durationMinutes"
                defaultValue={DEFAULT_RESERVATION_MINUTES}
                className={cn('mt-2', fieldCls)}
                aria-invalid={!!state.fieldErrors?.durationMinutes}
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.minutes} value={d.minutes}>
                    {d.label}
                  </option>
                ))}
              </select>
              <FieldErr messages={state.fieldErrors?.durationMinutes} />
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
                    setPayment(e.target.value as ReservationPaymentStatus)
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
                  defaultValue="MXN"
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
                  className={cn('mt-2', fieldCls)}
                  aria-invalid={!!state.fieldErrors?.price}
                />
                <FieldErr messages={state.fieldErrors?.price} />
              </div>
              {/* El abono solo aplica cuando el estado es "Abono parcial". */}
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
                    className={cn('mt-2', fieldCls)}
                    aria-invalid={!!state.fieldErrors?.amountPaid}
                  />
                  <FieldErr messages={state.fieldErrors?.amountPaid} />
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
              className={cn(
                'mt-2 w-full resize-none rounded-md border border-border bg-input/30 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              )}
              aria-invalid={!!state.fieldErrors?.notes}
            />
            <FieldErr messages={state.fieldErrors?.notes} />
          </div>

          <div className="flex items-center gap-3 border-t border-border pt-5">
            <Button
              type="submit"
              className="h-9 rounded-md px-4 text-sm"
              disabled={pending}
            >
              {pending ? 'Guardando…' : 'Guardar reserva'}
            </Button>
            <SheetClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-md px-4 text-sm"
              >
                Cancelar
              </Button>
            </SheetClose>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
