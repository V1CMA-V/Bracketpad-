'use client'

import Link from 'next/link'
import { useActionState, useEffect, useMemo, useRef, useTransition } from 'react'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  leagueRoundStatusLabels,
  leagueRoundStatusStyles,
} from '@/lib/leagues'
import {
  createRound,
  deleteRound,
  type RoundState,
} from '@/app/dashboard/ligas/[id]/actions'

const fieldCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const initialState: RoundState = {}

export type RoundItem = {
  id: string
  roundNumber: number
  name: string | null
  dateLabel: string
  matchCount: number
  status: string
}

function RoundRow({ leagueId, round }: { leagueId: string; round: RoundItem }) {
  const [pending, startTransition] = useTransition()

  const remove = () => {
    const label = round.name ?? `Jornada ${round.roundNumber}`
    const extra =
      round.matchCount > 0
        ? ` Sus ${round.matchCount} partido(s) quedarán sin jornada.`
        : ''
    if (!confirm(`¿Eliminar ${label}?${extra}`)) return
    startTransition(() => {
      void deleteRound(round.id)
    })
  }

  return (
    <li
      className={cn(
        'flex items-center gap-4 px-3 py-3',
        pending && 'opacity-50',
      )}
    >
      <Link
        href={`/dashboard/ligas/${leagueId}/jornadas/${round.id}`}
        className="flex min-w-0 flex-1 items-center gap-4"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border font-mono text-xs text-muted-foreground">
          J{round.roundNumber}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-foreground">
            {round.name ?? `Jornada ${round.roundNumber}`}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {round.dateLabel}
          </p>
        </div>
        {(() => {
          const st =
            leagueRoundStatusStyles[round.status] ??
            leagueRoundStatusStyles.draft
          return (
            <span
              className={cn(
                'flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest',
                st.text,
              )}
            >
              <span className={cn('size-1.5 rounded-full', st.dot)} />
              {leagueRoundStatusLabels[round.status] ?? round.status}
            </span>
          )
        })()}
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {round.matchCount}{' '}
          {round.matchCount === 1 ? 'partido' : 'partidos'}
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground/60"
          strokeWidth={2}
        />
      </Link>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        title="Eliminar jornada"
        className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-terracotta/40 hover:bg-terracotta/10 hover:text-terracotta disabled:opacity-50"
      >
        <Trash2 className="size-4" strokeWidth={2} />
      </button>
    </li>
  )
}

export function LeagueRounds({
  leagueId,
  rounds,
}: {
  leagueId: string
  rounds: RoundItem[]
}) {
  const boundAction = useMemo(
    () => createRound.bind(null, leagueId),
    [leagueId],
  )
  const [state, formAction, pending] = useActionState(boundAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Calendario
          </p>
          <h2 className="mt-1.5 font-serif text-2xl tracking-tight text-foreground">
            Jornadas
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
          {rounds.length} {rounds.length === 1 ? 'jornada' : 'jornadas'}
        </span>
      </div>

      {/* Crear jornada */}
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
              name="name"
              type="text"
              placeholder="Nombre (opcional, p. ej. «Jornada inaugural»)"
              className={fieldCls}
              aria-invalid={!!state.fieldErrors?.name}
              autoComplete="off"
            />
            {state.fieldErrors?.name?.[0] && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>
          <div className="sm:w-44">
            <input
              name="scheduledDate"
              type="date"
              className={fieldCls}
              aria-invalid={!!state.fieldErrors?.scheduledDate}
            />
            {state.fieldErrors?.scheduledDate?.[0] && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.scheduledDate[0]}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="h-9 shrink-0 gap-1.5 rounded-md px-4 text-sm"
            disabled={pending}
          >
            <Plus className="size-4" strokeWidth={2} />
            {pending ? 'Creando…' : 'Añadir jornada'}
          </Button>
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          El número de jornada se asigna automáticamente.
        </p>
      </form>

      {/* Listado */}
      {rounds.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay jornadas creadas. Añade la primera arriba para empezar a
            programar partidos.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {rounds.map((round) => (
            <RoundRow key={round.id} leagueId={leagueId} round={round} />
          ))}
        </ul>
      )}
    </section>
  )
}
