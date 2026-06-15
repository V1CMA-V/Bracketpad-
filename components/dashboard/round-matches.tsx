'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import {
  ClipboardCheck,
  Clock,
  Dices,
  FlagTriangleRight,
  Lock,
  Plus,
  Save,
  Search,
  Trash2,
  TriangleAlert,
  Users,
  Wand2,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { MAX_GAMES_PER_SET, NO_SHOW_SETS } from '@/lib/league-rules'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
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
  setGroupTieDecision,
  setMatchStatus,
  setSlotAttendance,
  updateGroupDetails,
  updateMatchDetails,
  type MatchState,
} from '@/app/dashboard/ligas/[id]/jornadas/[roundId]/actions'

const fieldCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

/**
 * Plan aleatorio para la «ruleta» de desempate: índice ganador y nº de pasos de
 * la animación. A nivel de módulo (fuera del render) para no violar la regla de
 * pureza de componentes (`Math.random` no puede llamarse durante el render).
 */
function randomRollPlan(count: number): { finalIdx: number; steps: number } {
  return {
    finalIdx: Math.floor(Math.random() * count),
    steps: 16 + Math.floor(Math.random() * 6),
  }
}

/**
 * Acota un input de juegos en tiempo real: solo dígitos (sin signo negativo) y
 * un tope de `MAX_GAMES_PER_SET` (7), ya que en pádel el marcador más alto es
 * 7-6. Evita escribir/pegar valores imposibles, no solo marcarlos como inválidos.
 */
const clampGamesInput = (e: React.FormEvent<HTMLInputElement>) => {
  const el = e.currentTarget
  const digits = el.value.replace(/[^\d]/g, '')
  if (digits === '') {
    el.value = ''
    return
  }
  el.value = String(Math.min(parseInt(digits, 10), MAX_GAMES_PER_SET))
}

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
  durationMinutes: number | null
  sideA: SidePlayer[]
  sideB: SidePlayer[]
  sets: { gamesA: number; gamesB: number }[]
}

export type Attendance = 'pending' | 'present' | 'absent'

/** Decisión manual del organizador para resolver un empate de ascenso/descenso. */
export type Movement = 'up' | 'down' | 'stay'

