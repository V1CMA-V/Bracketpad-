'use client'

import { useMemo, useState, useTransition } from 'react'
import { ChevronDown, ChevronUp, Shuffle, Trash2, Trophy } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MatchResultSheet,
  formatSet,
  type CourtOption,
  type FixtureSet,
} from '@/components/dashboard/match-result-sheet'
import type { GroupData } from '@/components/dashboard/tournament-group-generator'
import {
  clamp,
  computeGroupStandings,
} from '@/lib/tournament-groups'
import {
  roundLabel,
  roundSortIndex,
  selectQualifiers,
  type TeamStanding,
} from '@/lib/tournament-bracket'
import {
  clearBracket,
  generateBracket,
} from '@/app/dashboard/torneos/[id]/categorias/[catId]/actions'

/** Partido de la llave ya generada, con etiquetas listas para mostrar. */
export type BracketMatch = {
  id: string
  round: string
  slot: number
  aLabel: string
  bLabel: string
  winnerLabel: string | null
  status: string
  winner: 'A' | 'B' | null
  sets: FixtureSet[]
  date: string
  time: string
  courtId: string | null
  timeTbd: boolean
  scheduleLabel: string | null
}

/** Aplana las posiciones de todos los grupos a la forma que usa la llave. */
function standingsFromGroups(groups: GroupData[]): TeamStanding[] {
  const out: TeamStanding[] = []
  for (const g of groups) {
    const positions = g.teams.map((_, i) => i + 1)
    const rows = computeGroupStandings(positions, g.matches)
    rows.forEach((row, i) => {
      const team = g.teams[row.pos - 1]
      if (!team) return
      out.push({
        teamId: team.id,
        groupNumber: g.groupNumber,
        rankInGroup: i + 1,
        wins: row.wins,
        setDiff: row.setsFor - row.setsAgainst,
        gameDiff: row.gamesFor - row.gamesAgainst,
      })
    })
  }
  return out
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-serif text-4xl leading-none text-foreground tabular-nums">
          {value}
        </span>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
            className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            aria-label={`Aumentar ${label}`}
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
            className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            aria-label={`Reducir ${label}`}
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      </div>
      {hint && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {hint}
        </p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Generador (sin llave todavía)                                             */
/* -------------------------------------------------------------------------- */

function Generator({
  categoryId,
  groups,
  defaultAdvance,
}: {
  categoryId: string
  groups: GroupData[]
  defaultAdvance: number
}) {
  const standings = useMemo(() => standingsFromGroups(groups), [groups])
  const labelById = useMemo(() => {
    const m = new Map<string, string>()
    for (const g of groups) for (const t of g.teams) m.set(t.id, t.label)
    return m
  }, [groups])

  const maxAdvance = Math.max(1, Math.min(...groups.map((g) => g.teams.length)))
  const [advance, setAdvance] = useState(clamp(defaultAdvance || 1, 1, maxAdvance))
  const [wildcards, setWildcards] = useState(0)
  const [thirdPlace, setThirdPlace] = useState(true)
  // Override manual de comodines (ids en orden). Vacío = selección automática.
  const [overrides, setOverrides] = useState<string[]>([])
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const sel = useMemo(
    () => selectQualifiers(standings, advance, wildcards, overrides),
    [standings, advance, wildcards, overrides],
  )
  const chosenIds = sel.wildcards.map((w) => w.teamId)

  // Al cambiar los parámetros, vuelve a la selección automática de comodines.
  const changeAdvance = (v: number) => {
    setAdvance(v)
    setOverrides([])
  }
  const changeWildcards = (v: number) => {
    setWildcards(v)
    setOverrides([])
  }
  const swapWildcard = (index: number, teamId: string) => {
    const next = [...chosenIds]
    next[index] = teamId
    setOverrides(next)
  }

  const generate = () => {
    setError(null)
    startTransition(async () => {
      const res = await generateBracket(categoryId, {
        advancePerGroup: advance,
        wildcardSlots: wildcards,
        wildcardTeamIds: chosenIds,
        thirdPlace,
      })
      if (res?.error) setError(res.error)
    })
  }

  const groupLabel = (s: TeamStanding) =>
    `${labelById.get(s.teamId) ?? '—'} · G${s.groupNumber} (${s.rankInGroup}º)`

  return (
    <div className="mt-5 rounded-xl border border-border bg-card p-5">
      <div className="rounded-lg border-l-2 border-forest bg-forest/5 p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-forest">
          Clasificación a la llave
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          Pasan directo los mejores de cada grupo. Si no se llena un cuadro de
          potencia de 2, agrega comodines (mejores segundos) para completar.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Stepper
          label="Directos por grupo"
          value={advance}
          onChange={changeAdvance}
          min={1}
          max={maxAdvance}
          hint="Clasifican automático"
        />
        <Stepper
          label="Comodines"
          value={wildcards}
          onChange={changeWildcards}
          min={0}
          max={sel.wildcardCandidates.length}
          hint="Mejores segundos"
        />
      </div>

      {/* Tamaño de la llave / byes */}
      <div className="mt-4 rounded-lg border border-border bg-input/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Llave de {sel.bracketSize}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
            {sel.direct.length} directos · {sel.wildcards.length} comodines
            {sel.byes > 0 ? ` · ${sel.byes} bye${sel.byes === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        {/* Comodines elegidos con opción de intercambio */}
        {sel.wildcards.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {sel.wildcards.map((w, i) => (
              <li key={w.teamId} className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-ochre">
                  C{i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                  {groupLabel(w)}
                </span>
                {sel.wildcardCandidates.length > sel.wildcards.length && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="rounded-md border border-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        Cambiar
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Sustituir comodín</DropdownMenuLabel>
                      {sel.wildcardCandidates
                        .filter(
                          (c) =>
                            c.teamId === w.teamId ||
                            !chosenIds.includes(c.teamId),
                        )
                        .map((c) => (
                          <DropdownMenuItem
                            key={c.teamId}
                            onClick={() => swapWildcard(i, c.teamId)}
                            className={cn(
                              c.teamId === w.teamId && 'font-medium text-forest',
                            )}
                          >
                            {groupLabel(c)}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Toggle 3er lugar */}
      <label className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm">
        <input
          type="checkbox"
          checked={thirdPlace}
          onChange={(e) => setThirdPlace(e.target.checked)}
          className="size-4 accent-forest"
        />
        <span className="text-foreground">Partido por el 3er lugar</span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          perdedores de semifinal
        </span>
      </label>

      {error && (
        <p className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <Button
        type="button"
        onClick={generate}
        disabled={pending || sel.direct.length + sel.wildcards.length < 2}
        className="mt-5 h-9 gap-1.5 rounded-md px-4 text-sm"
      >
        <Shuffle className="size-4" strokeWidth={2} />
        {pending ? 'Generando…' : 'Generar llave'}
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Llave generada                                                            */
/* -------------------------------------------------------------------------- */

/** Una pareja dentro de la tarjeta de partido de la llave (resalta si ganó). */
function BracketSide({
  label,
  isWinner,
}: {
  label: string
  isWinner: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-xs',
          isWinner
            ? 'font-medium text-foreground'
            : label === '—'
              ? 'text-muted-foreground/50'
              : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
    </div>
  )
}

function BracketCard({
  match,
  bestOfSets,
  tiebreakAt,
  courts,
}: {
  match: BracketMatch
  bestOfSets: number
  tiebreakAt: number
  courts: CourtOption[]
}) {
  const [open, setOpen] = useState(false)
  const finished = match.status === 'finished'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-60 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-foreground/20 hover:bg-muted/40"
      >
        <BracketSide label={match.aLabel} isWinner={match.winner === 'A'} />
        <div className="my-1.5 flex items-center gap-2">
          <span className="h-px flex-1 bg-border" />
          {finished ? (
            <span className="font-mono text-[10px] text-foreground tabular-nums">
              {match.sets.map(formatSet).join(' ')}
            </span>
          ) : (
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
              {match.scheduleLabel ?? 'Capturar'}
            </span>
          )}
          <span className="h-px flex-1 bg-border" />
        </div>
        <BracketSide label={match.bLabel} isWinner={match.winner === 'B'} />
      </button>

      <MatchResultSheet
        match={match}
        title={`${roundLabel(match.round)} · Resultado`}
        description={`Al mejor de ${bestOfSets} sets. Anota los juegos de cada set.`}
        bestOfSets={bestOfSets}
        tiebreakAt={tiebreakAt}
        courts={courts}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}

function GeneratedBracket({
  categoryId,
  matches,
  bestOfSets,
  tiebreakAt,
  courts,
}: {
  categoryId: string
  matches: BracketMatch[]
  bestOfSets: number
  tiebreakAt: number
  courts: CourtOption[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Agrupa por ronda en orden (la final antes del 3er lugar).
  const rounds = useMemo(() => {
    const byRound = new Map<string, BracketMatch[]>()
    for (const m of matches) {
      const arr = byRound.get(m.round) ?? []
      arr.push(m)
      byRound.set(m.round, arr)
    }
    return [...byRound.entries()]
      .sort((a, b) => roundSortIndex(a[0]) - roundSortIndex(b[0]))
      .map(([round, ms]) => ({
        round,
        matches: ms.sort((x, y) => x.slot - y.slot),
      }))
  }, [matches])

  // Campeón: ganador del partido «F».
  const champion = useMemo(() => {
    const final = matches.find((m) => m.round === 'F')
    return final?.winnerLabel ?? null
  }, [matches])

  const clear = () => {
    setError(null)
    startTransition(async () => {
      const res = await clearBracket(categoryId)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {champion ? (
          <p className="flex items-center gap-2 text-sm">
            <Trophy className="size-4 text-ochre" strokeWidth={2} />
            <span className="text-muted-foreground">Campeón:</span>
            <span className="font-medium text-foreground">{champion}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Captura los resultados; el ganador avanza solo a la siguiente ronda.
          </p>
        )}
        <ConfirmDialog
          title="¿Borrar la llave?"
          description="Se eliminará la fase eliminatoria y sus partidos para poder regenerarla. No se puede deshacer."
          confirmLabel="Borrar llave"
          destructive
          onConfirm={clear}
          trigger={
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              className="h-9 gap-1.5 rounded-md px-3 text-sm"
            >
              <Trash2 className="size-4" strokeWidth={2} />
              {pending ? 'Borrando…' : 'Borrar llave'}
            </Button>
          }
        />
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="mt-5 flex gap-6 overflow-x-auto pb-2">
        {rounds.map(({ round, matches: roundMatches }) => (
          <div key={round} className="flex shrink-0 flex-col">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {roundLabel(round)}
            </p>
            <div className="flex flex-1 flex-col justify-around gap-3">
              {roundMatches.map((m) => (
                <BracketCard
                  key={m.id}
                  match={m}
                  bestOfSets={bestOfSets}
                  tiebreakAt={tiebreakAt}
                  courts={courts}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Módulo                                                                    */
/* -------------------------------------------------------------------------- */

export function TournamentBracket({
  categoryId,
  groups,
  groupsComplete,
  generated,
  matches,
  defaultAdvance,
  bestOfSets,
  tiebreakAt,
  courts,
}: {
  categoryId: string
  groups: GroupData[]
  groupsComplete: boolean
  generated: boolean
  matches: BracketMatch[]
  defaultAdvance: number
  bestOfSets: number
  tiebreakAt: number
  courts: CourtOption[]
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Eliminatoria
          </p>
          <h2 className="mt-1.5 font-serif text-2xl tracking-tight text-foreground">
            Llave final
          </h2>
        </div>
        {generated && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
            Generada
          </span>
        )}
      </div>

      {generated ? (
        <GeneratedBracket
          categoryId={categoryId}
          matches={matches}
          bestOfSets={bestOfSets}
          tiebreakAt={tiebreakAt}
          courts={courts}
        />
      ) : groupsComplete ? (
        <Generator
          categoryId={categoryId}
          groups={groups}
          defaultAdvance={defaultAdvance}
        />
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Termina todos los partidos de la fase de grupos para armar la llave.
          </p>
        </div>
      )}
    </section>
  )
}
