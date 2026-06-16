/**
 * Lógica pura para validar y resolver el resultado de un partido al mejor de N
 * sets. Se usa en el servidor (al guardar) y en el cliente (validación previa).
 */

export type SetScore = {
  gamesA: number
  gamesB: number
  tiebreakA?: number | null
  tiebreakB?: number | null
}

/** Sets necesarios para ganar (mejor de 3 → 2, mejor de 1 → 1). */
export function setsToWin(bestOfSets: number): number {
  return Math.ceil(bestOfSets / 2)
}

export type DecideResult =
  | { ok: true; winner: 'A' | 'B'; setsA: number; setsB: number }
  | { ok: false; error: string }

/**
 * Decide el ganador a partir de los sets capturados, validando que el marcador
 * defina un resultado coherente al mejor de `bestOfSets`: cada set tiene un
 * ganador y el partido termina justo cuando una pareja alcanza los sets
 * necesarios (sin sets de más ni de menos).
 */
export function decideResult(
  sets: SetScore[],
  bestOfSets: number,
): DecideResult {
  const need = setsToWin(bestOfSets)
  if (sets.length === 0) return { ok: false, error: 'Captura al menos un set.' }
  if (sets.length > bestOfSets) {
    return { ok: false, error: `Como máximo ${bestOfSets} sets.` }
  }

  let setsA = 0
  let setsB = 0
  for (let i = 0; i < sets.length; i++) {
    const s = sets[i]
    if (
      !Number.isInteger(s.gamesA) ||
      !Number.isInteger(s.gamesB) ||
      s.gamesA < 0 ||
      s.gamesB < 0 ||
      s.gamesA > 99 ||
      s.gamesB > 99
    ) {
      return { ok: false, error: `Set ${i + 1}: marcador inválido.` }
    }
    if (s.gamesA === s.gamesB) {
      return { ok: false, error: `Set ${i + 1}: no puede quedar empatado.` }
    }
    if (s.gamesA > s.gamesB) setsA += 1
    else setsB += 1
  }

  const max = Math.max(setsA, setsB)
  const min = Math.min(setsA, setsB)
  if (max !== need || min >= need) {
    return {
      ok: false,
      error: `El marcador no define un ganador al mejor de ${bestOfSets} (se necesitan ${need} sets).`,
    }
  }

  return { ok: true, winner: setsA > setsB ? 'A' : 'B', setsA, setsB }
}
