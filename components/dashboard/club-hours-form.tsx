'use client'

import { useActionState, useState } from 'react'
import { Clock } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  updateClubHours,
  type ClubHoursState,
} from '@/app/dashboard/pistas/actions'

const fieldCls =
  'h-9 rounded-md border border-border bg-input/30 px-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'

const labelCls =
  'font-mono text-[10px] uppercase tracking-widest text-muted-foreground'

const initialState: ClubHoursState = {}

// Orden de presentación: lunes → domingo (índice = dayOfWeek; 0=domingo).
const weekOrder = [1, 2, 3, 4, 5, 6, 0]
const weekdayNames = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

type DayHours = { dayOfWeek: number; openTime: string; closeTime: string }
type DayState = { closed: boolean; open: string; close: string }

/**
 * Editor del horario del club por día de la semana. Cada día puede tener su
 * propia franja (entre semana vs. fin de semana) o estar cerrado. Es el rango
 * que usa la programación de pistas.
 */
export function ClubHoursForm({ hours }: { hours: DayHours[] }) {
  const [state, formAction, pending] = useActionState(
    updateClubHours,
    initialState,
  )

  // Estado inicial por día a partir de las filas guardadas.
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]))
  const [days, setDays] = useState<DayState[]>(() =>
    Array.from({ length: 7 }, (_, d) => {
      const h = byDay.get(d)
      return h
        ? { closed: false, open: h.openTime, close: h.closeTime }
        : { closed: true, open: '', close: '' }
    }),
  )

  const update = (d: number, patch: Partial<DayState>) =>
    setDays((prev) => prev.map((x, i) => (i === d ? { ...x, ...patch } : x)))

  // Al abrir un día sin horas, prefija una franja por defecto.
  const setClosed = (d: number, closed: boolean) =>
    update(
      d,
      closed
        ? { closed: true }
        : {
            closed: false,
            open: days[d].open || '07:00',
            close: days[d].close || '23:00',
          },
    )

  // Copia la franja del primer día abierto al resto de días abiertos.
  const applyToAll = () => {
    const ref = days.find((x) => !x.closed)
    if (!ref) return
    setDays((prev) =>
      prev.map((x) =>
        x.closed ? x : { ...x, open: ref.open, close: ref.close },
      ),
    )
  }

  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <p className={labelCls}>Horario del club</p>
        </div>
        <button
          type="button"
          onClick={applyToAll}
          className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
        >
          Copiar al resto de días
        </button>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        Define la franja de juego de cada día (puede variar entre semana y fin de
        semana). Es el rango horario que muestra la programación de pistas.
      </p>

      <form action={formAction} className="mt-4">
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {weekOrder.map((d) => {
            const day = days[d]
            return (
              <div
                key={d}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5"
              >
                <span className="w-24 shrink-0 text-sm text-foreground">
                  {weekdayNames[d]}
                </span>

                {/* Inputs ocultos para enviar el estado de cada día */}
                {day.closed && (
                  <input type="hidden" name={`closed-${d}`} value="on" />
                )}

                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={day.closed}
                    onChange={(e) => setClosed(d, e.target.checked)}
                    className="size-4 rounded border-border accent-terracotta"
                  />
                  Cerrado
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    name={`open-${d}`}
                    value={day.open}
                    disabled={day.closed}
                    onChange={(e) => update(d, { open: e.target.value })}
                    className={cn(fieldCls, 'w-28')}
                  />
                  <span className="text-xs text-muted-foreground">a</span>
                  <input
                    type="time"
                    name={`close-${d}`}
                    value={day.close}
                    disabled={day.closed}
                    onChange={(e) => update(d, { close: e.target.value })}
                    className={cn(fieldCls, 'w-28')}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button
            type="submit"
            variant="outline"
            className="h-9 rounded-md px-4 text-sm"
            disabled={pending}
          >
            {pending ? 'Guardando…' : 'Guardar horario'}
          </Button>
          {state.error && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}
          {state.success && !pending && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-forest">
              Guardado
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
