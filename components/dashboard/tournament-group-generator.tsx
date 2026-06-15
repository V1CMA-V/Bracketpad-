'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  ChevronDown,
  ChevronUp,
  MoveRight,
  Shuffle,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  clamp,
  maxGroupCount,
  planGroups,
  recommendAdvance,
  recommendGroupCount,
  roundRobinMatchCount,
} from '@/lib/tournament-groups'
import {
  clearGroups,
  generateGroups,
  setTeamGroup,
} from '@/app/dashboard/torneos/[id]/categorias/[catId]/actions'

export type GroupTeam = { id: string; label: string; seed: number | null }

export type GroupData = {
  groupNumber: number
  teams: GroupTeam[]
}

/**
 * Menú para reubicar una pareja: moverla a otro grupo, asignarla a un grupo
 * nuevo o quitarla. Sirve tanto para parejas ya agrupadas (`currentGroup`) como
 * para las que están sin asignar (`currentGroup = null`).
 */
function TeamGroupMenu({
  teamId,
  currentGroup,
  groupNumbers,
  onError,
}: {
  teamId: string
  currentGroup: number | null
  groupNumbers: number[]
  onError: (msg: string | null) => void
}) {
  const [pending, startTransition] = useTransition()
  const newGroup = (groupNumbers.length ? Math.max(...groupNumbers) : 0) + 1

  const move = (target: number | null) => {
    onError(null)
    startTransition(async () => {
      const res = await setTeamGroup(teamId, target)
      if (res?.error) onError(res.error)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={pending}
          title="Mover de grupo"
          className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <MoveRight className="size-3.5" strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {currentGroup == null ? 'Asignar a' : 'Mover a'}
        </DropdownMenuLabel>
        {groupNumbers
          .filter((g) => g !== currentGroup)
          .map((g) => (
            <DropdownMenuItem key={g} onClick={() => move(g)}>
              Grupo {g}
            </DropdownMenuItem>
          ))}
        <DropdownMenuItem onClick={() => move(newGroup)}>
          Nuevo grupo {newGroup}
        </DropdownMenuItem>
        {currentGroup != null && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => move(null)}>
              Quitar del grupo
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
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
  const atMin = value <= min
  const atMax = value >= max
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
            disabled={atMax}
            className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            aria-label={`Aumentar ${label}`}
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={atMin}
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
/*  Generador (sin grupos todavía)                                            */
/* -------------------------------------------------------------------------- */

function Generator({
  categoryId,
  teamCount,
}: {
  categoryId: string
  teamCount: number
}) {
  const recommendedGroups = recommendGroupCount(teamCount)
  const maxGroups = maxGroupCount(teamCount)
  const [numGroups, setNumGroups] = useState(recommendedGroups)
  const plan = useMemo(
    () => planGroups(teamCount, numGroups),
    [teamCount, numGroups],
  )
  const [advance, setAdvance] = useState(recommendAdvance(plan.minSize))
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // El avance no puede superar al grupo más chico.
  const advanceClamped = clamp(advance, 1, plan.minSize)
  const isRecommended = numGroups === recommendedGroups

  const generate = () => {
    setError(null)
    startTransition(async () => {
      const res = await generateGroups(categoryId, {
        numGroups,
        advancePerGroup: advanceClamped,
      })
      if (res?.error) setError(res.error)
    })
  }

  if (teamCount < 2) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Inscribe al menos 2 parejas para poder generar los grupos.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-5 rounded-xl border border-border bg-card p-5">
      {/* Recomendación */}
      <div className="rounded-lg border-l-2 border-forest bg-forest/5 p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-forest">
          Recomendación
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          Con <span className="font-medium">{teamCount} parejas</span>, lo más
          parejo es{' '}
          <span className="font-medium">
            {recommendedGroups} grupo{recommendedGroups === 1 ? '' : 's'}
          </span>{' '}
          de{' '}
          {planGroups(teamCount, recommendedGroups)
            .sizes.join(', ')}
          . Puedes ajustarlo abajo.
        </p>
      </div>

      {/* Controles */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Stepper
          label="Número de grupos"
          value={numGroups}
          onChange={(v) => setNumGroups(v)}
          min={1}
          max={maxGroups}
          hint={isRecommended ? 'Recomendado' : `Recomendado: ${recommendedGroups}`}
        />
        <Stepper
          label="Avanzan por grupo"
          value={advanceClamped}
          onChange={(v) => setAdvance(v)}
          min={1}
          max={plan.minSize}
          hint="Pasan a la eliminatoria"
        />
      </div>

      {/* Vista previa */}
      <div className="mt-4 rounded-lg border border-border bg-input/20 p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Vista previa
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {plan.sizes.map((size, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                G{i + 1}
              </span>
              {size} parejas
            </span>
          ))}
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {plan.matchCount} partidos round-robin en total
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <Button
        type="button"
        onClick={generate}
        disabled={pending}
        className="mt-5 h-9 gap-1.5 rounded-md px-4 text-sm"
      >
        <Shuffle className="size-4" strokeWidth={2} />
        {pending ? 'Generando…' : 'Generar grupos'}
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Grupos generados                                                          */
/* -------------------------------------------------------------------------- */

function GeneratedGroups({
  categoryId,
  groups,
  unassignedTeams,
  advancePerGroup,
}: {
  categoryId: string
  groups: GroupData[]
  unassignedTeams: GroupTeam[]
  advancePerGroup: number | null
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const groupNumbers = groups.map((g) => g.groupNumber)

  const clear = () => {
    setError(null)
    startTransition(async () => {
      const res = await clearGroups(categoryId)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {groups.length} grupo{groups.length === 1 ? '' : 's'}
          {advancePerGroup != null && (
            <>
              {' · '}
              <span className="text-foreground">
                avanzan {advancePerGroup} por grupo
              </span>
            </>
          )}
        </p>
        <ConfirmDialog
          title="¿Borrar la fase de grupos?"
          description="Se eliminarán los grupos y sus partidos para poder regenerarlos. No se puede deshacer."
          confirmLabel="Borrar grupos"
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
              {pending ? 'Borrando…' : 'Borrar grupos'}
            </Button>
          }
        />
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group.groupNumber}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-serif text-lg text-foreground">
                Grupo {group.groupNumber}
              </p>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {roundRobinMatchCount(group.teams.length)} partidos
              </span>
            </div>
            <ul className="mt-3 divide-y divide-border">
              {group.teams.map((team, i) => (
                <li
                  key={team.id}
                  className="flex items-center gap-3 py-2 text-sm"
                >
                  <span className="w-5 shrink-0 font-mono text-[10px] text-muted-foreground/70 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {team.label}
                  </span>
                  {team.seed != null && (
                    <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Cab. {team.seed}
                    </span>
                  )}
                  <TeamGroupMenu
                    teamId={team.id}
                    currentGroup={group.groupNumber}
                    groupNumbers={groupNumbers}
                    onError={setError}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Parejas sin asignar (nuevas inscripciones o quitadas de un grupo) */}
      {unassignedTeams.length > 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-ochre/50 bg-ochre/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ochre">
            Sin asignar · {unassignedTeams.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Parejas activas que no están en ningún grupo. Asígnalas a uno.
          </p>
          <ul className="mt-3 divide-y divide-border">
            {unassignedTeams.map((team) => (
              <li key={team.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {team.label}
                </span>
                {team.seed != null && (
                  <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Cab. {team.seed}
                  </span>
                )}
                <TeamGroupMenu
                  teamId={team.id}
                  currentGroup={null}
                  groupNumbers={groupNumbers}
                  onError={setError}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Módulo                                                                    */
/* -------------------------------------------------------------------------- */

export function TournamentGroupGenerator({
  categoryId,
  activeTeamCount,
  groups,
  unassignedTeams,
  advancePerGroup,
}: {
  categoryId: string
  activeTeamCount: number
  groups: GroupData[]
  unassignedTeams: GroupTeam[]
  advancePerGroup: number | null
}) {
  const generated = groups.length > 0

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Sorteo
          </p>
          <h2 className="mt-1.5 font-serif text-2xl tracking-tight text-foreground">
            Fase de grupos
          </h2>
        </div>
        {generated && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
            Generada
          </span>
        )}
      </div>

      {generated ? (
        <GeneratedGroups
          categoryId={categoryId}
          groups={groups}
          unassignedTeams={unassignedTeams}
          advancePerGroup={advancePerGroup}
        />
      ) : (
        <Generator categoryId={categoryId} teamCount={activeTeamCount} />
      )}
    </section>
  )
}
