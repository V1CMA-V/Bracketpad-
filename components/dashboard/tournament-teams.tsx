'use client'

import { useActionState, useEffect, useMemo, useRef, useTransition } from 'react'
import { CheckCircle2, Plus, RotateCcw, Trash2, UserMinus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { teamStatusLabels, teamStatusStyles } from '@/lib/tournaments'
import { roundLabel } from '@/lib/tournament-bracket'
import {
  registerTeam,
  removeTeam,
  setTeamStatus,
  type TeamState,
} from '@/app/dashboard/torneos/[id]/categorias/[catId]/actions'

const fieldCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const initialState: TeamState = {}

export type TeamItem = {
  id: string
  label: string
  teamName: string | null
  seed: number | null
  status: string
  // Ronda donde fue eliminada (null = sigue en competencia / sin empezar).
  eliminatedInRound: string | null
}

function TeamRow({ team, index }: { team: TeamItem; index: number }) {
  const [pending, startTransition] = useTransition()
  const withdrawn = team.status === 'withdrawn'
  const confirmed = team.status === 'confirmed'
  const st = teamStatusStyles[team.status] ?? teamStatusStyles.registered

  const toggleWithdraw = () =>
    startTransition(() => {
      void setTeamStatus(team.id, withdrawn ? 'registered' : 'withdrawn')
    })

  const toggleConfirm = () =>
    startTransition(() => {
      void setTeamStatus(team.id, confirmed ? 'registered' : 'confirmed')
    })

  const remove = () =>
    startTransition(() => {
      void removeTeam(team.id)
    })

  return (
    <li className={cn('flex items-center gap-4 px-3 py-3', pending && 'opacity-50')}>
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
          {team.label}
        </p>
        {(team.teamName || team.seed != null) && (
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {team.teamName ?? ''}
            {team.teamName && team.seed != null ? ' · ' : ''}
            {team.seed != null ? `Cab. ${team.seed}` : ''}
          </p>
        )}
      </div>

      {!withdrawn && team.eliminatedInRound && (
        <span className="hidden shrink-0 items-center gap-1.5 rounded-sm bg-terracotta/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-terracotta sm:inline-flex">
          Fuera · {roundLabel(team.eliminatedInRound)}
        </span>
      )}

      <span
        className={cn(
          'flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest',
          st.text,
        )}
      >
        <span className={cn('size-1.5 rounded-full', st.dot)} />
        {teamStatusLabels[team.status] ?? team.status}
      </span>

      <div className="flex items-center gap-1">
        {!withdrawn && (
          <button
            type="button"
            onClick={toggleConfirm}
            disabled={pending}
            title={confirmed ? 'Marcar como inscrita' : 'Confirmar pareja'}
            className={cn(
              'flex size-8 items-center justify-center rounded-md border transition-colors disabled:opacity-50',
              confirmed
                ? 'border-forest/40 bg-forest/10 text-forest'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <CheckCircle2 className="size-4" strokeWidth={2} />
          </button>
        )}
        <button
          type="button"
          onClick={toggleWithdraw}
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
        <ConfirmDialog
          title={`¿Eliminar la pareja ${team.label}?`}
          description="Se quitará de la categoría junto con sus partidos. Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          destructive
          onConfirm={remove}
          trigger={
            <button
              type="button"
              disabled={pending}
              title="Eliminar pareja"
              className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-terracotta/40 hover:bg-terracotta/10 hover:text-terracotta disabled:opacity-50"
            >
              <Trash2 className="size-4" strokeWidth={2} />
            </button>
          }
        />
      </div>
    </li>
  )
}

export function TournamentTeams({
  categoryId,
  teams,
  players,
  maxTeams,
}: {
  categoryId: string
  teams: TeamItem[]
  players: { id: string; name: string }[]
  maxTeams: number | null
}) {
  const boundAction = useMemo(
    () => registerTeam.bind(null, categoryId),
    [categoryId],
  )
  const [state, formAction, pending] = useActionState(boundAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      firstRef.current?.focus()
    }
  }, [state.success])

  const activeCount = teams.filter((t) => t.status !== 'withdrawn').length
  const isFull = maxTeams != null && activeCount >= maxTeams

  // Sugerencias: jugadores del club que aún no están inscritos en la categoría.
  const suggestions = useMemo(() => {
    const registered = new Set(
      teams.flatMap((t) => t.label.split(' / ').map((n) => n.trim())),
    )
    return players.filter((p) => !registered.has(p.name))
  }, [players, teams])

  const listId = `players-${categoryId}`

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Participantes
          </p>
          <h2 className="mt-1.5 font-serif text-2xl tracking-tight text-foreground">
            Parejas inscritas
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
          {activeCount}
          {maxTeams != null ? ` / ${maxTeams}` : ''}{' '}
          {activeCount === 1 ? 'pareja' : 'parejas'}
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
        {isFull && !state.error && (
          <p className="mb-3 text-xs text-ochre">
            La categoría alcanzó su cupo de {maxTeams} parejas. Retira una para
            inscribir otra.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <input
              ref={firstRef}
              name="player1Name"
              type="text"
              list={listId}
              placeholder="Jugador 1…"
              className={fieldCls}
              aria-invalid={!!state.fieldErrors?.player1Name}
              autoComplete="off"
              required
            />
            {state.fieldErrors?.player1Name?.[0] && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.player1Name[0]}
              </p>
            )}
          </div>
          <div className="min-w-0">
            <input
              name="player2Name"
              type="text"
              list={listId}
              placeholder="Jugador 2…"
              className={fieldCls}
              aria-invalid={!!state.fieldErrors?.player2Name}
              autoComplete="off"
              required
            />
            {state.fieldErrors?.player2Name?.[0] && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.player2Name[0]}
              </p>
            )}
          </div>
        </div>
        <datalist id={listId}>
          {suggestions.map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <input
              name="teamName"
              type="text"
              placeholder="Nombre del equipo (opcional)"
              className={fieldCls}
              aria-invalid={!!state.fieldErrors?.teamName}
              autoComplete="off"
            />
            {state.fieldErrors?.teamName?.[0] && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.teamName[0]}
              </p>
            )}
          </div>
          <input
            name="seed"
            type="number"
            min={1}
            placeholder="Cab."
            className={cn(fieldCls, 'sm:w-24')}
            aria-invalid={!!state.fieldErrors?.seed}
          />
          <Button
            type="submit"
            className="h-9 shrink-0 gap-1.5 rounded-md px-4 text-sm"
            disabled={pending || isFull}
          >
            <Plus className="size-4" strokeWidth={2} />
            {pending ? 'Inscribiendo…' : 'Inscribir pareja'}
          </Button>
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          Se reutiliza el jugador si ya existe en el club; si no, se crea.
        </p>
      </form>

      {/* Listado */}
      {teams.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Todavía no hay parejas inscritas. Añade la primera arriba.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {teams.map((team, i) => (
            <TeamRow key={team.id} team={team} index={i} />
          ))}
        </ul>
      )}
    </section>
  )
}
