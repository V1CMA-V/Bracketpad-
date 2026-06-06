'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import {
  ClipboardCheck,
  Clock,
  FlagTriangleRight,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  Wand2,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { NO_SHOW_GAMES_PER_SET, NO_SHOW_SETS } from '@/lib/league-rules'
import { Button } from '@/components/ui/button'
import {
  captureGroupResults,
  captureMatchResult,
  closeRoundAndAdvance,
  createGroup,
  createMatch,
  deleteGroup,
  deleteMatch,
  generateGroupsFromStandings,
  setGroupStatus,
  setMatchStatus,
  setSlotAttendance,
  updateGroupDetails,
  updateMatchDetails,
  type MatchState,
} from '@/app/dashboard/ligas/[id]/jornadas/[roundId]/actions'

const fieldCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

/** Normaliza para búsqueda: minúsculas y sin acentos. */
const normalizeText = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

const initialState: MatchState = {}

type Option = { id: string; name: string }

/** Jugador dentro de un lado del partido (id para resolver suplentes). */
export type SidePlayer = { id: string; name: string }

export type MatchItem = {
  id: string
  status: string
  winnerSide: 'A' | 'B' | null
  groupNumber: number | null
  intraGroupOrder: number | null
  courtId: string | null
  courtName: string | null
  scheduledLabel: string | null
  scheduledValue: string | null
  sideA: SidePlayer[]
  sideB: SidePlayer[]
  sets: { gamesA: number; gamesB: number }[]
}

/**
 * Totales acumulados de un jugador en toda la liga. Se usa como último criterio
 * de desempate del movimiento de grupo (sube/baja) cuando dos jugadores empatan
 * en sets, juegos y diferencia, y su enfrentamiento directo también queda igual.
 */
export type GlobalStanding = {
  setsFor: number
  setsAgainst: number
  gamesFor: number
  gamesAgainst: number
}

export type Attendance = 'pending' | 'present' | 'absent'

/** Pase de lista de un grupo: jugadores inscritos, asistencia y suplente. */
export type GroupRoster = {
  groupNumber: number
  members: {
    registrationId: string
    playerId: string
    fullName: string
    attendance: Attendance
    substituteName: string | null
  }[]
}

const statusLabels: Record<string, string> = {
  scheduled: 'Programado',
  in_progress: 'En juego',
  suspended: 'Suspendido',
  finished: 'Finalizado',
  walkover: 'W.O.',
  cancelled: 'Cancelado',
}

// Estados que el operador puede fijar a mano (finished se deriva del resultado).
const manualStatusOptions: { value: string; label: string }[] = [
  { value: 'scheduled', label: 'Programado' },
  { value: 'in_progress', label: 'En juego' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'walkover', label: 'W.O.' },
  { value: 'cancelled', label: 'Cancelado' },
]

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

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-24">
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Grupo
          </label>
          <input
            name="groupNumber"
            type="number"
            min={1}
            max={99}
            placeholder="1"
            className={cn(fieldCls, 'w-full')}
            aria-invalid={!!state.fieldErrors?.groupNumber}
          />
        </div>
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
        <div className="sm:flex-1">
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Cancha
          </label>
          <select
            name="courtId"
            defaultValue=""
            disabled={courts.length === 0}
            className={cn(fieldCls, 'w-full appearance-none')}
          >
            <option value="">
              {courts.length === 0 ? 'Sin canchas registradas' : 'Sin cancha asignada'}
            </option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="submit"
          className="h-9 shrink-0 gap-1.5 rounded-md px-4 text-sm"
          disabled={pending}
        >
          <Plus className="size-4" strokeWidth={2} />
          {pending ? 'Creando…' : 'Crear partido'}
        </Button>
      </div>
      {(state.fieldErrors?.groupNumber?.[0] ||
        state.fieldErrors?.scheduledAt?.[0]) && (
        <p className="mt-1.5 text-xs text-destructive">
          {state.fieldErrors?.groupNumber?.[0] ??
            state.fieldErrors?.scheduledAt?.[0]}
        </p>
      )}
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*  Crear grupo de 4 (genera los 3 sets rotativos)                            */
/* -------------------------------------------------------------------------- */

