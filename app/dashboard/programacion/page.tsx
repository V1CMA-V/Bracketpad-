import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { NewReservationButton } from '@/components/dashboard/reservation-form'
import {
  ReservationEditor,
  type EditableReservation,
} from '@/components/dashboard/reservation-editor'
import {
  ReservationList,
  type ReservationRow,
} from '@/components/dashboard/reservation-list'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'
import { DEFAULT_MATCH_MINUTES, leagueStaggerSlot } from '@/lib/league-rules'
import {
  formatDuration,
  paymentStatusLabels,
  type ReservationPaymentStatus,
} from '@/lib/reservations'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Programación de pistas · Bandeja',
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

const weekdayLongFmt = new Intl.DateTimeFormat('es', { weekday: 'long' })
const dayMonthFmt = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'long',
})
const weekdayShortFmt = new Intl.DateTimeFormat('es', { weekday: 'short' })

/* -------------------------------------------------------------------------- */
/*  Utilidades                                                                 */
/* -------------------------------------------------------------------------- */

/** Date local → clave "YYYY-MM-DD". */
function dateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

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

async function getSchedule(clubId: string, day: Date) {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const [courts, matches, reservations, coaches, classPricing, dayHours] =
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
        category: { select: { name: true } },
        sides: {
          orderBy: { side: 'asc' },
          include: {
            team: { select: { name: true } },
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
    // Horario del club para el día de la semana seleccionado (puede no existir
    // si el club cierra ese día).
    prisma.clubHours.findUnique({
      where: { clubId_dayOfWeek: { clubId, dayOfWeek: day.getDay() } },
      select: { openTime: true, closeTime: true },
    }),
  ])

  return { courts, matches, reservations, coaches, classPricing, dayHours }
}

type RawMatch = Awaited<ReturnType<typeof getSchedule>>['matches'][number]

