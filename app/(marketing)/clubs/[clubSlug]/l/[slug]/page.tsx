import {
  PublicRounds,
  type PublicRound,
} from '@/components/league/public-rounds'
import { prisma } from '@/lib/prisma'
import { compareStandings } from '@/lib/standings'
import {
  leagueFormatLabels,
  leagueStatusLabels,
  standingTiebreakerLabels,
} from '@/lib/leagues'
import { Mail, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const dateFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const dayFmt = new Intl.DateTimeFormat('es', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
})

function formatRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${dateFmt.format(start)} — ${dateFmt.format(end)}`
  if (start) return `Desde ${dateFmt.format(start)}`
  if (end) return `Hasta ${dateFmt.format(end)}`
  return 'Fechas por confirmar'
}

/** Carga la liga pública (no borrador) de un club por su slug. */
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
    where: { id: leagueId, clubId: club.id, status: { not: 'draft' } },
    include: {
      scoringConfig: true,
      _count: { select: { registrations: true, rounds: true, matches: true } },
      standings: {
        include: {
          registration: { include: { player: { select: { fullName: true } } } },
        },
      },
      rounds: {
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
  const tiebreakers = cfg
    ? [cfg.tiebreaker1, cfg.tiebreaker2, cfg.tiebreaker3]
    : ['set_diff', 'sets_won', 'game_diff']

  const orderedStandings = [...league.standings].sort((a, b) =>
    compareStandings(a, b, tiebreakers),
  )

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
        scheduledLabel: m.scheduledAt ? dateTimeFmt.format(m.scheduledAt) : null,
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

  const stats = [
    { label: 'Inscritos', value: String(league._count.registrations) },
    { label: 'Jornadas', value: String(league._count.rounds) },
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
            {formatRange(league.startDate, league.endDate)}. El ranking se decide
            por sets ganados, con desempates por diferencia de sets y juegos.
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
                    Ranking · por sets ganados
                  </p>
                  <h2 className="mt-1.5 font-heading text-3xl text-ink">
                    Clasificación
                  </h2>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {league.standings.length} jugadores
                </span>
              </div>

              {orderedStandings.length === 0 ? (
                <div className="mt-5 rounded-sm border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
                  Aún no hay clasificación. Se calcula automáticamente con los
                  resultados de cada jornada.
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[620px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground [&>th]:px-3 [&>th]:pb-2.5 [&>th]:font-normal">
                        <th className="w-10 text-left">Pos</th>
                        <th className="text-left">Jugador</th>
                        <th className="w-12 text-right">PJ</th>
                        <th className="w-16 text-right">G-P</th>
                        <th className="w-16 text-right">Sets</th>
                        <th className="w-16 text-right">±Sets</th>
                        <th className="w-16 text-right">±Jue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedStandings.map((s, i) => {
                        const setDiff = s.setsFor - s.setsAgainst
                        const gameDiff = s.gamesFor - s.gamesAgainst
                        const fmt = (n: number) => `${n > 0 ? '+' : ''}${n}`
                        return (
                          <tr
                            key={s.registrationId}
                            className={
                              i === 0
                                ? 'border-b border-border bg-forest/5 [&>td]:px-3 [&>td]:py-3'
                                : 'border-b border-border [&>td]:px-3 [&>td]:py-3'
                            }
                          >
                            <td
                              className={
                                i === 0
                                  ? 'font-heading text-lg text-forest tabular-nums'
                                  : 'font-heading text-lg text-muted-foreground/70 tabular-nums'
                              }
                            >
                              {i + 1}
                            </td>
                            <td
                              className={
                                i === 0
                                  ? 'max-w-0 truncate font-medium text-ink'
                                  : 'max-w-0 truncate text-ink'
                              }
                            >
                              {s.registration.player.fullName}
                            </td>
                            <td className="text-right font-mono text-muted-foreground tabular-nums">
                              {s.matchesPlayed}
                            </td>
                            <td className="text-right font-mono tabular-nums">
                              {s.wins}-{s.losses}
                            </td>
                            <td className="text-right font-mono tabular-nums">
                              {s.setsFor}-{s.setsAgainst}
                            </td>
                            <td
                              className={
                                setDiff > 0
                                  ? 'text-right font-mono text-forest tabular-nums'
                                  : setDiff < 0
                                    ? 'text-right font-mono text-terracotta tabular-nums'
                                    : 'text-right font-mono text-muted-foreground tabular-nums'
                              }
                            >
                              {fmt(setDiff)}
                            </td>
                            <td className="text-right font-mono text-muted-foreground tabular-nums">
                              {fmt(gameDiff)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Jornadas y partidos */}
            <section>
              <div className="border-b border-border pb-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Calendario · resultados
                </p>
                <h2 className="mt-1.5 font-heading text-3xl text-ink">
                  Jornadas
                </h2>
              </div>
              <div className="mt-6">
                <PublicRounds rounds={rounds} />
              </div>
            </section>
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
                    <a href={`tel:${club.phone}`} className="hover:text-terracotta">
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
                  <DataRow label="Sets" value={`Al mejor de ${cfg.bestOfSets}`} />
                  <DataRow
                    label="Punto de oro"
                    value={cfg.goldenPoint ? 'Sí' : 'No'}
                  />
                  <DataRow
                    label="Tie-break en"
                    value={`${cfg.tiebreakAt} juegos`}
                  />
                </dl>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Sin configuración de puntuación.
                </p>
              )}

              <div className="mt-4 border-t border-border pt-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Desempates · en orden
                </p>
                <ol className="mt-2 space-y-1.5">
                  {tiebreakers.map((tb, i) => (
                    <li
                      key={`${tb}-${i}`}
                      className="flex items-center gap-2 text-sm text-ink"
                    >
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {i + 1}.
                      </span>
                      {standingTiebreakerLabels[tb] ?? tb}
                    </li>
                  ))}
                </ol>
              </div>
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
