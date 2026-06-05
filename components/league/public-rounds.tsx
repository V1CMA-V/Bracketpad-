'use client'

import { cn } from '@/lib/utils'
import { matchStatusLabels, matchStatusStyles } from '@/lib/leagues'
import { Clock, MapPin } from 'lucide-react'
import { useMemo, useState } from 'react'

export type PublicSet = {
  gamesA: number
  gamesB: number
  tiebreakA: number | null
  tiebreakB: number | null
}

export type PublicMatch = {
  id: string
  status: string
  winnerSide: 'A' | 'B' | null
  groupNumber: number | null
  courtName: string | null
  scheduledLabel: string | null
  sideA: string[]
  sideB: string[]
  sets: PublicSet[]
}

export type PublicRound = {
  id: string
  roundNumber: number
  name: string | null
  dateLabel: string
  matchCount: number
  matches: PublicMatch[]
}

function SideRow({
  players,
  sets,
  side,
  winnerSide,
}: {
  players: string[]
  sets: PublicSet[]
  side: 'A' | 'B'
  winnerSide: 'A' | 'B' | null
}) {
  const isWinner = winnerSide === side
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        {isWinner && (
          <span
            aria-label="Ganador"
            className="size-1.5 shrink-0 rounded-full bg-forest"
          />
        )}
        <span
          className={cn(
            'truncate text-sm',
            isWinner ? 'font-medium text-ink' : 'text-ink/70',
            !winnerSide && 'text-ink/70',
          )}
        >
          {players.length > 0 ? players.join(' / ') : 'Por definir'}
        </span>
      </div>
      <div className="flex shrink-0 items-baseline gap-3 font-mono tabular-nums">
        {sets.length === 0 ? (
          <span className="text-ink/30">—</span>
        ) : (
          sets.map((s, i) => {
            const g = side === 'A' ? s.gamesA : s.gamesB
            const tb = side === 'A' ? s.tiebreakA : s.tiebreakB
            const won = side === 'A' ? s.gamesA > s.gamesB : s.gamesB > s.gamesA
            return (
              <span
                key={i}
                className={cn(
                  'text-base',
                  won ? 'font-semibold text-ink' : 'text-ink/45',
                )}
              >
                {g}
                {tb != null && (
                  <sup className="ml-0.5 text-[10px] text-ink/40">{tb}</sup>
                )}
              </span>
            )
          })
        )}
      </div>
    </div>
  )
}

function MatchCard({ match }: { match: PublicMatch }) {
  const st = matchStatusStyles[match.status] ?? matchStatusStyles.scheduled
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3 pb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className={cn('flex items-center gap-1.5', st.text)}>
          <span className={cn('size-1.5 rounded-full', st.dot)} />
          {matchStatusLabels[match.status] ?? match.status}
        </span>
        <div className="flex items-center gap-3">
          {match.courtName && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" strokeWidth={1.5} />
              {match.courtName}
            </span>
          )}
          {match.scheduledLabel && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" strokeWidth={1.5} />
              {match.scheduledLabel}
            </span>
          )}
        </div>
      </div>
      <div className="divide-y divide-border/60 border-t border-border pt-1">
        <SideRow
          players={match.sideA}
          sets={match.sets}
          side="A"
          winnerSide={match.winnerSide}
        />
        <SideRow
          players={match.sideB}
          sets={match.sets}
          side="B"
          winnerSide={match.winnerSide}
        />
      </div>
    </div>
  )
}

export function PublicRounds({ rounds }: { rounds: PublicRound[] }) {
  // Por defecto, la última jornada que tenga partidos (la más reciente con
  // juego); si ninguna tiene, la última de la lista.
  const defaultId = useMemo(() => {
    const withMatches = [...rounds].reverse().find((r) => r.matches.length > 0)
    return withMatches?.id ?? rounds[rounds.length - 1]?.id ?? ''
  }, [rounds])

  const [activeId, setActiveId] = useState(defaultId)
  const active = rounds.find((r) => r.id === activeId) ?? rounds[0]

  if (rounds.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        Aún no hay jornadas programadas para esta liga.
      </div>
    )
  }

  // Partidos del grupo agrupados por número de grupo (1 = nivel más alto).
  const groups = [
    ...active.matches
      .reduce((map, m) => {
        const key = m.groupNumber ?? 0
        const list = map.get(key) ?? []
        list.push(m)
        map.set(key, list)
        return map
      }, new Map<number, PublicMatch[]>())
      .entries(),
  ].sort((a, b) => a[0] - b[0])

  return (
    <div>
      {/* Selector de jornadas */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-2">
        {rounds.map((r) => {
          const isActive = r.id === active?.id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveId(r.id)}
              aria-pressed={isActive}
              className={cn(
                'shrink-0 rounded-sm px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors',
                isActive
                  ? 'bg-ink text-cream'
                  : 'border border-ink/15 bg-transparent text-ink hover:bg-ink/5',
              )}
            >
              J{r.roundNumber}
            </button>
          )
        })}
      </div>

      {active && (
        <div className="mt-5">
          <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
            <div>
              <h3 className="font-heading text-2xl text-ink">
                {active.name ?? `Jornada ${active.roundNumber}`}
              </h3>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {active.dateLabel} · {active.matchCount}{' '}
                {active.matchCount === 1 ? 'partido' : 'partidos'}
              </p>
            </div>
          </div>

          {active.matches.length === 0 ? (
            <div className="mt-5 rounded-sm border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              Esta jornada todavía no tiene partidos.
            </div>
          ) : (
            <div className="mt-5 space-y-7">
              {groups.map(([groupNumber, matches]) => (
                <div key={groupNumber}>
                  {groupNumber > 0 && (
                    <p className="mb-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Grupo {groupNumber}
                      {groupNumber === 1 && ' · nivel más alto'}
                    </p>
                  )}
                  <div className="space-y-2.5">
                    {matches.map((m) => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
