import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { NewReservationButton } from '@/components/dashboard/reservation-form'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { auth } from '@/auth'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'
import { DEFAULT_MATCH_MINUTES, leagueStaggerSlot } from '@/lib/league-rules'
import { leagueFormatLabels } from '@/lib/leagues'
import {
  formatDuration,
  paymentStatusLabels,
  type ReservationPaymentStatus,
} from '@/lib/reservations'
import {
  clubDateKey,
  clubDayRange,
  clubDecimalHour,
  clubMinutesOfDay,
  clubTimeLabel,
  clubWeekday,
  formatInClubTz,
} from '@/lib/timezone'
import { ChevronRight, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Resumen del club · Bandeja',
}

/* -------------------------------------------------------------------------- */
/*  Tipos y utilidades                                                        */
/* -------------------------------------------------------------------------- */

type PillStatus = 'en-juego' | 'programado' | 'borrador'

type EventItem = {
  id: string
  href: string
  name: string
  meta: string
  status: PillStatus
  entrants: number
  progress: number | null
  subLabel: string
  revenue: number | null
  currency: string
  startMs: number
}

type SideLike =
  | {
      team: { name: string | null } | null
      players: { player: { fullName: string } }[]
    }
  | undefined

const shortDateFmt = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
})
const fullDateFmt = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Último token de un nombre completo, para etiquetas compactas. */
function surname(full: string): string {
  const parts = full.trim().split(/\s+/)
  return parts[parts.length - 1] || full
}

/** Apellidos de los jugadores de un lado (o el nombre del equipo). */
function sideLabel(side: SideLike): string {
  if (!side) return '—'
  if (side.players.length > 0) {
    return side.players.map((p) => surname(p.player.fullName)).join(' / ')
  }
  return side.team?.name ?? '—'
}

function rangeLabel(start: Date | null, end: Date | null): string {
  if (start && end)
    return `${shortDateFmt.format(start)} — ${shortDateFmt.format(end)}`
  if (start) return `Desde ${shortDateFmt.format(start)}`
  if (end) return `Hasta ${shortDateFmt.format(end)}`
  return 'Sin fechas'
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** "HH:MM" → hora decimal (8.5 = 08:30), o null si no es válida. */
function parseHour(hhmm: string | null | undefined): number | null {
  if (!hhmm) return null
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!m) return null
  return Number(m[1]) + Number(m[2]) / 60
}

