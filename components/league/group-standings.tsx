'use client'

import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

/** Normaliza para buscar sin distinguir mayúsculas ni acentos. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** Un jugador dentro de la clasificación de un grupo de la jornada. */
export type GroupPlayerStat = {
  key: string
  rank: number | null
  name: string
  absent: boolean
  note: string | null
  // Null en jornadas próximas (aún sin jugar): la fila se muestra vacía.
  setsWon: number | null
  setsLost: number | null
  gamesFor: number | null
  gamesAgainst: number | null
  movement: 'up' | 'down' | 'stay' | null
}

/** Un set rotativo del grupo (parejas y marcador). */
export type GroupSetRow = {
  id: string
  label: string
  sideA: string[]
  sideB: string[]
  winnerSide: 'A' | 'B' | null
  scoreA: number | null
  scoreB: number | null
}

/** Un grupo resuelto: clasificación + sets jugados. */
export type PublicGroup = {
  groupNumber: number
  players: GroupPlayerStat[]
  sets: GroupSetRow[]
}

/** Una jornada con sus grupos. `pending` = próxima (publicada, aún sin jugar). */
export type GroupStandingRound = {
  id: string
  roundNumber: number
  label: string
  dateLabel: string | null
  pending: boolean
  groups: PublicGroup[]
}

const movementLabel: Record<'up' | 'down' | 'stay', string> = {
  up: 'Sube',
  down: 'Baja',
  stay: 'Mantiene',
}

/**
 * Clasificación por grupo con las jornadas en pestañas: el jugador cambia entre
 * jornadas (cerradas y próximas) sin recargar. Por defecto se muestra la última
 * jornada con resultados.
 */
