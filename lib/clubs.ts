// Catálogos del club, compartidos entre servidor y cliente (sin dependencias de
// servidor para poder importarse desde componentes cliente).

// Zonas horarias de México (IANA). La primera es la predeterminada del club.
export const TIMEZONES = [
  'America/Mexico_City',
  'America/Cancun',
  'America/Merida',
  'America/Monterrey',
  'America/Matamoros',
  'America/Mazatlan',
  'America/Chihuahua',
  'America/Hermosillo',
  'America/Tijuana',
] as const

export type Timezone = (typeof TIMEZONES)[number]

export const timezoneLabels: Record<Timezone, string> = {
  'America/Mexico_City': 'Ciudad de México (Centro)',
  'America/Cancun': 'Cancún (Sureste)',
  'America/Merida': 'Mérida (Centro)',
  'America/Monterrey': 'Monterrey (Centro)',
  'America/Matamoros': 'Matamoros (Centro)',
  'America/Mazatlan': 'Mazatlán (Pacífico)',
  'America/Chihuahua': 'Chihuahua (Pacífico)',
  'America/Hermosillo': 'Hermosillo (Noroeste)',
  'America/Tijuana': 'Tijuana (Noroeste)',
}

/* -------------------------------------------------------------------------- */
/*  Días de la semana (0=domingo … 6=sábado)                                   */
/* -------------------------------------------------------------------------- */

// Iniciales y nombres cortos indexados por dayOfWeek.
export const DAY_INITIALS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
export const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
// Orden de presentación lunes → domingo.
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

/**
 * Etiqueta legible para un conjunto de días: reconoce los presets habituales
 * (todos, entre semana, fin de semana) y, si no, lista los días en orden.
 */
export function formatDays(days: number[]): string {
  const set = new Set(days)
  if (set.size === 0) return '—'
  if (set.size === 7) return 'Todos los días'
  const isWeekday = [1, 2, 3, 4, 5].every((d) => set.has(d)) && set.size === 5
  if (isWeekday) return 'Lun – Vie'
  const isWeekend = set.has(0) && set.has(6) && set.size === 2
  if (isWeekend) return 'Sáb y Dom'
  return WEEK_ORDER.filter((d) => set.has(d))
    .map((d) => DAY_SHORT[d])
    .join(', ')
}
