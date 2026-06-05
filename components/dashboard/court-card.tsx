'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { Pencil, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  COURT_SURFACES,
  courtSurfaceLabels,
  type CourtSurface,
} from '@/lib/courts'
import { CourtActions } from '@/components/dashboard/court-actions'
import {
  updateCourt,
  type CourtFormState,
} from '@/app/dashboard/pistas/actions'

const fieldCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const initialState: CourtFormState = {}

export type CourtCardData = {
  id: string
  name: string
  surface: CourtSurface
  isIndoor: boolean
  isActive: boolean
}

export function CourtCard({
  court,
  index,
}: {
  court: CourtCardData
  index: number
}) {
  const [editing, setEditing] = useState(false)

  const boundAction = useMemo(
    () => updateCourt.bind(null, court.id),
    [court.id],
  )
  const [state, formAction, pending] = useActionState(boundAction, initialState)

  useEffect(() => {
    if (state.success) setEditing(false)
  }, [state.success])

  const code = `P ${String(index + 1).padStart(2, '0')}`

  /* ---- Modo edición ---- */
  if (editing) {
    return (
      <form
        action={formAction}
        noValidate
        className="flex flex-col gap-4 rounded-xl border border-foreground/30 bg-card p-5"
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Editando · {code}
          </span>
          <button
            type="button"
            onClick={() => setEditing(false)}
            title="Cancelar"
            className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        {state.error && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}

        <div>
          <label
            htmlFor={`name-${court.id}`}
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
          >
            Nombre
          </label>
          <input
            id={`name-${court.id}`}
            name="name"
            type="text"
            defaultValue={court.name}
            className={cn('mt-1.5', fieldCls)}
            aria-invalid={!!state.fieldErrors?.name}
          />
          {state.fieldErrors?.name?.[0] && (
            <p className="mt-1 text-xs text-destructive">
              {state.fieldErrors.name[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`surface-${court.id}`}
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
          >
            Superficie
          </label>
          <select
            id={`surface-${court.id}`}
            name="surface"
            defaultValue={court.surface}
            className={cn('mt-1.5', fieldCls)}
          >
            {COURT_SURFACES.map((s) => (
              <option key={s} value={s}>
                {courtSurfaceLabels[s]}
              </option>
            ))}
          </select>
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            name="isIndoor"
            defaultChecked={court.isIndoor}
            className="size-4 rounded border-border accent-foreground"
          />
          Pista cubierta (indoor)
        </label>

        <div className="flex items-center gap-2 border-t border-border pt-4">
          <Button
            type="submit"
            className="h-8 rounded-md px-3 text-sm"
            disabled={pending}
          >
            {pending ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-8 rounded-md px-3 text-sm text-muted-foreground"
            onClick={() => setEditing(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
        </div>
      </form>
    )
  }

  /* ---- Modo vista ---- */
  return (
    <div
      className={cn(
        'flex min-h-[132px] flex-col justify-between rounded-xl border bg-card p-5 transition-colors',
        court.isActive ? 'border-border' : 'border-border bg-muted/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {code}
        </span>
        <span
          className={cn(
            'flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest',
            court.isActive ? 'text-forest' : 'text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              court.isActive ? 'bg-forest' : 'bg-muted-foreground',
            )}
          />
          {court.isActive ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      <div>
        <p
          className={cn(
            'font-serif text-2xl leading-none tracking-tight',
            court.isActive ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {court.name}
        </p>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {courtSurfaceLabels[court.surface]}
          {' · '}
          {court.isIndoor ? 'Cubierta' : 'Exterior'}
        </p>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Editar pista"
          className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Pencil className="size-4" strokeWidth={2} />
        </button>
        <CourtActions courtId={court.id} isActive={court.isActive} />
      </div>
    </div>
  )
}
