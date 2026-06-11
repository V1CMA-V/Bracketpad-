'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PlayerFields } from '@/components/dashboard/player-fields'
import {
  createPlayer,
  type PlayerFormState,
} from '@/app/dashboard/jugadores/actions'

const initialState: PlayerFormState = {}

export function AddPlayerForm() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    createPlayer,
    initialState,
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      setOpen(false)
    }
  }, [state.success])

  return (
    <section
      id="nuevo-jugador"
      className="mt-6 scroll-mt-24 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Gestión · jugadores del club
          </p>
          <h2 className="mt-0.5 font-serif text-2xl tracking-tight text-foreground">
            {open ? 'Nuevo jugador' : 'Agregar un jugador'}
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
              Nuevo jugador
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

          <PlayerFields errors={state.fieldErrors} idPrefix="new-player" />

          <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
            <Button
              type="submit"
              className="h-9 rounded-md px-4 text-sm"
              disabled={pending}
            >
              {pending ? 'Guardando…' : 'Guardar jugador'}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
