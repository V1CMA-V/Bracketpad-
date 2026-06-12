// Reglas de liga compartidas entre servidor (clasificación) y cliente (UI).
// Sin dependencias de servidor para poder importarse desde componentes cliente.

/** Sets rotativos que juega cada jugador en su grupo de 4. */
export const NO_SHOW_SETS = 3

/**
 * Duración por defecto (minutos) que un partido aparta la cancha cuando no se
 * fija una explícita. En los grupos de liga marca cuánto dura cada ronda.
 */
export const DEFAULT_MATCH_MINUTES = 90

/**
 * Desfase (en «ranuras» de duración) de un partido dentro de su grupo de liga.
 * Las rondas de un grupo comparten la hora del grupo pero son SECUENCIALES y se
 * escalonan para no solaparse:
 *  · pairs: 2 canchas, 2 partidos por ronda → ranura = (orden − 1) / 2.
 *  · individual: 3 sets en la misma cancha → ranura = orden − 1.
 * El inicio real del partido = hora del grupo + ranura · duración. Sin orden
 * (torneos u otros contextos) → 0. Lo usan tanto la rejilla de programación como
 * la validación de solapes para coincidir en el hueco que ocupa cada partido.
 */
export function leagueStaggerSlot(
  playKind: string | null | undefined,
  intraGroupOrder: number | null | undefined,
): number {
  if (intraGroupOrder == null) return 0
  return playKind === 'pairs'
    ? Math.floor((intraGroupOrder - 1) / 2)
    : intraGroupOrder - 1
}

/**
 * Juegos máximos que puede tener un lado en un set de pádel: el resultado más
 * alto posible es 7-6 (con tie-break a 6-6), así que ningún marcador supera 7.
 * Se usa para acotar los inputs de resultado y validar en el servidor.
 */
export const MAX_GAMES_PER_SET = 7

/** Juegos en contra por set forfeit cuando el jugador no se presenta. */
export const NO_SHOW_GAMES_PER_SET = 3

/**
 * Sanción por defecto (juegos en contra) cuando un jugador no llega a su
 * jornada: forfeit de sus 3 sets a −3 juegos cada uno → 9. Cada liga puede
 * sobrescribirla con `LeagueScoringConfig.noShowGamesAgainst`; esta constante es
 * el valor por defecto y el respaldo cuando una liga no tiene configuración.
 */
export const NO_SHOW_GAMES_AGAINST = NO_SHOW_SETS * NO_SHOW_GAMES_PER_SET
