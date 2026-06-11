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
