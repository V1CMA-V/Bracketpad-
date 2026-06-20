'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import {
  ClipboardCheck,
  Clock,
  FlagTriangleRight,
  Lock,
  Plus,
  Save,
  Search,
  Trash2,
  Wand2,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { MAX_GAMES_PER_SET, NO_SHOW_SETS } from '@/lib/league-rules'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DurationSelect } from '@/components/dashboard/duration-select'
import {
  captureGroupResults,
  closeRoundAndAdvancePairs,
  createPairGroup,
  deleteGroup,
  generatePairGroupsFromStandings,
  setGroupStatus,
  setSlotAttendance,
  updatePairGroupDetails,
  type MatchState,
} from '@/app/dashboard/ligas/[id]/jornadas/[roundId]/actions'
import type {
  Attendance,
  GroupRoster,
  MatchItem,
  SidePlayer,
} from '@/components/dashboard/round-matches'

const fieldCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const initialState: MatchState = {}

type Option = { id: string; name: string }

/** Limita el input de juegos a dígitos con tope MAX_GAMES_PER_SET (7). */
const clampGamesInput = (e: React.FormEvent<HTMLInputElement>) => {
  const el = e.currentTarget
  const digits = el.value.replace(/[^\d]/g, '')
  el.value = digits === '' ? '' : String(Math.min(parseInt(digits, 10), MAX_GAMES_PER_SET))
}

const normalizeText = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

const statusLabels: Record<string, string> = {
  scheduled: 'Programado',
  in_progress: 'En juego',
  suspended: 'Suspendido',
  finished: 'Finalizado',
  walkover: 'W.O.',
  cancelled: 'Cancelado',
}

const manualStatusOptions: { value: string; label: string }[] = [
  { value: 'scheduled', label: 'Programado' },
  { value: 'in_progress', label: 'En juego' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'walkover', label: 'W.O.' },
  { value: 'cancelled', label: 'Cancelado' },
]

/** Etiqueta de una pareja a partir de los jugadores de un lado del partido. */
const sideLabel = (players: SidePlayer[]) =>
  players.length > 0 ? players.map((p) => p.name).join(' / ') : '—'

/** Clave estable de una pareja: ids de sus jugadores ordenados. */
const teamKey = (players: SidePlayer[]) =>
  players
    .map((p) => p.id)
    .sort()
    .join('|')

type RoundGroup = {
  groupNumber: number
  matches: MatchItem[]
  courtNames: string[]
  scheduledLabel: string | null
}

/* -------------------------------------------------------------------------- */
/*  Autogenerar grupos                                                         */
/* -------------------------------------------------------------------------- */

