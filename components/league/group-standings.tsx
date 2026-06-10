'use client'

import { cn } from '@/lib/utils'
import { MapPin, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

/** Normaliza para buscar sin distinguir mayúsculas ni acentos. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** Parte un array en grupos consecutivos de tamaño `size`. */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
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
  // Cancha de este partido (parejas: dos partidos simultáneos, uno por pista).
  courtName: string | null
  sideA: string[]
  sideB: string[]
  winnerSide: 'A' | 'B' | null
  scoreA: number | null
  scoreB: number | null
}

/** Un grupo resuelto: clasificación + sets jugados. */
export type PublicGroup = {
  groupNumber: number
  // Cancha donde se juegan los partidos del grupo (null si no está asignada).
  courtName: string | null
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

// Chip de movimiento (móvil): fondo tenue + color por dirección.
const movementChipClass: Record<'up' | 'down' | 'stay', string> = {
  up: 'bg-forest/10 text-forest',
  down: 'bg-terracotta/10 text-terracotta',
  stay: 'bg-muted text-muted-foreground',
}

/**
 * Clasificación por grupo con las jornadas en pestañas: el jugador cambia entre
 * jornadas (cerradas y próximas) sin recargar. Por defecto se muestra la última
 * jornada con resultados.
 */
export function GroupStandings({
  rounds,
  isPairs = false,
}: {
  rounds: GroupStandingRound[]
  // En parejas, los partidos del grupo se agrupan por ronda de juego (R1, R2…)
  // en lugar de listarse como sets sueltos (S1, S2…).
  isPairs?: boolean
}) {
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
                  isPairs={isPairs}
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
  isPairs,
  isHit,
}: {
  group: PublicGroup
  pending: boolean
  isPairs: boolean
  isHit: (name: string) => boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="min-w-0">
        <h4 className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-heading text-xl tracking-tight text-ink">
            Grupo {group.groupNumber}
          </span>
          {group.groupNumber === 1 && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Más alto
            </span>
          )}
          {group.courtName && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-forest/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-forest">
              <MapPin className="size-3" strokeWidth={1.75} />
              {group.courtName}
            </span>
          )}
        </h4>
        <p className="mt-1 text-sm leading-snug text-muted-foreground">
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

      {/* Clasificación del grupo · tabla (≥ sm) */}
      <div className="mt-4 hidden overflow-hidden rounded-lg border border-border sm:block">
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

      {/* Clasificación del grupo · tarjetas (móvil) */}
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border sm:hidden">
        {group.players.map((p, i) => {
          const rank = pending ? null : (p.rank ?? i + 1)
          const diff =
            p.gamesFor != null && p.gamesAgainst != null
              ? p.gamesFor - p.gamesAgainst
              : null
          const hit = isHit(p.name)
          return (
            <li
              key={p.key}
              className={cn(
                'flex gap-3 px-3 py-3',
                hit ? 'bg-terracotta/10' : rank === 1 && 'bg-forest/5',
              )}
            >
              <span
                className={cn(
                  'w-6 shrink-0 pt-0.5 text-center font-heading text-2xl leading-none tabular-nums',
                  hit
                    ? 'text-terracotta'
                    : rank === 1
                      ? 'text-forest'
                      : 'text-muted-foreground/60',
                )}
              >
                {rank ?? '–'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      'text-[15px] font-medium leading-snug',
                      p.absent
                        ? 'text-muted-foreground line-through'
                        : 'text-ink',
                      hit && 'text-terracotta',
                    )}
                  >
                    {p.name}
                  </span>
                  {p.movement && (
                    <span
                      className={cn(
                        'mt-0.5 shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider',
                        movementChipClass[p.movement],
                      )}
                    >
                      {movementLabel[p.movement]}
                    </span>
                  )}
                </div>
                {p.note && (
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-terracotta">
                    {p.note}
                  </p>
                )}
                <dl className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-xs tabular-nums">
                  <StatChip
                    label="Sets"
                    value={p.setsWon != null ? `${p.setsWon}–${p.setsLost}` : '–'}
                  />
                  <StatChip
                    label="Jue"
                    value={
                      p.gamesFor != null ? `${p.gamesFor}–${p.gamesAgainst}` : '–'
                    }
                  />
                  <StatChip
                    label="Dif"
                    value={diff == null ? '–' : diff > 0 ? `+${diff}` : String(diff)}
                    valueClass={
                      diff == null || diff === 0
                        ? undefined
                        : diff > 0
                          ? 'text-forest'
                          : 'text-terracotta'
                    }
                  />
                </dl>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Enfrentamientos jugados / por jugar (mini marcador apilado).
          · Parejas: agrupados por ronda de juego (R1, R2…), de tantos partidos
            simultáneos como pistas usa el grupo (floor de equipos / 2).
          · Individual: un set rotativo por fila (S1, S2…). */}
      {group.sets.length > 0 &&
        (isPairs ? (
          <div className="mt-3 space-y-2.5">
            {chunk(
              group.sets,
              Math.max(1, Math.floor(group.players.length / 2)),
            ).map((roundSets, i) => (
              <div
                key={roundSets[0].id}
                className="rounded-md border border-border bg-background/40 px-3 py-2.5"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded border border-border font-mono text-[10px] text-muted-foreground tabular-nums">
                    R{i + 1}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Ronda {i + 1}
                  </span>
                </div>
                <div className="divide-y divide-border/60">
                  {roundSets.map((s) => (
                    <div key={s.id} className="py-2 first:pt-0 last:pb-0">
                      {s.courtName && (
                        <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          {s.courtName}
                        </p>
                      )}
                      <div className="space-y-1">
                        <SetLine
                          players={s.sideA}
                          winner={s.winnerSide === 'A'}
                          score={s.scoreA}
                          isHit={isHit}
                        />
                        <SetLine
                          players={s.sideB}
                          winner={s.winnerSide === 'B'}
                          score={s.scoreB}
                          isHit={isHit}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {group.sets.map((s) => (
              <div
                key={s.id}
                className="flex items-start gap-3 rounded-md border border-border bg-background/40 px-3 py-2.5"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded border border-border font-mono text-[10px] text-muted-foreground tabular-nums">
                  {s.label}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <SetLine
                    players={s.sideA}
                    winner={s.winnerSide === 'A'}
                    score={s.scoreA}
                    isHit={isHit}
                  />
                  <SetLine
                    players={s.sideB}
                    winner={s.winnerSide === 'B'}
                    score={s.scoreB}
                    isHit={isHit}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}

/** Etiqueta + valor compacto para las estadísticas en la tarjeta móvil. */
function StatChip({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className={cn('text-ink', valueClass)}>{value}</dd>
    </div>
  )
}

/** Una pareja del set con sus juegos al lado (mini marcador, sin truncar). */
function SetLine({
  players,
  winner,
  score,
  isHit,
}: {
  players: string[]
  winner: boolean
  score: number | null
  isHit: (name: string) => boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={cn(
          'min-w-0 text-sm leading-snug',
          winner ? 'font-medium text-ink' : 'text-ink/70',
        )}
      >
        {players.length === 0
          ? '—'
          : players.map((name, i) => (
              <span key={i}>
                {i > 0 && ' / '}
                <span
                  className={cn(isHit(name) && 'font-semibold text-terracotta')}
                >
                  {name}
                </span>
              </span>
            ))}
      </span>
      <span
        className={cn(
          'shrink-0 font-mono text-base tabular-nums',
          winner ? 'font-semibold text-ink' : 'text-ink/45',
        )}
      >
        {score ?? '–'}
      </span>
    </div>
  )
}
