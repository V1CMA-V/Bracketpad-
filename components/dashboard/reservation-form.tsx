'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'

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
import {
  ReservationFields,
  type ClassPrices,
  type CoachOption,
} from '@/components/dashboard/reservation-fields'
import {
  type ReservationPaymentStatus,
  type WeekHours,
} from '@/lib/reservations'
import {
  createReservation,
  type ReservationFormState,
} from '@/app/dashboard/programacion/actions'

const initialState: ReservationFormState = {}

type Court = { id: string; name: string }

export function NewReservationButton({
  courts,
  coaches = [],
  classPrices,
  weekHours,
  defaultDate,
}: {
  courts: Court[]
  coaches?: CoachOption[]
  classPrices?: ClassPrices
  // Horario del club por día de la semana (restringe la hora a la franja abierta).
  weekHours?: WeekHours
  // Día seleccionado en la programación ("YYYY-MM-DD"), para prerellenar la fecha.
  defaultDate: string
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    createReservation,
    initialState,
  )
  const [payment, setPayment] = useState<ReservationPaymentStatus>('pending')
  // Se incrementa al guardar para remontar los campos y limpiar su estado
  // interno controlado (tipo, coach, nº de jugadores, precio y moneda).
  const [fieldsKey, setFieldsKey] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      setPayment('pending')
      setFieldsKey((k) => k + 1)
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

        <form
          ref={formRef}
          action={formAction}
          noValidate
          className="flex flex-col gap-5 p-6"
        >
          {state.error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </div>
          )}

          <ReservationFields
            key={fieldsKey}
            courts={courts}
            coaches={coaches}
            classPrices={classPrices}
            weekHours={weekHours}
            defaults={{ date: defaultDate }}
            errors={state.fieldErrors}
            payment={payment}
            onPaymentChange={setPayment}
          />

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
