'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { Clock, Plus, Save, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  captureMatchResult,
  createMatch,
  deleteMatch,
  updateMatchSchedule,
  type MatchState,
} from '@/app/dashboard/ligas/[id]/jornadas/[roundId]/actions'

const fieldCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const initialState: MatchState = {}

type Option = { id: string; name: string }

export type MatchItem = {
  id: string
  status: string
  winnerSide: 'A' | 'B' | null
  courtId: string | null
  courtName: string | null
  scheduledLabel: string | null
  scheduledValue: string | null
  sideA: string[]
  sideB: string[]
  sets: { gamesA: number; gamesB: number }[]
}

const statusLabels: Record<string, string> = {
  scheduled: 'Programado',
  in_progress: 'En juego',
  finished: 'Finalizado',
  walkover: 'W.O.',
  cancelled: 'Cancelado',
}

/* -------------------------------------------------------------------------- */
/*  Selector de jugador                                                       */
/* -------------------------------------------------------------------------- */

function PlayerSelect({
  name,
  players,
  required,
  placeholder,
  invalid,
}: {
  name: string
  players: Option[]
  required?: boolean
  placeholder: string
  invalid?: boolean
}) {
  return (
    <select
      name={name}
      required={required}
      aria-invalid={invalid}
      defaultValue=""
      className={cn(fieldCls, 'appearance-none')}
    >
      <option value="" disabled={required}>
        {placeholder}
      </option>
      {players.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  )
}

/* -------------------------------------------------------------------------- */
/*  Crear partido                                                             */
/* -------------------------------------------------------------------------- */

function CreateMatchForm({
  roundId,
  players,
  courts,
  defaultDateTime,
}: {
  roundId: string
  players: Option[]
  courts: Option[]
  defaultDateTime?: string
}) {
  const boundAction = createMatch.bind(null, roundId)
  const [state, formAction, pending] = useActionState(boundAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="rounded-xl border border-border bg-card p-4"
    >
      {state.error && (
        <p className="mb-3 text-xs text-destructive">{state.error}</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Lado A
          </p>
          <div className="flex flex-col gap-2">
            <PlayerSelect
              name="a1"
              players={players}
              required
              placeholder="Jugador 1…"
              invalid={!!state.fieldErrors?.a1}
            />
            <PlayerSelect
              name="a2"
              players={players}
              placeholder="Jugador 2 (opcional)…"
            />
          </div>
          {state.fieldErrors?.a1?.[0] && (
            <p className="mt-1 text-xs text-destructive">
              {state.fieldErrors.a1[0]}
            </p>
          )}
        </div>
        <div>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Lado B
          </p>
          <div className="flex flex-col gap-2">
            <PlayerSelect
              name="b1"
              players={players}
              required
              placeholder="Jugador 1…"
              invalid={!!state.fieldErrors?.b1}
            />
            <PlayerSelect
              name="b2"
              players={players}
              placeholder="Jugador 2 (opcional)…"
            />
          </div>
          {state.fieldErrors?.b1?.[0] && (
            <p className="mt-1 text-xs text-destructive">
              {state.fieldErrors.b1[0]}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:flex-1">
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Horario
          </label>
          <input
            name="scheduledAt"
            type="datetime-local"
            defaultValue={defaultDateTime}
            className={cn(fieldCls, 'w-full')}
            aria-invalid={!!state.fieldErrors?.scheduledAt}
          />
        </div>
        {courts.length > 0 && (
          <div className="sm:flex-1">
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Cancha
            </label>
            <select
              name="courtId"
              defaultValue=""
              className={cn(fieldCls, 'w-full appearance-none')}
            >
              <option value="">Sin cancha asignada</option>
              {courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <Button
          type="submit"
          className="h-9 shrink-0 gap-1.5 rounded-md px-4 text-sm sm:mt-[22px]"
          disabled={pending}
        >
          <Plus className="size-4" strokeWidth={2} />
          {pending ? 'Creando…' : 'Crear partido'}
        </Button>
      </div>
      {state.fieldErrors?.scheduledAt?.[0] && (
        <p className="mt-1.5 text-xs text-destructive">
          {state.fieldErrors.scheduledAt[0]}
        </p>
      )}
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*  Capturar resultado                                                        */
/* -------------------------------------------------------------------------- */

function ResultForm({
  matchId,
  bestOfSets,
  sets,
  onDone,
}: {
  matchId: string
  bestOfSets: number
  sets: { gamesA: number; gamesB: number }[]
  onDone: () => void
}) {
  const boundAction = captureMatchResult.bind(null, matchId)
  const [state, formAction, pending] = useActionState(boundAction, initialState)

  useEffect(() => {
    if (state.success) onDone()
  }, [state.success, onDone])

  const rows = Array.from({ length: bestOfSets }, (_, i) => sets[i])

  return (
    <form action={formAction} className="mt-3 border-t border-border pt-3">
      {state.error && (
        <p className="mb-2 text-xs text-destructive">{state.error}</p>
      )}
      <div className="flex flex-wrap items-end gap-3">
        {rows.map((set, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Set {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <input
                name="gamesA"
                type="number"
                min={0}
                max={99}
                defaultValue={set?.gamesA ?? ''}
                className={cn(fieldCls, 'w-14 text-center')}
              />
              <span className="text-muted-foreground">–</span>
              <input
                name="gamesB"
                type="number"
                min={0}
                max={99}
                defaultValue={set?.gamesB ?? ''}
                className={cn(fieldCls, 'w-14 text-center')}
              />
            </div>
          </div>
        ))}
        <Button
          type="submit"
          variant="outline"
          className="h-9 gap-1.5 rounded-md px-4 text-sm"
          disabled={pending}
        >
          <Save className="size-4" strokeWidth={2} />
          {pending ? 'Guardando…' : 'Guardar resultado'}
        </Button>
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
        Deja vacíos los sets no jugados. El ranking se recalcula al guardar.
      </p>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*  Editar horario                                                            */
/* -------------------------------------------------------------------------- */

function ScheduleForm({
  matchId,
  value,
  courts,
  currentCourtId,
  onDone,
}: {
  matchId: string
  value: string | null
  courts: Option[]
  currentCourtId: string | null
  onDone: () => void
}) {
  const boundAction = updateMatchSchedule.bind(null, matchId)
  const [state, formAction, pending] = useActionState(boundAction, initialState)

  useEffect(() => {
    if (state.success) onDone()
  }, [state.success, onDone])

  return (
    <form action={formAction} className="mt-3 border-t border-border pt-3">
      {state.error && (
        <p className="mb-2 text-xs text-destructive">{state.error}</p>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Horario
          </label>
          <input
            name="scheduledAt"
            type="datetime-local"
            defaultValue={value ?? ''}
            className={cn(fieldCls, 'w-56')}
            aria-invalid={!!state.fieldErrors?.scheduledAt}
          />
        </div>
        {courts.length > 0 && (
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Cancha
            </label>
            <select
              name="courtId"
              defaultValue={currentCourtId ?? ''}
              className={cn(fieldCls, 'w-56 appearance-none')}
            >
              <option value="">Sin cancha asignada</option>
              {courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <Button
          type="submit"
          variant="outline"
          className="h-9 gap-1.5 rounded-md px-4 text-sm"
          disabled={pending}
        >
          <Save className="size-4" strokeWidth={2} />
          {pending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
      {state.fieldErrors?.scheduledAt?.[0] && (
        <p className="mt-1.5 text-xs text-destructive">
          {state.fieldErrors.scheduledAt[0]}
        </p>
      )}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
        Deja el horario vacío para quitarlo.
      </p>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*  Fila de partido                                                           */
/* -------------------------------------------------------------------------- */

function MatchRow({
  match,
  bestOfSets,
  courts,
}: {
  match: MatchItem
  bestOfSets: number
  courts: Option[]
}) {
  const [panel, setPanel] = useState<'none' | 'result' | 'schedule'>('none')
  const [pending, startTransition] = useTransition()
  const finished = match.status === 'finished'

  const toggle = (which: 'result' | 'schedule') =>
    setPanel((p) => (p === which ? 'none' : which))

  const remove = () => {
    if (!confirm('¿Eliminar este partido?')) return
    startTransition(() => {
      void deleteMatch(match.id)
    })
  }

  const sideName = (names: string[]) =>
    names.length > 0 ? names.join(' / ') : '—'

  return (
    <li
      className={cn(
        'rounded-xl border border-border bg-card p-4',
        pending && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <p
              className={cn(
                'truncate text-sm',
                finished && match.winnerSide === 'A'
                  ? 'font-medium text-foreground'
                  : 'text-foreground',
              )}
            >
              {sideName(match.sideA)}
            </p>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
              vs
            </span>
            <p
              className={cn(
                'truncate text-sm',
                finished && match.winnerSide === 'B'
                  ? 'font-medium text-foreground'
                  : 'text-foreground',
              )}
            >
              {sideName(match.sideB)}
            </p>
          </div>
          <p className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>{statusLabels[match.status] ?? match.status}</span>
            {match.scheduledLabel && (
              <>
                <span className="text-foreground/25">·</span>
                <span className="normal-case tracking-normal">
                  {match.scheduledLabel}
                </span>
              </>
            )}
            {match.courtName && (
              <>
                <span className="text-foreground/25">·</span>
                <span>{match.courtName}</span>
              </>
            )}
            {match.sets.length > 0 && (
              <>
                <span className="text-foreground/25">·</span>
                <span className="tabular-nums normal-case tracking-normal">
                  {match.sets
                    .map((s) => `${s.gamesA}-${s.gamesB}`)
                    .join(', ')}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => toggle('schedule')}
            title="Editar horario"
            className={cn(
              'flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              panel === 'schedule' && 'bg-muted text-foreground',
            )}
          >
            <Clock className="size-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => toggle('result')}
            className={cn(
              'h-8 rounded-md border border-border px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              panel === 'result' && 'bg-muted text-foreground',
            )}
          >
            {panel === 'result' ? 'Cerrar' : finished ? 'Editar' : 'Resultado'}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            title="Eliminar partido"
            className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-terracotta/40 hover:bg-terracotta/10 hover:text-terracotta disabled:opacity-50"
          >
            <Trash2 className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {panel === 'result' && (
        <ResultForm
          matchId={match.id}
          bestOfSets={bestOfSets}
          sets={match.sets}
          onDone={() => setPanel('none')}
        />
      )}
      {panel === 'schedule' && (
        <ScheduleForm
          matchId={match.id}
          value={match.scheduledValue}
          courts={courts}
          currentCourtId={match.courtId}
          onDone={() => setPanel('none')}
        />
      )}
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/*  Sección completa                                                          */
/* -------------------------------------------------------------------------- */

export function RoundMatches({
  roundId,
  players,
  courts,
  matches,
  bestOfSets,
  defaultDateTime,
}: {
  roundId: string
  players: Option[]
  courts: Option[]
  matches: MatchItem[]
  bestOfSets: number
  defaultDateTime?: string
}) {
  return (
    <section className="space-y-5">
      {players.length < 2 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Necesitas al menos dos jugadores inscritos en la liga para crear
            partidos.
          </p>
        </div>
      ) : (
        <CreateMatchForm
          roundId={roundId}
          players={players}
          courts={courts}
          defaultDateTime={defaultDateTime}
        />
      )}

      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay partidos en esta jornada todavía.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              bestOfSets={bestOfSets}
              courts={courts}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
