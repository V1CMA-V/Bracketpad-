'use client'

import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'
import { useState } from 'react'

/** Normaliza para buscar sin distinguir mayúsculas ni acentos. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** Una fila de la clasificación general, con su posición ya calculada. */
export type LeagueStandingRow = {
  registrationId: string
  rank: number
  fullName: string
  matchesPlayed: number
  wins: number
  losses: number
  setsFor: number
  setsAgainst: number
  gamesFor: number
  gamesAgainst: number
}

const fmtDiff = (n: number) => `${n > 0 ? '+' : ''}${n}`

/**
 * Tabla de clasificación general con buscador de jugador: al escribir, deja a
 * la vista solo a los jugadores que coinciden (conservando su posición real) y
 * los resalta, para saber de un vistazo en qué puesto va alguien concreto.
 */
export function StandingsTable({
  rows,
  showSets,
  showGames,
  showGameDiff,
}: {
  rows: LeagueStandingRow[]
  showSets: boolean
  showGames: boolean
  showGameDiff: boolean
}) {
  const [query, setQuery] = useState('')
  const q = normalize(query.trim())
  const hasQuery = q.length > 0
  const isHit = (name: string) => hasQuery && normalize(name).includes(q)
  const visible = hasQuery ? rows.filter((r) => isHit(r.fullName)) : rows

  return (
    <div>
      {/* Buscador de jugador */}
      <label className="relative mt-5 block">
        <span className="sr-only">Buscar jugador</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.5}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar jugador y ver su posición…"
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

      {visible.length === 0 ? (
        <div className="mt-5 rounded-sm border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          Ningún jugador coincide con «{query.trim()}».
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground [&>th]:px-3 [&>th]:pb-2.5 [&>th]:font-normal">
                <th className="w-10 text-left">Pos</th>
                <th className="text-left">Jugador</th>
                <th className="w-12 text-right">PJ</th>
                <th className="w-16 text-right">G-P</th>
                {showSets && (
                  <>
                    <th className="w-16 text-right">Sets</th>
                    <th className="w-16 text-right">±Sets</th>
                  </>
                )}
                {showGames && <th className="w-16 text-right">Juegos</th>}
                {showGameDiff && <th className="w-16 text-right">±Jue</th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => {
                const setDiff = s.setsFor - s.setsAgainst
                const gameDiff = s.gamesFor - s.gamesAgainst
                const top = s.rank === 1
                const hit = isHit(s.fullName)
                return (
                  <tr
                    key={s.registrationId}
                    className={cn(
                      'border-b border-border [&>td]:px-3 [&>td]:py-3',
                      top && 'bg-forest/5',
                      hit && 'bg-terracotta/10',
                    )}
                  >
                    <td
                      className={cn(
                        'font-heading text-lg tabular-nums',
                        hit
                          ? 'text-terracotta'
                          : top
                            ? 'text-forest'
                            : 'text-muted-foreground/70',
                      )}
                    >
                      {s.rank}
                    </td>
                    <td
                      className={cn(
                        'max-w-0 truncate text-ink',
                        (top || hit) && 'font-medium',
                        hit && 'text-terracotta',
                      )}
                    >
                      {s.fullName}
                    </td>
                    <td className="text-right font-mono text-muted-foreground tabular-nums">
                      {s.matchesPlayed}
                    </td>
                    <td className="text-right font-mono tabular-nums">
                      {s.wins}-{s.losses}
                    </td>
                    {showSets && (
                      <>
                        <td className="text-right font-mono tabular-nums">
                          {s.setsFor}-{s.setsAgainst}
                        </td>
                        <td
                          className={
                            setDiff > 0
                              ? 'text-right font-mono text-forest tabular-nums'
                              : setDiff < 0
                                ? 'text-right font-mono text-terracotta tabular-nums'
                                : 'text-right font-mono text-muted-foreground tabular-nums'
                          }
                        >
                          {fmtDiff(setDiff)}
                        </td>
                      </>
                    )}
                    {showGames && (
                      <td className="text-right font-mono tabular-nums">
                        {s.gamesFor}-{s.gamesAgainst}
                      </td>
                    )}
                    {showGameDiff && (
                      <td
                        className={
                          // En modo «juegos» ±Jue es el diferencial principal y
                          // se colorea; en «ambos» se queda gris como secundaria.
                          !showGames
                            ? 'text-right font-mono text-muted-foreground tabular-nums'
                            : gameDiff > 0
                              ? 'text-right font-mono text-forest tabular-nums'
                              : gameDiff < 0
                                ? 'text-right font-mono text-terracotta tabular-nums'
                                : 'text-right font-mono text-muted-foreground tabular-nums'
                        }
                      >
                        {fmtDiff(gameDiff)}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
