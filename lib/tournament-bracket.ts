/**
 * Utilidades puras para la fase eliminatoria (llave) de una categoría de torneo.
 * No tocan la base de datos: se usan en el servidor (al generar la llave y al
 * propagar resultados) y en el cliente (vista previa de clasificados). Parten de
 * las posiciones de grupo que calcula `computeGroupStandings` en
 * `lib/tournament-groups.ts`.
 */

/* -------------------------------------------------------------------------- */
/*  Nombres y etiquetas de ronda                                              */
/* -------------------------------------------------------------------------- */

/** Secuencia canónica de rondas de eliminación directa (de más a menos parejas). */
const KO_SEQUENCE = ['R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'F'] as const

/** Etiqueta en español de cada `bracketRound` (incluye grupos y 3er lugar). */
export const bracketRoundLabels: Record<string, string> = {
  groups: 'Fase de grupos',
  R128: 'Ronda de 128',
  R64: 'Ronda de 64',
  R32: 'Dieciseisavos',
  R16: 'Octavos',
  QF: 'Cuartos',
  SF: 'Semifinal',
  F: 'Final',
  '3P': '3er lugar',
}

/** Etiqueta legible de una ronda; cae al código si no se conoce. */
export function roundLabel(round: string): string {
  return bracketRoundLabels[round] ?? round
}

/** Nombre de la ronda según cuántos partidos tiene (1→F, 2→SF, 4→QF, 8→R16…). */
function roundNameForMatchCount(matchCount: number): string {
  if (matchCount === 1) return 'F'
  if (matchCount === 2) return 'SF'
  if (matchCount === 4) return 'QF'
  return `R${matchCount * 2}`
}

/**
 * Lista de rondas de una llave de `bracketSize` parejas, de la 1ª a la final
 * (sin incluir el 3er lugar). Ej.: 8 → ["QF","SF","F"]; 16 → ["R16","QF","SF","F"].
 */
export function roundNamesFor(bracketSize: number): string[] {
  const rounds: string[] = []
  for (let m = bracketSize / 2; m >= 1; m = m / 2) {
    rounds.push(roundNameForMatchCount(m))
  }
  return rounds
}

/** Orden de una ronda para mostrar la llave (el 3er lugar va tras la final). */
export function roundSortIndex(round: string): number {
  if (round === '3P') return KO_SEQUENCE.length
  const i = (KO_SEQUENCE as readonly string[]).indexOf(round)
  return i < 0 ? 99 : i
}

/** Ronda siguiente en la secuencia, o null si es la final. */
export function roundAfter(round: string): string | null {
  const i = (KO_SEQUENCE as readonly string[]).indexOf(round)
  if (i < 0 || i >= KO_SEQUENCE.length - 1) return null
  return KO_SEQUENCE[i + 1]
}

/* -------------------------------------------------------------------------- */
/*  Selección de clasificados                                                 */
/* -------------------------------------------------------------------------- */

/** Menor potencia de 2 ≥ n (mínimo 2). Ej.: 3→4, 5→8, 8→8. */
export function nextPow2(n: number): number {
  let p = 2
  while (p < n) p *= 2
  return p
}

/**
 * Posición (1-based) de cada pareja dentro de su grupo, con los datos mínimos
 * para comparar «mejores segundos» entre grupos distintos.
 */
export type TeamStanding = {
  teamId: string
  groupNumber: number
  rankInGroup: number // 1 = primero del grupo
  wins: number
  setDiff: number
  gameDiff: number
}

/** Orden de candidatos al comodín: más victorias, mejor dif. de sets y de juegos. */
export function compareWildcards(a: TeamStanding, b: TeamStanding): number {
  if (b.wins !== a.wins) return b.wins - a.wins
  if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff
  if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff
  return a.groupNumber - b.groupNumber
}

export type QualifierSelection = {
  /** Clasificados directos (top `advancePerGroup` de cada grupo). */
  direct: TeamStanding[]
  /** Comodines elegidos que completan la llave. */
  wildcards: TeamStanding[]
  /** Todos los candidatos a comodín (la siguiente posición de cada grupo), ordenados. */
  wildcardCandidates: TeamStanding[]
  /** Tamaño de la llave: potencia de 2 ≥ (directos + comodines). */
  bracketSize: number
  /** Huecos vacíos de la llave: byes para los mejores sembrados. */
  byes: number
}

/**
 * Reparte los clasificados de los grupos en directos + comodines. Los directos
 * son las primeras `advancePerGroup` posiciones de cada grupo; los comodines se
 * eligen entre las parejas de la posición siguiente (los «mejores segundos»),
 * ordenadas por `compareWildcards`. Si `overrideWildcardIds` trae una selección
 * manual válida (subconjunto de candidatos), se respeta y se completa con los
 * mejores restantes hasta `wildcardSlots`.
 */
export function selectQualifiers(
  standings: TeamStanding[],
  advancePerGroup: number,
  wildcardSlots: number,
  overrideWildcardIds: string[] = [],
): QualifierSelection {
  const direct = standings
    .filter((s) => s.rankInGroup <= advancePerGroup)
    .sort((a, b) => a.rankInGroup - b.rankInGroup || a.groupNumber - b.groupNumber)

  // Candidatos al comodín: la posición inmediatamente siguiente de cada grupo.
  const wildcardTier = advancePerGroup + 1
  const wildcardCandidates = standings
    .filter((s) => s.rankInGroup === wildcardTier)
    .sort(compareWildcards)

  const slots = Math.max(0, Math.min(wildcardSlots, wildcardCandidates.length))
  const byId = new Map(wildcardCandidates.map((c) => [c.teamId, c]))

  // Override manual: respeta los ids válidos en orden y rellena con los mejores.
  const wildcards: TeamStanding[] = []
  const used = new Set<string>()
  for (const id of overrideWildcardIds) {
    const c = byId.get(id)
    if (c && !used.has(id) && wildcards.length < slots) {
      wildcards.push(c)
      used.add(id)
    }
  }
  for (const c of wildcardCandidates) {
    if (wildcards.length >= slots) break
    if (!used.has(c.teamId)) {
      wildcards.push(c)
      used.add(c.teamId)
    }
  }

  const total = direct.length + wildcards.length
  const bracketSize = nextPow2(Math.max(2, total))
  return {
    direct,
    wildcards,
    wildcardCandidates,
    bracketSize,
    byes: bracketSize - total,
  }
}

/* -------------------------------------------------------------------------- */
/*  Siembra de la llave                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Orden estándar de siembra: para una llave de `n` (potencia de 2) devuelve, por
 * cada slot (0-based), el nº de siembra (1-based) que le corresponde, de modo que
 * los mejores sembrados queden lo más separados posible. Ej.: n=4 → [1,4,2,3]
 * (partidos 1·4 y 2·3); n=8 → [1,8,4,5,2,7,3,6].
 */
export function seedSlots(n: number): number[] {
  let seeds = [1]
  while (seeds.length < n) {
    const len = seeds.length * 2
    const next: number[] = []
    for (const s of seeds) {
      next.push(s)
      next.push(len + 1 - s)
    }
    seeds = next
  }
  return seeds
}

export type BracketMatchPlan = {
  round: string
  slot: number
  teamA: string | null
  teamB: string | null
}

export type BracketPlan = {
  bracketSize: number
  rounds: string[]
  matches: BracketMatchPlan[]
}

/**
 * Arma el plan completo de partidos de la llave. Siembra a los clasificados
 * (ganadores de grupo arriba, comodines abajo) con el orden estándar, intenta
 * evitar que dos parejas del mismo grupo se crucen en la 1ª ronda, resuelve los
 * byes empujando a la pareja directamente a la 2ª ronda, y deja el resto de
 * partidos con lados por definir. Añade el partido por el 3er lugar si procede.
 */
export function buildBracketPlan(input: {
  direct: TeamStanding[]
  wildcards: TeamStanding[]
  bracketSize: number
  thirdPlace: boolean
}): BracketPlan {
  const { bracketSize, thirdPlace } = input
  // Siembra por fuerza: directos por posición de grupo, luego comodines.
  const seedList = [...input.direct, ...input.wildcards]
  const byId = new Map(seedList.map((s) => [s.teamId, s]))

  // slotTeam[i] = id de la pareja en el slot i de la 1ª ronda (null = bye).
  const order = seedSlots(bracketSize)
  const slotTeam: (string | null)[] = order.map((seed) =>
    seed <= seedList.length ? seedList[seed - 1].teamId : null,
  )

  reduceSameGroupClashes(slotTeam, byId)

  const rounds = roundNamesFor(bracketSize)
  const matches: BracketMatchPlan[] = []
  // Lados pre-asignados por byes (y, más adelante, sin usar): clave `${round}:${slot}`.
  const preset = new Map<string, { A?: string; B?: string }>()
  const setSide = (round: string, slot: number, side: 'A' | 'B', id: string) => {
    const key = `${round}:${slot}`
    const cur = preset.get(key) ?? {}
    cur[side] = id
    preset.set(key, cur)
  }

  // 1ª ronda: solo partidos disputados (dos parejas). Los byes pasan a la 2ª.
  const firstRound = rounds[0]
  const secondRound = rounds[1] // undefined si la llave es solo la final
  for (let k = 0; k < bracketSize / 2; k++) {
    const a = slotTeam[2 * k]
    const b = slotTeam[2 * k + 1]
    if (a && b) {
      matches.push({ round: firstRound, slot: k, teamA: a, teamB: b })
    } else if ((a || b) && secondRound) {
      // Bye: la pareja avanza al slot floor(k/2) de la 2ª ronda.
      setSide(secondRound, Math.floor(k / 2), k % 2 === 0 ? 'A' : 'B', (a ?? b)!)
    }
  }

  // Rondas posteriores: todos los partidos, con lados pre-asignados por byes.
  for (let r = 1; r < rounds.length; r++) {
    const round = rounds[r]
    const count = bracketSize / 2 ** (r + 1)
    for (let slot = 0; slot < count; slot++) {
      const pre = preset.get(`${round}:${slot}`) ?? {}
      matches.push({ round, slot, teamA: pre.A ?? null, teamB: pre.B ?? null })
    }
  }

  // Partido por el 3er lugar: solo si hay semifinales.
  if (thirdPlace && rounds.includes('SF')) {
    matches.push({ round: '3P', slot: 0, teamA: null, teamB: null })
  }

  return { bracketSize, rounds, matches }
}

/**
 * Intenta deshacer los cruces de 1ª ronda entre parejas del mismo grupo mediante
 * intercambios entre parejas de la misma posición de grupo (misma «fuerza»), para
 * no alterar el equilibrio de la siembra. Es de mejor esfuerzo: si un cruce no se
 * puede resolver sin crear otro, se deja como está. Muta `slotTeam`.
 */
function reduceSameGroupClashes(
  slotTeam: (string | null)[],
  byId: Map<string, TeamStanding>,
) {
  const group = (id: string | null) =>
    id == null ? null : (byId.get(id)?.groupNumber ?? null)
  const tier = (id: string | null) =>
    id == null ? null : (byId.get(id)?.rankInGroup ?? null)
  const clash = (i: number, j: number) => {
    const gi = group(slotTeam[i])
    const gj = group(slotTeam[j])
    return gi != null && gi === gj
  }
  const n = slotTeam.length
  for (let k = 0; k < n / 2; k++) {
    const i = 2 * k
    const j = 2 * k + 1
    if (!clash(i, j)) continue
    // Busca otro slot con el que intercambiar `j` sin crear un nuevo cruce.
    for (let m = 0; m < n; m++) {
      if (m === i || m === j) continue
      if (slotTeam[m] == null || tier(slotTeam[m]) !== tier(slotTeam[j])) continue
      const partner = m % 2 === 0 ? m + 1 : m - 1
      // Tras el swap: ni el partido de `j` ni el de `m` deben quedar en cruce.
      const newJ = slotTeam[m]
      const newM = slotTeam[j]
      const gAtI = group(slotTeam[i])
      const gAtPartner = group(slotTeam[partner])
      const okHere = gAtI == null || gAtI !== group(newJ)
      const okThere = gAtPartner == null || gAtPartner !== group(newM)
      if (okHere && okThere) {
        ;[slotTeam[j], slotTeam[m]] = [slotTeam[m], slotTeam[j]]
        break
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Propagación de resultados                                                 */
/* -------------------------------------------------------------------------- */

export type Progression = {
  /** Destino del ganador, o null si era la final. */
  winner: { round: string; slot: number; side: 'A' | 'B' } | null
  /** Destino del perdedor (solo semifinales → 3er lugar). */
  loserToThirdPlace: { side: 'A' | 'B' } | null
}

/**
 * A dónde van el ganador y el perdedor de un partido de llave. El ganador sube a
 * la ronda siguiente, al slot floor(slot/2) y al lado A/B según la paridad del
 * slot. En semifinales, el perdedor cae al partido por el 3er lugar (slot 0).
 */
export function bracketProgression(round: string, slot: number): Progression {
  const next = roundAfter(round)
  const winner =
    next == null
      ? null
      : { round: next, slot: Math.floor(slot / 2), side: (slot % 2 === 0 ? 'A' : 'B') as 'A' | 'B' }
  const loserToThirdPlace =
    round === 'SF' ? { side: (slot === 0 ? 'A' : 'B') as 'A' | 'B' } : null
  return { winner, loserToThirdPlace }
}
