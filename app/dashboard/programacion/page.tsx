import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { DayJump } from '@/components/dashboard/day-jump'
import { NewReservationButton } from '@/components/dashboard/reservation-form'
import {
  ReservationEditor,
  type EditableReservation,
} from '@/components/dashboard/reservation-editor'
import {
  DayItinerary,
  type ItineraryItem,
  type MatchState,
  type ReservationRow,
} from '@/components/dashboard/reservation-list'
import {
  ScheduledMatchBlock,
  type MatchDetail,
} from '@/components/dashboard/schedule-match-block'
import { roundLabel } from '@/lib/tournament-bracket'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'
import { DEFAULT_MATCH_MINUTES, leagueStaggerSlot } from '@/lib/league-rules'
import {
  formatDuration,
  paymentStatusLabels,
  type ReservationPaymentStatus,
  type WeekHours,
} from '@/lib/reservations'
import {
  clubDateKey,
  clubDayNoon,
  clubDayRange,
  clubDecimalHour,
  clubMinutesOfDay,
  clubTimeLabel,
  clubWeekday,
  formatInClubTz,
} from '@/lib/timezone'
import { CalendarClock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Programación de pistas',
}

/* -------------------------------------------------------------------------- */
/*  Modelo                                                                     */
/* -------------------------------------------------------------------------- */

// Ventana por defecto cuando el día no tiene partidos (09:00 — 21:00).
const DEFAULT_START = 9
const DEFAULT_END = 21

type SlotState =
  | 'en-juego'
  | 'proximo'
  | 'disputado'
  | 'conflicto'
  | 'reserva'
  | 'clase'

type ScheduledMatch = {
  id: string
  // 'match' = partido de liga/torneo; 'reserva' = apartado privado de pista.
  kind: 'match' | 'reserva'
  start: number // hora decimal (16.25 = 16:15)
  duration: number
  // subtitle = competición (liga/categoría); tag = grupo/ronda; label = jugadores.
  subtitle?: string
  tag: string
  label: string
  timeLabel: string
  state: SlotState
  // Reparto horizontal cuando varios partidos coinciden en la misma pista y hora
  // (conflicto): se dibujan lado a lado para poder verlos y abrirlos.
  lane: number
  lanes: number
  // Enlace a la pantalla donde se edita (jornada de la liga), y texto para el
  // tooltip al pasar el ratón.
  href?: string
  title: string
  // Detalle de solo lectura para el panel al hacer clic (solo en partidos).
  detail?: MatchDetail
}

type CourtRow = {
  id: string
  n: number
  name: string
  surface: string
  matches: ScheduledMatch[]
}

const surfaceLabels: Record<string, string> = {
  artificial_grass: 'Césped',
  concrete: 'Hormigón',
  synthetic: 'Sintética',
  glass: 'Cristal',
}

const stateFromStatus: Record<string, SlotState> = {
  in_progress: 'en-juego',
  scheduled: 'proximo',
  finished: 'disputado',
  walkover: 'disputado',
  suspended: 'disputado',
  cancelled: 'disputado',
}

const legend: { label: string; cls: string }[] = [
  { label: 'En juego', cls: 'bg-forest' },
  { label: 'Próximo', cls: 'bg-ochre' },
  { label: 'Reserva', cls: 'bg-ink' },
  { label: 'Clase', cls: 'bg-plum' },
  { label: 'Disputado', cls: 'bg-muted border border-border' },
  { label: 'Conflicto', cls: 'bg-terracotta' },
]

/* -------------------------------------------------------------------------- */
/*  Utilidades                                                                 */
/* -------------------------------------------------------------------------- */

/** Apellido (último token) para etiquetas compactas. */
function surname(full: string): string {
  const parts = full.trim().split(/\s+/)
  return parts[parts.length - 1] || full
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "HH:MM" → hora decimal (8.5 = 08:30), o null si no es válida. */
function parseHour(hhmm: string | null): number | null {
  if (!hhmm) return null
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!m) return null
  return Number(m[1]) + Number(m[2]) / 60
}

/* -------------------------------------------------------------------------- */
/*  Carga de datos                                                            */
/* -------------------------------------------------------------------------- */

