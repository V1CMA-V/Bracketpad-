// Reglas de liga compartidas entre servidor (clasificación) y cliente (UI).
// Sin dependencias de servidor para poder importarse desde componentes cliente.

/** Sets rotativos que juega cada jugador en su grupo de 4. */
export const NO_SHOW_SETS = 3

/**
 * Juegos máximos que puede tener un lado en un set de pádel: el resultado más
 * alto posible es 7-6 (con tie-break a 6-6), así que ningún marcador supera 7.
 * Se usa para acotar los inputs de resultado y validar en el servidor.
 */
export const MAX_GAMES_PER_SET = 7

/** Juegos en contra por set forfeit cuando el jugador no se presenta. */
export const NO_SHOW_GAMES_PER_SET = 3

/**
 * Penalización en diferencia de juegos cuando un jugador no llega a su jornada:
 * pierde sus 3 sets como forfeit (−3 juegos cada uno) → −9 en la diferencia.
 */
export const NO_SHOW_GAME_DIFF = -(NO_SHOW_SETS * NO_SHOW_GAMES_PER_SET)