function CreateGroupForm({
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
  const boundAction = createGroup.bind(null, roundId)
  const [state, formAction, pending] = useActionState(boundAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  const slots = ['p1', 'p2', 'p3', 'p4'] as const

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="rounded-xl border border-border bg-card p-4"
    >
      <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <Users className="size-3.5" strokeWidth={2} />
        Crear grupo de 4 · 3 sets rotativos
      </p>
      {state.error && (
        <p className="mb-3 text-xs text-destructive">{state.error}</p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {slots.map((slot, i) => (
          <div key={slot}>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Jugador {i + 1}
            </label>
            <PlayerSelect
              name={slot}
              players={players}
              required
              placeholder={`Jugador ${i + 1}…`}
              invalid={!!state.fieldErrors?.[slot]}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-24">
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Grupo
          </label>
          <input
            name="groupNumber"
            type="number"
            min={1}
            max={99}
            placeholder="auto"
            className={cn(fieldCls, 'w-full')}
            aria-invalid={!!state.fieldErrors?.groupNumber}
          />
        </div>
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
        <div className="sm:flex-1">
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Cancha
          </label>
          <select
            name="courtId"
            defaultValue=""
            disabled={courts.length === 0}
            className={cn(fieldCls, 'w-full appearance-none')}
          >
            <option value="">
              {courts.length === 0
                ? 'Sin canchas registradas'
                : 'Sin cancha asignada'}
            </option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="submit"
          className="h-9 shrink-0 gap-1.5 rounded-md px-4 text-sm"
          disabled={pending}
        >
          <Plus className="size-4" strokeWidth={2} />
          {pending ? 'Creando…' : 'Crear grupo'}
        </Button>
      </div>
      {(state.fieldErrors?.groupNumber?.[0] ||
        state.fieldErrors?.scheduledAt?.[0]) && (
        <p className="mt-1.5 text-xs text-destructive">
          {state.fieldErrors?.groupNumber?.[0] ??
            state.fieldErrors?.scheduledAt?.[0]}
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
/*  Editar partido (horario, grupo, cancha)                                   */
/* -------------------------------------------------------------------------- */

function MatchDetailsForm({
  matchId,
  value,
  currentGroupNumber,
  courts,
  currentCourtId,
  onDone,
}: {
  matchId: string
  value: string | null
  currentGroupNumber: number | null
  courts: Option[]
  currentCourtId: string | null
  onDone: () => void
}) {
  const boundAction = updateMatchDetails.bind(null, matchId)
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
            Grupo
          </label>
          <input
            name="groupNumber"
            type="number"
            min={1}
            max={99}
            placeholder="—"
            defaultValue={currentGroupNumber ?? ''}
            className={cn(fieldCls, 'w-20')}
            aria-invalid={!!state.fieldErrors?.groupNumber}
          />
        </div>
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
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Cancha
          </label>
          <select
            name="courtId"
            defaultValue={currentCourtId ?? ''}
            disabled={courts.length === 0}
            className={cn(fieldCls, 'w-56 appearance-none')}
          >
            <option value="">
              {courts.length === 0 ? 'Sin canchas registradas' : 'Sin cancha asignada'}
            </option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
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
      {(state.fieldErrors?.groupNumber?.[0] ||
        state.fieldErrors?.scheduledAt?.[0]) && (
        <p className="mt-1.5 text-xs text-destructive">
          {state.fieldErrors?.groupNumber?.[0] ??
            state.fieldErrors?.scheduledAt?.[0]}
        </p>
      )}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
        Deja un campo vacío para quitar su valor.
      </p>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*  Selector de estado (manual)                                               */
/* -------------------------------------------------------------------------- */

function StatusSelect({
  status,
  onChange,
  disabled,
}: {
  status: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <select
      // `key` remonta el select tras revalidar para reflejar el estado guardado.
      key={status}
      defaultValue={status}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      title="Estado del partido"
      className={cn(
        fieldCls,
        'h-8 w-auto appearance-none px-2 text-xs uppercase tracking-wider',
      )}
    >
      {manualStatusOptions.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
      {/* El estado finalizado se deriva del resultado; visible pero no elegible. */}
      {status === 'finished' && (
        <option value="finished" disabled>
          Finalizado
        </option>
      )}
    </select>
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
  const [statusPending, startStatus] = useTransition()
  const finished = match.status === 'finished'

  const toggle = (which: 'result' | 'schedule') =>
    setPanel((p) => (p === which ? 'none' : which))

  const remove = () => {
    if (!confirm('¿Eliminar este partido?')) return
    startTransition(() => {
      void deleteMatch(match.id)
    })
  }

  const sideName = (players: SidePlayer[]) =>
    players.length > 0 ? players.map((p) => p.name).join(' / ') : '—'

  return (
    <li
      className={cn(
        'rounded-xl border border-border bg-card p-4',
        pending && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-4">
        {match.groupNumber != null && (
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border font-mono text-xs text-muted-foreground tabular-nums"
            title={`Grupo ${match.groupNumber}`}
          >
            G{match.groupNumber}
          </span>
        )}
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
          <StatusSelect
            status={match.status}
            disabled={statusPending}
            onChange={(v) =>
              startStatus(() => void setMatchStatus(match.id, v))
            }
          />
          <button
            type="button"
            onClick={() => toggle('schedule')}
            title="Editar grupo, horario y cancha"
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
        <MatchDetailsForm
          matchId={match.id}
          value={match.scheduledValue}
          currentGroupNumber={match.groupNumber}
          courts={courts}
          currentCourtId={match.courtId}
          onDone={() => setPanel('none')}
        />
      )}
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/*  Autogenerar grupos                                                        */
/* -------------------------------------------------------------------------- */

function GenerateGroupsButton({ roundId }: { roundId: string }) {
  const boundAction = generateGroupsFromStandings.bind(null, roundId)
  const [state, formAction, pending] = useActionState(boundAction, initialState)

  return (
    <form
      action={formAction}
      className="rounded-xl border border-dashed border-border bg-card/50 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-foreground">
            Autogenerar partidos por clasificación
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Grupos de 4 · 3 sets rotativos · grupo 1 = mejores de la liga
          </p>
        </div>
        <Button
          type="submit"
          variant="outline"
          className="h-9 shrink-0 gap-1.5 rounded-md px-4 text-sm"
          disabled={pending}
        >
          <Wand2 className="size-4" strokeWidth={2} />
          {pending ? 'Generando…' : 'Generar grupos'}
        </Button>
      </div>
      {state.error && (
        <p className="mt-2 text-xs text-destructive">{state.error}</p>
      )}
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*  Cerrar jornada (ascenso/descenso → genera la siguiente)                   */
/* -------------------------------------------------------------------------- */

function CloseRoundButton({ roundId }: { roundId: string }) {
  const boundAction = closeRoundAndAdvance.bind(null, roundId)
  const [state, formAction, pending] = useActionState(boundAction, initialState)

  return (
    <form
      action={formAction}
      className="rounded-xl border border-dashed border-border bg-card/50 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-foreground">Cerrar jornada</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Calcula ascensos y descensos · genera la jornada siguiente
          </p>
        </div>
        <Button
          type="submit"
          variant="outline"
          className="h-9 shrink-0 gap-1.5 rounded-md px-4 text-sm"
          disabled={pending}
        >
          <FlagTriangleRight className="size-4" strokeWidth={2} />
          {pending ? 'Cerrando…' : 'Cerrar y generar siguiente'}
        </Button>
      </div>
      {state.error && (
        <p className="mt-2 text-xs text-destructive">{state.error}</p>
      )}
      {state.success && (
        <p className="mt-2 text-xs text-forest">
          Jornada cerrada. Se generó la jornada siguiente con los nuevos grupos.
        </p>
      )}
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tarjeta de grupo (4 jugadores · 3 sets rotativos)                         */
/* -------------------------------------------------------------------------- */

export type RoundGroup = {
  groupNumber: number
  courtId: string | null
  courtName: string | null
  scheduledLabel: string | null
  scheduledValue: string | null
  matches: MatchItem[]
}

function GroupDetailsForm({
  roundId,
  group,
  courts,
  onDone,
}: {
  roundId: string
  group: RoundGroup
  courts: Option[]
  onDone: () => void
}) {
  const boundAction = updateGroupDetails.bind(null, roundId, group.groupNumber)
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
            defaultValue={group.scheduledValue ?? ''}
            className={cn(fieldCls, 'w-56')}
            aria-invalid={!!state.fieldErrors?.scheduledAt}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Cancha
          </label>
          <select
            name="courtId"
            defaultValue={group.courtId ?? ''}
            disabled={courts.length === 0}
            className={cn(fieldCls, 'w-56 appearance-none')}
          >
            <option value="">
              {courts.length === 0
                ? 'Sin canchas registradas'
                : 'Sin cancha asignada'}
            </option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
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
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
        Aplica el horario y la cancha a los 3 sets del grupo.
      </p>
    </form>
  )
}

/** Una fila del pase de lista: marca asistencia y captura el suplente. */
function AttendanceRow({
  roundId,
  member,
}: {
  roundId: string
  member: GroupRoster['members'][number]
}) {
  const [pending, start] = useTransition()
  const [sub, setSub] = useState(member.substituteName ?? '')

  const apply = (attendance: Attendance) =>
    start(() => {
      void setSlotAttendance(
        roundId,
        member.registrationId,
        attendance,
        attendance === 'absent' ? sub : null,
      )
    })

  const isAbsent = member.attendance === 'absent'
  const isPresent = member.attendance === 'present'

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-background/40 px-3 py-2',
        pending && 'opacity-50',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'flex-1 truncate text-sm text-foreground',
            isAbsent && 'text-muted-foreground line-through',
          )}
        >
          {member.fullName}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={pending}
            onClick={() => apply('present')}
            className={cn(
              'h-7 rounded-md border px-2 text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50',
              isPresent
                ? 'border-forest/40 bg-forest/10 text-forest'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            Presente
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => apply('absent')}
            className={cn(
              'h-7 rounded-md border px-2 text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50',
              isAbsent
                ? 'border-terracotta/40 bg-terracotta/10 text-terracotta'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            No llegó
          </button>
        </div>
      </div>
      {isAbsent && (
        <div className="mt-2 flex items-center gap-2">
          <input
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            placeholder="Nombre del suplente…"
            className={cn(fieldCls, 'h-8 flex-1')}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => apply('absent')}
            title="Guardar suplente"
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <Save className="size-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  )
}

function GroupCard({
  roundId,
  group,
  roster,
  maxGroupNumber,
  courts,
  globalStandings,
  highlight,
}: {
  roundId: string
  group: RoundGroup
  roster?: GroupRoster
  maxGroupNumber: number
  courts: Option[]
  globalStandings?: Record<string, GlobalStanding>
  /** Texto de búsqueda ya normalizado, para resaltar el jugador coincidente. */
  highlight?: string
}) {
  const boundAction = captureGroupResults.bind(null, roundId)
  const [state, formAction, pending] = useActionState(boundAction, initialState)
  const [panel, setPanel] = useState<'none' | 'edit' | 'checkin'>('none')
  const [removing, startRemove] = useTransition()
  const [statusPending, startStatus] = useTransition()

  const matches = [...group.matches].sort(
    (a, b) => (a.intraGroupOrder ?? 0) - (b.intraGroupOrder ?? 0),
  )

  // Datos del jugador por id, para resolver suplentes en los nombres mostrados.
  const memberByPlayer = new Map(
    (roster?.members ?? []).map((m) => [m.playerId, m]),
  )

  // Lista de jugadores del grupo (inscritos). Si no hay pase de lista cargado,
  // se deriva del primer set: A = [P1,P2], B = [P3,P4].
  const first = matches[0]
  const derived: SidePlayer[] =
    first && first.sideA.length + first.sideB.length === 4
      ? [...first.sideA, ...first.sideB]
      : [
          ...new Map(
            matches.flatMap((m) => [...m.sideA, ...m.sideB]).map((p) => [p.id, p]),
          ).values(),
        ]

  // Nombre a mostrar: si el jugador no llegó, se muestra a su suplente.
  const displayName = (p: SidePlayer) => {
    const mem = memberByPlayer.get(p.id)
    if (mem?.attendance === 'absent') {
      return mem.substituteName ? `${mem.substituteName} (sup.)` : '(suplente)'
    }
    return p.name
  }

  // Reparto de juegos por jugador (de los sets ya guardados), por id.
  const gamesByPlayer = new Map<string, number>()
  for (const m of matches) {
    for (const s of m.sets) {
      for (const p of m.sideA)
        gamesByPlayer.set(p.id, (gamesByPlayer.get(p.id) ?? 0) + s.gamesA)
      for (const p of m.sideB)
        gamesByPlayer.set(p.id, (gamesByPlayer.get(p.id) ?? 0) + s.gamesB)
    }
  }
  const anyScores = matches.some((m) => m.sets.length > 0)

  // Estado representativo del grupo (todos sus sets se mueven juntos).
  const groupStatus = (() => {
    if (matches.every((m) => m.status === 'finished')) return 'finished'
    if (matches.some((m) => m.status === 'in_progress')) return 'in_progress'
    if (matches.some((m) => m.status === 'suspended')) return 'suspended'
    if (matches.some((m) => m.status === 'cancelled')) return 'cancelled'
    if (matches.some((m) => m.status === 'walkover')) return 'walkover'
    return 'scheduled'
  })()

  // Estadísticas por jugador (se muestran al finalizar el grupo). El ausente
  // pierde la jornada: 0 sets y último, igual que al cerrar la jornada.
  type GroupStat = {
    id: string
    name: string
    note: string | null
    isAbsent: boolean
    setsWon: number
    setsLost: number
    gamesFor: number
    gamesAgainst: number
  }
  const stats: GroupStat[] = derived.map((p) => {
    const mem = memberByPlayer.get(p.id)
    if (mem?.attendance === 'absent') {
      // No se presentó: forfeit de sus 3 sets → −9 en diferencia de juegos.
      return {
        id: p.id,
        name: mem.fullName,
        note: mem.substituteName ? `No llegó · ${mem.substituteName}` : 'No llegó',
        isAbsent: true,
        setsWon: 0,
        setsLost: NO_SHOW_SETS,
        gamesFor: 0,
        gamesAgainst: NO_SHOW_SETS * NO_SHOW_GAMES_PER_SET,
      }
    }
    let setsWon = 0
    let setsLost = 0
    let gamesFor = 0
    let gamesAgainst = 0
    for (const m of matches) {
      const set = m.sets[0]
      if (!set) continue
      const onA = m.sideA.some((x) => x.id === p.id)
      const onB = m.sideB.some((x) => x.id === p.id)
      if (!onA && !onB) continue
      gamesFor += onA ? set.gamesA : set.gamesB
      gamesAgainst += onA ? set.gamesB : set.gamesA
      if ((onA && m.winnerSide === 'A') || (onB && m.winnerSide === 'B'))
        setsWon += 1
      else if (m.winnerSide) setsLost += 1
    }
    return {
      id: p.id,
      name: p.name,
      note: null,
      isAbsent: false,
      setsWon,
      setsLost,
      gamesFor,
      gamesAgainst,
    }
  })
  // Enfrentamiento directo entre dos jugadores del grupo: sets ganados en los
  // sets donde fueron rivales (en el americano de 4 se cruzan en 2 de los 3
  // sets; en el tercero son compañeros). Devuelve >0 si `aId` ganó más.
  const headToHead = (aId: string, bId: string) => {
    let aSets = 0
    let bSets = 0
    for (const m of matches) {
      const set = m.sets[0]
      if (!set) continue
      const aOnA = m.sideA.some((x) => x.id === aId)
      const aOnB = m.sideB.some((x) => x.id === aId)
      const bOnA = m.sideA.some((x) => x.id === bId)
      const bOnB = m.sideB.some((x) => x.id === bId)
      const rivals = (aOnA && bOnB) || (aOnB && bOnA)
      if (!rivals) continue
      const aGames = aOnA ? set.gamesA : set.gamesB
      const bGames = bOnA ? set.gamesA : set.gamesB
      if (aGames > bGames) aSets += 1
      else if (bGames > aGames) bSets += 1
    }
    return aSets - bSets
  }

  // Clasificación acumulada de la liga: comparador (negativo = `a` va por
  // delante). Mismos criterios que la tabla: sets, dif. de sets, dif. de juegos.
  const compareGlobal = (aId: string, bId: string) => {
    const ga = globalStandings?.[aId]
    const gb = globalStandings?.[bId]
    if (!ga || !gb) return 0
    return (
      gb.setsFor - ga.setsFor ||
      gb.setsFor - gb.setsAgainst - (ga.setsFor - ga.setsAgainst) ||
      gb.gamesFor - gb.gamesAgainst - (ga.gamesFor - ga.gamesAgainst)
    )
  }

  // Presentes por sets ganados, luego dif. de juegos y juegos a favor. Empate
  // total → enfrentamiento directo → clasificación general acumulada → nombre
  // (último recurso determinista y reproducible). Ausentes al fondo.
  const rankedStats = [
    ...stats
      .filter((s) => !s.isAbsent)
      .sort(
        (a, b) =>
          b.setsWon - a.setsWon ||
          b.gamesFor - b.gamesAgainst - (a.gamesFor - a.gamesAgainst) ||
          b.gamesFor - a.gamesFor ||
          headToHead(b.id, a.id) ||
          compareGlobal(a.id, b.id) ||
          a.name.localeCompare(b.name),
      ),
    ...stats.filter((s) => s.isAbsent),
  ]
  const movementOf = (rank: number, isAbsent: boolean) => {
    if (isAbsent) return group.groupNumber < maxGroupNumber ? 'down' : 'stay'
    if (rank === 1 && group.groupNumber > 1) return 'up'
    if (rank === rankedStats.length && group.groupNumber < maxGroupNumber)
      return 'down'
    return 'stay'
  }
  const movementLabel: Record<string, string> = {
    up: 'Sube',
    down: 'Baja',
    stay: 'Mantiene',
  }

  // ¿Coincide este nombre con la búsqueda activa? (para resaltarlo).
  const isHit = (name: string) =>
    !!highlight && normalizeText(name).includes(highlight)

  const remove = () => {
    if (!confirm(`¿Eliminar el grupo ${group.groupNumber} y sus 3 sets?`)) return
    startRemove(() => {
      void deleteGroup(roundId, group.groupNumber)
    })
  }

  // Remonta el formulario cuando cambian los resultados guardados, para que los
  // inputs reflejen el estado persistido tras revalidar.
  const formKey = matches
    .map((m) => `${m.id}:${m.sets.map((s) => `${s.gamesA}-${s.gamesB}`).join(',')}`)
    .join('|')

  const pairLabel = (players: SidePlayer[]) =>
    players.length > 0 ? players.map(displayName).join(' / ') : '—'

  // Resumen de la formación: jugadores con marca de ausencia y su suplente.
  const lineup = roster?.members.length
    ? roster.members.map((m) =>
        m.attendance === 'absent'
          ? `${m.fullName} → ${m.substituteName ?? 'suplente'}`
          : m.fullName,
      )
    : derived.map((p) => p.name)

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card/30 p-4',
        removing && 'opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-baseline gap-2">
            <span className="font-serif text-xl tracking-tight text-foreground">
              Grupo {group.groupNumber}
            </span>
            {group.groupNumber === 1 && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Más alto
              </span>
            )}
          </h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {lineup.map((name, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                <span
                  className={cn(isHit(name) && 'font-semibold text-primary')}
                >
                  {name}
                </span>
              </span>
            ))}
          </p>
          <p className="mt-0.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>{statusLabels[groupStatus] ?? groupStatus}</span>
            {group.scheduledLabel && (
              <>
                <span className="text-foreground/25">·</span>
                <span className="normal-case tracking-normal">
                  {group.scheduledLabel}
                </span>
              </>
            )}
            {group.courtName && (
              <>
                <span className="text-foreground/25">·</span>
                <span>{group.courtName}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <StatusSelect
            status={groupStatus}
            disabled={statusPending}
            onChange={(v) =>
              startStatus(() => void setGroupStatus(roundId, group.groupNumber, v))
            }
          />
          {roster?.members.length ? (
            <button
              type="button"
              onClick={() =>
                setPanel((p) => (p === 'checkin' ? 'none' : 'checkin'))
              }
              title="Pase de lista"
              className={cn(
                'flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                panel === 'checkin' && 'bg-muted text-foreground',
              )}
            >
              <ClipboardCheck className="size-4" strokeWidth={2} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setPanel((p) => (p === 'edit' ? 'none' : 'edit'))}
            title="Editar horario y cancha del grupo"
            className={cn(
              'flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              panel === 'edit' && 'bg-muted text-foreground',
            )}
          >
            <Clock className="size-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={removing}
            title="Eliminar grupo"
            className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-terracotta/40 hover:bg-terracotta/10 hover:text-terracotta disabled:opacity-50"
          >
            <Trash2 className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {panel === 'edit' && (
        <GroupDetailsForm
          roundId={roundId}
          group={group}
          courts={courts}
          onDone={() => setPanel('none')}
        />
      )}

      {panel === 'checkin' && roster?.members.length ? (
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Pase de lista
          </p>
          <div className="space-y-2">
            {roster.members.map((mem) => (
              <AttendanceRow
                key={mem.registrationId}
                roundId={roundId}
                member={mem}
              />
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
            «No llegó» hace que el jugador pierda la jornada (último del grupo,
            desciende). El suplente cubre el partido, pero sus puntos no cuentan.
          </p>
        </div>
      ) : null}

      {groupStatus === 'finished' && (
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 text-left font-normal">#</th>
                <th className="px-3 py-2 text-left font-normal">Jugador</th>
                <th className="px-3 py-2 text-center font-normal">Sets</th>
                <th className="px-3 py-2 text-center font-normal">Juegos</th>
                <th className="px-3 py-2 text-center font-normal">Dif.</th>
                <th className="px-3 py-2 text-right font-normal">Mov.</th>
              </tr>
            </thead>
            <tbody>
              {rankedStats.map((s, i) => {
                const rank = i + 1
                const mv = movementOf(rank, s.isAbsent)
                const diff = s.gamesFor - s.gamesAgainst
                return (
                  <tr
                    key={s.id}
                    className={cn(
                      'border-b border-border/60 last:border-0',
                      isHit(s.name) && 'bg-primary/10',
                    )}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground tabular-nums">
                      {rank}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'text-foreground',
                          s.isAbsent && 'text-muted-foreground line-through',
                          rank === 1 && !s.isAbsent && 'font-medium',
                          isHit(s.name) && 'font-semibold text-primary',
                        )}
                      >
                        {s.name}
                      </span>
                      {s.note && (
                        <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-terracotta">
                          {s.note}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums">
                      {s.setsWon}–{s.setsLost}
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">
                      {s.gamesFor}–{s.gamesAgainst}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2 text-center tabular-nums',
                        diff > 0
                          ? 'text-forest'
                          : diff < 0
                            ? 'text-terracotta'
                            : 'text-muted-foreground',
                      )}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={cn(
                          'font-mono text-[10px] uppercase tracking-wider',
                          mv === 'up'
                            ? 'text-forest'
                            : mv === 'down'
                              ? 'text-terracotta'
                              : 'text-muted-foreground',
                        )}
                      >
                        {movementLabel[mv]}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <form key={formKey} action={formAction} className="mt-4 space-y-2">
        {state.error && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}
        {matches.map((m) => {
          const set = m.sets[0]
          return (
            <div
              key={m.id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-background/40 px-3 py-2"
            >
              <input type="hidden" name="matchId" value={m.id} />
              <span className="flex size-7 shrink-0 items-center justify-center rounded border border-border font-mono text-[10px] text-muted-foreground tabular-nums">
                S{m.intraGroupOrder ?? '?'}
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={cn(
                    'truncate text-sm text-foreground',
                    m.winnerSide === 'A' && 'font-medium',
                  )}
                >
                  {pairLabel(m.sideA)}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                  vs
                </span>
                <span
                  className={cn(
                    'truncate text-sm text-foreground',
                    m.winnerSide === 'B' && 'font-medium',
                  )}
                >
                  {pairLabel(m.sideB)}
                </span>
              </div>
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
          )
        })}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
            {groupStatus === 'finished'
              ? null
              : anyScores
                ? derived
                    .map(
                      (p) =>
                        `${displayName(p).split(' ')[0]} ${
                          gamesByPlayer.get(p.id) ?? 0
                        }`,
                    )
                    .join(' · ')
                : 'Deja vacíos los sets no jugados. Los juegos se reparten por jugador.'}
          </p>
          <Button
            type="submit"
            variant="outline"
            className="h-9 gap-1.5 rounded-md px-4 text-sm"
            disabled={pending}
          >
            <Save className="size-4" strokeWidth={2} />
            {pending ? 'Guardando…' : 'Guardar resultados'}
          </Button>
        </div>
      </form>
    </div>
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
  rosters,
  globalStandings,
  playKind,
  bestOfSets,
  defaultDateTime,
}: {
  roundId: string
  players: Option[]
  courts: Option[]
  matches: MatchItem[]
  rosters: GroupRoster[]
  globalStandings?: Record<string, GlobalStanding>
  playKind: 'individual' | 'pairs'
  bestOfSets: number
  defaultDateTime?: string
}) {
  const isIndividual = playKind === 'individual'
  const rosterByGroup = new Map(rosters.map((r) => [r.groupNumber, r]))
  const [query, setQuery] = useState('')

  // En ligas individuales los partidos con grupo se muestran como tarjetas de
  // grupo; el resto (sin grupo, o ligas de parejas) como filas sueltas.
  const byGroup = new Map<number, MatchItem[]>()
  const ungrouped: MatchItem[] = []
  for (const m of matches) {
    if (isIndividual && m.groupNumber != null) {
      const list = byGroup.get(m.groupNumber) ?? []
      list.push(m)
      byGroup.set(m.groupNumber, list)
    } else {
      ungrouped.push(m)
    }
  }
  const maxGroupNumber = byGroup.size ? Math.max(...byGroup.keys()) : 0
  const groups: RoundGroup[] = [...byGroup.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([groupNumber, ms]) => {
      const lead =
        [...ms].sort(
          (a, b) => (a.intraGroupOrder ?? 0) - (b.intraGroupOrder ?? 0),
        )[0] ?? ms[0]
      return {
        groupNumber,
        courtId: lead.courtId,
        courtName: lead.courtName,
        scheduledLabel: lead.scheduledLabel,
        scheduledValue: lead.scheduledValue,
        matches: ms,
      }
    })

  // Nombres buscables de un grupo: jugadores inscritos y suplentes (pase de
  // lista) más los nombres que aparecen en los partidos.
  const groupNames = (g: RoundGroup) => {
    const names = new Set<string>()
    for (const m of rosterByGroup.get(g.groupNumber)?.members ?? []) {
      names.add(m.fullName)
      if (m.substituteName) names.add(m.substituteName)
    }
    for (const mt of g.matches)
      for (const p of [...mt.sideA, ...mt.sideB]) names.add(p.name)
    return [...names]
  }

  const q = normalizeText(query)
  const visibleGroups = q
    ? groups.filter((g) => groupNames(g).some((n) => normalizeText(n).includes(q)))
    : groups

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
        <>
          {matches.length === 0 && isIndividual && (
            <GenerateGroupsButton roundId={roundId} />
          )}
          {isIndividual ? (
            <CreateGroupForm
              roundId={roundId}
              players={players}
              courts={courts}
              defaultDateTime={defaultDateTime}
            />
          ) : (
            <CreateMatchForm
              roundId={roundId}
              players={players}
              courts={courts}
              defaultDateTime={defaultDateTime}
            />
          )}
        </>
      )}

      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay partidos en esta jornada todavía.
          </p>
        </div>
      ) : (
        <>
          {groups.length > 1 && (
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={2}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar jugador por nombre…"
                aria-label="Buscar jugador en los grupos"
                className={cn(fieldCls, 'h-10 px-9')}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              )}
            </div>
          )}

          <div className="space-y-6">
            {q && (
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {visibleGroups.length === 0
                  ? 'Ningún grupo coincide'
                  : `${visibleGroups.length} ${
                      visibleGroups.length === 1
                        ? 'grupo encontrado'
                        : 'grupos encontrados'
                    }`}
              </p>
            )}
            {visibleGroups.map((g) => (
              <GroupCard
                key={g.groupNumber}
                roundId={roundId}
                group={g}
                roster={rosterByGroup.get(g.groupNumber)}
                maxGroupNumber={maxGroupNumber}
                courts={courts}
                globalStandings={globalStandings}
                highlight={q}
              />
            ))}

            {!q && ungrouped.length > 0 && (
              <div>
                {groups.length > 0 && (
                  <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Sin grupo
                  </h3>
                )}
                <ul className="space-y-3">
                  {ungrouped.map((match) => (
                    <MatchRow
                      key={match.id}
                      match={match}
                      bestOfSets={bestOfSets}
                      courts={courts}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
          <CloseRoundButton roundId={roundId} />
        </>
      )}
    </section>
  )
}