async function getSchedule(clubId: string, dayKey: string) {
  const { start: dayStart, end: dayEnd } = clubDayRange(dayKey)

  const [courts, matches, reservations, coaches, classPricing, allHours] =
    await Promise.all([
    prisma.court.findMany({
      where: { clubId, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, surface: true, isIndoor: true },
    }),
    prisma.match.findMany({
      where: { clubId, scheduledAt: { gte: dayStart, lt: dayEnd } },
      include: {
        league: { select: { name: true, playKind: true } },
        leagueRound: { select: { roundNumber: true } },
        category: {
          select: {
            name: true,
            tournament: { select: { id: true, name: true } },
          },
        },
        sets: {
          orderBy: { setNumber: 'asc' },
          select: {
            gamesA: true,
            gamesB: true,
            tiebreakA: true,
            tiebreakB: true,
          },
        },
        sides: {
          orderBy: { side: 'asc' },
          include: {
            team: {
              select: {
                name: true,
                members: {
                  select: { player: { select: { fullName: true } } },
                },
              },
            },
            players: {
              include: { player: { select: { fullName: true } } },
            },
          },
        },
      },
    }),
    // Reservas privadas del club (juego libre o clase) que apartan pista ese día.
    prisma.courtReservation.findMany({
      where: { clubId, startAt: { gte: dayStart, lt: dayEnd } },
      orderBy: { startAt: 'asc' },
      include: { coach: { select: { fullName: true } } },
    }),
    // Coaches activos del club (para reservar clases).
    prisma.coach.findMany({
      where: { clubId, isActive: true },
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true },
    }),
    // Tarifario de clases del club (prerellena el precio al reservar una clase).
    prisma.clubClassPricing.findUnique({ where: { clubId } }),
    // Horario del club por día de la semana: define la franja de la rejilla y las
    // horas que el formulario de reserva ofrece para cada día.
    prisma.clubHours.findMany({
      where: { clubId },
      select: { dayOfWeek: true, openTime: true, closeTime: true },
    }),
  ])

  // Horario indexado por día de la semana (0=domingo); null = cerrado ese día.
  const weekHours: WeekHours = Array.from({ length: 7 }, () => null)
  for (const h of allHours) {
    weekHours[h.dayOfWeek] = { openTime: h.openTime, closeTime: h.closeTime }
  }
  const dayHours = weekHours[clubWeekday(dayStart)]

  return {
    courts,
    matches,
    reservations,
    coaches,
    classPricing,
    weekHours,
    dayHours,
  }
}

type RawMatch = Awaited<ReturnType<typeof getSchedule>>['matches'][number]

/** Etiqueta de un lado del partido (apellidos de los jugadores o nombre del equipo). */
function sideLabel(side: RawMatch['sides'][number] | undefined): string {
  if (!side) return '—'
  // Ligas individuales: jugadores asignados explícitamente a este lado.
  if (side.players.length > 0) {
    return side.players.map((p) => surname(p.player.fullName)).join(' / ')
  }
  // Torneos (grupos y llave): la pareja se identifica por sus integrantes. En la
  // llave un lado puede estar aún por definir (sin equipo): se muestra «—».
  if (side.team) {
    if (side.team.members.length > 0) {
      return side.team.members.map((m) => surname(m.player.fullName)).join(' / ')
    }
    if (side.team.name) return side.team.name
  }
  return '—'
}

/** Como `sideLabel` pero con nombres completos (para el panel de detalle). */
function sideFullLabel(side: RawMatch['sides'][number] | undefined): string {
  if (!side) return '—'
  if (side.players.length > 0) {
    return side.players.map((p) => p.player.fullName).join(' / ')
  }
  if (side.team) {
    if (side.team.members.length > 0) {
      return side.team.members.map((m) => m.player.fullName).join(' / ')
    }
    if (side.team.name) return side.team.name
  }
  return '—'
}

/** Estado del partido en español para el panel de detalle. */
const matchStatusLabels: Record<string, string> = {
  scheduled: 'Programado',
  in_progress: 'En juego',
  finished: 'Disputado',
  walkover: 'Walkover',
  suspended: 'Suspendido',
  cancelled: 'Cancelado',
}

/**
 * Construye las etiquetas de un partido:
 *  · subtitle = competición (nombre de la liga o categoría del torneo)
 *  · tag      = grupo / ronda (compacto, p. ej. «G1»)
 *  · full     = contexto completo para el tooltip
 */