/** Etiqueta de un lado del partido (apellidos de los jugadores o nombre del equipo). */
function sideLabel(side: RawMatch['sides'][number] | undefined): string {
  if (!side) return '—'
  if (side.players.length > 0) {
    return side.players.map((p) => surname(p.player.fullName)).join(' / ')
  }
  return side.team?.name ?? '—'
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
/*  Subcomponentes                                                            */
/* -------------------------------------------------------------------------- */

const toneByState: Record<SlotState, string> = {
  'en-juego': 'bg-forest text-cream',
  proximo: 'bg-ochre text-ink',
  // Las reservas (uso privado del club) se distinguen en oscuro de los partidos
  // de competición.
  reserva: 'bg-ink text-cream',
  // Las clases con coach destacan en ciruela para identificarlas a simple vista.
  clase: 'bg-plum text-cream',
  disputado: 'border border-border bg-muted/60 text-muted-foreground',
  conflicto: 'bg-terracotta text-cream',
}

function MatchBlock({
  match,
  windowStart,
  windowHours,
}: {
  match: ScheduledMatch
  windowStart: number
  windowHours: number
}) {
  const baseLeft = ((match.start - windowStart) / windowHours) * 100
  const slotWidth = Math.min(
    (match.duration / windowHours) * 100,
    100 - baseLeft,
  )
  // Si hay conflicto, el slot se divide entre los partidos coincidentes.
  const width = slotWidth / match.lanes
  const left = baseLeft + match.lane * width
  const inner = (
    <div
      className={cn(
        'relative flex h-full flex-col justify-center gap-0.5 overflow-hidden rounded-md px-2 py-1 transition-shadow',
        toneByState[match.state],
        match.href && 'hover:ring-2 hover:ring-foreground/20',
      )}
    >
      {match.state === 'en-juego' && (
        <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-lime" />
      )}
      <span className="truncate font-mono text-[9px] uppercase tracking-wider opacity-80">
        {match.timeLabel} · {match.tag}
      </span>
      <span className="truncate text-[11px] font-medium leading-tight">
        {match.label}
      </span>
      {match.subtitle && (
        <span className="truncate font-mono text-[8px] uppercase tracking-wider opacity-60">
          {match.subtitle}
        </span>
      )}
    </div>
  )
  return (
    <div
      className="absolute inset-y-1 p-1"
      style={{ left: `${left}%`, width: `${width}%` }}
      title={match.title}
    >
      {match.href ? (
        <Link href={match.href} className="block h-full">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  )
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
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selected =
    d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`) : today
  const selectedKey = dateKey(selected)
  const todayKey = dateKey(today)
  const isToday = selectedKey === todayKey

  const { courts, matches, reservations, coaches, classPricing, dayHours } =
    await getSchedule(club.id, selected)

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
    const startMinutes =
      m.scheduledAt.getHours() * 60 + m.scheduledAt.getMinutes() + slot * durMin
    const startH = Math.floor(startMinutes / 60)
    const startM = startMinutes % 60
    const start = startMinutes / 60
    const timeLabel = `${String(startH).padStart(2, '0')}:${String(
      startM,
    ).padStart(2, '0')}`
    const { subtitle, tag, full } = matchContext(m)
    const label = `${sideLabel(m.sides[0])} vs ${sideLabel(m.sides[1])}`
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
    const startH = r.startAt.getHours()
    const startM = r.startAt.getMinutes()
    const start = startH + startM / 60
    const timeLabel = `${String(startH).padStart(2, '0')}:${String(
      startM,
    ).padStart(2, '0')}`
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
  const inPlay = matches.filter((m) => m.status === 'in_progress').length
  const occupiedHours = placed.reduce((sum, m) => sum + m.duration, 0)
  const capacity = courts.length * windowHours
  const occupancy = capacity > 0 ? Math.round((occupiedHours / capacity) * 100) : 0
  const stats = [
    { label: 'Programados', value: String(matches.length) },
    { label: 'En juego', value: String(inPlay) },
    { label: 'Conflictos', value: String(conflictPairs), accent: conflictPairs > 0 },
    { label: 'Ocupación', value: `${occupancy}%` },
  ]

  // Semana (lunes → domingo) que contiene el día seleccionado.
  const monday = new Date(selected)
  const dow = (monday.getDay() + 6) % 7 // 0 = lunes
  monday.setDate(monday.getDate() - dow)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return date
  })

  const now = new Date()
  const nowHour = now.getHours() + now.getMinutes() / 60
  const nowFraction = (nowHour - windowStart) / windowHours
  const showNow = isToday && nowFraction >= 0 && nowFraction <= 1
  const nowLeft = `calc(184px + (100% - 184px) * ${nowFraction})`

  // Filas para la lista «Reservas del día» (incluye las canceladas). Los
  // importes Decimal de Prisma se convierten a número para el componente cliente.
  const reservationRows: ReservationRow[] = reservations.map((r) => {
    const startH = r.startAt.getHours()
    const startM = r.startAt.getMinutes()
    return {
      id: r.id,
      courtName: courtNameById.get(r.courtId) ?? 'Pista',
      kind: r.kind,
      coachName: r.coach?.fullName ?? null,
      playerCount: r.playerCount,
      holderName: r.holderName,
      phone: r.phone,
      timeLabel: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
      durationLabel: formatDuration(r.durationMinutes),
      paymentStatus: r.paymentStatus as ReservationPaymentStatus,
      price: r.price ? Number(r.price) : null,
      amountPaid: Number(r.amountPaid),
      currency: r.currency,
      cancelled: r.status === 'cancelled',
      notes: r.notes,
    }
  })

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
        date: dateKey(editing.startAt),
        time: `${String(editing.startAt.getHours()).padStart(2, '0')}:${String(
          editing.startAt.getMinutes(),
        ).padStart(2, '0')}`,
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
              {capitalize(weekdayLongFmt.format(selected))}{' '}
              <em className="italic">{dayMonthFmt.format(selected)}</em>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {matches.length === 0 ? (
                <>No hay partidos programados este día.</>
              ) : (
                <>
                  {matches.length}{' '}
                  {matches.length === 1
                    ? 'partido programado'
                    : 'partidos programados'}{' '}
                  en {courts.length} {courts.length === 1 ? 'pista' : 'pistas'}.
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

          <dl className="grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-4 lg:gap-x-8">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </dt>
                <dd
                  className={cn(
                    'font-serif text-4xl leading-none',
                    stat.accent ? 'text-terracotta' : 'text-foreground',
                  )}
                >
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- Selector de día + leyenda ---- */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <div className="flex flex-wrap items-center gap-1">
            {weekDays.map((date) => {
              const key = dateKey(date)
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
                  {weekdayShortFmt.format(date).replace('.', '')} {date.getDate()}
                </Link>
              )
            })}
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
                        <MatchBlock
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
                      {String(now.getHours()).padStart(2, '0')}:
                      {String(now.getMinutes()).padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- Reservas del día (gestión + cobro) ---- */}
        <ReservationList rows={reservationRows} day={selectedKey} />
      </div>

      {/* Panel de edición de reserva (se monta con ?edit=<id>) */}
      {editingReservation && (
        <ReservationEditor
          reservation={editingReservation}
          courts={courtOptions}
          coaches={coachOptions}
          classPrices={classPrices}
          day={selectedKey}
        />
      )}
    </>
  )
}