export function GroupStandings({ rounds }: { rounds: GroupStandingRound[] }) {
  // Por defecto, la jornada cerrada más reciente; si ninguna está cerrada, la
  // primera de la lista (la próxima más cercana).
  const defaultId = useMemo(() => {
    const lastClosed = [...rounds].reverse().find((r) => !r.pending)
    return lastClosed?.id ?? rounds[0]?.id ?? ''
  }, [rounds])

  const [activeId, setActiveId] = useState(defaultId)
  const active = rounds.find((r) => r.id === activeId) ?? rounds[0]

  // Búsqueda de un jugador concreto: resalta su nombre, deja a la vista solo el
  // grupo donde juega y marca en qué jornadas (pestañas) aparece.
  const [query, setQuery] = useState('')
  const q = normalize(query.trim())
  const hasQuery = q.length > 0
  const isHit = (name: string) => hasQuery && normalize(name).includes(q)
  const roundHasHit = (round: GroupStandingRound) =>
    round.groups.some((g) => g.players.some((p) => isHit(p.name)))

  if (rounds.length === 0) return null

  const visibleGroups = hasQuery
    ? active.groups.filter((g) => g.players.some((p) => isHit(p.name)))
    : active.groups

  return (
    <div>
      {/* Buscador de jugador */}
      <label className="relative mb-4 block">
        <span className="sr-only">Buscar jugador</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.5}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar mis partidos por jugador…"
          aria-label="Buscar jugador"
          className="w-full rounded-sm border border-border bg-card py-2 pl-9 pr-9 text-sm text-ink outline-none transition-colors placeholder:text-muted-foreground focus:border-ink/40"
        />
        {hasQuery && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X className="size-3.5" strokeWidth={2} />
          </button>
        )}
      </label>

      {/* Pestañas de jornadas */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-2">
        {rounds.map((r) => {
          const isActive = r.id === active?.id
          // Con búsqueda activa, atenúa las jornadas sin el jugador y destaca
          // las que sí lo tienen.
          const hit = hasQuery && roundHasHit(r)
          const miss = hasQuery && !hit
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveId(r.id)}
              aria-pressed={isActive}
              title={r.label}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors',
                isActive
                  ? 'bg-ink text-cream'
                  : 'border border-ink/15 bg-transparent text-ink hover:bg-ink/5',
                hit && !isActive && 'border-terracotta/50 text-terracotta',
                miss && 'opacity-40',
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  r.pending ? 'bg-ochre' : 'bg-forest',
                  isActive && 'opacity-90',
                )}
              />
              J{r.roundNumber}
            </button>
          )
        })}
      </div>

      {active && (
        <div className="mt-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-3">
            <h3 className="font-heading text-2xl text-ink">{active.label}</h3>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider',
                active.pending
                  ? 'bg-ochre/10 text-ochre'
                  : 'bg-forest/10 text-forest',
              )}
            >
              {active.pending ? 'Próxima' : 'Finalizada'}
            </span>
            {active.dateLabel && (
              <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {active.dateLabel}
              </span>
            )}
          </div>

          {visibleGroups.length === 0 ? (
            <div className="mt-5 rounded-sm border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              Ese jugador no aparece en esta jornada. Prueba en otra de las
              pestañas marcadas.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {visibleGroups.map((group) => (
                <GroupCard
                  key={group.groupNumber}
                  group={group}
                  pending={active.pending}
                  isHit={isHit}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Tarjeta de grupo en versión pública (espejo de la del panel, sin controles):
 * cabecera con la formación, tabla de clasificación (sets, juegos, dif. y
 * movimiento) y los sets jugados con su marcador. En jornadas próximas
 * (`pending`) se muestra la misma estructura con la información de resultados
 * vacía: solo la formación y los enfrentamientos por jugar.
 */
function GroupCard({
  group,
  pending,
  isHit,
}: {
  group: PublicGroup
  pending: boolean
  isHit: (name: string) => boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="min-w-0">
        <h4 className="flex items-baseline gap-2">
          <span className="font-heading text-xl tracking-tight text-ink">
            Grupo {group.groupNumber}
          </span>
          {group.groupNumber === 1 && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Más alto
            </span>
          )}
        </h4>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {group.players.map((p, i) => (
            <span key={p.key}>
              {i > 0 && ' · '}
              <span className={cn(isHit(p.name) && 'font-semibold text-terracotta')}>
                {p.name}
              </span>
            </span>
          ))}
        </p>
      </div>

      {/* Clasificación del grupo */}
      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-cream font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 text-left font-normal">#</th>
              <th className="px-3 py-2 text-left font-normal">Jugador</th>
              <th className="px-3 py-2 text-center font-normal">Sets</th>
              <th className="px-3 py-2 text-center font-normal">Juegos</th>
              <th className="px-3 py-2 text-center font-normal">Dif.</th>
              <th className="px-3 py-2 text-right font-normal">Mov.</th>
            </tr>
          </thead>
          <tbody>
            {group.players.map((p, i) => {
              const rank = pending ? null : (p.rank ?? i + 1)
              // Diferencia de juegos (solo en jornadas jugadas).
              const diff =
                p.gamesFor != null && p.gamesAgainst != null
                  ? p.gamesFor - p.gamesAgainst
                  : null
              const hit = isHit(p.name)
              return (
                <tr
                  key={p.key}
                  className={cn(
                    'border-b border-border/60 last:border-0',
                    hit && 'bg-terracotta/10',
                  )}
                >
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground tabular-nums">
                    {rank ?? '–'}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        p.absent
                          ? 'text-muted-foreground line-through'
                          : rank === 1
                            ? 'font-medium text-ink'
                            : 'text-ink',
                        hit && 'font-semibold text-terracotta',
                      )}
                    >
                      {p.name}
                    </span>
                    {p.note && (
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-terracotta">
                        {p.note}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums text-ink">
                    {p.setsWon != null ? `${p.setsWon}–${p.setsLost}` : '–'}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">
                    {p.gamesFor != null ? `${p.gamesFor}–${p.gamesAgainst}` : '–'}
                  </td>
                  <td
                    className={
                      diff == null
                        ? 'px-3 py-2 text-center tabular-nums text-muted-foreground'
                        : diff > 0
                          ? 'px-3 py-2 text-center tabular-nums text-forest'
                          : diff < 0
                            ? 'px-3 py-2 text-center tabular-nums text-terracotta'
                            : 'px-3 py-2 text-center tabular-nums text-muted-foreground'
                    }
                  >
                    {diff == null ? '–' : diff > 0 ? `+${diff}` : diff}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {p.movement ? (
                      <span
                        className={
                          p.movement === 'up'
                            ? 'font-mono text-[10px] uppercase tracking-wider text-forest'
                            : p.movement === 'down'
                              ? 'font-mono text-[10px] uppercase tracking-wider text-terracotta'
                              : 'font-mono text-[10px] uppercase tracking-wider text-muted-foreground'
                        }
                      >
                        {movementLabel[p.movement]}
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        –
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Sets jugados / por jugar */}
      {group.sets.length > 0 && (
        <div className="mt-3 space-y-2">
          {group.sets.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-background/40 px-3 py-2"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded border border-border font-mono text-[10px] text-muted-foreground tabular-nums">
                {s.label}
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <SetSide
                  players={s.sideA}
                  winner={s.winnerSide === 'A'}
                  isHit={isHit}
                />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                  vs
                </span>
                <SetSide
                  players={s.sideB}
                  winner={s.winnerSide === 'B'}
                  isHit={isHit}
                />
              </div>
              <div className="flex shrink-0 items-center gap-1.5 font-mono tabular-nums">
                <span className="text-ink">{s.scoreA ?? '–'}</span>
                <span className="text-muted-foreground">–</span>
                <span className="text-ink">{s.scoreB ?? '–'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Un lado de un set: parejas con el jugador buscado resaltado. */
function SetSide({
  players,
  winner,
  isHit,
}: {
  players: string[]
  winner: boolean
  isHit: (name: string) => boolean
}) {
  if (players.length === 0) {
    return <span className="truncate text-sm text-ink">—</span>
  }
  return (
    <span
      className={cn(
        'truncate text-sm text-ink',
        winner && 'font-medium',
      )}
    >
      {players.map((name, i) => (
        <span key={i}>
          {i > 0 && ' / '}
          <span className={cn(isHit(name) && 'font-semibold text-terracotta')}>
            {name}
          </span>
        </span>
      ))}
    </span>
  )
}
