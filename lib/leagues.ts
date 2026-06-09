/**
 * Etiqueta de una inscripción para mostrar. En ligas por parejas une los dos
 * jugadores con « / »; en individuales devuelve el nombre del jugador.
 */
export function teamLabel(
  playerName: string,
  partnerName?: string | null,
): string {
  return partnerName ? `${playerName} / ${partnerName}` : playerName
}

export const leagueFormatLabels: Record<string, string> = {
  round_robin: 'Round robin',
  divisions: 'Grupos',
  ladder: 'Escalera',
}

/** Cómo se decide la clasificación de la liga. */
export const leagueRankingBasisLabels: Record<string, string> = {
  sets: 'Por sets ganados',
  games: 'Por juegos ganados',
  both: 'Por sets y juegos',
}

export const leagueStatusLabels: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activa',
  finished: 'Finalizada',
  archived: 'Archivada',
}

export const leagueRoundStatusLabels: Record<string, string> = {
  draft: 'No publicada',
  published: 'Publicada',
  closed: 'Cerrada',
}

/** Color por estado de jornada para badges/puntos en el panel. */
export const leagueRoundStatusStyles: Record<
  string,
  { text: string; dot: string }
> = {
  draft: { text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  published: { text: 'text-forest', dot: 'bg-forest' },
  closed: { text: 'text-ochre', dot: 'bg-ochre' },
}

export const registrationStatusLabels: Record<string, string> = {
  active: 'Activa',
  withdrawn: 'Retirada',
}

export const matchStatusLabels: Record<string, string> = {
  scheduled: 'Programado',
  in_progress: 'En juego',
  suspended: 'Suspendido',
  finished: 'Finalizado',
  walkover: 'W.O.',
  cancelled: 'Cancelado',
}

/** Color por estado de partido para puntos/badges en la vista pública. */
export const matchStatusStyles: Record<string, { text: string; dot: string }> = {
  scheduled: { text: 'text-ink/50', dot: 'bg-ink/40' },
  in_progress: { text: 'text-terracotta', dot: 'bg-terracotta' },
  suspended: { text: 'text-ochre', dot: 'bg-ochre' },
  finished: { text: 'text-forest', dot: 'bg-forest' },
  walkover: { text: 'text-ochre', dot: 'bg-ochre' },
  cancelled: { text: 'text-ink/40', dot: 'bg-ink/30' },
}

/** Clases de color por estado para badges/puntos en el dashboard. */
export const leagueStatusStyles: Record<string, { text: string; dot: string }> =
  {
    draft: { text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
    active: { text: 'text-forest', dot: 'bg-forest' },
    finished: { text: 'text-ochre', dot: 'bg-ochre' },
    archived: { text: 'text-muted-foreground/70', dot: 'bg-muted-foreground/50' },
  }
