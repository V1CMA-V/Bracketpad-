'use client'

import { useActionState, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { currencyOptions } from '@/lib/money'
import {
  updateClassPricing,
  type ClassPricingState,
} from '@/app/dashboard/ajustes/actions'

const initialState: ClassPricingState = {}

const fieldCls =
  'h-10 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const labelCls =
  'font-mono text-[10px] uppercase tracking-widest text-muted-foreground'

export type ClassPricingDefaults = {
  price1: number | null
  price2: number | null
  price3: number | null
  price4: number | null
  currency: string
}

function PriceField({
  n,
  defaultValue,
  error,
}: {
  n: number
  defaultValue: number | null
  error?: string[]
}) {
  return (
    <div>
      <label htmlFor={`price${n}`} className={labelCls}>
        {n} {n === 1 ? 'jugador' : 'jugadores'}
      </label>
      <input
        id={`price${n}`}
        name={`price${n}`}
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        placeholder="0.00"
        defaultValue={defaultValue ?? ''}
        className={cn('mt-2', fieldCls)}
        aria-invalid={!!error}
      />
      {error?.length ? (
        <p className="mt-1.5 text-xs text-destructive">{error[0]}</p>
      ) : null}
    </div>
  )
}

/**
 * Tarifario de clases del club: precio por clase según cuántos jugadores asisten
 * (1–4) y la moneda. Prerellena el precio al reservar una clase desde la
 * programación. Cada importe es opcional.
 */
export function ClassPricingSettings({
  defaults,
}: {
  defaults: ClassPricingDefaults
}) {
  const [state, formAction, pending] = useActionState(
    updateClassPricing,
    initialState,
  )
  const liveRegion = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (state.success && liveRegion.current) {
      liveRegion.current.textContent = 'Tarifario guardado.'
    }
  }, [state.success])

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
        Precio por clase según cuántos jugadores asisten. Se usa para prerellenar
        el cobro al reservar una clase con coach (puedes ajustarlo en cada
        reserva).
      </p>

      <form action={formAction} noValidate className="mt-5">
        {state.error && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {state.error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PriceField n={1} defaultValue={defaults.price1} error={state.fieldErrors?.price1} />
          <PriceField n={2} defaultValue={defaults.price2} error={state.fieldErrors?.price2} />
          <PriceField n={3} defaultValue={defaults.price3} error={state.fieldErrors?.price3} />
          <PriceField n={4} defaultValue={defaults.price4} error={state.fieldErrors?.price4} />
        </div>

        <div className="mt-4 max-w-[200px]">
          <label htmlFor="currency" className={labelCls}>
            Moneda
          </label>
          <select
            id="currency"
            name="currency"
            defaultValue={defaults.currency}
            className={cn('mt-2', fieldCls)}
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
            {pending ? 'Guardando…' : 'Guardar tarifario'}
          </Button>
          <p
            ref={liveRegion}
            aria-live="polite"
            className="font-mono text-[11px] uppercase tracking-wider text-forest"
          />
        </div>
      </form>
    </section>
  )
}
