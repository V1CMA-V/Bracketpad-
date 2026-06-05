'use client'

import { useActionState, useEffect, useMemo, useRef, useTransition } from 'react'
import { Plus, RotateCcw, Trash2, UserMinus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { registrationStatusLabels } from '@/lib/leagues'
import {
  registerPlayer,
  removeRegistration,
  setRegistrationStatus,
  type RegistrationState,
} from '@/app/dashboard/ligas/[id]/actions'

const fieldCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const initialState: RegistrationState = {}

export type RegistrationItem = {
  id: string
  name: string
  division: string | null
  seed: number | null
  status: string
}

function RegistrationRow({
  reg,
  index,
}: {
  reg: RegistrationItem
  index: number
}) {
  const [pending, startTransition] = useTransition()
  const withdrawn = reg.status === 'withdrawn'

  const toggle = () =>
    startTransition(() => {
      void setRegistrationStatus(reg.id, withdrawn ? 'active' : 'withdrawn')
    })

  const remove = () => {
    if (!confirm(`¿Eliminar la inscripción de ${reg.name}?`)) return
    startTransition(() => {
      void removeRegistration(reg.id)
    })
  }

  return (
    <li
      className={cn(
        'flex items-center gap-4 px-3 py-3',
        pending && 'opacity-50',
      )}
    >
      <span className="w-6 shrink-0 font-serif text-lg text-muted-foreground/70 tabular-nums">
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm',
            withdrawn ? 'text-muted-foreground line-through' : 'text-foreground',
          )}
        >
          {reg.name}
        </p>
        {(reg.division || reg.seed != null) && (
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {reg.division ? `División ${reg.division}` : ''}
            {reg.division && reg.seed != null ? ' · ' : ''}
            {reg.seed != null ? `Cab. ${reg.seed}` : ''}
          </p>
        )}
      </div>

      <span
        className={cn(
          'font-mono text-[10px] uppercase tracking-widest',
          withdrawn ? 'text-muted-foreground' : 'text-forest',
        )}
      >
        {registrationStatusLabels[reg.status] ?? reg.status}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          title={withdrawn ? 'Reactivar' : 'Retirar'}
          className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          {withdrawn ? (
            <RotateCcw className="size-4" strokeWidth={2} />
          ) : (
            <UserMinus className="size-4" strokeWidth={2} />
          )}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          title="Eliminar inscripción"
          className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-terracotta/40 hover:bg-terracotta/10 hover:text-terracotta disabled:opacity-50"
        >
          <Trash2 className="size-4" strokeWidth={2} />
        </button>
      </div>
    </li>
  )
}

export function LeagueRegistrations({
  leagueId,
  registrations,
  players,
}: {
  leagueId: string
  registrations: RegistrationItem[]
  players: { id: string; name: string }[]
}) {
  const boundAction = useMemo(
    () => registerPlayer.bind(null, leagueId),
    [leagueId],
  )
  const [state, formAction, pending] = useActionState(boundAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      nameRef.current?.focus()
    }
  }, [state.success])

  // Sugerencias: jugadores del club que aún no están inscritos.
  const suggestions = useMemo(() => {
    const registered = new Set(registrations.map((r) => r.name))
    return players.filter((p) => !registered.has(p.name))
  }, [players, registrations])

  const listId = `players-${leagueId}`

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Participantes
          </p>
          <h2 className="mt-1.5 font-serif text-2xl tracking-tight text-foreground">
            Inscripciones
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
          {registrations.length} inscritos
        </span>
      </div>

      {/* Formulario de inscripción */}
      <form
        ref={formRef}
        action={formAction}
        noValidate
        className="mt-5 rounded-xl border border-border bg-card p-4"
      >
        {state.error && (
          <p className="mb-3 text-xs text-destructive">{state.error}</p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <input
              ref={nameRef}
              name="playerName"
              type="text"
              list={listId}
              placeholder="Nombre del jugador…"
              className={fieldCls}
              aria-invalid={!!state.fieldErrors?.playerName}
              autoComplete="off"
              required
            />
            <datalist id={listId}>
              {suggestions.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
            {state.fieldErrors?.playerName?.[0] && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.playerName[0]}
              </p>
            )}
          </div>
          {/* Ancho fijo: cn() deja que tailwind-merge elimine el `w-full` de
              fieldCls, así estos campos no aplastan al de nombre. */}
          <div className="flex shrink-0 flex-wrap gap-3">
            <input
              name="division"
              type="text"
              placeholder="División"
              className={cn(fieldCls, 'w-32')}
              aria-invalid={!!state.fieldErrors?.division}
            />
            <input
              name="seed"
              type="number"
              min={1}
              placeholder="Cab."
              className={cn(fieldCls, 'w-20')}
              aria-invalid={!!state.fieldErrors?.seed}
            />
            <Button
              type="submit"
              className="h-9 shrink-0 gap-1.5 rounded-md px-4 text-sm"
              disabled={pending}
            >
              <Plus className="size-4" strokeWidth={2} />
              {pending ? 'Inscribiendo…' : 'Inscribir'}
            </Button>
          </div>
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          Se reutiliza el jugador si ya existe en el club; si no, se crea.
        </p>
      </form>

      {/* Listado */}
      {registrations.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Todavía no hay inscripciones. Añade el primer jugador arriba.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {registrations.map((reg, i) => (
            <RegistrationRow key={reg.id} reg={reg} index={i} />
          ))}
        </ul>
      )}
    </section>
  )
}
