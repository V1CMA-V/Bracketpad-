'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  ReservationFields,
  type ReservationDefaults,
} from '@/components/dashboard/reservation-fields'
import { type ReservationPaymentStatus } from '@/lib/reservations'
import {
  cancelReservation,
  deleteReservation,
  reactivateReservation,
  updateReservation,
  type ReservationFormState,
} from '@/app/dashboard/programacion/actions'

const initialState: ReservationFormState = {}

export type EditableReservation = ReservationDefaults & {
  id: string
  cancelled: boolean
}

type Court = { id: string; name: string }

/**
 * Panel de edición de una reserva. Se monta cuando la URL trae `?edit=<id>` y se
 * cierra volviendo a `?d=<día>`. Permite modificar todo, extender la duración,
 * cambiar de pista/hora, ajustar el cobro y cancelar / reactivar / eliminar.
 */
export function ReservationEditor({
  reservation,
  courts,
  day,
}: {
  reservation: EditableReservation
  courts: Court[]
  day: string
}) {
  const router = useRouter()
  const close = () => router.push(`/dashboard/programacion?d=${day}`)

  const action = updateReservation.bind(null, reservation.id)
  const [state, formAction, pending] = useActionState(action, initialState)
  const [payment, setPayment] = useState<ReservationPaymentStatus>(
    reservation.paymentStatus ?? 'pending',
  )
  const [actionPending, startTransition] = useTransition()

  useEffect(() => {
    if (state.success) close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success])

  const busy = pending || actionPending

  return (
    <Sheet
      open
      onOpenChange={(next) => {
        if (!next) close()
      }}
    >
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="font-serif text-2xl tracking-tight">
            Editar reserva
          </SheetTitle>
          <SheetDescription>
            Modifica los datos, extiende la duración o cámbiala de pista y hora.
          </SheetDescription>
        </SheetHeader>

        <form action={formAction} noValidate className="flex flex-col gap-5 p-6">
          {state.error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </div>
          )}

          {reservation.cancelled && (
            <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Esta reserva está <span className="text-foreground">cancelada</span>
              . Reactívala para volver a apartar la pista.
            </div>
          )}

          <ReservationFields
            courts={courts}
            defaults={reservation}
            errors={state.fieldErrors}
            payment={payment}
            onPaymentChange={setPayment}
          />

          <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                className="h-9 rounded-md px-4 text-sm"
                disabled={busy}
              >
                {pending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
              {reservation.cancelled ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 gap-1.5 rounded-md px-4 text-sm"
                  disabled={busy}
                  onClick={() =>
                    startTransition(async () => {
                      await reactivateReservation(reservation.id)
                      close()
                    })
                  }
                >
                  <RotateCcw className="size-4" />
                  Reactivar
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-md px-4 text-sm"
                  disabled={busy}
                  onClick={() =>
                    startTransition(async () => {
                      await cancelReservation(reservation.id)
                      close()
                    })
                  }
                >
                  Cancelar reserva
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              title="Eliminar reserva"
              disabled={busy}
              onClick={() =>
                startTransition(async () => {
                  await deleteReservation(reservation.id)
                  close()
                })
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
