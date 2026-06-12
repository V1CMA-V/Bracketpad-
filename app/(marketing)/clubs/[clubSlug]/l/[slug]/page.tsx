import {
  GroupStandings,
  type GroupPlayerStat,
  type GroupSetRow,
  type GroupStandingRound,
  type PublicGroup,
} from '@/components/league/group-standings'
import { type PublicRound } from '@/components/league/public-rounds'
import {
  StandingsTable,
  type LeagueStandingRow,
} from '@/components/league/standings-table'
import { NO_SHOW_SETS } from '@/lib/league-rules'
import {
  leagueFormatLabels,
  leagueRankingBasisLabels,
  leagueStatusLabels,
  teamLabel,
} from '@/lib/leagues'
import { formatMoney } from '@/lib/money'
import { prisma } from '@/lib/prisma'
import { compareStandings } from '@/lib/standings'
import { Mail, MapPin, Phone, Ticket } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Fechas de calendario `@db.Date` (startDate/endDate): guardadas como medianoche
// UTC, se formatean en UTC para no mostrar un día antes en zonas con desfase.
const dateFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

// Timestamp real de un partido (`scheduledAt`): se formatea en hora local.
const dateTimeFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

// Fecha de la jornada (`scheduledDate`, `@db.Date`): también en UTC.
const dayFmt = new Intl.DateTimeFormat('es', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

function formatRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${dateFmt.format(start)} — ${dateFmt.format(end)}`
  if (start) return `Desde ${dateFmt.format(start)}`
  if (end) return `Hasta ${dateFmt.format(end)}`
  return 'Fechas por confirmar'
}

const weekdayNames = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

/** Días de la semana (0=domingo … 6=sábado) en texto. */
function formatWeekdays(days: number[]): string {
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => weekdayNames[d])
    .join(', ')
}

/** "HH:MM" (24 h) a formato de 12 horas (p. ej. "7:00 p.m."). */
function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  const period = h < 12 ? 'a.m.' : 'p.m.'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

/** Carga la liga pública de un club por su slug. */
async function getLeague(clubSlug: string, leagueId: string) {
  const club = await prisma.club.findUnique({
    where: { slug: clubSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      address: true,
      email: true,
      phone: true,
      logoUrl: true,
    },
  })
  if (!club) return null

  const league = await prisma.league.findFirst({
    where: { id: leagueId, clubId: club.id },
    include: {
      scoringConfig: true,
      _count: { select: { registrations: true, rounds: true, matches: true } },
      standings: {
        include: {
          registration: {
            include: {
              player: { select: { fullName: true } },
              partnerPlayer: { select: { fullName: true } },
            },
          },
        },
      },
      rounds: {
        // Solo las jornadas publicadas o cerradas son visibles públicamente;
        // los borradores quedan ocultos hasta que el club las publique.
        where: { status: { in: ['published', 'closed'] } },
        orderBy: { roundNumber: 'asc' },
        include: {
          matches: {
            orderBy: [
              { groupNumber: 'asc' },
              { intraGroupOrder: 'asc' },
              { createdAt: 'asc' },
            ],
            include: {
              court: { select: { name: true } },
              sides: {
                orderBy: { side: 'asc' },
                include: {
                  players: {
                    include: { player: { select: { fullName: true } } },
                  },
                },
              },
              sets: { orderBy: { setNumber: 'asc' } },
            },
          },
          // Grupos resueltos de la jornada (posición, sets y ascenso/descenso).
          // Solo se rellenan al cerrar la jornada.
          groupSlots: {
            orderBy: [{ groupNumber: 'asc' }, { rankInGroup: 'asc' }],
            select: {
              groupNumber: true,
              rankInGroup: true,
              movement: true,
              attendance: true,
              substituteName: true,
              registration: {
                select: {
                  playerId: true,
                  player: { select: { fullName: true } },
                  partnerPlayer: { select: { fullName: true } },
                },
              },
            },
          },
        },
      },
    },
  })
  if (!league) return null

  const courts = await prisma.court.findMany({
    where: { clubId: club.id, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, surface: true, isIndoor: true },
  })

  return { club, league, courts }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string; slug: string }>
}): Promise<Metadata> {
  const { clubSlug, slug } = await params
  const data = await getLeague(clubSlug, slug)
  if (!data) return { title: 'Liga no encontrada' }
  return {
    title: `${data.league.name} · ${data.club.name}`,
    description: `Clasificación, jornadas y resultados de ${data.league.name} en ${data.club.name}.`,
  }
}

const surfaceLabels: Record<string, string> = {
  artificial_grass: 'Césped artificial',
  concrete: 'Hormigón',
  synthetic: 'Sintética',
  glass: 'Cristal',
}

export default async function PublicLeaguePage({
  params,
}: {
  params: Promise<{ clubSlug: string; slug: string }>
}) {
  const { clubSlug, slug } = await params
  const data = await getLeague(clubSlug, slug)
  if (!data) notFound()
  const { club, league, courts } = data

  const cfg = league.scoringConfig
  const isPairs = league.playKind === 'pairs'

  const rankingBy = cfg?.rankingBy ?? 'sets'
  const rankingLabel = rankingBy === 'games' ? 'juegos ganados' : 'sets ganados'
  // Columnas de la clasificación según el criterio: por sets (Sets/±Sets), por
  // juegos (Juegos/±Jue) o ambos (Sets/±Sets/±Jue).
  const showSets = rankingBy !== 'games'
  const showGames = rankingBy === 'games'
  const showGameDiff = rankingBy !== 'sets'
  // Los jugadores retirados no entran en la clasificación.
  const orderedStandings = league.standings
    .filter((s) => s.registration.status !== 'withdrawn')
    .sort((a, b) => compareStandings(a, b, rankingBy))

  // Filas serializables para la tabla de clasificación (con posición fijada).
  const standingRows: LeagueStandingRow[] = orderedStandings.map((s, i) => ({
    registrationId: s.registrationId,
    rank: i + 1,
    fullName: teamLabel(
      s.registration.player.fullName,
      s.registration.partnerPlayer?.fullName,
    ),
    matchesPlayed: s.matchesPlayed,
    wins: s.wins,
    losses: s.losses,
    setsFor: s.setsFor,
    setsAgainst: s.setsAgainst,
    gamesFor: s.gamesFor,
    gamesAgainst: s.gamesAgainst,
  }))

  const rounds: PublicRound[] = league.rounds.map((round) => ({
    id: round.id,
    roundNumber: round.roundNumber,
    name: round.name,
    dateLabel: round.scheduledDate
      ? dayFmt.format(round.scheduledDate)
      : 'Sin fecha',
    matchCount: round.matches.length,
    matches: round.matches.map((m) => {
      const side = (s: 'A' | 'B') =>
        m.sides
          .find((x) => x.side === s)
          ?.players.map((p) => p.player.fullName) ?? []
      return {
        id: m.id,
        status: m.status,
        winnerSide: m.winnerSide,
        groupNumber: m.groupNumber,
        courtName: m.court?.name ?? null,
        scheduledLabel: m.scheduledAt
          ? dateTimeFmt.format(m.scheduledAt)
          : null,
        sideA: side('A'),
        sideB: side('B'),
        sets: m.sets.map((s) => ({
          gamesA: s.gamesA,
          gamesB: s.gamesB,
          tiebreakA: s.tiebreakA,
          tiebreakB: s.tiebreakB,
        })),
      }
    }),
  }))

  // Clasificación por grupo, jornada a jornada. Las jornadas cerradas (más
  // reciente primero) muestran la tarjeta con resultados; las jornadas
  // publicadas aún no jugadas se muestran como «próximas» con la info vacía.
  // Replica la tarjeta de grupo del panel, en versión pública de solo lectura:
  // posición, sets, juegos y diferencia se calculan de los partidos del grupo;
  // la posición y el ascenso/descenso ya vienen resueltos en cada slot al cerrar.
  const noShowGamesAgainst = cfg?.noShowGamesAgainst ?? 9
  const groupStandingRounds: GroupStandingRound[] = league.rounds
    .filter((r) => r.groupSlots.length > 0)
    .sort((a, b) => a.roundNumber - b.roundNumber)
    .map((round) => {
      const pending = round.status !== 'closed'
      // Números de grupo presentes en la jornada, en orden.
      const groupNumbers = [
        ...new Set(round.groupSlots.map((s) => s.groupNumber)),
      ].sort((a, b) => a - b)

      const groups: PublicGroup[] = groupNumbers.map((groupNumber) => {
        const slots = round.groupSlots.filter(
          (s) => s.groupNumber === groupNumber,
        )
        const matches = round.matches
          .filter((m) => m.groupNumber === groupNumber)
          .sort((a, b) => (a.intraGroupOrder ?? 0) - (b.intraGroupOrder ?? 0))

        const sidePlayers = (m: (typeof matches)[number], side: 'A' | 'B') =>
          m.sides.find((x) => x.side === side)?.players ?? []

        // Cancha del grupo: normalmente todos sus partidos se juegan en la misma
        // pista. Si hubiera varias, se listan separadas por « · ».
        const courtNames = [
          ...new Set(
            matches
              .map((m) => m.court?.name)
              .filter((n): n is string => Boolean(n)),
          ),
        ]
        const courtName = courtNames.length > 0 ? courtNames.join(' · ') : null

        // Acumula sets y juegos por jugador presente a partir de cada set
        // jugado (un set por partido en el formato individual rotativo).
        const acc = new Map<
          string,
          {
            setsWon: number
            setsLost: number
            gamesFor: number
            gamesAgainst: number
          }
        >()
        const absentIds = new Set(
          slots
            .filter((s) => s.attendance === 'absent')
            .map((s) => s.registration.playerId),
        )
        for (const m of matches) {
          const set = m.sets[0]
          if (!set) continue
          const add = (playerId: string, on: 'A' | 'B') => {
            // El ausente no recibe lo que jugó su suplente.
            if (absentIds.has(playerId)) return
            const a = acc.get(playerId) ?? {
              setsWon: 0,
              setsLost: 0,
              gamesFor: 0,
              gamesAgainst: 0,
            }
            a.gamesFor += on === 'A' ? set.gamesA : set.gamesB
            a.gamesAgainst += on === 'A' ? set.gamesB : set.gamesA
            if (m.winnerSide === on) a.setsWon += 1
            else if (m.winnerSide) a.setsLost += 1
            acc.set(playerId, a)
          }
          for (const p of sidePlayers(m, 'A')) add(p.playerId, 'A')
          for (const p of sidePlayers(m, 'B')) add(p.playerId, 'B')
        }

        // Filas de la clasificación. En jornadas cerradas se ordenan por la
        // posición resuelta (rankInGroup) y traen sets/juegos/diferencia; en las
        // próximas se listan sin resultados (todo vacío).
        const players: GroupPlayerStat[] = slots.map((slot) => {
          const pid = slot.registration.playerId
          const absent = slot.attendance === 'absent'
          const stat = acc.get(pid)
          return {
            key: pid,
            rank: pending ? null : slot.rankInGroup,
            name: teamLabel(
              slot.registration.player.fullName,
              slot.registration.partnerPlayer?.fullName,
            ),
            absent: pending ? false : absent,
            note:
              !pending && absent
                ? slot.substituteName
                  ? `No llegó · ${slot.substituteName}`
                  : 'No llegó'
                : null,
            // El ausente pierde la jornada: forfeit de sus sets y la sanción de
            // juegos en contra que fijó el club.
            setsWon: pending ? null : absent ? 0 : (stat?.setsWon ?? 0),
            setsLost: pending
              ? null
              : absent
                ? NO_SHOW_SETS
                : (stat?.setsLost ?? 0),
            gamesFor: pending ? null : absent ? 0 : (stat?.gamesFor ?? 0),
            gamesAgainst: pending
              ? null
              : absent
                ? noShowGamesAgainst
                : (stat?.gamesAgainst ?? 0),
            movement: pending ? null : slot.movement,
          }
        })

        const sets: GroupSetRow[] = matches.map((m) => ({
          id: m.id,
          label: `S${m.intraGroupOrder ?? '?'}`,
          courtName: m.court?.name ?? null,
          sideA: sidePlayers(m, 'A').map((p) => p.player.fullName),
          sideB: sidePlayers(m, 'B').map((p) => p.player.fullName),
          winnerSide: pending ? null : m.winnerSide,
          scoreA: pending ? null : (m.sets[0]?.gamesA ?? null),
          scoreB: pending ? null : (m.sets[0]?.gamesB ?? null),
        }))

        return { groupNumber, courtName, players, sets }
      })

      return {
        id: round.id,
        roundNumber: round.roundNumber,
        label: round.name ?? `Jornada ${round.roundNumber}`,
        dateLabel: round.scheduledDate
          ? dayFmt.format(round.scheduledDate)
          : null,
        pending,
        isPreliminary: round.isPreliminary,
        groups,
      }
    })

  const stats = [
    { label: 'Inscritos', value: String(league._count.registrations) },
    // Solo cuenta las jornadas visibles (publicadas/cerradas), no los borradores.
    { label: 'Jornadas', value: String(rounds.length) },
    { label: 'Partidos', value: String(league._count.matches) },
    { label: 'Sets', value: cfg ? `Mejor de ${cfg.bestOfSets}` : '—' },
  ]

  const statusLabel = leagueStatusLabels[league.status] ?? league.status

  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-cream">
        <nav className="mx-auto flex max-w-[1400px] items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-wider md:px-12">
          <Link
            href="/clubs"
            className="text-muted-foreground transition-colors hover:text-ink"
          >
            Clubes
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href={`/clubs/${club.slug}`}
            className="text-muted-foreground transition-colors hover:text-ink"
          >
            {club.name}
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href={`/clubs/${club.slug}/ligas`}
            className="text-muted-foreground transition-colors hover:text-ink"
          >
            Ligas
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-ink">{league.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="border-b border-border bg-cream px-6 py-14 md:px-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="flex items-center gap-2 text-terracotta">
              <span className="size-1.5 rounded-full bg-terracotta" />
              {statusLabel}
            </span>
            <span className="text-ink/25">·</span>
            <span>{leagueFormatLabels[league.format] ?? league.format}</span>
            <span className="text-ink/25">·</span>
            <span>{club.name}</span>
          </p>

          <h1 className="mt-5 font-heading text-6xl leading-[1.02] tracking-tight text-ink md:text-7xl">
            {league.name}
          </h1>

          <p className="mt-5 max-w-xl font-serif text-lg italic leading-relaxed text-ink/80">
            {formatRange(league.startDate, league.endDate)}. El ranking se
            decide por {rankingLabel}
            {rankingBy === 'games'
              ? '.'
              : ', con desempates por diferencia de sets y juegos.'}
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5">
                <dd className="font-heading text-4xl leading-none text-ink tabular-nums">
                  {stat.value}
                </dd>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Cuerpo */}
      <section className="bg-background px-6 py-14 md:px-12">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Columna principal */}
          <div className="space-y-14">
            {/* Clasificación */}
            <section>
              <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Ranking · por {rankingLabel}
                  </p>
                  <h2 className="mt-1.5 font-heading text-3xl text-ink">
                    Clasificación
                  </h2>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {orderedStandings.length} {isPairs ? 'parejas' : 'jugadores'}
                </span>
              </div>

              {orderedStandings.length === 0 ? (
                <div className="mt-5 rounded-sm border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
                  Aún no hay clasificación. Se calcula automáticamente con los
                  resultados de cada jornada.
                </div>
              ) : (
                <StandingsTable
                  rows={standingRows}
                  showSets={showSets}
                  showGames={showGames}
                  showGameDiff={showGameDiff}
                />
              )}
            </section>

            {/* Clasificación por grupo (jornadas cerradas y próximas) */}
            {groupStandingRounds.length > 0 && (
              <section>
                <div className="border-b border-border pb-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Grupos · ascensos y descensos
                  </p>
                  <h2 className="mt-1.5 font-heading text-3xl text-ink">
                    Clasificación por grupo
                  </h2>
                </div>
                <div className="mt-6">
                  <GroupStandings
                    rounds={groupStandingRounds}
                    isPairs={isPairs}
                  />
                </div>
              </section>
            )}
          </div>

          {/* Columna lateral */}
          <aside className="space-y-6">
            {/* Información del club */}
            <div className="rounded-sm border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Organiza
              </p>
              <div className="mt-3 flex items-center gap-3">
                {club.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={club.logoUrl}
                    alt={club.name}
                    className="size-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-12 items-center justify-center rounded-full bg-ink font-heading text-xl text-cream">
                    {club.name.charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/clubs/${club.slug}`}
                    className="block truncate font-heading text-lg text-ink hover:text-terracotta"
                  >
                    {club.name}
                  </Link>
                  {club.city && (
                    <p className="truncate text-xs text-muted-foreground">
                      {club.city}
                    </p>
                  )}
                </div>
              </div>

              <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
                {club.address && (
                  <div className="flex items-start gap-2 text-ink/80">
                    <MapPin
                      className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                    <span>{club.address}</span>
                  </div>
                )}
                {club.phone && (
                  <div className="flex items-center gap-2 text-ink/80">
                    <Phone
                      className="size-3.5 shrink-0 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                    <a
                      href={`tel:${club.phone}`}
                      className="hover:text-terracotta"
                    >
                      {club.phone}
                    </a>
                  </div>
                )}
                {club.email && (
                  <div className="flex items-center gap-2 text-ink/80">
                    <Mail
                      className="size-3.5 shrink-0 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                    <a
                      href={`mailto:${club.email}`}
                      className="truncate hover:text-terracotta"
                    >
                      {club.email}
                    </a>
                  </div>
                )}
              </dl>
            </div>

            {/* Calendario de la temporada */}
            {(league.totalRounds != null ||
              league.playWeekdays.length > 0 ||
              league.playTimes.length > 0) && (
              <div className="rounded-sm border border-border bg-card p-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Calendario
                </p>
                <dl className="mt-3 space-y-2.5 border-t border-border pt-4 text-sm">
                  {league.totalRounds != null && (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Jornadas</dt>
                      <dd className="font-medium text-ink">
                        {league.totalRounds}
                      </dd>
                    </div>
                  )}
                  {league.playWeekdays.length > 0 && (
                    <div className="flex items-start justify-between gap-3">
                      <dt className="shrink-0 text-muted-foreground">Días</dt>
                      <dd className="text-right text-ink">
                        {formatWeekdays(league.playWeekdays)}
                      </dd>
                    </div>
                  )}
                  {league.playTimes.length > 0 && (
                    <div className="flex items-start justify-between gap-3">
                      <dt className="shrink-0 text-muted-foreground">
                        Horarios
                      </dt>
                      <dd className="text-right text-ink">
                        {league.playTimes.map(formatTime12).join(' · ')}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Costo de inscripción */}
            <div className="rounded-sm border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Inscripción
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-forest/10 text-forest">
                  <Ticket className="size-5" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="font-heading text-2xl leading-none text-ink">
                    {league.entryFee != null
                      ? formatMoney(Number(league.entryFee), league.currency)
                      : 'Gratuita'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {league.entryFee != null
                      ? 'Costo de ingreso por jugador'
                      : 'Entrada sin costo'}
                  </p>
                </div>
              </div>
            </div>

            {/* Premios */}
            {league.prizes && (
              <div className="rounded-sm border border-border bg-card p-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Premios
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">
                  {league.prizes}
                </p>
              </div>
            )}

            {/* Canchas */}
            <div className="rounded-sm border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Pistas · {courts.length}
              </p>
              {courts.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Sin pistas registradas.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {courts.map((court) => (
                    <li
                      key={court.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <span className="text-sm text-ink">{court.name}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {surfaceLabels[court.surface] ?? court.surface}
                        {court.isIndoor ? ' · cubierta' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Reglas de puntuación */}
            <div className="rounded-sm border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Reglas · puntuación
              </p>
              {cfg ? (
                <dl className="mt-3 divide-y divide-border">
                  <DataRow
                    label="Sets"
                    value={`Al mejor de ${cfg.bestOfSets}`}
                  />
                  <DataRow
                    label="Punto de oro"
                    value={cfg.goldenPoint ? 'Sí' : 'No'}
                  />
                  <DataRow
                    label="Tie-break en"
                    value={`${cfg.tiebreakAt} juegos`}
                  />
                  <DataRow
                    label="Clasificación"
                    value={leagueRankingBasisLabels[rankingBy] ?? rankingBy}
                  />
                  <DataRow
                    label="Sanción por falta"
                    value={`−${cfg.noShowGamesAgainst} juegos`}
                  />
                </dl>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Sin configuración de puntuación.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right text-sm text-ink">{value}</dd>
    </div>
  )
}
