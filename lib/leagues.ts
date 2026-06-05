export const leagueFormatLabels: Record<string, string> = {
  round_robin: 'Round robin',
  divisions: 'Divisiones',
  ladder: 'Escalera',
}

export const leagueStatusLabels: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activa',
  finished: 'Finalizada',
  archived: 'Archivada',
}

export const standingTiebreakerLabels: Record<string, string> = {
  head_to_head: 'Enfrentamiento directo',
  set_diff: 'Diferencia de sets',
  game_diff: 'Diferencia de juegos',
  sets_won: 'Sets ganados',
  games_won: 'Juegos ganados',
}

export const registrationStatusLabels: Record<string, string> = {
  active: 'Activa',
  withdrawn: 'Retirada',
}

/** Clases de color por estado para badges/puntos en el dashboard. */
export const leagueStatusStyles: Record<string, { text: string; dot: string }> =
  {
    draft: { text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
    active: { text: 'text-forest', dot: 'bg-forest' },
    finished: { text: 'text-ochre', dot: 'bg-ochre' },
    archived: { text: 'text-muted-foreground/70', dot: 'bg-muted-foreground/50' },
  }
