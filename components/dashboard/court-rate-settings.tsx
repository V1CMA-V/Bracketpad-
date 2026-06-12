'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useActionState, useState } from 'react'

import {
  updateCourtRates,
  type CourtRatesState,
} from '@/app/dashboard/ajustes/actions'
import { Button } from '@/components/ui/button'
import { DAY_INITIALS, WEEK_ORDER } from '@/lib/clubs'
import { currencyOptions } from '@/lib/money'
import { cn } from '@/lib/utils'

const fieldCls =
  'h-9 rounded-md border border-border bg-input/30 px-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const labelCls =
  'font-mono text-[10px] uppercase tracking-widest text-muted-foreground'

const initialState: CourtRatesState = {}

export type CourtRate = {
  label: string | null
  days: number[]
  startTime: string
  endTime: string
  price: number
}

type RateRow = {
  label: string
  days: number[]
  startTime: string
  endTime: string
  price: string
}

function toRow(r: CourtRate): RateRow {
  return {
    label: r.label ?? '',
    days: r.days,
    startTime: r.startTime,
    endTime: r.endTime,
    price: String(r.price),
  }
}

const emptyRow: RateRow = {
  label: '',
  days: [1, 2, 3, 4, 5],
  startTime: '07:00',
  endTime: '23:00',
  price: '',
}

/**
 * Editor de tarifas de renta de pista. Cada regla cubre una franja horaria y un
 * conjunto de días con un precio por hora (p.ej. 07:00–11:00 entre semana a
 * $300, o más barato el fin de semana). Las reglas se envían serializadas como
 * JSON; el servidor sustituye todas por las recibidas.
 */
export function CourtRateSettings({
  rates,
  currency: initialCurrency,
}: {
  rates: CourtRate[]
  currency: string
}) {
  const [state, formAction, pending] = useActionState(
    updateCourtRates,
    initialState,
  )
  const [rows, setRows] = useState<RateRow[]>(() => rates.map(toRow))
  const [currency, setCurrency] = useState(initialCurrency)

  const update = (i: number, patch: Partial<RateRow>) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  const toggleDay = (i: number, day: number) =>
    setRows((prev) =>
      prev.map((r, j) => {
        if (j !== i) return r
        const has = r.days.includes(day)
        return {
          ...r,
          days: has ? r.days.filter((d) => d !== day) : [...r.days, day],
        }
      }),
    )

  const addRow = () => setRows((prev) => [...prev, { ...emptyRow }])
  const removeRow = (i: number) =>
    setRows((prev) => prev.filter((_, j) => j !== i))

  // Payload serializado: precio vacío → null para que el servidor lo rechace.
  const payload = JSON.stringify(
    rows.map((r) => ({
      label: r.label.trim() || undefined,
      days: r.days,
      startTime: r.startTime,
      endTime: r.endTime,
      price: r.price === '' ? null : Number(r.price),
    })),
  )

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
        Precio por hora de renta de pista. Crea una regla por cada franja con
        tarifa distinta (mañana, tarde, fin de semana…). Aparecen en la página
        pública del club.
      </p>

      <form action={formAction} noValidate className="mt-5">
        <input type="hidden" name="rates" value={payload} />

        {state.error && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {state.error}
          </div>
        )}

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Sin tarifas. Añade una regla para publicar el precio de renta.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {rows.map((row, i) => (
              <li
                key={i}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
                  {/* Etiqueta */}
                  <div className="min-w-[160px] flex-1">
                    <label className={labelCls}>Etiqueta (opcional)</label>
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => update(i, { label: e.target.value })}
                      placeholder="Ej. Mañana entre semana"
                      className={cn('mt-1.5 w-full', fieldCls)}
                    />
                  </div>

                  {/* Franja horaria */}
                  <div>
                    <label className={labelCls}>Franja</label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="time"
                        value={row.startTime}
                        onChange={(e) =>
                          update(i, { startTime: e.target.value })
                        }
                        className={cn(fieldCls, 'w-28')}
                      />
                      <span className="text-xs text-muted-foreground">a</span>
                      <input
                        type="time"
                        value={row.endTime}
                        onChange={(e) => update(i, { endTime: e.target.value })}
                        className={cn(fieldCls, 'w-28')}
                      />
                    </div>
                  </div>

                  {/* Precio */}
                  <div>
                    <label className={labelCls}>Precio / hora</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      value={row.price}
                      onChange={(e) => update(i, { price: e.target.value })}
                      placeholder="0.00"
                      className={cn('mt-1.5 w-28', fieldCls)}
                    />
                  </div>

                  {/* Quitar */}
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label="Quitar tarifa"
                    className="ml-auto inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                  >
                    <Trash2 className="size-4" strokeWidth={1.75} />
                  </button>
                </div>

                {/* Días */}
                <div className="mt-3">
                  <label className={labelCls}>Días</label>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {WEEK_ORDER.map((d) => {
                      const on = row.days.includes(d)
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(i, d)}
                          aria-pressed={on}
                          className={cn(
                            'inline-flex size-8 items-center justify-center rounded-md border text-xs font-medium transition-colors',
                            on
                              ? 'border-forest bg-forest text-cream'
                              : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                          )}
                        >
                          {DAY_INITIALS[d]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={addRow}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          <Plus className="size-4" strokeWidth={1.75} />
          Añadir tarifa
        </button>

        <div className="mt-5 max-w-[200px]">
          <label htmlFor="court-rate-currency" className={labelCls}>
            Moneda
          </label>
          <select
            id="court-rate-currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={cn('mt-2 h-10 w-full px-3', fieldCls)}
          >
            {currencyOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
          <Button
            type="submit"
            className="h-9 rounded-md px-4 text-sm"
            disabled={pending}
          >
            {pending ? 'Guardando…' : 'Guardar tarifas'}
          </Button>
          {state.success && !pending && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-forest">
              Tarifas guardadas
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
