// Catálogos y etiquetas de jugadores, compartidos entre servidor y cliente.
// Sin dependencias de servidor para poder importarse desde componentes cliente.

export const GENDERS = ['M', 'F', 'X'] as const
export type Gender = (typeof GENDERS)[number]

export const SKILL_LEVELS = [
  'unranked',
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
] as const
export type SkillLevel = (typeof SKILL_LEVELS)[number]

export const HANDS = ['left', 'right'] as const
export type Hand = (typeof HANDS)[number]

export const genderLabels: Record<Gender, string> = {
  M: 'Masculino',
  F: 'Femenino',
  X: 'Otro',
}

export const skillLevelLabels: Record<SkillLevel, string> = {
  unranked: 'Sin categoría',
  first: '1ª fuerza',
  second: '2ª fuerza',
  third: '3ª fuerza',
  fourth: '4ª fuerza',
  fifth: '5ª fuerza',
  sixth: '6ª fuerza',
}

/** Etiqueta corta de categoría para badges/columnas compactas. */
export const skillLevelShort: Record<SkillLevel, string> = {
  unranked: '—',
  first: '1ª',
  second: '2ª',
  third: '3ª',
  fourth: '4ª',
  fifth: '5ª',
  sixth: '6ª',
}

export const handLabels: Record<Hand, string> = {
  left: 'Zurdo',
  right: 'Diestro',
}
