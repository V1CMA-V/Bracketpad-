/**
 * Utilidades puras para la fase de grupos de una categoría de torneo. No tocan
 * la base de datos: se usan tanto en el servidor (al generar) como en el
 * cliente (para la vista previa de la recomendación).
 */

/** Tamaño objetivo por defecto de un grupo de pádel. */
export const DEFAULT_GROUP_SIZE = 4

/**
 * Reparte `n` parejas en `groups` grupos lo más parejo posible: los primeros
 * grupos reciben una pareja de más cuando no es divisible. Devuelve los tamaños
 * (longitud = nº de grupos). Ej.: evenSplit(15, 4) → [4, 4, 4, 3].
 */
export function evenSplit(n: number, groups: number): number[] {
  const g = Math.max(1, groups)
  const base = Math.floor(n / g)
  const rem = n % g
  return Array.from({ length: g }, (_, i) => base + (i < rem ? 1 : 0))
}

/**
 * Nº de grupos recomendado para `teamCount` parejas, apuntando a grupos de
 * `targetSize`. Ej.: 16→4, 15→4, 10→3, 6→2, 5→1.
 */
export function recommendGroupCount(
  teamCount: number,
  targetSize = DEFAULT_GROUP_SIZE,
): number {
  if (teamCount < 2) return 1
  return Math.max(1, Math.round(teamCount / targetSize))
}

/** Máximo de grupos razonable: cada grupo necesita al menos 2 parejas. */
export function maxGroupCount(teamCount: number): number {
  return Math.max(1, Math.floor(teamCount / 2))
}

/** Mantiene `n` dentro de [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export type GroupPlan = {
  numGroups: number
  sizes: number[]
  maxSize: number
  minSize: number
  /** Total de partidos round-robin que generarán los grupos. */
  matchCount: number
}

/** Plan de grupos (tamaños y partidos) al repartir `teamCount` en `numGroups`. */
export function planGroups(teamCount: number, numGroups: number): GroupPlan {
  const sizes = evenSplit(teamCount, numGroups)
  return {
    numGroups: sizes.length,
    sizes,
    maxSize: Math.max(...sizes),
    minSize: Math.min(...sizes),
    matchCount: sizes.reduce((sum, s) => sum + roundRobinMatchCount(s), 0),
  }
}

/**
 * Grupo (1-based) que le toca a la pareja k-ésima (0-based) en orden de siembra,
 * usando reparto serpenteante: la fila baja 1→G y la siguiente sube G→1, para
 * que los cabezas de serie queden distribuidos y los grupos parejos en fuerza.
 */
export function snakeGroupNumber(k: number, numGroups: number): number {
  const row = Math.floor(k / numGroups)
  const pos = k % numGroups
  const col = row % 2 === 0 ? pos : numGroups - 1 - pos
  return col + 1
}

/** Parejas (índices 0-based) que se enfrentan en un round-robin de `m` equipos. */
export function roundRobinPairs(m: number): [number, number][] {
  const pairs: [number, number][] = []
  for (let i = 0; i < m; i++) {
    for (let j = i + 1; j < m; j++) pairs.push([i, j])
  }
  return pairs
}

/** Nº de partidos de un round-robin de `m` equipos: m·(m−1)/2. */
export function roundRobinMatchCount(m: number): number {
  return (m * (m - 1)) / 2
}

/** Cuántas parejas avanzan por grupo, recomendado (2, o menos si el grupo es chico). */
export function recommendAdvance(minGroupSize: number): number {
  return clamp(2, 1, Math.max(1, minGroupSize))
}

/* -------------------------------------------------------------------------- */
/*  Tabla de posiciones de un grupo                                           */
/* -------------------------------------------------------------------------- */

export type GroupStandingRow = {
  pos: number // posición (1-based) de la pareja dentro del grupo
  played: number
  wins: number
  losses: number
  setsFor: number
  setsAgainst: number
  gamesFor: number
  gamesAgainst: number
}

/** Datos mínimos de un enfrentamiento para computar posiciones. */
export type StandingFixture = {
  aPos: number
  bPos: number
  status: string
  winner: 'A' | 'B' | null
  sets: { gamesA: number; gamesB: number }[]
}

/**
 * Orden de la tabla: más victorias, luego mejor diferencia de sets y, como
 * último criterio, mejor diferencia de juegos. Los empates se resuelven de
 * forma estable por la posición de siembra (no se aplica enfrentamiento directo).
 */
export function compareGroupStandings(
  a: GroupStandingRow,
  b: GroupStandingRow,
): number {
  if (b.wins !== a.wins) return b.wins - a.wins
  const setDiff = b.setsFor - b.setsAgainst - (a.setsFor - a.setsAgainst)
  if (setDiff !== 0) return setDiff
  const gameDiff = b.gamesFor - b.gamesAgainst - (a.gamesFor - a.gamesAgainst)
  if (gameDiff !== 0) return gameDiff
  return a.pos - b.pos
}

/**
 * Calcula la tabla de posiciones de un grupo a partir de los enfrentamientos
 * finalizados. Solo cuentan los partidos con resultado; el orden lo decide
 * `compareGroupStandings`.
 */
export function computeGroupStandings(
  positions: number[],
  fixtures: StandingFixture[],
): GroupStandingRow[] {
  const rows = new Map<number, GroupStandingRow>()
  for (const pos of positions) {
    rows.set(pos, {
      pos,
      played: 0,
      wins: 0,
      losses: 0,
      setsFor: 0,
      setsAgainst: 0,
      gamesFor: 0,
      gamesAgainst: 0,
    })
  }

  for (const f of fixtures) {
    if (f.status !== 'finished' || !f.winner) continue
    const a = rows.get(f.aPos)
    const b = rows.get(f.bPos)
    if (!a || !b) continue

    let setsA = 0
    let setsB = 0
    let gamesA = 0
    let gamesB = 0
    for (const s of f.sets) {
      gamesA += s.gamesA
      gamesB += s.gamesB
      if (s.gamesA > s.gamesB) setsA += 1
      else if (s.gamesB > s.gamesA) setsB += 1
    }

    a.played += 1
    b.played += 1
    a.setsFor += setsA
    a.setsAgainst += setsB
    a.gamesFor += gamesA
    a.gamesAgainst += gamesB
    b.setsFor += setsB
    b.setsAgainst += setsA
    b.gamesFor += gamesB
    b.gamesAgainst += gamesA
    if (f.winner === 'A') {
      a.wins += 1
      b.losses += 1
    } else {
      b.wins += 1
      a.losses += 1
    }
  }

  return [...rows.values()].sort(compareGroupStandings)
}
