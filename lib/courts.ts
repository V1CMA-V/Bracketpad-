export const COURT_SURFACES = [
  'artificial_grass',
  'concrete',
  'synthetic',
  'glass',
] as const

export type CourtSurface = (typeof COURT_SURFACES)[number]

export const courtSurfaceLabels: Record<CourtSurface, string> = {
  artificial_grass: 'Césped artificial',
  concrete: 'Hormigón',
  synthetic: 'Sintética',
  glass: 'Cristal',
}
