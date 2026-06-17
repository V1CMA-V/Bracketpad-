/**
 * Helpers puros para la página pública de un torneo. Convierten las parejas y
 * partidos (con sus jugadores y sets) en las etiquetas limpias que ven los
 * jugadores: nombres de pareja, iniciales y marcadores legibles. No tocan la
 * base de datos.
 */

/* -------------------------------------------------------------------------- */
/*  Parejas                                                                    */
/* -------------------------------------------------------------------------- */

export type TeamMemberLite = { player: { fullName: string } }
export type TeamLite = {
  name: string | null
  members: TeamMemberLite[]
}

/** Apellido (último token) de un nombre completo, para marcadores compactos. */
function surname(fullName: string): string {
  const tokens = fullName.trim().split(/\s+/)
  return tokens.length > 1 ? tokens[tokens.length - 1] : tokens[0]
}

/** Inicial del nombre de pila. */
function firstInitial(fullName: string): string {
  return (fullName.trim()[0] ?? '?').toUpperCase()
}

/**
 * Nombre legible de una pareja: «Apellido / Apellido» a partir de sus jugadores;
 * si no tiene jugadores, su nombre libre; en último caso «Por definir».
 */
export function teamLabel(team: TeamLite | null | undefined): string {
  if (!team) return 'Por definir'
  if (team.members.length > 0) {
    return team.members.map((m) => surname(m.player.fullName)).join(' / ')
  }
  return team.name?.trim() || 'Por definir'
}

/** Hasta dos iniciales para los avatares de la pareja. */
export function teamInitials(team: TeamLite | null | undefined): [string, string] {
  if (!team || team.members.length === 0) {
    const n = team?.name?.trim()
    return n ? [n[0].toUpperCase(), n.slice(1, 2).toUpperCase() || '·'] : ['·', '·']
  }
  const a = firstInitial(team.members[0].player.fullName)
  const b = team.members[1]
    ? firstInitial(team.members[1].player.fullName)
    : surname(team.members[0].player.fullName)[0]?.toUpperCase() ?? '·'
  return [a, b]
}

/* -------------------------------------------------------------------------- */
/*  Marcadores                                                                 */
/* -------------------------------------------------------------------------- */

export type SetLite = {
  setNumber: number
  gamesA: number
  gamesB: number
  tiebreakA: number | null
  tiebreakB: number | null
}

export type SetScore = { a: number; b: number; tbA: number | null; tbB: number | null }

/** Ordena y normaliza los sets de un partido para mostrarlos. */
export function setScores(sets: SetLite[]): SetScore[] {
  return [...sets]
    .sort((x, y) => x.setNumber - y.setNumber)
    .map((s) => ({ a: s.gamesA, b: s.gamesB, tbA: s.tiebreakA, tbB: s.tiebreakB }))
}

/* -------------------------------------------------------------------------- */
/*  Estado de una categoría a partir de sus partidos                          */
/* -------------------------------------------------------------------------- */

export type CategoryPhase = 'upcoming' | 'live' | 'finished'

export const categoryPhaseLabels: Record<CategoryPhase, string> = {
  upcoming: 'Por comenzar',
  live: 'En juego',
  finished: 'Finalizada',
}

/**
 * Fase de una categoría/torneo según el estado de sus partidos: «en juego» si
 * alguno está in_progress, «finalizada» si todos terminaron (y hay partidos),
 * y «por comenzar» en cualquier otro caso (sin partidos o solo programados).
 */
export function deriveCategoryPhase(
  matches: { status: string }[],
): CategoryPhase {
  if (matches.some((m) => m.status === 'in_progress')) return 'live'
  if (
    matches.length > 0 &&
    matches.every((m) =>
      ['finished', 'walkover', 'cancelled'].includes(m.status),
    )
  ) {
    return 'finished'
  }
  return 'upcoming'
}

/* -------------------------------------------------------------------------- */
/*  Estado de inscripción de un torneo                                         */
/* -------------------------------------------------------------------------- */

export type RegistrationState = 'open' | 'upcoming' | 'closed' | 'none'

export type RegistrationInfo = {
  state: RegistrationState
  label: string
}

type RegistrationInput = {
  status: string
  registrationOpensAt: Date | null
  registrationClosesAt: Date | null
}

/**
 * Estado legible de la inscripción a un torneo a partir de su `status` y de las
 * fechas de apertura/cierre. No hay registro en línea: sirve para orientar al
 * jugador sobre si puede inscribirse y hasta cuándo (el club confirma plazas).
 */
export function registrationState(
  t: RegistrationInput,
  now: Date = new Date(),
): RegistrationInfo {
  const opens = t.registrationOpensAt
  const closes = t.registrationClosesAt

  // Una vez el torneo arranca o termina, la inscripción ya no está abierta.
  if (t.status === 'in_progress') return { state: 'closed', label: 'Torneo en juego' }
  if (t.status === 'finished' || t.status === 'archived') {
    return { state: 'closed', label: 'Torneo finalizado' }
  }

  if (opens && now < opens) {
    return { state: 'upcoming', label: 'Inscripción próximamente' }
  }
  if (closes && now > closes) {
    return { state: 'closed', label: 'Inscripción cerrada' }
  }
  if (t.status === 'registration_open' || opens || closes) {
    return { state: 'open', label: 'Inscripción abierta' }
  }
  return { state: 'none', label: 'Inscripción por confirmar' }
}