function matchContext(m: RawMatch): {
  subtitle?: string
  tag: string
  full: string
} {
  if (m.leagueId) {
    const subtitle = m.league?.name ?? 'Liga'
    const tag =
      m.groupNumber != null
        ? `G${m.groupNumber}`
        : m.leagueRound
          ? `J${m.leagueRound.roundNumber}`
          : 'Liga'
    const parts = [subtitle]
    if (m.groupNumber != null) parts.push(`Grupo ${m.groupNumber}`)
    if (m.leagueRound) parts.push(`Jornada ${m.leagueRound.roundNumber}`)
    return { subtitle, tag, full: parts.join(' · ') }
  }
  if (m.categoryId) {
    const subtitle = m.category?.name ?? 'Torneo'
    const tag = m.bracketRound ?? subtitle
    return {
      subtitle,
      tag,
      full: m.bracketRound ? `${subtitle} · ${m.bracketRound}` : subtitle,
    }
  }
  return { tag: 'Partido', full: 'Partido' }
}

/* -------------------------------------------------------------------------- */
/*  Página                                                                    */
/* -------------------------------------------------------------------------- */

export default async function ProgramacionPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; edit?: string }>
}) {
  const club = await getManagedClub()
  if (!club) notFound()

  const { d, edit } = await searchParams
  const todayKey = clubDateKey(new Date())
  const selectedKey =
    d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : todayKey
  // Ancla a mediodía del día seleccionado (mismo día natural en el club) para
  // formatear el encabezado y construir la semana.
  const selected = clubDayNoon(selectedKey)
  const isToday = selectedKey === todayKey

  const {
    courts,
    matches,
    reservations,
    coaches,
    classPricing,
    weekHours,
    dayHours,
  } = await getSchedule(club.id, selectedKey)

  // Coaches y tarifario de clases para el formulario de reserva.
  const coachOptions = coaches.map((c) => ({ id: c.id, name: c.fullName }))
  const classPrices = {
    currency: classPricing?.currency ?? 'MXN',
    // byCount[n] = precio para n jugadores (índice 0 sin usar).
    byCount: [
      null,
      classPricing?.price1 ? Number(classPricing.price1) : null,
      classPricing?.price2 ? Number(classPricing.price2) : null,
      classPricing?.price3 ? Number(classPricing.price3) : null,
      classPricing?.price4 ? Number(classPricing.price4) : null,
    ],
  }

  // Construye los partidos posicionables (con pista y hora) por pista.
  const courtNameLookup = new Map(courts.map((c) => [c.id, c.name]))
  const matchById = new Map<string, ScheduledMatch>()
  const byCourt = new Map<string, ScheduledMatch[]>()
  for (const m of matches) {
    if (!m.courtId || !m.scheduledAt) continue
    // Los partidos de un grupo de liga comparten la hora del grupo, pero son
    // rondas SECUENCIALES: se escalonan según su orden para no solaparse.
    //  · Parejas: 2 canchas, 2 partidos por ronda → ronda = (orden-1) / 2.
    //  · Individual: 3 sets en la misma cancha → ronda = orden-1.
    const slot = m.leagueId
      ? leagueStaggerSlot(m.league?.playKind, m.intraGroupOrder)
      : 0
    // El escalonado y el ancho del bloque usan la duración real del partido
    // (apartado de cancha); si no se fijó, la duración por defecto.
    const durMin = m.durationMinutes ?? DEFAULT_MATCH_MINUTES
    const startMinutes = clubMinutesOfDay(m.scheduledAt) + slot * durMin
    const startH = Math.floor(startMinutes / 60)
    const startM = startMinutes % 60
    const start = startMinutes / 60
    const timeLabel = `${String(startH).padStart(2, '0')}:${String(
      startM,
    ).padStart(2, '0')}`
    const { subtitle, tag, full } = matchContext(m)
    const label = `${sideLabel(m.sides[0])} vs ${sideLabel(m.sides[1])}`

    // Detalle de solo lectura para el panel (competición, fase, resultado…).
    const isLeague = !!m.leagueId
    const detail: MatchDetail = {
      competition: isLeague
        ? (m.league?.name ?? 'Liga')
        : (m.category?.tournament?.name ?? 'Torneo'),
      competitionKind: isLeague ? 'liga' : 'torneo',
      category: isLeague ? null : (m.category?.name ?? null),
      phase: isLeague
        ? m.groupNumber != null
          ? `Grupo ${m.groupNumber}`
          : m.leagueRound
            ? `Jornada ${m.leagueRound.roundNumber}`
            : '—'
        : m.bracketRound
          ? roundLabel(m.bracketRound)
          : m.groupNumber != null
            ? `Grupo ${m.groupNumber}`
            : '—',
      aLabel: sideFullLabel(m.sides[0]),
      bLabel: sideFullLabel(m.sides[1]),
      courtName: courtNameLookup.get(m.courtId) ?? 'Pista',
      dateLabel: formatInClubTz(m.scheduledAt, "d 'de' LLLL"),
      timeLabel,
      durationLabel: formatDuration(durMin),
      statusLabel: matchStatusLabels[m.status] ?? m.status,
      sets: m.sets.map((s) => ({
        gamesA: s.gamesA,
        gamesB: s.gamesB,
        tiebreakA: s.tiebreakA,
        tiebreakB: s.tiebreakB,
      })),
      winner: m.winnerSide ?? null,
      href:
        isLeague && m.leagueRoundId
          ? `/dashboard/ligas/${m.leagueId}/jornadas/${m.leagueRoundId}`
          : !isLeague && m.category?.tournament
            ? `/dashboard/torneos/${m.category.tournament.id}/categorias/${m.categoryId}`
            : null,
      hrefLabel: isLeague ? 'Ir a la jornada' : 'Ir a la categoría',
    }

    const sm: ScheduledMatch = {
      id: m.id,
      kind: 'match',
      start,
      duration: durMin / 60,
      subtitle,
      tag,
      label,
      timeLabel,
      state: stateFromStatus[m.status] ?? 'proximo',
      lane: 0,
      lanes: 1,
      href:
        m.leagueId && m.leagueRoundId
          ? `/dashboard/ligas/${m.leagueId}/jornadas/${m.leagueRoundId}`
          : undefined,
      title: `${full}\n${label}\n${timeLabel}`,
      detail,
    }
    matchById.set(m.id, sm)
    const list = byCourt.get(m.courtId) ?? []
    list.push(sm)
    byCourt.set(m.courtId, list)
  }

  // Reservas privadas: cada una bloquea su pista durante su duración. Solo las
  // vigentes se dibujan en la rejilla (las canceladas viven en la lista). Entran
  // en la detección de conflictos: una reserva y un partido a la misma hora y
  // pista chocan igual que dos partidos.
  for (const r of reservations) {
    if (r.status === 'cancelled') continue
    const start = clubDecimalHour(r.startAt)
    const timeLabel = clubTimeLabel(r.startAt)
    // En una clase se muestra el coach y el nº de jugadores; en juego libre, el
    // estado de cobro como antes.
    const isClass = r.kind === 'class'
    const classSuffix =
      isClass && r.coach
        ? ` · ${r.coach.fullName}${r.playerCount ? ` · ${r.playerCount} jug.` : ''}`
        : ''
    const sm: ScheduledMatch = {
      id: r.id,
      kind: 'reserva',
      start,
      duration: r.durationMinutes / 60,
      subtitle: isClass
        ? `Clase${r.coach ? ` · ${r.coach.fullName}` : ''}`
        : paymentStatusLabels[r.paymentStatus as ReservationPaymentStatus],
      tag: isClass ? 'Clase' : 'Reserva',
      label: r.holderName,
      timeLabel,
      state: isClass ? 'clase' : 'reserva',
      lane: 0,
      lanes: 1,
      // Al hacer clic se abre el panel de edición (?edit=<id>).
      href: `/dashboard/programacion?d=${selectedKey}&edit=${r.id}`,
      title: `${isClass ? 'Clase' : 'Reserva'} · ${r.holderName}${classSuffix}\n${timeLabel} · ${formatDuration(
        r.durationMinutes,
      )}`,
    }
    matchById.set(r.id, sm)
    const list = byCourt.get(r.courtId) ?? []
    list.push(sm)
    byCourt.set(r.courtId, list)
  }

  // Doble reserva: dos o más partidos en la MISMA pista a la MISMA hora de
  // inicio. Las rondas de un grupo ya van escalonadas, así que no cuentan como
  // conflicto entre sí; solo lo es solapar partidos de grupos/eventos distintos.
  // Los partidos que coinciden se reparten en «carriles» (lane/lanes) para
  // dibujarse lado a lado, y se listan aparte con su detalle.
  const courtNameById = new Map(courts.map((c) => [c.id, c.name]))
  let conflictPairs = 0
  const conflicts: {
    court: string
    timeLabel: string
    matches: ScheduledMatch[]
  }[] = []
  for (const [courtId, list] of byCourt) {
    const byStart = new Map<number, ScheduledMatch[]>()
    for (const m of list) {
      const g = byStart.get(m.start) ?? []
      g.push(m)
      byStart.set(m.start, g)
    }
    for (const g of byStart.values()) {
      g.forEach((m, i) => {
        m.lane = i
        m.lanes = g.length
      })
      if (g.length > 1) {
        for (const m of g) m.state = 'conflicto'
        conflictPairs += g.length - 1
        conflicts.push({
          court: courtNameById.get(courtId) ?? 'Pista',
          timeLabel: g[0].timeLabel,
          matches: g,
        })
      }
    }
  }

  const courtRows: CourtRow[] = courts.map((c, i) => ({
    id: c.id,
    n: i + 1,
    name: c.name,
    surface: `${surfaceLabels[c.surface] ?? c.surface}${c.isIndoor ? ' · Cubierta' : ''}`,
    matches: (byCourt.get(c.id) ?? []).sort((a, b) => a.start - b.start),
  }))

  // Rango base = horario del club para el día seleccionado; si ese día no tiene
  // horario definido se usan las 09:00–21:00 por defecto.
  const openH = parseHour(dayHours?.openTime ?? null)
  const closeH = parseHour(dayHours?.closeTime ?? null)
  const baseStart = openH != null ? Math.floor(openH) : DEFAULT_START
  const baseEnd = closeH != null ? Math.ceil(closeH) : DEFAULT_END

  // Ventana horaria: el rango del club, ampliado si algún partido cae fuera.
  const placed = [...matchById.values()]
  const windowStart = placed.length
    ? Math.min(baseStart, Math.floor(Math.min(...placed.map((m) => m.start))))
    : baseStart
  const windowEnd = Math.max(
    windowStart + 1,
    placed.length
      ? Math.max(
          baseEnd,
          Math.ceil(Math.max(...placed.map((m) => m.start + m.duration))),
        )
      : baseEnd,
  )
  const windowHours = windowEnd - windowStart
  const hours = Array.from({ length: windowHours }, (_, i) => windowStart + i)

  // Métricas del día.
  // Reservas vigentes (no canceladas), separadas en clases y juego libre, para
  // que el conteo de «programados» refleje todo lo que ocupa pista, no solo los
  // partidos de competición.
  const activeReservations = reservations.filter((r) => r.status !== 'cancelled')
  const classCount = activeReservations.filter((r) => r.kind === 'class').length
  const reservaCount = activeReservations.length - classCount
  const scheduledTotal = matches.length + activeReservations.length
  // Desglose compacto para el subtítulo de «Programados» (omite los ceros).
  const scheduledBreakdown =
    [
      matches.length > 0
        ? `${matches.length} ${matches.length === 1 ? 'partido' : 'partidos'}`
        : null,
      reservaCount > 0
        ? `${reservaCount} ${reservaCount === 1 ? 'reserva' : 'reservas'}`
        : null,
      classCount > 0
        ? `${classCount} ${classCount === 1 ? 'clase' : 'clases'}`
        : null,
    ]
      .filter(Boolean)
      .join(' · ') || 'nada programado'

  // «En juego» = partidos en curso + reservas/clases activas ahora mismo (solo
  // tiene sentido en el día de hoy; otros días siempre es 0).
  const nowMs = new Date().getTime()
  const inPlayMatches = matches.filter((m) => m.status === 'in_progress').length
  const inPlayReservations = isToday
    ? activeReservations.filter((r) => {
        const start = r.startAt.getTime()
        return nowMs >= start && nowMs < start + r.durationMinutes * 60_000
      }).length
    : 0
  const inPlay = inPlayMatches + inPlayReservations
  const occupiedHours = placed.reduce((sum, m) => sum + m.duration, 0)
  const capacity = courts.length * windowHours
  const occupancy = capacity > 0 ? Math.round((occupiedHours / capacity) * 100) : 0
  type Stat = {
    label: string
    value: string
    hint: string
    live?: boolean
    accent?: boolean
    fraction?: number
  }
  const stats: Stat[] = [
    {
      label: 'Programados',
      value: String(scheduledTotal),
      hint: scheduledBreakdown,
    },
    {
      label: 'En juego',
      value: String(inPlay),
      hint: inPlay > 0 ? 'en pista ahora' : 'sin actividad',
      live: inPlay > 0,
    },
    {
      label: 'Conflictos',
      value: String(conflictPairs),
      hint: conflictPairs > 0 ? 'requiere acción' : 'sin choques',
      accent: conflictPairs > 0,
    },
    {
      label: 'Ocupación',
      value: `${occupancy}%`,
      hint: `${courts.length} ${courts.length === 1 ? 'pista' : 'pistas'}`,
      fraction: occupancy / 100,
    },
  ]

  // Semana (lunes → domingo) que contiene el día seleccionado. Se opera sobre el
  // ancla a mediodía para que el día natural del club no se desplace.
  const monday = new Date(selected)
  const dow = (selected.getUTCDay() + 6) % 7 // 0 = lunes
  monday.setUTCDate(selected.getUTCDate() - dow)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setUTCDate(monday.getUTCDate() + i)
    return date
  })

  const now = new Date()
  const nowHour = clubDecimalHour(now)
  const nowFraction = (nowHour - windowStart) / windowHours
  const showNow = isToday && nowFraction >= 0 && nowFraction <= 1
  const nowLeft = `calc(184px + (100% - 184px) * ${nowFraction})`

  // Filas para la lista «Reservas del día» (incluye las canceladas). Los
  // importes Decimal de Prisma se convierten a número para el componente cliente.
  const reservationRows: ReservationRow[] = reservations.map((r) => {
    return {
      id: r.id,
      courtName: courtNameById.get(r.courtId) ?? 'Pista',
      kind: r.kind,
      coachName: r.coach?.fullName ?? null,
      playerCount: r.playerCount,
      holderName: r.holderName,
      phone: r.phone,
      timeLabel: clubTimeLabel(r.startAt),
      durationLabel: formatDuration(r.durationMinutes),
      paymentStatus: r.paymentStatus as ReservationPaymentStatus,
      price: r.price ? Number(r.price) : null,
      amountPaid: Number(r.amountPaid),
      currency: r.currency,
      cancelled: r.status === 'cancelled',
      notes: r.notes,
    }
  })

  // Itinerario del día: reservas/clases (con su cobro) + partidos de competición
  // (que enlazan a su jornada), todo ordenado por hora de inicio. Las etiquetas
  // "HH:MM" llevan ceros, así que ordenan bien como texto.
  const itinerary: ItineraryItem[] = [
    ...reservationRows.map((r) => ({ type: 'reservation' as const, ...r })),
    ...courtRows.flatMap((court) =>
      court.matches
        .filter((m) => m.kind === 'match')
        .map((m) => ({
          type: 'match' as const,
          id: m.id,
          courtName: court.name,
          timeLabel: m.timeLabel,
          durationLabel: formatDuration(Math.round(m.duration * 60)),
          label: m.label,
          subtitle: m.subtitle,
          tag: m.tag,
          state: m.state as MatchState,
          href: m.href,
        })),
    ),
  ].sort((a, b) => a.timeLabel.localeCompare(b.timeLabel))

  // Pistas (id + nombre) para el selector del formulario de reserva.
  const courtOptions = courts.map((c) => ({ id: c.id, name: c.name }))

  // Reserva en edición (?edit=<id>): se construye el payload con los valores en
  // crudo para prerellenar el panel. Si el id no existe, no se abre nada.
  const editing = edit ? reservations.find((r) => r.id === edit) : undefined
  const editingReservation: EditableReservation | null = editing
    ? {
        id: editing.id,
        courtId: editing.courtId,
        kind: editing.kind,
        coachId: editing.coachId,
        playerCount: editing.playerCount,
        holderName: editing.holderName,
        phone: editing.phone,
        date: clubDateKey(editing.startAt),
        time: clubTimeLabel(editing.startAt),
        durationMinutes: editing.durationMinutes,
        paymentStatus: editing.paymentStatus as ReservationPaymentStatus,
        price: editing.price ? Number(editing.price) : null,
        amountPaid: Number(editing.amountPaid),
        currency: editing.currency,
        notes: editing.notes,
        cancelled: editing.status === 'cancelled',
      }
    : null

  // Plantilla de columnas: etiqueta de pista + pista temporal (1fr).
  const gridCols = 'grid grid-cols-[184px_minmax(0,1fr)]'

  return (
    <>
      <DashboardTopbar>
        <Button variant="outline" className="h-9 rounded-md px-4 text-sm" disabled>
          Auto-programar
        </Button>
        <Button variant="outline" className="h-9 rounded-md px-4 text-sm" disabled>
          Imprimir
        </Button>
        <NewReservationButton
          courts={courtOptions}
          coaches={coachOptions}
          classPrices={classPrices}
          weekHours={weekHours}
          defaultDate={selectedKey}
        />
      </DashboardTopbar>

      <div className="mx-auto max-w-[1600px] px-8 py-10">
        {/* ---- Encabezado + métricas ---- */}
        <section className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {club.name} · Programación
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {capitalize(formatInClubTz(selected, 'EEEE'))}{' '}
              <em className="italic">
                {formatInClubTz(selected, "d 'de' LLLL")}
              </em>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {scheduledTotal === 0 ? (
                <>No hay nada programado este día.</>
              ) : (
                <>
                  <span className="capitalize">{scheduledBreakdown}</span> en{' '}
                  {courts.length} {courts.length === 1 ? 'pista' : 'pistas'}.
                  {conflictPairs > 0 ? (
                    <>
                      {' '}
                      <span className="text-terracotta">
                        {conflictPairs}{' '}
                        {conflictPairs === 1
                          ? 'conflicto detectado'
                          : 'conflictos detectados'}
                      </span>
                      : reasigna pista o reprograma la hora.
                    </>
                  ) : (
                    ' Sin conflictos de pista.'
                  )}
                </>
              )}
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
              {dayHours ? (
                <>
                  Horario del club · {dayHours.openTime}–{dayHours.closeTime}
                </>
              ) : (
                <>
                  Sin horario para este día · rango por defecto 09:00–21:00 ·{' '}
                  <Link
                    href="/dashboard/pistas"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    configúralo
                  </Link>
                </>
              )}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[540px]">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  'flex flex-col justify-between gap-4 rounded-xl border bg-card/50 p-4',
                  stat.accent
                    ? 'border-terracotta/40 bg-terracotta/5'
                    : 'border-border',
                )}
              >
                <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {stat.live && (
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-forest opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-forest" />
                    </span>
                  )}
                  {stat.label}
                </dt>
                <dd className="flex flex-col gap-2">
                  <span
                    className={cn(
                      'font-serif text-4xl leading-none tabular-nums',
                      stat.accent ? 'text-terracotta' : 'text-foreground',
                    )}
                  >
                    {stat.value}
                  </span>
                  {stat.fraction != null ? (
                    <span className="block h-1 w-full overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-forest"
                        style={{
                          width: `${Math.min(100, Math.round(stat.fraction * 100))}%`,
                        }}
                      />
                    </span>
                  ) : (
                    <span
                      className={cn(
                        'font-mono text-[9px] uppercase tracking-wider',
                        stat.accent
                          ? 'text-terracotta/80'
                          : 'text-muted-foreground/70',
                      )}
                    >
                      {stat.hint}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- Selector de día + leyenda ---- */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <div className="flex flex-wrap items-center gap-1">
            {weekDays.map((date) => {
              const key = clubDateKey(date)
              const active = key === selectedKey
              return (
                <Link
                  key={key}
                  href={`/dashboard/programacion?d=${key}`}
                  className={cn(
                    'rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors',
                    active
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {formatInClubTz(date, 'EEE')} {date.getUTCDate()}
                </Link>
              )
            })}
            <span className="mx-1 h-5 w-px bg-border" aria-hidden />
            <Link
              href={`/dashboard/programacion?d=${todayKey}`}
              aria-disabled={isToday}
              className={cn(
                'flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors',
                isToday
                  ? 'pointer-events-none border-transparent text-muted-foreground/50'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <CalendarClock className="size-3.5" />
              Hoy
            </Link>
            <DayJump value={selectedKey} />
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {legend.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span className={cn('size-2.5 rounded-sm', item.cls)} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* ---- Conflictos (detalle + enlaces para corregir) ---- */}
        {conflicts.length > 0 && (
          <div className="mt-5 rounded-xl border border-terracotta/40 bg-terracotta/5 p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
              Conflictos · {conflictPairs}
            </p>
            <ul className="mt-3 space-y-2">
              {conflicts.map((c, i) => (
                <li
                  key={`${c.court}-${c.timeLabel}-${i}`}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
                >
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {c.court} · {c.timeLabel}
                  </span>
                  {c.matches.map((m, j) => (
                    <span key={m.id} className="flex items-center gap-2">
                      {j > 0 && <span className="text-terracotta/60">×</span>}
                      {m.href ? (
                        <Link
                          href={m.href}
                          className="text-ink underline underline-offset-2 hover:text-terracotta"
                        >
                          {m.tag} · {m.label}
                        </Link>
                      ) : (
                        <span className="text-ink">
                          {m.tag} · {m.label}
                        </span>
                      )}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Dos partidos coinciden en la misma pista y hora. Abre uno para
              cambiar su <span className="text-foreground">pista</span> o su{' '}
              <span className="text-foreground">horario</span> desde la jornada.
            </p>
          </div>
        )}

        {/* ---- Calendario de pistas ---- */}
        {courts.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
            Este club no tiene pistas activas. Añade pistas para programar
            partidos.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-card">
            <div className="min-w-[1180px]">
              {/* Cabecera de horas */}
              <div className={cn(gridCols, 'border-b border-border bg-muted/30')}>
                <div className="flex flex-col justify-center border-r border-border px-4 py-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Pistas · {courts.length}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                    Disponibles
                  </span>
                </div>
                <div className="flex">
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="flex-1 border-l border-border/50 px-2 py-3 font-mono"
                    >
                      <span className="block text-[11px] text-foreground">
                        {String(h).padStart(2, '0')}:00
                      </span>
                      <span className="block text-[10px] text-muted-foreground/60">
                        1h
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filas de pistas */}
              <div className="relative">
                {courtRows.map((court) => (
                  <div
                    key={court.id}
                    className={cn(
                      gridCols,
                      'min-h-[68px] border-b border-border last:border-b-0',
                    )}
                  >
                    {/* Etiqueta de pista */}
                    <div className="flex items-center gap-3 border-r border-border px-4">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded border border-border font-mono text-[11px] text-muted-foreground">
                        {court.n}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">
                          {court.name}
                        </p>
                        <p className="truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          {court.surface}
                        </p>
                      </div>
                    </div>

                    {/* Pista temporal: rejilla de horas + bloques posicionados */}
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-0 flex">
                        {hours.map((h) => (
                          <div
                            key={h}
                            className="flex-1 border-l border-border/50"
                          />
                        ))}
                      </div>
                      {court.matches.map((match) => (
                        <ScheduledMatchBlock
                          key={match.id}
                          match={match}
                          windowStart={windowStart}
                          windowHours={windowHours}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Línea de hora actual */}
                {showNow && (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-10 w-px bg-terracotta"
                    style={{ left: nowLeft }}
                  >
                    <span className="absolute -top-px left-1/2 -translate-x-1/2 rounded-sm bg-terracotta px-1 py-0.5 font-mono text-[9px] leading-none text-cream">
                      {clubTimeLabel(now)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- Reservas del día (gestión + cobro) ---- */}
        <DayItinerary items={itinerary} day={selectedKey} />
      </div>

      {/* Panel de edición de reserva (se monta con ?edit=<id>) */}
      {editingReservation && (
        <ReservationEditor
          reservation={editingReservation}
          courts={courtOptions}
          coaches={coachOptions}
          classPrices={classPrices}
          weekHours={weekHours}
          day={selectedKey}
        />
      )}
    </>
  )
}