function GeneratePairGroupsButton({ roundId }: { roundId: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const run = () => {
    setError(null)
    start(async () => {
      const res = await generatePairGroupsFromStandings(roundId)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            Autogenerar grupos
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Reparte las parejas activas en grupos de 4 por clasificación y asigna
            2 canchas a cada grupo.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={run}
          disabled={pending}
          className="h-9 shrink-0 gap-1.5 rounded-md px-4 text-sm"
        >
          <Wand2 className="size-4" strokeWidth={2} />
          {pending ? 'Generando…' : 'Generar grupos'}
        </Button>
      </div>
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Cerrar jornada (ascenso/descenso → genera la siguiente)                    */
/* -------------------------------------------------------------------------- */

function ClosePairRoundButton({
  roundId,
  lockReason,
}: {
  roundId: string
  /** Si está definido, el cierre está bloqueado y este es el motivo. */
  lockReason?: string
}) {
  const boundAction = closeRoundAndAdvancePairs.bind(null, roundId)
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
/*  Crear grupo de 4 parejas                                                   */
/* -------------------------------------------------------------------------- */

function TeamSelect({
  name,
  teams,
  placeholder,
  invalid,
}: {
  name: string
  teams: Option[]
  placeholder: string
  invalid?: boolean
}) {
  return (
    <select
      name={name}
      required
      aria-invalid={invalid}
      defaultValue=""
      className={cn(fieldCls, 'appearance-none')}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  )
}

function CourtSelect({
  name,
  courts,
  placeholder,
  invalid,
}: {
  name: string
  courts: Option[]
  placeholder: string
  invalid?: boolean
}) {
  return (
    <select
      name={name}
      required
      aria-invalid={invalid}
      defaultValue=""
      disabled={courts.length === 0}
      className={cn(fieldCls, 'appearance-none')}
    >
      <option value="" disabled>
        {courts.length === 0 ? 'Sin canchas' : placeholder}
      </option>
      {courts.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}

function CreatePairGroupForm({
  roundId,
  teams,
  courts,
  defaultDateTime,
}: {
  roundId: string
  teams: Option[]
  courts: Option[]
  defaultDateTime?: string
}) {
  const boundAction = createPairGroup.bind(null, roundId)
  const [state, formAction, pending] = useActionState(boundAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  const enoughTeams = teams.length >= 4
  const enoughCourts = courts.length >= 2

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
      {!enoughCourts && (
        <p className="mb-3 text-xs text-ochre">
          Necesitas al menos 2 canchas activas para crear un grupo de parejas.
        </p>
      )}

      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Parejas del grupo
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {(['t1', 't2', 't3', 't4'] as const).map((n, i) => (
          <div key={n}>
            <TeamSelect
              name={n}
              teams={teams}
              placeholder={`Pareja ${i + 1}…`}
              invalid={!!state.fieldErrors?.[n]}
            />
            {state.fieldErrors?.[n]?.[0] && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors[n]![0]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Cancha A
          </label>
          <CourtSelect
            name="courtAId"
            courts={courts}
            placeholder="Cancha A…"
            invalid={!!state.fieldErrors?.courtAId}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Cancha B
          </label>
          <CourtSelect
            name="courtBId"
            courts={courts}
            placeholder="Cancha B…"
            invalid={!!state.fieldErrors?.courtBId}
          />
        </div>
      </div>
      {state.fieldErrors?.courtBId?.[0] && (
        <p className="mt-1 text-xs text-destructive">
          {state.fieldErrors.courtBId[0]}
        </p>
      )}

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
            placeholder="Auto"
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
        <div className="sm:w-32">
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Apartado
          </label>
          <DurationSelect />
        </div>
        <Button
          type="submit"
          className="h-9 shrink-0 gap-1.5 rounded-md px-4 text-sm"
          disabled={pending || !enoughTeams || !enoughCourts}
        >
          <Plus className="size-4" strokeWidth={2} />
          {pending ? 'Creando…' : 'Crear grupo'}
        </Button>
      </div>
      {(state.error || state.fieldErrors?.groupNumber?.[0]) && (
        <p className="mt-1.5 text-xs text-destructive">
          {state.error ?? state.fieldErrors?.groupNumber?.[0]}
        </p>
      )}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
        4 parejas, todos contra todos a un juego. 6 partidos repartidos en las 2
        canchas.
      </p>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*  Editar horario y canchas de un grupo                                       */
/* -------------------------------------------------------------------------- */

function PairGroupDetailsForm({
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
  const boundAction = updatePairGroupDetails.bind(
    null,
    roundId,
    group.groupNumber,
  )
  const [state, formAction, pending] = useActionState(boundAction, initialState)

  useEffect(() => {
    if (state.success) onDone()
  }, [state.success, onDone])

  // Cancha actual de cada lado: A = orden impar, B = orden par.
  const courtOf = (orders: number[]) =>
    group.matches.find((m) => orders.includes(m.intraGroupOrder ?? 0))?.courtId ??
    ''
  const courtA = courtOf([1, 3, 5])
  const courtB = courtOf([2, 4, 6])
  const when = group.matches.find((m) => m.scheduledValue)?.scheduledValue ?? ''
  const duration =
    group.matches.find((m) => m.durationMinutes != null)?.durationMinutes ?? null

  return (
    <form
      action={formAction}
      className="mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Cancha A
        </label>
        <select
          name="courtAId"
          defaultValue={courtA}
          className={cn(fieldCls, 'appearance-none')}
        >
          {courts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Cancha B
        </label>
        <select
          name="courtBId"
          defaultValue={courtB}
          className={cn(fieldCls, 'appearance-none')}
        >
          {courts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Horario
        </label>
        <input
          name="scheduledAt"
          type="datetime-local"
          defaultValue={when}
          className={cn(fieldCls, 'w-full')}
          aria-invalid={!!state.fieldErrors?.scheduledAt}
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Apartado
        </label>
        <DurationSelect defaultValue={duration} />
      </div>
      {(state.error || state.fieldErrors?.courtBId?.[0]) && (
        <p className="text-xs text-destructive sm:col-span-2 lg:col-span-4">
          {state.error ?? state.fieldErrors?.courtBId?.[0]}
        </p>
      )}
      <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          className="h-9 rounded-md px-4 text-sm"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="outline"
          disabled={pending}
          className="h-9 gap-1.5 rounded-md px-4 text-sm"
        >
          <Save className="size-4" strokeWidth={2} />
          {pending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*  Pase de lista de una pareja                                                */
/* -------------------------------------------------------------------------- */

/** Una fila del pase de lista de parejas: marca asistencia y suplente. */
function PairAttendanceRow({
  roundId,
  member,
  label,
}: {
  roundId: string
  member: GroupRoster['members'][number]
  /** Etiqueta de la pareja (ambos jugadores). */
  label: string
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
          {label}
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
            placeholder="Pareja suplente…"
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

/* -------------------------------------------------------------------------- */
/*  Tarjeta de grupo                                                           */
/* -------------------------------------------------------------------------- */

function PairGroupCard({
  roundId,
  group,
  roster,
  courts,
  rankingBy,
  maxGroupNumber,
  noShowGamesAgainst,
  teamLabelByReg,
  highlight,
}: {
  roundId: string
  group: RoundGroup
  roster?: GroupRoster
  courts: Option[]
  rankingBy: 'sets' | 'games' | 'both'
  maxGroupNumber: number
  /** Juegos en contra que el club asigna a la pareja que no se presenta. */
  noShowGamesAgainst: number
  /** Etiqueta de cada pareja por registrationId (para el pase de lista). */
  teamLabelByReg: Map<string, string>
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

  // Las 4 parejas del grupo, derivadas de los lados de los partidos.
  const teams = new Map<
    string,
    { key: string; label: string; playerIds: string[] }
  >()
  for (const m of matches) {
    for (const side of [m.sideA, m.sideB]) {
      const key = teamKey(side)
      if (key && !teams.has(key))
        teams.set(key, {
          key,
          label: sideLabel(side),
          playerIds: side.map((p) => p.id),
        })
    }
  }

  // Pase de lista de la pareja por id de jugador (cualquiera de los dos resuelve
  // el slot, que es por inscripción/pareja).
  const memberByPlayer = new Map(
    (roster?.members ?? []).map((m) => [m.playerId, m] as const),
  )
  const absentMemberOf = (playerIds: string[]) => {
    const mem = playerIds.map((id) => memberByPlayer.get(id)).find((m) => !!m)
    return mem?.attendance === 'absent' ? mem : null
  }

  const groupStatus = (() => {
    if (matches.every((m) => m.status === 'finished')) return 'finished'
    if (matches.some((m) => m.status === 'in_progress')) return 'in_progress'
    if (matches.some((m) => m.status === 'suspended')) return 'suspended'
    if (matches.some((m) => m.status === 'cancelled')) return 'cancelled'
    if (matches.some((m) => m.status === 'walkover')) return 'walkover'
    return 'scheduled'
  })()

  // Estadísticas por pareja a partir de los resultados (un set por partido). La
  // pareja que no se presenta pierde la jornada: forfeit de sus partidos y
  // último puesto, igual que en el formato individual.
  type Stat = {
    key: string
    label: string
    note: string | null
    isAbsent: boolean
    wins: number
    losses: number
    setsWon: number
    gamesFor: number
    gamesAgainst: number
  }
  const stats = new Map<string, Stat>()
  for (const [key, t] of teams) {
    const absentMem = absentMemberOf(t.playerIds)
    if (absentMem) {
      stats.set(key, {
        key,
        label: t.label,
        note: absentMem.substituteName
          ? `No llegó · ${absentMem.substituteName}`
          : 'No llegó',
        isAbsent: true,
        wins: 0,
        losses: NO_SHOW_SETS,
        setsWon: 0,
        gamesFor: 0,
        gamesAgainst: noShowGamesAgainst,
      })
    } else {
      stats.set(key, {
        key,
        label: t.label,
        note: null,
        isAbsent: false,
        wins: 0,
        losses: 0,
        setsWon: 0,
        gamesFor: 0,
        gamesAgainst: 0,
      })
    }
  }
  for (const m of matches) {
    const set = m.sets[0]
    if (!set) continue
    const a = stats.get(teamKey(m.sideA))
    const b = stats.get(teamKey(m.sideB))
    // Una pareja ausente conserva su forfeit: no se le suman los resultados que
    // jugó su pareja suplente.
    if (a && !a.isAbsent) {
      a.gamesFor += set.gamesA
      a.gamesAgainst += set.gamesB
      if (m.winnerSide === 'A') {
        a.wins += 1
        a.setsWon += 1
      } else if (m.winnerSide) a.losses += 1
    }
    if (b && !b.isAbsent) {
      b.gamesFor += set.gamesB
      b.gamesAgainst += set.gamesA
      if (m.winnerSide === 'B') {
        b.wins += 1
        b.setsWon += 1
      } else if (m.winnerSide) b.losses += 1
    }
  }
  const scoreOf = (s: Stat) =>
    rankingBy === 'games' ? s.gamesFor - s.gamesAgainst : s.setsWon
  const allStats = [...stats.values()]
  const hasAbsent = allStats.some((s) => s.isAbsent)
  // Puesto en la clasificación general de cada pareja (1 = mejor), tomado de
  // cualquiera de sus jugadores, para decidir qué ausente desciende cuando varias
  // faltan en el mismo grupo.
  const overallRankOfStat = (s: Stat): number => {
    for (const id of teams.get(s.key)?.playerIds ?? []) {
      const r = memberByPlayer.get(id)?.overallRank
      if (r != null) return r
    }
    return Number.POSITIVE_INFINITY
  }
  // Orden: primero las parejas presentes por puntuación; las ausentes al final,
  // ordenadas por clasificación general (peor abajo → es quien desciende).
  const rankedStats = [
    ...allStats
      .filter((s) => !s.isAbsent)
      .sort(
        (a, b) =>
          scoreOf(b) - scoreOf(a) ||
          b.gamesFor - b.gamesAgainst - (a.gamesFor - a.gamesAgainst) ||
          a.label.localeCompare(b.label),
      ),
    ...allStats
      .filter((s) => s.isAbsent)
      .sort((a, b) => overallRankOfStat(a) - overallRankOfStat(b)),
  ]
  const presentCount = allStats.filter((s) => !s.isAbsent).length
  // De las parejas ausentes, solo desciende la peor clasificada en la liga; el
  // resto mantiene su grupo aunque pierdan la jornada.
  const absentDescenderKey = allStats.some((s) => s.isAbsent)
    ? [...allStats.filter((s) => s.isAbsent)].sort(
        (a, b) => overallRankOfStat(b) - overallRankOfStat(a),
      )[0].key
    : null

  // Ascenso/descenso de parejas: el grupo más alto no sube, el más bajo no baja.
  // La mejor pareja del grupo sube; la peor baja, salvo que haya ausentes, que
  // ocupan el descenso (solo la peor clasificada de ellas). Empates de presentes
  // resueltos por el orden de la tabla.
  const isHighest = group.groupNumber === 1
  const isLowest = group.groupNumber >= maxGroupNumber
  const movementOf = (s: Stat, i: number): 'up' | 'down' | 'stay' => {
    if (s.isAbsent)
      return !isLowest && s.key === absentDescenderKey ? 'down' : 'stay'
    if (i === 0 && !isHighest && presentCount > 0) return 'up'
    if (i === presentCount - 1 && !isLowest && !hasAbsent) return 'down'
    return 'stay'
  }
  const movementLabel: Record<string, string> = {
    up: 'Sube',
    down: 'Baja',
    stay: 'Mantiene',
  }

  const isHit = (name: string) =>
    !!highlight && normalizeText(name).includes(highlight)

  const remove = () => {
    startRemove(() => void deleteGroup(roundId, group.groupNumber))
  }

  // Remonta el formulario cuando cambian los resultados persistidos.
  const formKey = matches
    .map((m) => `${m.id}:${m.sets.map((s) => `${s.gamesA}-${s.gamesB}`).join(',')}`)
    .join('|')

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card/30 p-4',
        removing && 'opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-xl tracking-tight text-foreground">
            Grupo {group.groupNumber}
          </h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {[...teams.values()].map((t, i) => {
              const absentMem = absentMemberOf(t.playerIds)
              return (
                <span key={t.key}>
                  {i > 0 && ' · '}
                  <span
                    className={cn(
                      isHit(t.label) && 'font-semibold text-primary',
                      absentMem && 'line-through',
                    )}
                  >
                    {t.label}
                  </span>
                  {absentMem?.substituteName && (
                    <span className="no-underline"> → {absentMem.substituteName}</span>
                  )}
                </span>
              )
            })}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>{statusLabels[groupStatus] ?? groupStatus}</span>
            {group.scheduledLabel && (
              <>
                <span className="text-foreground/25">·</span>
                <span className="normal-case tracking-normal">
                  {group.scheduledLabel}
                </span>
              </>
            )}
            {group.courtNames.length > 0 && (
              <>
                <span className="text-foreground/25">·</span>
                <span>Canchas {group.courtNames.join(' · ')}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <select
            value={groupStatus}
            disabled={statusPending || groupStatus === 'finished'}
            onChange={(e) =>
              startStatus(
                () => void setGroupStatus(roundId, group.groupNumber, e.target.value),
              )
            }
            className={cn(fieldCls, 'h-8 w-auto appearance-none px-2 text-xs')}
          >
            {manualStatusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
            {groupStatus === 'finished' && (
              <option value="finished">Finalizado</option>
            )}
          </select>
          {roster?.members.length ? (
            <button
              type="button"
              onClick={() =>
                setPanel((p) => (p === 'checkin' ? 'none' : 'checkin'))
              }
              title="Pase de lista del grupo"
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
            title="Editar horario y canchas del grupo"
            className={cn(
              'flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              panel === 'edit' && 'bg-muted text-foreground',
            )}
          >
            <Clock className="size-4" strokeWidth={2} />
          </button>
          <ConfirmDialog
            title={`¿Eliminar el grupo ${group.groupNumber}?`}
            description="Se borrarán sus 6 partidos. Esta acción no se puede deshacer."
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
        <PairGroupDetailsForm
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
              <PairAttendanceRow
                key={mem.registrationId}
                roundId={roundId}
                member={mem}
                label={teamLabelByReg.get(mem.registrationId) ?? mem.fullName}
              />
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
            «No llegó» hace que la pareja pierda la jornada (último del grupo).
            Si faltan varias, solo desciende la peor clasificada de la liga; el
            resto mantiene su grupo. La pareja suplente cubre los partidos, pero
            sus puntos no cuentan.
          </p>
        </div>
      ) : null}

      {groupStatus === 'finished' && (
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 text-left font-normal">#</th>
                <th className="px-3 py-2 text-left font-normal">Pareja</th>
                <th className="px-3 py-2 text-center font-normal">G-P</th>
                <th className="px-3 py-2 text-center font-normal">Juegos</th>
                <th className="px-3 py-2 text-center font-normal">Dif.</th>
                <th className="px-3 py-2 text-right font-normal">Mov.</th>
              </tr>
            </thead>
            <tbody>
              {rankedStats.map((s, i) => {
                const diff = s.gamesFor - s.gamesAgainst
                const mv = movementOf(s, i)
                return (
                  <tr
                    key={s.key}
                    className={cn(
                      'border-b border-border/60 last:border-0',
                      isHit(s.label) && 'bg-primary/10',
                    )}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground tabular-nums">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'text-foreground',
                          s.isAbsent && 'text-muted-foreground line-through',
                          i === 0 && !s.isAbsent && 'font-medium',
                          isHit(s.label) && 'font-semibold text-primary',
                        )}
                      >
                        {s.label}
                      </span>
                      {s.note && (
                        <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-terracotta">
                          {s.note}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums">
                      {s.wins}–{s.losses}
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
        {state.error && <p className="text-xs text-destructive">{state.error}</p>}
        {matches.map((m) => {
          const set = m.sets[0]
          const round = Math.ceil((m.intraGroupOrder ?? 0) / 2)
          return (
            <div
              key={m.id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-background/40 px-3 py-2"
            >
              <input type="hidden" name="matchId" value={m.id} />
              <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="flex size-7 items-center justify-center rounded border border-border tabular-nums">
                  R{round || '?'}
                </span>
                {m.courtName && <span>{m.courtName}</span>}
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={cn(
                    'truncate text-sm text-foreground',
                    m.winnerSide === 'A' && 'font-medium',
                  )}
                >
                  {sideLabel(m.sideA)}
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
                  {sideLabel(m.sideB)}
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
            Cada enfrentamiento es a un juego. Deja vacíos los no jugados.
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

export function PairRoundMatches({
  roundId,
  teams,
  courts,
  matches,
  rosters,
  rankingBy,
  noShowGamesAgainst,
  defaultDateTime,
}: {
  roundId: string
  /** Parejas inscritas activas: id = registrationId, name = etiqueta de pareja. */
  teams: Option[]
  courts: Option[]
  matches: MatchItem[]
  rosters: GroupRoster[]
  rankingBy: 'sets' | 'games' | 'both'
  /** Juegos en contra que el club asigna a la pareja que no se presenta. */
  noShowGamesAgainst: number
  defaultDateTime?: string
}) {
  const [query, setQuery] = useState('')

  // Parejas ya asignadas a un grupo de esta jornada (no se vuelven a ofrecer).
  const usedRegs = new Set(
    rosters.flatMap((r) => r.members.map((m) => m.registrationId)),
  )
  const availableTeams = teams.filter((t) => !usedRegs.has(t.id))
  const rosterByGroup = new Map(rosters.map((r) => [r.groupNumber, r]))
  const teamLabelByReg = new Map(teams.map((t) => [t.id, t.name]))

  const byGroup = new Map<number, MatchItem[]>()
  for (const m of matches) {
    if (m.groupNumber == null) continue
    const list = byGroup.get(m.groupNumber) ?? []
    list.push(m)
    byGroup.set(m.groupNumber, list)
  }
  const maxGroupNumber = byGroup.size ? Math.max(...byGroup.keys()) : 0
  const groups: RoundGroup[] = [...byGroup.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([groupNumber, ms]) => {
      const sorted = [...ms].sort(
        (a, b) => (a.intraGroupOrder ?? 0) - (b.intraGroupOrder ?? 0),
      )
      const courtNames = [
        ...new Set(sorted.map((m) => m.courtName).filter((n): n is string => !!n)),
      ]
      return {
        groupNumber,
        matches: ms,
        courtNames,
        scheduledLabel: sorted.find((m) => m.scheduledLabel)?.scheduledLabel ?? null,
      }
    })

  const groupNames = (g: RoundGroup) => {
    const names = new Set<string>()
    for (const m of g.matches)
      for (const p of [...m.sideA, ...m.sideB]) names.add(p.name)
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
      {teams.length < 4 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Necesitas al menos 4 parejas inscritas en la liga para crear grupos.
          </p>
        </div>
      ) : (
        <>
          {matches.length === 0 && <GeneratePairGroupsButton roundId={roundId} />}
          <CreatePairGroupForm
            roundId={roundId}
            teams={availableTeams}
            courts={courts}
            defaultDateTime={defaultDateTime}
          />
        </>
      )}

      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay grupos en esta jornada todavía.
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
                placeholder="Buscar pareja por nombre…"
                aria-label="Buscar pareja en los grupos"
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
              <PairGroupCard
                key={g.groupNumber}
                roundId={roundId}
                group={g}
                roster={rosterByGroup.get(g.groupNumber)}
                courts={courts}
                rankingBy={rankingBy}
                maxGroupNumber={maxGroupNumber}
                noShowGamesAgainst={noShowGamesAgainst}
                teamLabelByReg={teamLabelByReg}
                highlight={q}
              />
            ))}
          </div>
          <ClosePairRoundButton roundId={roundId} lockReason={lockReason} />
        </>
      )}
    </section>
  )
}
