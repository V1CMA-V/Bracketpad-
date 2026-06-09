'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { Clock, Plus, Save, Search, Trash2, Wand2, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { MAX_GAMES_PER_SET } from '@/lib/league-rules'
import { Button } from '@/components/ui/button'
import {
  captureGroupResults,
  createPairGroup,
  deleteGroup,
  generatePairGroupsFromStandings,
  setGroupStatus,
  updatePairGroupDetails,
  type MatchState,
} from '@/app/dashboard/ligas/[id]/jornadas/[roundId]/actions'
import type {
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
        <Button
          type="submit"
          className="h-9 shrink-0 gap-1.5 rounded-md px-4 text-sm"
          disabled={pending || !enoughTeams || !enoughCourts}
        >
          <Plus className="size-4" strokeWidth={2} />
          {pending ? 'Creando…' : 'Crear grupo'}
        </Button>
      </div>
      {state.fieldErrors?.groupNumber?.[0] && (
        <p className="mt-1.5 text-xs text-destructive">
          {state.fieldErrors.groupNumber[0]}
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

  return (
    <form
      action={formAction}
      className="mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-3"
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
      {(state.error || state.fieldErrors?.courtBId?.[0]) && (
        <p className="text-xs text-destructive sm:col-span-3">
          {state.error ?? state.fieldErrors?.courtBId?.[0]}
        </p>
      )}
      <div className="flex justify-end gap-2 sm:col-span-3">
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
/*  Tarjeta de grupo                                                           */
/* -------------------------------------------------------------------------- */

function PairGroupCard({
  roundId,
  group,
  courts,
  rankingBy,
  highlight,
}: {
  roundId: string
  group: RoundGroup
  courts: Option[]
  rankingBy: 'sets' | 'games' | 'both'
  highlight?: string
}) {
  const boundAction = captureGroupResults.bind(null, roundId)
  const [state, formAction, pending] = useActionState(boundAction, initialState)
  const [editing, setEditing] = useState(false)
  const [removing, startRemove] = useTransition()
  const [statusPending, startStatus] = useTransition()

  const matches = [...group.matches].sort(
    (a, b) => (a.intraGroupOrder ?? 0) - (b.intraGroupOrder ?? 0),
  )

  // Las 4 parejas del grupo, derivadas de los lados de los partidos.
  const teams = new Map<string, { key: string; label: string }>()
  for (const m of matches) {
    for (const side of [m.sideA, m.sideB]) {
      const key = teamKey(side)
      if (key && !teams.has(key)) teams.set(key, { key, label: sideLabel(side) })
    }
  }

  const groupStatus = (() => {
    if (matches.every((m) => m.status === 'finished')) return 'finished'
    if (matches.some((m) => m.status === 'in_progress')) return 'in_progress'
    if (matches.some((m) => m.status === 'suspended')) return 'suspended'
    if (matches.some((m) => m.status === 'cancelled')) return 'cancelled'
    if (matches.some((m) => m.status === 'walkover')) return 'walkover'
    return 'scheduled'
  })()

  // Estadísticas por pareja a partir de los resultados (un set por partido).
  type Stat = {
    key: string
    label: string
    wins: number
    losses: number
    setsWon: number
    gamesFor: number
    gamesAgainst: number
  }
  const stats = new Map<string, Stat>()
  for (const [key, t] of teams) {
    stats.set(key, {
      key,
      label: t.label,
      wins: 0,
      losses: 0,
      setsWon: 0,
      gamesFor: 0,
      gamesAgainst: 0,
    })
  }
  for (const m of matches) {
    const set = m.sets[0]
    if (!set) continue
    const a = stats.get(teamKey(m.sideA))
    const b = stats.get(teamKey(m.sideB))
    if (a) {
      a.gamesFor += set.gamesA
      a.gamesAgainst += set.gamesB
      if (m.winnerSide === 'A') {
        a.wins += 1
        a.setsWon += 1
      } else if (m.winnerSide) a.losses += 1
    }
    if (b) {
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
  const rankedStats = [...stats.values()].sort(
    (a, b) =>
      scoreOf(b) - scoreOf(a) ||
      b.gamesFor - b.gamesAgainst - (a.gamesFor - a.gamesAgainst) ||
      a.label.localeCompare(b.label),
  )

  const isHit = (name: string) =>
    !!highlight && normalizeText(name).includes(highlight)

  const remove = () => {
    if (!confirm(`¿Eliminar el grupo ${group.groupNumber} y sus 6 partidos?`))
      return
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
            {[...teams.values()].map((t, i) => (
              <span key={t.key}>
                {i > 0 && ' · '}
                <span className={cn(isHit(t.label) && 'font-semibold text-primary')}>
                  {t.label}
                </span>
              </span>
            ))}
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
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            title="Editar horario y canchas del grupo"
            className={cn(
              'flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              editing && 'bg-muted text-foreground',
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

      {editing && (
        <PairGroupDetailsForm
          roundId={roundId}
          group={group}
          courts={courts}
          onDone={() => setEditing(false)}
        />
      )}

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
              </tr>
            </thead>
            <tbody>
              {rankedStats.map((s, i) => {
                const diff = s.gamesFor - s.gamesAgainst
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
                          i === 0 && 'font-medium',
                          isHit(s.label) && 'font-semibold text-primary',
                        )}
                      >
                        {s.label}
                      </span>
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
  defaultDateTime,
}: {
  roundId: string
  /** Parejas inscritas activas: id = registrationId, name = etiqueta de pareja. */
  teams: Option[]
  courts: Option[]
  matches: MatchItem[]
  rosters: GroupRoster[]
  rankingBy: 'sets' | 'games' | 'both'
  defaultDateTime?: string
}) {
  const [query, setQuery] = useState('')

  // Parejas ya asignadas a un grupo de esta jornada (no se vuelven a ofrecer).
  const usedRegs = new Set(
    rosters.flatMap((r) => r.members.map((m) => m.registrationId)),
  )
  const availableTeams = teams.filter((t) => !usedRegs.has(t.id))

  const byGroup = new Map<number, MatchItem[]>()
  for (const m of matches) {
    if (m.groupNumber == null) continue
    const list = byGroup.get(m.groupNumber) ?? []
    list.push(m)
    byGroup.set(m.groupNumber, list)
  }
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
                courts={courts}
                rankingBy={rankingBy}
                highlight={q}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