/** Pase de lista de un grupo: jugadores inscritos, asistencia y suplente. */
export type GroupRoster = {
  groupNumber: number
  members: {
    registrationId: string
    playerId: string
    fullName: string
    attendance: Attendance
    substituteName: string | null
    /** Decisión manual de empate (sube/baja) si el organizador ya la fijó. */
    manualMovement: Movement | null
    /**
     * Puesto en la clasificación general de la liga (1 = mejor). Desempata qué
     * ausente desciende cuando varios faltan en el mismo grupo: solo baja el
     * peor clasificado; el resto mantiene su grupo aunque pierdan la jornada.
     */
    overallRank: number
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
        {/* Apartado fijo: cada set reserva 30 min de cancha. */}
        <input type="hidden" name="durationMinutes" value="30" />
        <Button
          type="submit"
          className="h-9 shrink-0 gap-1.5 rounded-md px-4 text-sm"
          disabled={pending}
        >
          <Plus className="size-4" strokeWidth={2} />
          {pending ? 'Creando…' : 'Crear grupo'}
        </Button>
      </div>
      {state.error && (
        <p className="mt-2 text-xs text-destructive">{state.error}</p>
      )}
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
                inputMode="numeric"
                min={0}
                max={MAX_GAMES_PER_SET}
                onInput={clampGamesInput}
                defaultValue={set?.gamesA ?? ''}
                className={cn(fieldCls, 'w-14 text-center')}
              />
              <span className="text-muted-foreground">–</span>
              <input
                name="gamesB"
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_GAMES_PER_SET}
                onInput={clampGamesInput}
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
          <ConfirmDialog
            title="¿Eliminar este partido?"
            description="Esta acción no se puede deshacer."
            confirmLabel="Eliminar"
            destructive
            onConfirm={remove}
            trigger={
              <button
                type="button"
                disabled={pending}
                title="Eliminar partido"
                className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-terracotta/40 hover:bg-terracotta/10 hover:text-terracotta disabled:opacity-50"
              >
                <Trash2 className="size-4" strokeWidth={2} />
              </button>
            }
          />
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

function CloseRoundButton({
  roundId,
  lockReason,
}: {
  roundId: string
  /** Si está definido, el cierre está bloqueado y este es el motivo. */
  lockReason?: string
}) {
  const boundAction = closeRoundAndAdvance.bind(null, roundId)
  const [state, formAction, pending] = useActionState(boundAction, initialState)
  const locked = !!lockReason

  return (
    <form
      action={formAction}
      className="rounded-xl border border-dashed border-border bg-card/50 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-foreground">Cerrar jornada</p>
          <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {locked ? (
              <>
                <Lock className="size-3" strokeWidth={2} />
                <span className="text-terracotta">{lockReason}</span>
              </>
            ) : (
              'Calcula ascensos y descensos · genera la jornada siguiente'
            )}
          </p>
        </div>
        <Button
          type="submit"
          variant="outline"
          className="h-9 shrink-0 gap-1.5 rounded-md px-4 text-sm"
          disabled={pending || locked}
          title={locked ? lockReason : undefined}
          aria-disabled={locked}
        >
          {locked ? (
            <Lock className="size-4" strokeWidth={2} />
          ) : (
            <FlagTriangleRight className="size-4" strokeWidth={2} />
          )}
          {pending
            ? 'Cerrando…'
            : locked
              ? 'Bloqueado'
              : 'Cerrar y generar siguiente'}
        </Button>
      </div>
      {state.error && (
        <p className="mt-2 text-xs text-destructive">{state.error}</p>
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
        {/* Apartado fijo: cada set reserva 30 min de cancha. */}
        <input type="hidden" name="durationMinutes" value="30" />
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
        Aplica el horario y la cancha a los 3 sets del grupo (30 min por set).
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
  rankingBy,
  noShowGamesAgainst,
  highlight,
}: {
  roundId: string
  group: RoundGroup
  roster?: GroupRoster
  maxGroupNumber: number
  courts: Option[]
  /** Criterio de ascenso/descenso: sets ganados o diferencia de juegos. */
  rankingBy: 'sets' | 'games' | 'both'
  /** Juegos en contra que el club asigna a quien no se presenta. */
  noShowGamesAgainst: number
  /** Texto de búsqueda ya normalizado, para resaltar el jugador coincidente. */
  highlight?: string
}) {
  const boundAction = captureGroupResults.bind(null, roundId)
  const [state, formAction, pending] = useActionState(boundAction, initialState)
  const [panel, setPanel] = useState<'none' | 'edit' | 'checkin'>('none')
  const [removing, startRemove] = useTransition()
  const [statusPending, startStatus] = useTransition()
  const [tiePending, startTie] = useTransition()

  // Selección del organizador para resolver empates, inicializada con la
  // decisión ya guardada (si la hay).
  const [chosenUp, setChosenUp] = useState(
    () =>
      roster?.members.find((m) => m.manualMovement === 'up')?.registrationId ??
      '',
  )
  const [chosenDown, setChosenDown] = useState(
    () =>
      roster?.members.find((m) => m.manualMovement === 'down')
        ?.registrationId ?? '',
  )

  // Ruleta de empate: `rolling` indica el lado que está sorteando ('up'/'down')
  // y `rollName` el nombre que se muestra girando. Al terminar fija la elección.
  const [rolling, setRolling] = useState<'up' | 'down' | null>(null)
  const [rollName, setRollName] = useState('')
  const rollTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(
    () => () => {
      rollTimers.current.forEach(clearTimeout)
    },
    [],
  )

  // Elige un ganador al azar entre los empatados con una animación de «ruleta»
  // que pasa por los nombres acelerando y frena hasta detenerse en el elegido.
  const rollRandom = (
    side: 'up' | 'down',
    options: { registrationId: string; name: string }[],
    setChosen: (v: string) => void,
  ) => {
    if (rolling || tiePending || options.length < 2) return
    const { finalIdx, steps } = randomRollPlan(options.length)
    setRolling(side)
    let i = 0
    const tick = () => {
      i += 1
      if (i >= steps) {
        setRollName(options[finalIdx].name)
        setChosen(options[finalIdx].registrationId)
        setRolling(null)
        return
      }
      setRollName(options[i % options.length].name)
      // Frenado: cada paso tarda un poco más que el anterior.
      const delay = 45 + Math.pow(i / steps, 2.6) * 340
      rollTimers.current.push(setTimeout(tick, delay))
    }
    tick()
  }

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
      // No se presentó: forfeit de sus 3 sets; los juegos en contra los fija el
      // club (noShowGamesAgainst).
      return {
        id: p.id,
        name: mem.fullName,
        note: mem.substituteName ? `No llegó · ${mem.substituteName}` : 'No llegó',
        isAbsent: true,
        setsWon: 0,
        setsLost: NO_SHOW_SETS,
        gamesFor: 0,
        gamesAgainst: noShowGamesAgainst,
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
  // Puntuación de ascenso/descenso: sets ganados (o dif. de juegos en ligas «por
  // juegos»). Ya no hay lista de desempates: los empates por subir/bajar los
  // resuelve el organizador a mano.
  const scoreOf = (s: GroupStat) =>
    rankingBy === 'games' ? s.gamesFor - s.gamesAgainst : s.setsWon

  const presentStats = stats.filter((s) => !s.isAbsent)
  const absentStats = stats.filter((s) => s.isAbsent)
  const hasAbsent = absentStats.length > 0
  // Puesto en la clasificación general de cada jugador (1 = mejor), para decidir
  // qué ausente desciende cuando varios faltan en el mismo grupo.
  const overallRankOf = (s: GroupStat) =>
    memberByPlayer.get(s.id)?.overallRank ?? Number.POSITIVE_INFINITY
  // Orden de visualización: presentes por puntuación (y nombre); ausentes al
  // final, ordenados por clasificación general (peor abajo → es quien desciende).
  const rankedStats = [
    ...[...presentStats].sort(
      (a, b) => scoreOf(b) - scoreOf(a) || a.name.localeCompare(b.name),
    ),
    ...[...absentStats].sort((a, b) => overallRankOf(a) - overallRankOf(b)),
  ]
  // De los ausentes, solo desciende el peor clasificado en la liga; el resto
  // mantiene su grupo aunque pierdan la jornada. (Coincide con el cierre de
  // jornada en el servidor.)
  const absentDescenderId = absentStats.length
    ? [...absentStats].sort((a, b) => overallRankOf(b) - overallRankOf(a))[0].id
    : null

  const isHighest = group.groupNumber === 1
  const isLowest = group.groupNumber >= maxGroupNumber
  // Candidatos al ascenso (mejor puntuación) y al descenso (peor). Con ausentes,
  // el descenso lo ocupan ellos, así que no hay empate por bajar.
  const topScore = presentStats.length
    ? Math.max(...presentStats.map(scoreOf))
    : 0
  const bottomScore = presentStats.length
    ? Math.min(...presentStats.map(scoreOf))
    : 0
  const upCandidates = isHighest
    ? []
    : presentStats.filter((s) => scoreOf(s) === topScore)
  const downCandidates =
    isLowest || hasAbsent
      ? []
      : presentStats.filter((s) => scoreOf(s) === bottomScore)
  const upTie = upCandidates.length > 1
  const downTie = downCandidates.length > 1

  // Decisión manual ya guardada (por jugador) para resolver el empate.
  const resolvedUpId =
    roster?.members.find((m) => m.manualMovement === 'up')?.playerId ?? null
  const resolvedDownId =
    roster?.members.find((m) => m.manualMovement === 'down')?.playerId ?? null
  const upPending = upTie && !resolvedUpId
  const downPending = downTie && !resolvedDownId

  // Movimiento mostrado por jugador. 'tie' = empate pendiente de decidir.
  const movementOf = (s: GroupStat): 'up' | 'down' | 'stay' | 'tie' => {
    // Ausente: pierde la jornada, pero solo desciende el peor clasificado de
    // entre los ausentes del grupo; los demás mantienen su grupo.
    if (s.isAbsent)
      return !isLowest && s.id === absentDescenderId ? 'down' : 'stay'
    if (!isHighest) {
      if (upTie) {
        if (resolvedUpId === s.id) return 'up'
        if (upPending && scoreOf(s) === topScore) return 'tie'
      } else if (upCandidates[0]?.id === s.id) return 'up'
    }
    if (!isLowest && !hasAbsent) {
      if (downTie) {
        if (resolvedDownId === s.id) return 'down'
        if (downPending && scoreOf(s) === bottomScore) return 'tie'
      } else if (downCandidates[0]?.id === s.id) return 'down'
    }
    return 'stay'
  }
  const movementLabel: Record<string, string> = {
    up: 'Sube',
    down: 'Baja',
    stay: 'Mantiene',
    tie: 'Empate',
  }

  // Opciones del selector de empate (el server espera la registración).
  const regOf = (playerId: string) =>
    memberByPlayer.get(playerId)?.registrationId ?? null
  const toOptions = (cands: GroupStat[]) =>
    cands
      .map((s) => ({ registrationId: regOf(s.id), name: s.name }))
      .filter(
        (o): o is { registrationId: string; name: string } =>
          !!o.registrationId,
      )
  const upOptions = toOptions(upCandidates)
  const downOptions = toOptions(downCandidates)
  // Solo ofrecemos resolver si conocemos las registraciones de los empatados.
  const showTieResolver =
    groupStatus === 'finished' &&
    ((upTie && upOptions.length === upCandidates.length) ||
      (downTie && downOptions.length === downCandidates.length))

  // Guarda la decisión del empate (quién sube / quién baja).
  const tieSaveDisabled =
    tiePending ||
    rolling !== null ||
    (upTie && !chosenUp) ||
    (downTie && !chosenDown) ||
    (upTie && downTie && chosenUp === chosenDown)
  const saveTie = () => {
    if (tieSaveDisabled) return
    startTie(() => {
      void setGroupTieDecision(
        roundId,
        group.groupNumber,
        upTie ? chosenUp || null : null,
        downTie ? chosenDown || null : null,
      )
    })
  }

  // ¿Coincide este nombre con la búsqueda activa? (para resaltarlo).
  const isHit = (name: string) =>
    !!highlight && normalizeText(name).includes(highlight)

  const remove = () => {
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
          <ConfirmDialog
            title={`¿Eliminar el grupo ${group.groupNumber}?`}
            description="Se borrarán sus 3 sets. Esta acción no se puede deshacer."
            confirmLabel="Eliminar"
            destructive
            onConfirm={remove}
            trigger={
              <button
                type="button"
                disabled={removing}
                title="Eliminar grupo"
                className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-terracotta/40 hover:bg-terracotta/10 hover:text-terracotta disabled:opacity-50"
              >
                <Trash2 className="size-4" strokeWidth={2} />
              </button>
            }
          />
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
            «No llegó» hace que el jugador pierda la jornada (último del grupo).
            Si faltan varios, solo desciende el peor clasificado de la liga; el
            resto mantiene su grupo. El suplente cubre el partido, pero sus puntos
            no cuentan.
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
                const mv = movementOf(s)
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
                              : mv === 'tie'
                                ? 'text-ochre'
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

      {showTieResolver && (
        <div className="mt-3 rounded-lg border border-ochre/40 bg-ochre/5 p-4">
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ochre">
            <TriangleAlert className="size-3.5" strokeWidth={2} />
            Empate — decide quién {upTie && downTie
              ? 'sube y baja'
              : upTie
                ? 'sube'
                : 'baja'}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Hay empate en{' '}
            {rankingBy === 'games' ? 'la diferencia de juegos' : 'los sets ganados'}
            . El sistema no decide el ascenso/descenso: elígelo tú o deja que el
            dado lo sortee al azar para poder cerrar la jornada.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            {upTie && (
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Sube
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={chosenUp}
                    onChange={(e) => setChosenUp(e.target.value)}
                    disabled={tiePending || rolling !== null}
                    className={cn(fieldCls, 'w-44')}
                  >
                    <option value="">Elegir…</option>
                    {upOptions.map((o) => (
                      <option key={o.registrationId} value={o.registrationId}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Elegir al azar"
                    onClick={() => rollRandom('up', upOptions, setChosenUp)}
                    disabled={tiePending || rolling !== null}
                    className="shrink-0 rounded-md"
                  >
                    <Dices
                      className={cn('size-4', rolling === 'up' && 'animate-spin')}
                      strokeWidth={2}
                    />
                  </Button>
                </div>
                {rolling === 'up' && (
                  <span className="animate-pulse font-mono text-xs font-medium text-ochre">
                    {rollName}
                  </span>
                )}
              </label>
            )}
            {downTie && (
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Baja
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={chosenDown}
                    onChange={(e) => setChosenDown(e.target.value)}
                    disabled={tiePending || rolling !== null}
                    className={cn(fieldCls, 'w-44')}
                  >
                    <option value="">Elegir…</option>
                    {downOptions.map((o) => (
                      <option key={o.registrationId} value={o.registrationId}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Elegir al azar"
                    onClick={() => rollRandom('down', downOptions, setChosenDown)}
                    disabled={tiePending || rolling !== null}
                    className="shrink-0 rounded-md"
                  >
                    <Dices
                      className={cn(
                        'size-4',
                        rolling === 'down' && 'animate-spin',
                      )}
                      strokeWidth={2}
                    />
                  </Button>
                </div>
                {rolling === 'down' && (
                  <span className="animate-pulse font-mono text-xs font-medium text-ochre">
                    {rollName}
                  </span>
                )}
              </label>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={saveTie}
              disabled={tieSaveDisabled}
              className="h-9 gap-1.5 rounded-md px-4 text-sm"
            >
              <Save className="size-4" strokeWidth={2} />
              {tiePending ? 'Guardando…' : 'Guardar decisión'}
            </Button>
          </div>
          {upTie && downTie && chosenUp && chosenUp === chosenDown && (
            <p className="mt-2 text-xs text-destructive">
              El mismo jugador no puede subir y bajar.
            </p>
          )}
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
                  inputMode="numeric"
                  min={0}
                  max={MAX_GAMES_PER_SET}
                  onInput={clampGamesInput}
                  defaultValue={set?.gamesA ?? ''}
                  className={cn(fieldCls, 'w-14 text-center')}
                />
                <span className="text-muted-foreground">–</span>
                <input
                  name="gamesB"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX_GAMES_PER_SET}
                  onInput={clampGamesInput}
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
  playKind,
  bestOfSets,
  rankingBy,
  noShowGamesAgainst,
  defaultDateTime,
}: {
  roundId: string
  players: Option[]
  courts: Option[]
  matches: MatchItem[]
  rosters: GroupRoster[]
  playKind: 'individual' | 'pairs'
  bestOfSets: number
  rankingBy: 'sets' | 'games' | 'both'
  noShowGamesAgainst: number
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

  // Candado de cierre: no se puede cerrar y generar la siguiente jornada hasta
  // que todos los grupos (todos sus partidos) estén finalizados.
  const unfinishedGroups = groups.filter(
    (g) => !g.matches.every((m) => m.status === 'finished'),
  ).length
  const pendingMatches = matches.filter((m) => m.status !== 'finished').length
  const lockReason =
    pendingMatches === 0
      ? undefined
      : unfinishedGroups > 0
        ? `Faltan ${unfinishedGroups} grupo${
            unfinishedGroups === 1 ? '' : 's'
          } por finalizar`
        : `Faltan ${pendingMatches} partido${
            pendingMatches === 1 ? '' : 's'
          } por finalizar`

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
                rankingBy={rankingBy}
                noShowGamesAgainst={noShowGamesAgainst}
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
          <CloseRoundButton roundId={roundId} lockReason={lockReason} />
        </>
      )}
    </section>
  )
}
