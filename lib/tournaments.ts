/**
 * Etiquetas y estilos para torneos y sus categorías. Centraliza los textos en
 * español de los enums de Prisma para reutilizarlos en panel y página pública.
 */

export const tournamentStatusLabels: Record<string, string> = {
  draft: 'Borrador',
  registration_open: 'Inscripción abierta',
  in_progress: 'En juego',
  finished: 'Finalizado',
  archived: 'Archivado',
}

/** Color por estado de torneo para badges/puntos en el dashboard. */
export const tournamentStatusStyles: Record<
  string,
  { text: string; dot: string }
> = {
  draft: { text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  registration_open: { text: 'text-ochre', dot: 'bg-ochre' },
  in_progress: { text: 'text-forest', dot: 'bg-forest' },
  finished: { text: 'text-ochre', dot: 'bg-ochre' },
  archived: { text: 'text-muted-foreground/70', dot: 'bg-muted-foreground/50' },
}

/** Distinción de la categoría: femenil, varonil o mixta. */
export const categoryGenderLabels: Record<string, string> = {
  M: 'Varonil',
  F: 'Femenil',
  mixed: 'Mixta',
}

/**
 * Nivel/fuerza de la categoría. En torneos `unranked` significa categoría
 * abierta (Open), sin distinción de fuerza.
 */
export const skillLevelLabels: Record<string, string> = {
  unranked: 'Open',
  first: '1ra fuerza',
  second: '2da fuerza',
  third: '3ra fuerza',
  fourth: '4ta fuerza',
  fifth: '5ta fuerza',
  sixth: '6ta fuerza',
}

/** Sistema de clasificación / armado del cuadro. */
export const drawTypeLabels: Record<string, string> = {
  single_elim: 'Eliminación directa',
  double_elim: 'Doble eliminación',
  round_robin: 'Round robin',
  groups_playoff: 'Grupos + eliminatoria',
}

/**
 * Nombre legible de una categoría a partir de su distinción y nivel, p. ej.
 * «Mixta · Open» o «Femenil · 3ra fuerza».
 */
export function categoryLabel(gender: string, skillLevel: string): string {
  const g = categoryGenderLabels[gender] ?? gender
  const s = skillLevelLabels[skillLevel] ?? skillLevel
  return `${g} · ${s}`
}
