import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { LeagueRegistrations } from '@/components/dashboard/league-registrations'
import { LeagueRounds } from '@/components/dashboard/league-rounds'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'
import { compareStandings } from '@/lib/standings'
import {
  leagueFormatLabels,
  leagueRankingBasisLabels,
  leagueStatusLabels,
  leagueStatusStyles,
  standingTiebreakerLabels,
} from '@/lib/leagues'
import { ArrowLeft, ArrowUpRight, Pencil } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const dateFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${dateFmt.format(start)} → ${dateFmt.format(end)}`
  if (start) return `Desde ${dateFmt.format(start)}`
  if (end) return `Hasta ${dateFmt.format(end)}`
  return 'Sin fechas'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const league = await prisma.league.findUnique({
    where: { id },
    select: { name: true },
  })
  return { title: `${league?.name ?? 'Liga'} · Bandeja` }
}

/* -------------------------------------------------------------------------- */
/*  Bloques reutilizables                                                     */
/* -------------------------------------------------------------------------- */

function ModuleHeader({
  eyebrow,
  title,
  aside,
}: {
  eyebrow: string
  title: string
  aside?: string
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 font-serif text-2xl tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      {aside && (
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
          {aside}
        </span>
      )}
    </div>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right text-sm text-foreground">{value}</dd>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Página                                                                    */
/* -------------------------------------------------------------------------- */

export default async function LigaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const club = await getManagedClub()
  if (!club) notFound()

  const league = await prisma.league.findFirst({
    where: { id, clubId: club.id },
    include: {
      scoringConfig: true,
      _count: { select: { registrations: true, rounds: true, matches: true } },
      registrations: {
        orderBy: { createdAt: 'asc' },
        include: { player: { select: { fullName: true } } },
      },
      rounds: {
        orderBy: { roundNumber: 'asc' },
        include: { _count: { select: { matches: true } } },
      },
      standings: {
        include: {
          registration: { include: { player: { select: { fullName: true } } } },
        },
      },
    },
  })

  if (!league) notFound()

  const clubPlayers = await prisma.player.findMany({
    where: { clubId: club.id },
    orderBy: { fullName: 'asc' },
    select: { id: true, fullName: true },
  })

  const status = leagueStatusStyles[league.status] ?? leagueStatusStyles.draft
  const cfg = league.scoringConfig

  const stats = [
    { label: 'Inscritos', value: league._count.registrations },
    { label: 'Jornadas', value: league._count.rounds },
    { label: 'Partidos', value: league._count.matches },
    { label: 'Sets', value: cfg ? `Mejor de ${cfg.bestOfSets}` : '—' },
  ]

  const tiebreakers = cfg
    ? [cfg.tiebreaker1, cfg.tiebreaker2, cfg.tiebreaker3]
    : []

  // Ranking ordenado aplicando los desempates configurados (lo que la barra
  // lateral anuncia). Sin configuración, se usan desempates por defecto.
  const rankingTiebreakers =
    tiebreakers.length > 0 ? tiebreakers : ['set_diff', 'sets_won', 'game_diff']
  const rankingBy = cfg?.rankingBy ?? 'sets'
  const orderedStandings = [...league.standings].sort((a, b) =>
    compareStandings(a, b, rankingTiebreakers, rankingBy),
  )
  const rankingLabel =
    rankingBy === 'games' ? 'juegos ganados' : 'sets ganados'
  // Columnas de la clasificación según el criterio: por sets (Sets/±Sets), por
  // juegos (Juegos/±Jue) o ambos (Sets/±Sets/±Jue).
  const showSets = rankingBy !== 'games'
  const showGames = rankingBy === 'games'
  const showGameDiff = rankingBy !== 'sets'

  return (
    <>
      <DashboardTopbar>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="h-9 gap-1.5 rounded-md px-4 text-sm"
          >
            <Link href="/dashboard/ligas">
              <ArrowLeft className="size-4" strokeWidth={2} />
              Ligas
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-9 gap-1.5 rounded-md px-4 text-sm"
          >
            <Link
              href={`/clubs/${club.slug}/l/${league.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver página pública
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </Link>
          </Button>
          <Button
            asChild
            className="h-9 gap-1.5 rounded-md px-4 text-sm"
          >
            <Link href={`/dashboard/ligas/${league.id}/editar`}>
              <Pencil className="size-4" strokeWidth={2} />
              Editar liga
            </Link>
          </Button>
        </div>
      </DashboardTopbar>

      <div className="mx-auto max-w-[1600px] px-8 py-10">
        {/* ---- Encabezado ---- */}
        <section className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <span
                className={cn(
                  'flex items-center gap-1.5',
                  status.text,
                )}
              >
                <span className={cn('size-1.5 rounded-full', status.dot)} />
                {leagueStatusLabels[league.status] ?? league.status}
              </span>
              <span className="text-foreground/25">·</span>
              {leagueFormatLabels[league.format] ?? league.format}
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {league.name}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {formatRange(league.startDate, league.endDate)} · El ranking se
              decide por {rankingLabel}.
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
              </div>
            ))}
          </dl>
        </section>

        {/* ---- Módulos ---- */}
        <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-12 border-t border-border pt-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Columna principal */}
          <div className="space-y-12">
            {/* Clasificación */}
            <section>
              <ModuleHeader
                eyebrow={`Ranking · por ${rankingLabel}`}
                title="Clasificación"
                aside={`${league.standings.length} jugadores`}
              />
              {league.standings.length === 0 ? (
                <EmptyState>
                  Aún no hay clasificación. Se calculará automáticamente al
                  registrar resultados de los partidos.
                </EmptyState>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[620px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground [&>th]:px-3 [&>th]:pb-2.5 [&>th]:font-normal">
                        <th className="w-10 text-left">Pos</th>
                        <th className="text-left">Jugador</th>
                        <th className="w-12 text-right">PJ</th>
                        <th className="w-16 text-right">G-P</th>
                        {showSets && (
                          <>
                            <th className="w-16 text-right">Sets</th>
                            <th className="w-16 text-right">±Sets</th>
                          </>
                        )}
                        {showGames && (
                          <th className="w-16 text-right">Juegos</th>
                        )}
                        {showGameDiff && (
                          <th className="w-16 text-right">±Jue</th>
                        )}
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
                            className={cn(
                              'border-b border-border [&>td]:px-3 [&>td]:py-3',
                              i === 0 && 'bg-forest/5',
                            )}
                          >
                            <td
                              className={cn(
                                'font-serif text-lg tabular-nums',
                                i === 0
                                  ? 'text-forest'
                                  : 'text-muted-foreground/70',
                              )}
                            >
                              {i + 1}
                            </td>
                            <td
                              className={cn(
                                'max-w-0 truncate text-foreground',
                                i === 0 && 'font-medium',
                              )}
                            >
                              {s.registration.player.fullName}
                            </td>
                            <td className="text-right font-mono text-muted-foreground tabular-nums">
                              {s.matchesPlayed}
                            </td>
                            <td className="text-right font-mono tabular-nums">
                              {s.wins}-{s.losses}
                            </td>
                            {showSets && (
                              <>
                                <td className="text-right font-mono tabular-nums">
                                  {s.setsFor}-{s.setsAgainst}
                                </td>
                                <td
                                  className={cn(
                                    'text-right font-mono tabular-nums',
                                    setDiff > 0
                                      ? 'text-forest'
                                      : setDiff < 0
                                        ? 'text-terracotta'
                                        : 'text-muted-foreground',
                                  )}
                                >
                                  {fmt(setDiff)}
                                </td>
                              </>
                            )}
                            {showGames && (
                              <td className="text-right font-mono tabular-nums">
                                {s.gamesFor}-{s.gamesAgainst}
                              </td>
                            )}
                            {showGameDiff && (
                              <td
                                className={cn(
                                  'text-right font-mono tabular-nums',
                                  // En modo «juegos» ±Jue es el diferencial
                                  // principal y se colorea; en «ambos» se queda
                                  // gris como columna secundaria.
                                  !showGames
                                    ? 'text-muted-foreground'
                                    : gameDiff > 0
                                      ? 'text-forest'
                                      : gameDiff < 0
                                        ? 'text-terracotta'
                                        : 'text-muted-foreground',
                                )}
                              >
                                {fmt(gameDiff)}
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Inscripciones */}
            <LeagueRegistrations
              leagueId={league.id}
              registrations={league.registrations.map((reg) => ({
                id: reg.id,
                name: reg.player.fullName,
                division: reg.division,
                seed: reg.seed,
                status: reg.status,
              }))}
              players={clubPlayers.map((p) => ({ id: p.id, name: p.fullName }))}
            />

            {/* Jornadas */}
            <LeagueRounds
              leagueId={league.id}
              rounds={league.rounds.map((round) => ({
                id: round.id,
                roundNumber: round.roundNumber,
                name: round.name,
                dateLabel: round.scheduledDate
                  ? dateFmt.format(round.scheduledDate)
                  : 'Sin fecha',
                matchCount: round._count.matches,
                status: round.status,
              }))}
            />
          </div>

          {/* Columna lateral */}
          <aside className="space-y-6">
            {/* Configuración */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Configuración · puntuación
              </p>
              {cfg ? (
                <dl className="mt-3 divide-y divide-border">
                  <DataRow label="Sets" value={`Al mejor de ${cfg.bestOfSets}`} />
                  <DataRow
                    label="Punto de oro"
                    value={cfg.goldenPoint ? 'Sí' : 'No'}
                  />
                  <DataRow label="Tie-break en" value={`${cfg.tiebreakAt} juegos`} />
                  <DataRow
                    label="Clasificación"
                    value={leagueRankingBasisLabels[rankingBy] ?? rankingBy}
                  />
                </dl>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Sin configuración de puntuación.
                </p>
              )}

              {tiebreakers.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Desempates · en orden
                  </p>
                  <ol className="mt-2 space-y-1.5">
                    {tiebreakers.map((tb, i) => (
                      <li
                        key={`${tb}-${i}`}
                        className="flex items-center gap-2 text-sm text-foreground"
                      >
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {i + 1}.
                        </span>
                        {standingTiebreakerLabels[tb] ?? tb}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Premios */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Premios
              </p>
              {league.prizes ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {league.prizes}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Sin premios definidos. Añádelos desde{' '}
                  <Link
                    href={`/dashboard/ligas/${league.id}/editar`}
                    className="text-foreground underline underline-offset-2"
                  >
                    Editar liga
                  </Link>
                  .
                </p>
              )}
            </div>

            {/* Datos de la liga */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Datos de la liga
              </p>
              <dl className="mt-3 divide-y divide-border">
                <DataRow
                  label="Formato"
                  value={leagueFormatLabels[league.format] ?? league.format}
                />
                <DataRow
                  label="Estado"
                  value={leagueStatusLabels[league.status] ?? league.status}
                />
                <DataRow
                  label="Inicio"
                  value={
                    league.startDate ? dateFmt.format(league.startDate) : '—'
                  }
                />
                <DataRow
                  label="Fin"
                  value={league.endDate ? dateFmt.format(league.endDate) : '—'}
                />
                <DataRow label="Creada" value={dateFmt.format(league.createdAt)} />
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