function durationLabel(from: Date | null, to: Date): string {
  if (!from) return '—'
  const mins = Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

/* -------------------------------------------------------------------------- */
/*  Subcomponentes                                                            */
/* -------------------------------------------------------------------------- */

function StatusPill({ status }: { status: PillStatus }) {
  const map = {
    'en-juego': {
      label: 'En juego',
      text: 'text-forest',
      border: 'border-forest/25',
      dot: 'bg-forest',
    },
    programado: {
      label: 'Programado',
      text: 'text-ochre',
      border: 'border-ochre/35',
      dot: 'bg-ochre',
    },
    borrador: {
      label: 'Borrador',
      text: 'text-terracotta',
      border: 'border-terracotta/35',
      dot: 'bg-terracotta',
    },
  } as const
  const s = map[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest',
        s.text,
        s.border,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Programación de pistas (mismo tema que /dashboard/programacion)            */
/* -------------------------------------------------------------------------- */

type SlotState =
  | 'en-juego'
  | 'proximo'
  | 'disputado'
  | 'conflicto'
  | 'reserva'
  | 'clase'

type ScheduledMatch = {
  id: string
  kind: 'match' | 'reserva'
  start: number // hora decimal (16.25 = 16:15)
  duration: number
  subtitle?: string
  tag: string
  label: string
  timeLabel: string
  state: SlotState
  // Reparto horizontal cuando varios eventos chocan en la misma pista y hora.
  lane: number
  lanes: number
  href?: string
  title: string
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

const toneByState: Record<SlotState, string> = {
  'en-juego': 'bg-forest text-cream',
  proximo: 'bg-ochre text-ink',
  // Reservas (uso privado del club) en oscuro; clases con coach en ciruela.
  reserva: 'bg-ink text-cream',
  clase: 'bg-plum text-cream',
  disputado: 'border border-border bg-muted/60 text-muted-foreground',
  conflicto: 'bg-terracotta text-cream',
}

const scheduleLegend: { label: string; cls: string }[] = [
  { label: 'En juego', cls: 'bg-forest' },
  { label: 'Próximo', cls: 'bg-ochre' },
  { label: 'Reserva', cls: 'bg-ink' },
  { label: 'Clase', cls: 'bg-plum' },
  { label: 'Disputado', cls: 'bg-muted border border-border' },
  { label: 'Conflicto', cls: 'bg-terracotta' },
]

type MatchContextInput = {
  leagueId: string | null
  categoryId: string | null
  groupNumber: number | null
  bracketRound: string | null
  league: { name: string } | null
  leagueRound: { roundNumber: number } | null
  category: { name: string } | null
}

/** Etiquetas de un partido: subtítulo (competición), tag (grupo/ronda) y texto completo. */
function matchContext(m: MatchContextInput): {
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
  const slotWidth = Math.min((match.duration / windowHours) * 100, 100 - baseLeft)
  // Si hay conflicto, el slot se divide entre los eventos coincidentes.
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

const leaguePillStatus: Record<string, PillStatus | null> = {
  active: 'en-juego',
  draft: 'borrador',
  finished: null,
  archived: null,
}

const tournamentPillStatus: Record<string, PillStatus | null> = {
  in_progress: 'en-juego',
  registration_open: 'programado',
  draft: 'borrador',
  finished: null,
  archived: null,
}

const pillRank: Record<PillStatus, number> = {
  'en-juego': 0,
  programado: 1,
  borrador: 2,
}

export default async function DashboardResumenPage() {
  const [session, club] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getManagedClub(),
  ])

  /* ---- Sin club: nada que resumir ---- */
  if (!club) {
    return (
      <>
        <DashboardTopbar />
        <div className="mx-auto max-w-[1600px] px-8 py-10">
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <h1 className="font-serif text-3xl tracking-tight text-foreground">
              Aún no administras un club
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Crea tu club para empezar a organizar ligas, torneos y partidos.
            </p>
            <Button asChild className="mt-6 h-9 rounded-md px-4 text-sm">
              <Link href="/registro/club">Crear club</Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  const now = new Date()
  const todayKey = clubDateKey(now)
  const { start: dayStart, end: dayEnd } = clubDayRange(todayKey)

  const [
    leagues,
    tournaments,
    playerCount,
    liveCount,
    courts,
    dayMatches,
    dayReservations,
    liveMatch,
    dayHours,
  ] = await Promise.all([
    prisma.league.findMany({
      where: { clubId: club.id, status: { not: 'archived' } },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { registrations: true } },
        rounds: { select: { status: true } },
      },
    }),
    prisma.tournament.findMany({
      where: { clubId: club.id, status: { not: 'archived' } },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        categories: {
          select: {
            entryFee: true,
            currency: true,
            _count: { select: { teams: true } },
          },
        },
      },
    }),
    prisma.player.count({ where: { clubId: club.id } }),
    prisma.match.count({ where: { clubId: club.id, status: 'in_progress' } }),
    prisma.court.findMany({
      where: { clubId: club.id, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, surface: true, isIndoor: true },
    }),
    prisma.match.findMany({
      where: { clubId: club.id, scheduledAt: { gte: dayStart, lt: dayEnd } },
      include: {
        league: { select: { name: true, playKind: true } },
        leagueRound: { select: { roundNumber: true } },
        category: { select: { name: true } },
        sides: {
          orderBy: { side: 'asc' },
          include: {
            team: { select: { name: true } },
            players: { include: { player: { select: { fullName: true } } } },
          },
        },
      },
    }),
    // Reservas privadas (juego libre o clase) que apartan pista hoy.
    prisma.courtReservation.findMany({
      where: {
        clubId: club.id,
        status: 'confirmed',
        startAt: { gte: dayStart, lt: dayEnd },
      },
      orderBy: { startAt: 'asc' },
      include: { coach: { select: { fullName: true } } },
    }),
    prisma.match.findFirst({
      where: { clubId: club.id, status: 'in_progress' },
      orderBy: { scheduledAt: 'asc' },
      include: {
        court: { select: { name: true } },
        league: { select: { name: true } },
        leagueRound: { select: { roundNumber: true } },
        category: { select: { name: true } },
        sides: {
          orderBy: { side: 'asc' },
          include: {
            team: { select: { name: true } },
            players: { include: { player: { select: { fullName: true } } } },
          },
        },
        sets: { orderBy: { setNumber: 'asc' } },
      },
    }),
    prisma.clubHours.findUnique({
      where: {
        clubId_dayOfWeek: { clubId: club.id, dayOfWeek: clubWeekday(now) },
      },
      select: { openTime: true, closeTime: true },
    }),
  ])

  /* ---- Lista unificada de eventos (ligas + torneos) ---- */
  const leagueItems: EventItem[] = leagues.flatMap((l) => {
    const status = leaguePillStatus[l.status]
    if (!status) return []
    const totalRounds = l.totalRounds ?? l.rounds.length
    const closed = l.rounds.filter((r) => r.status === 'closed').length
    const entrants = l._count.registrations
    const progress =
      status === 'en-juego' && totalRounds > 0
        ? Math.min(100, Math.round((closed / totalRounds) * 100))
        : null
    return [
      {
        id: l.id,
        href: `/dashboard/ligas/${l.id}`,
        name: l.name,
        meta: `${rangeLabel(l.startDate, l.endDate)} · ${leagueFormatLabels[l.format] ?? 'Liga'}`,
        status,
        entrants,
        progress,
        subLabel: status === 'borrador' ? 'Sin publicar' : 'Liga',
        revenue: l.entryFee ? Number(l.entryFee) * entrants : null,
        currency: l.currency,
        startMs: l.startDate?.getTime() ?? Number.POSITIVE_INFINITY,
      },
    ]
  })

  const tournamentItems: EventItem[] = tournaments.flatMap((t) => {
    const status = tournamentPillStatus[t.status]
    if (!status) return []
    const entrants = t.categories.reduce((n, c) => n + c._count.teams, 0)
    const revenue = t.categories.reduce(
      (sum, c) => sum + (c.entryFee ? Number(c.entryFee) * c._count.teams : 0),
      0,
    )
    const catCount = t.categories.length
    const subLabel =
      status === 'en-juego'
        ? 'En juego'
        : status === 'programado'
          ? 'Inscripción abierta'
          : 'Sin iniciar'
    return [
      {
        id: t.id,
        href: `/dashboard/torneos/${t.id}`,
        name: t.name,
        meta: `${rangeLabel(t.startDate, t.endDate)} · ${catCount} ${catCount === 1 ? 'cat.' : 'cats.'}`,
        status,
        entrants,
        progress: null,
        subLabel,
        revenue: revenue > 0 ? revenue : null,
        currency: t.categories[0]?.currency ?? 'MXN',
        startMs: t.startDate?.getTime() ?? Number.POSITIVE_INFINITY,
      },
    ]
  })

  const allEvents = [...leagueItems, ...tournamentItems].sort(
    (a, b) => pillRank[a.status] - pillRank[b.status] || a.startMs - b.startMs,
  )
  const events = allEvents.slice(0, 6)

  /* ---- Métricas ---- */
  const currency = leagues[0]?.currency ?? tournamentItems[0]?.currency ?? 'MXN'
  const totalRevenue = allEvents.reduce((sum, e) => sum + (e.revenue ?? 0), 0)

  const occupiedCourtIds = new Set(
    dayMatches
      .filter((m) => m.status === 'in_progress' && m.courtId)
      .map((m) => m.courtId),
  )
  // Una reserva en curso ahora mismo también ocupa la pista (y cuenta como
  // actividad «en juego» junto a los partidos).
  const nowMs = now.getTime()
  let liveReservationsCount = 0
  for (const r of dayReservations) {
    const s = r.startAt.getTime()
    if (nowMs >= s && nowMs < s + r.durationMinutes * 60_000) {
      occupiedCourtIds.add(r.courtId)
      liveReservationsCount += 1
    }
  }
  const freeCourts = Math.max(0, courts.length - occupiedCourtIds.size)
  // «En juego» = partidos en curso + reservas en curso (todo lo que ocupa pista).
  const liveActivity = liveCount + liveReservationsCount

  const stats = [
    {
      label: 'En juego',
      value: String(liveActivity),
      sub: 'En las pistas',
    },
    { label: 'Jugadores', value: String(playerCount), sub: 'En el club' },
    {
      label: 'Ingresos',
      value: formatMoney(totalRevenue, currency),
      sub: 'Cuotas estimadas',
    },
    {
      label: 'Pistas libres',
      value: `${freeCourts}/${courts.length}`,
      sub: dayHours ? `Hasta ${dayHours.closeTime}` : 'Sin horario hoy',
    },
  ]

  /* ---- Acciones pendientes (derivadas de datos reales) ---- */
  const pending: { title: string; meta: string; href: string }[] = []
  for (const l of leagues) {
    if (l.status === 'draft') {
      pending.push({
        title: `Publicar «${l.name}»`,
        meta: 'Liga en borrador',
        href: `/dashboard/ligas/${l.id}`,
      })
    }
  }
  for (const t of tournaments) {
    if (t.status === 'draft') {
      pending.push({
        title: `Configurar «${t.name}»`,
        meta: 'Torneo en borrador',
        href: `/dashboard/torneos/${t.id}`,
      })
    }
  }
  const unscheduled = dayMatches.filter(
    (m) => m.status === 'scheduled' && !m.courtId,
  ).length
  if (unscheduled > 0) {
    pending.push({
      title: `Asignar pista a ${unscheduled} ${unscheduled === 1 ? 'partido' : 'partidos'}`,
      meta: 'Programación de hoy',
      href: '/dashboard/programacion',
    })
  }
  if (courts.length === 0) {
    pending.push({
      title: 'Registra las pistas del club',
      meta: 'Sin pistas activas',
      href: '/dashboard/pistas',
    })
  }
  const pendingActions = pending.slice(0, 5)

  /* ---- Partido en vivo ---- */
  const liveSides = liveMatch
    ? (['A', 'B'] as const).map((side) => {
        const s = liveMatch.sides.find((x) => x.side === side)
        const label = sideLabel(s)
        return {
          tag: label.charAt(0).toUpperCase() || '·',
          pair: label,
          sets: liveMatch.sets.map((set) =>
            side === 'A' ? set.gamesA : set.gamesB,
          ),
        }
      })
    : []
  const liveComp =
    liveMatch?.league?.name ?? liveMatch?.category?.name ?? 'Partido'
  const liveRound = liveMatch?.leagueRound
    ? `Jornada ${liveMatch.leagueRound.roundNumber}${
        liveMatch.groupNumber != null ? ` · Grupo ${liveMatch.groupNumber}` : ''
      }`
    : (liveMatch?.bracketRound ?? 'En curso')
  const lastSet = (liveMatch?.sets.length ?? 1) - 1
  // Actividad restante de hoy = partidos sin terminar + reservas (juego libre)
  // aún vigentes, para que el resumen refleje tanto ligas/torneos como las
  // reservas privadas de pista.
  const remainingMatches = dayMatches.filter(
    (m) => m.status === 'scheduled' || m.status === 'in_progress',
  ).length
  const remainingReservations = dayReservations.filter(
    (r) => r.startAt.getTime() + r.durationMinutes * 60_000 > nowMs,
  ).length
  const remainingToday = remainingMatches + remainingReservations
  // Reserva en curso ahora mismo (si no hay un partido en vivo que mostrar).
  const liveReservation = dayReservations.find((r) => {
    const s = r.startAt.getTime()
    return nowMs >= s && nowMs < s + r.durationMinutes * 60_000
  })
  const courtNameById = new Map(courts.map((c) => [c.id, c.name]))

  /* ---- Programación de pistas (mismo tema que /dashboard/programacion) ---- */
  const matchById = new Map<string, ScheduledMatch>()
  const byCourt = new Map<string, ScheduledMatch[]>()
  for (const m of dayMatches) {
    if (!m.courtId || !m.scheduledAt) continue
    // Las rondas de un grupo de liga comparten la hora del grupo pero son
    // secuenciales: se escalonan según su orden para no solaparse.
    const slot = m.leagueId
      ? leagueStaggerSlot(m.league?.playKind, m.intraGroupOrder)
      : 0
    const durMin = m.durationMinutes ?? DEFAULT_MATCH_MINUTES
    const startMinutes = clubMinutesOfDay(m.scheduledAt) + slot * durMin
    const startH = Math.floor(startMinutes / 60)
    const startM = startMinutes % 60
    const start = startMinutes / 60
    const timeLabel = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`
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
  // Reservas privadas (juego libre o clase): bloquean su pista durante su duración.
  for (const r of dayReservations) {
    const start = clubDecimalHour(r.startAt)
    const timeLabel = clubTimeLabel(r.startAt)
    const isClass = r.kind === 'class'
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
      // Al hacer clic se abre el panel de edición en la pantalla de programación.
      href: `/dashboard/programacion?d=${todayKey}&edit=${r.id}`,
      title: `${isClass ? 'Clase' : 'Reserva'} · ${r.holderName}\n${timeLabel} · ${formatDuration(
        r.durationMinutes,
      )}`,
    }
    matchById.set(r.id, sm)
    const list = byCourt.get(r.courtId) ?? []
    list.push(sm)
    byCourt.set(r.courtId, list)
  }

  // Conflicto: dos o más eventos en la misma pista a la misma hora de inicio. Se
  // reparten en «carriles» (lane/lanes) para dibujarse lado a lado.
  for (const list of byCourt.values()) {
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
      }
    }
  }

  // Ventana horaria: el horario del club, ampliado si algún evento cae fuera.
  const placed = [...matchById.values()]
  const baseStart = parseHour(dayHours?.openTime) ?? 9
  const baseEnd = parseHour(dayHours?.closeTime) ?? 21
  const windowStart = placed.length
    ? Math.min(Math.floor(baseStart), Math.floor(Math.min(...placed.map((m) => m.start))))
    : Math.floor(baseStart)
  const windowEnd = Math.max(
    windowStart + 1,
    placed.length
      ? Math.max(
          Math.ceil(baseEnd),
          Math.ceil(Math.max(...placed.map((m) => m.start + m.duration))),
        )
      : Math.ceil(baseEnd),
  )
  const windowHours = windowEnd - windowStart
  const scheduleHours = Array.from({ length: windowHours }, (_, i) => windowStart + i)
  const scheduleCourts = courts.map((c, i) => ({
    id: c.id,
    n: i + 1,
    name: c.name,
    surface: `${surfaceLabels[c.surface] ?? c.surface}${c.isIndoor ? ' · Cubierta' : ''}`,
    matches: (byCourt.get(c.id) ?? []).sort((a, b) => a.start - b.start),
  }))

  // Línea de la hora actual (siempre es hoy en el resumen).
  const nowHour = clubDecimalHour(now)
  const nowFraction = (nowHour - windowStart) / windowHours
  const showNow = nowFraction >= 0 && nowFraction <= 1
  const nowLeft = `calc(184px + (100% - 184px) * ${nowFraction})`

  /* ---- Saludo ---- */
  const hour = Number(formatInClubTz(now, 'H'))
  const greeting =
    hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = (session?.user?.name ?? club.name).split(/\s+/)[0]

  // Resumen de actividad de hoy: partidos y reservas (juego libre) por separado.
  const todayActivity: string[] = []
  if (dayMatches.length > 0) {
    todayActivity.push(
      `${dayMatches.length} ${dayMatches.length === 1 ? 'partido' : 'partidos'}`,
    )
  }
  if (dayReservations.length > 0) {
    todayActivity.push(
      `${dayReservations.length} ${dayReservations.length === 1 ? 'reserva' : 'reservas'}`,
    )
  }

  return (
    <>
      <DashboardTopbar>
        <Button variant="outline" className="h-9 rounded-md px-4 text-sm" disabled>
          Exportar
        </Button>
        <Button asChild className="h-9 gap-1.5 rounded-md px-4 text-sm">
          <Link href="/dashboard/nuevo-evento">
            <Plus className="size-4" strokeWidth={2} />
            Nuevo evento
          </Link>
        </Button>
      </DashboardTopbar>

      <div className="mx-auto max-w-[1600px] px-8 py-10">
        {/* ---- Saludo + métricas ---- */}
        <section className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {club.name}
              {club.city ? ` · ${club.city}` : ''}
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {greeting}, <em className="italic">{firstName}.</em>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              {todayActivity.length > 0 ? (
                <>
                  Hoy hay{' '}
                  <span className="text-foreground">
                    {todayActivity.join(' y ')}
                  </span>{' '}
                  en {courts.length} {courts.length === 1 ? 'pista' : 'pistas'}.
                </>
              ) : (
                <>No hay partidos ni reservas para hoy en {courts.length}{' '}
                  {courts.length === 1 ? 'pista' : 'pistas'}.</>
              )}{' '}
              {pendingActions.length > 0
                ? `Quedan ${pendingActions.length} ${pendingActions.length === 1 ? 'acción' : 'acciones'} por revisar.`
                : 'Todo al día.'}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-4 lg:gap-x-8">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="font-serif text-4xl leading-none text-foreground tabular-nums">
                  {stat.value}
                </dd>
                <dd className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  {stat.sub}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- Eventos · partido en vivo · pendientes ---- */}
        <section className="mt-10 grid grid-cols-1 gap-6 border-t border-border pt-10 lg:grid-cols-5">
          {/* Lista de eventos */}
          <div className="rounded-xl border border-border bg-card lg:col-span-3">
            <div className="flex items-center justify-between gap-4 px-6 pt-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Eventos activos
                </p>
                <h2 className="mt-1.5 font-serif text-2xl tracking-tight text-foreground">
                  En curso &amp; próximos
                </h2>
              </div>
              <span className="shrink-0 rounded-md border border-border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {allEvents.length} {allEvents.length === 1 ? 'evento' : 'eventos'}
              </span>
            </div>

            {events.length === 0 ? (
              <div className="mt-4 border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
                No hay ligas ni torneos activos. Usa{' '}
                <span className="text-foreground">Nuevo evento</span> para crear
                el primero.
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-border border-t border-border">
                {events.map((e, i) => (
                  <li key={e.id}>
                    <Link
                      href={e.href}
                      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40"
                    >
                      <span className="w-6 shrink-0 font-mono text-xs text-muted-foreground/60">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">
                          {e.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          {e.meta}
                        </p>
                      </div>
                      <StatusPill status={e.status} />
                      <div className="hidden w-40 shrink-0 sm:block">
                        <p className="font-mono text-sm text-foreground tabular-nums">
                          {e.entrants}
                        </p>
                        {e.progress != null ? (
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                              <span
                                className="block h-full rounded-full bg-forest"
                                style={{ width: `${e.progress}%` }}
                              />
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {e.progress}%
                            </span>
                          </div>
                        ) : (
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
                            {e.subLabel}
                          </p>
                        )}
                      </div>
                      <span className="w-20 shrink-0 text-right font-mono text-sm text-foreground tabular-nums">
                        {e.revenue != null
                          ? formatMoney(e.revenue, e.currency)
                          : '—'}
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground"
                        strokeWidth={1.5}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Columna derecha */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Partido en vivo */}
            {liveMatch ? (
              <div className="rounded-xl bg-forest p-6 text-cream">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 text-lime">
                    <span className="inline-block size-1.5 rounded-full bg-lime" />
                    En vivo{liveMatch.court ? ` · ${liveMatch.court.name}` : ''}
                  </span>
                  <span className="text-cream/55">
                    {durationLabel(liveMatch.scheduledAt, now)}
                  </span>
                </div>
                <p className="mt-4 truncate font-mono text-[11px] uppercase tracking-widest text-cream/70">
                  {liveComp} · {liveRound}
                </p>

                <div className="mt-4 space-y-3">
                  {liveSides.map((row, ri) => (
                    <div key={ri} className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-cream/10 font-mono text-xs">
                        {row.tag}
                      </span>
                      <span className="flex-1 truncate text-sm">{row.pair}</span>
                      <span className="flex gap-2 font-mono text-sm tabular-nums">
                        {row.sets.length === 0 ? (
                          <span className="text-cream/45">—</span>
                        ) : (
                          row.sets.map((set, i) => (
                            <span
                              key={i}
                              className={cn(
                                'w-4 text-center',
                                i === lastSet ? 'text-lime' : 'text-cream/70',
                              )}
                            >
                              {set}
                            </span>
                          ))
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-cream/15 pt-4 font-mono text-[10px] uppercase tracking-widest">
                  <span className="text-lime">
                    Set {Math.max(1, liveMatch.sets.length)}
                  </span>
                  <span className="text-cream/50">
                    Restan {remainingToday} hoy
                  </span>
                </div>
              </div>
            ) : liveReservation ? (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-forest">
                  <span className="inline-block size-1.5 rounded-full bg-forest" />
                  Reserva en curso
                  {courtNameById.get(liveReservation.courtId)
                    ? ` · ${courtNameById.get(liveReservation.courtId)}`
                    : ''}
                </div>
                <p className="mt-4 truncate text-sm leading-relaxed text-foreground">
                  {liveReservation.holderName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Juego libre en curso.
                  {remainingToday > 0
                    ? ` Quedan ${remainingToday} entre partidos y reservas hoy.`
                    : ''}
                </p>
                <Link
                  href="/dashboard/programacion"
                  className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-foreground hover:underline"
                >
                  Ver programación
                  <ChevronRight className="size-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span className="inline-block size-1.5 rounded-full bg-muted-foreground/50" />
                  Sin actividad en vivo
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {remainingToday > 0
                    ? `Quedan ${remainingToday} entre partidos y reservas hoy.`
                    : 'No hay partidos ni reservas en juego en este momento.'}
                </p>
                <Link
                  href="/dashboard/programacion"
                  className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-foreground hover:underline"
                >
                  Ver programación
                  <ChevronRight className="size-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            )}

            {/* Acciones pendientes */}
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Pendiente ·{' '}
                {pendingActions.length === 0
                  ? 'al día'
                  : `${pendingActions.length} ${pendingActions.length === 1 ? 'acción' : 'acciones'}`}
              </p>
              {pendingActions.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No tienes acciones pendientes. Todo está en orden.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {pendingActions.map((action, i) => (
                    <li key={i} className="first:pt-0 last:pb-0">
                      <Link
                        href={action.href}
                        className="flex gap-3 py-3 transition-colors hover:opacity-80"
                      >
                        <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-terracotta" />
                        <div className="min-w-0">
                          <p className="text-sm text-foreground">
                            {action.title}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {action.meta}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* ---- Programación de pistas (mismo tema que /programacion) ---- */}
        <section className="mt-10 border-t border-border pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Hoy · {capitalize(fullDateFmt.format(now))}
              </p>
              <h2 className="mt-1.5 font-serif text-2xl tracking-tight text-foreground">
                Programación de pistas
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {scheduleLegend.map((item) => (
                  <span key={item.label} className="flex items-center gap-1.5">
                    <span className={cn('size-2.5 rounded-sm', item.cls)} />
                    {item.label}
                  </span>
                ))}
              </div>
              <NewReservationButton courts={courts} defaultDate={todayKey} />
            </div>
          </div>

          {courts.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
              Este club no tiene pistas activas.{' '}
              <Link
                href="/dashboard/pistas"
                className="text-foreground underline underline-offset-2"
              >
                Añade pistas
              </Link>{' '}
              para programar partidos.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
              <div className="min-w-[1180px]">
                {/* Cabecera de horas */}
                <div className="grid grid-cols-[184px_minmax(0,1fr)] border-b border-border bg-muted/30">
                  <div className="flex flex-col justify-center border-r border-border px-4 py-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Pistas · {courts.length}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                      Disponibles
                    </span>
                  </div>
                  <div className="flex">
                    {scheduleHours.map((h) => (
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
                  {scheduleCourts.map((court) => (
                    <div
                      key={court.id}
                      className="grid min-h-[68px] grid-cols-[184px_minmax(0,1fr)] border-b border-border last:border-b-0"
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
                          {scheduleHours.map((h) => (
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
                        {clubTimeLabel(now)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
