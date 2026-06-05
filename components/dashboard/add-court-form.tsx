'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { COURT_SURFACES, courtSurfaceLabels } from '@/lib/courts'
import {
  createCourt,
  type CourtFormState,
} from '@/app/dashboard/pistas/actions'

const initialState: CourtFormState = {}

const fieldCls =
  'h-10 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

function FieldErr({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null
  return <p className="mt-1.5 text-xs text-destructive">{messages[0]}</p>
}

export function AddCourtForm() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createCourt, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      setOpen(false)
    }
  }, [state.success])

  return (
    <section
      id="nueva-pista"
      className="mt-6 scroll-mt-24 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Gestión · pistas del club
          </p>
          <h2 className="mt-0.5 font-serif text-2xl tracking-tight text-foreground">
            {open ? 'Nueva pista' : 'Agregar una pista'}
          </h2>
        </div>
        <Button
          type="button"
          variant={open ? 'ghost' : 'default'}
          className="h-9 gap-1.5 rounded-md px-4 text-sm"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <>
              <X className="size-4" strokeWidth={2} />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="size-4" strokeWidth={2} />
              Nueva pista
            </>
          )}
        </Button>
      </div>

      {open && (
        <form ref={formRef} action={formAction} noValidate className="mt-5">
          {state.error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <label
                htmlFor="court-name"
                className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                Nombre <span className="text-muted-foreground/70">(opcional)</span>
              </label>
              <input
                id="court-name"
                name="name"
                type="text"
                placeholder="Ej. Central, Pista 1…"
                className={cn('mt-2', fieldCls)}
                aria-invalid={!!state.fieldErrors?.name}
              />
              <FieldErr messages={state.fieldErrors?.name} />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Si lo dejas vacío se nombrará automáticamente como{' '}
                <span className="text-foreground">Pista N</span>.
              </p>
            </div>

            <div>
              <label
                htmlFor="court-surface"
                className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                Superficie
              </label>
              <select
                id="court-surface"
                name="surface"
                defaultValue="glass"
                className={cn('mt-2', fieldCls)}
                aria-invalid={!!state.fieldErrors?.surface}
              >
                {COURT_SURFACES.map((s) => (
                  <option key={s} value={s}>
                    {courtSurfaceLabels[s]}
                  </option>
                ))}
              </select>
              <FieldErr messages={state.fieldErrors?.surface} />
            </div>
          </div>

          <label className="mt-5 flex w-fit cursor-pointer items-center gap-2.5 text-sm text-foreground">
            <input
              type="checkbox"
              name="isIndoor"
              className="size-4 rounded border-border accent-foreground"
            />
            Pista cubierta (indoor)
          </label>

          <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
            <Button
              type="submit"
              className="h-9 rounded-md px-4 text-sm"
              disabled={pending}
            >
              {pending ? 'Guardando…' : 'Guardar pista'}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
