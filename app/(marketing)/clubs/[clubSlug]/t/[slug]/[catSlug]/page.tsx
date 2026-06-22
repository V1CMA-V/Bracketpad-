import { Breadcrumb } from '@/components/club/breadcrumb'
import { formatMoney } from '@/lib/money'
import { prisma } from '@/lib/prisma'
import { roundLabel, roundSortIndex } from '@/lib/tournament-bracket'
import {
  compareGroupStandings,
  computeGroupStandings,
  type StandingFixture,
} from '@/lib/tournament-groups'
import {
  deriveCategoryPhase,
  categoryPhaseLabels,
  setScores,
  teamLabel,
  type CategoryPhase,
  type TeamLite,
} from '@/lib/tournament-public'
import {
  categoryGenderLabels,
  categoryLabel,
  drawTypeLabels,
  skillLevelLabels,
  teamStatusLabels,
  teamStatusStyles,
} from '@/lib/tournaments'
import { ChevronRight, Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const phaseDot: Record<CategoryPhase, string> = {
  upcoming: 'bg-ochre',
  live: 'bg-forest',
  finished: 'bg-muted-foreground',
}

async function getCategory(
  clubSlug: string,
  tournamentId: string,
  categoryId: string,
) {
  const club = await prisma.club.findUnique({
    where: { slug: clubSlug },
    select: { id: true, name: true, slug: true },
  })
  if (!club) return null

  const category = await prisma.tournamentCategory.findFirst({
    where: {
      id: categoryId,
      tournamentId,
      clubId: club.id,
      // El torneo padre no puede ser borrador.
      tournament: { status: { not: 'draft' } },
    },
    include: {
      tournament: { select: { id: true, name: true, status: true } },
      teams: {
        orderBy: [{ seed: 'asc' }, { createdAt: 'asc' }],
        include: {
          members: { select: { player: { select: { fullName: true } } } },
        },
      },
    },
  })
  if (!category) return null

  const matches = await prisma.match.findMany({
    where: { categoryId: category.id },
    orderBy: [{ bracketSlot: 'asc' }, { groupNumber: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      status: true,
      winnerSide: true,
      groupNumber: true,
      bracketRound: true,
      bracketSlot: true,
      scheduledAt: true,
      timeTbd: true,
      court: { select: { name: true } },
      sides: { orderBy: { side: 'asc' }, select: { side: true, teamId: true } },
      sets: {
        orderBy: { setNumber: 'asc' },
        select: {
          setNumber: true,
          gamesA: true,
          gamesB: true,
          tiebreakA: true,
          tiebreakB: true,
        },
      },
    },
  })

  return { club, category, matches }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string; slug: string; catSlug: string }>
}): Promise<Metadata> {
  const { clubSlug, slug, catSlug } = await params
  const data = await getCategory(clubSlug, slug, catSlug)
  if (!data) return { title: 'Categoría no encontrada' }
  const { category } = data
  const title = `${category.name} · ${category.tournament.name}`
  const description = `Cuadro, grupos, parejas inscritas y resultados de ${category.name} (${categoryLabel(
    category.gender,
    category.skillLevel,
  )}) en ${category.tournament.name}.`
  const canonical = `/clubs/${clubSlug}/t/${slug}/${catSlug}`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title, description },
  }
}

export default async function TorneoCategoriaPage({
  params,
}: {
  params: Promise<{ clubSlug: string; slug: string; catSlug: string }>
}) {
  const { clubSlug, slug, catSlug } = await params
  const data = await getCategory(clubSlug, slug, catSlug)
  if (!data) notFound()
  const { club, category, matches } = data

  // Lookup de pareja por id (para etiquetas y avatares).
  const teamById = new Map<string, TeamLite & { seed: number | null }>()
  for (const t of category.teams) {
    teamById.set(t.id, { name: t.name, members: t.members, seed: t.seed })
  }
  const labelFor = (id: string | null): string =>
    id ? teamLabel(teamById.get(id) ?? null) : 'Por definir'

  const phase = deriveCategoryPhase(matches)
  const matchHref = (id: string) =>
    `/clubs/${club.slug}/t/${slug}/partidos/${id}`

  const groupMatches = matches.filter((m) => m.groupNumber != null)
  const bracketMatches = matches.filter((m) => m.bracketRound != null)

  /* --------------------------- Tablas de grupo --------------------------- */
  const groupNumbers = [
    ...new Set(groupMatches.map((m) => m.groupNumber as number)),
  ].sort((a, b) => a - b)

  const groups = groupNumbers.map((groupNumber) => {
    const gm = groupMatches.filter((m) => m.groupNumber === groupNumber)
    // Parejas del grupo (por su groupNumber persistido).
    const teamIds = [
      ...new Set(
        [
          ...category.teams.filter((t) => t.groupNumber === groupNumber).map((t) => t.id),
          // Respaldo: parejas que aparezcan en los partidos del grupo.
          ...gm.flatMap((m) => m.sides.map((s) => s.teamId).filter((x): x is string => !!x)),
        ],
      ),
    ]
    // Índice numérico por pareja para `computeGroupStandings`.
    const indexOf = new Map(teamIds.map((id, i) => [id, i]))
    const fixtures: StandingFixture[] = gm.map((m) => {
      const a = m.sides.find((s) => s.side === 'A')?.teamId ?? null
      const b = m.sides.find((s) => s.side === 'B')?.teamId ?? null
      return {
        aPos: a != null ? (indexOf.get(a) ?? -1) : -1,
        bPos: b != null ? (indexOf.get(b) ?? -1) : -1,
        status: m.status,
        winner: m.winnerSide,
        sets: m.sets.map((s) => ({ gamesA: s.gamesA, gamesB: s.gamesB })),
      }
    })
    const standings = computeGroupStandings(
      teamIds.map((_, i) => i),
      fixtures,
    )
      .sort(compareGroupStandings)
      .map((row) => ({ ...row, teamId: teamIds[row.pos] }))

    const advance = category.advancePerGroup ?? 0
    return { groupNumber, standings, matches: gm, advance }
  })

  /* ------------------------------- Cuadro -------------------------------- */
  const rounds = [...new Set(bracketMatches.map((m) => m.bracketRound as string))]
    .sort((a, b) => roundSortIndex(a) - roundSortIndex(b))
    .map((round) => ({
      round,
      matches: bracketMatches
        .filter((m) => m.bracketRound === round)
        .sort((a, b) => (a.bracketSlot ?? 0) - (b.bracketSlot ?? 0)),
    }))

  const confirmedTeams = category.teams.filter((t) => t.status !== 'withdrawn')

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Clubes', href: '/clubs' },
          { label: club.name, href: `/clubs/${club.slug}` },
          { label: 'Torneos', href: `/clubs/${club.slug}/torneos` },
          { label: category.tournament.name, href: `/clubs/${club.slug}/t/${slug}` },
          { label: category.name },
        ]}
      />

      {/* Hero de categoría */}
      <section className="border-b border-border bg-cream px-5 py-12 sm:px-6 md:px-12 md:py-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-px w-10 bg-muted-foreground/60" />
            <span className="flex items-center gap-2 text-ink">
              <span className={`size-1.5 rounded-full ${phaseDot[phase]}`} />
              {categoryPhaseLabels[phase]}
            </span>
            <span className="text-ink/25">·</span>
            <span>{drawTypeLabels[category.drawType] ?? category.drawType}</span>
          </div>

          <h1 className="mt-6 font-heading text-5xl leading-[0.95] tracking-tight text-ink [overflow-wrap:anywhere] sm:text-6xl md:text-7xl">
            {category.name}
          </h1>
          <p className="mt-4 font-serif text-lg italic text-ink/80">
            {categoryLabel(category.gender, category.skillLevel)}
          </p>

          <dl className="mt-9 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-7 md:grid-cols-4">
            <Stat label="Parejas" value={`${confirmedTeams.length}${category.maxTeams ? `/${category.maxTeams}` : ''}`} />
            <Stat label="Sets" value={`Al mejor de ${category.bestOfSets}`} />
            <Stat label="Punto de oro" value={category.goldenPoint ? 'Sí' : 'No'} />
            <Stat
              label="Premio"
              value={
                category.prize ??
                (category.entryFee != null
                  ? formatMoney(Number(category.entryFee), category.currency)
                  : '—')
              }
            />
          </dl>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-16 px-5 py-14 sm:px-6 md:px-12">
        {/* Grupos */}
        {groups.length > 0 && (
          <section>
            <SectionHeading
              caption={`Fase de grupos · ${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}`}
              title={
                <>
                  Los <em className="italic">grupos.</em>
                </>
              }
            />
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {groups.map((g) => (
                <div
                  key={g.groupNumber}
                  className="overflow-hidden rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
                    <h3 className="font-heading text-2xl text-ink">Grupo {g.groupNumber}</h3>
                    {g.advance > 0 && (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Avanzan {g.advance}
                      </span>
                    )}
                  </div>

                  {/* Tabla de posiciones */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        <th className="px-4 py-2 text-left font-normal sm:px-5">#</th>
                        <th className="px-2 py-2 text-left font-normal">Pareja</th>
                        <th className="px-2 py-2 text-center font-normal">PJ</th>
                        <th className="px-2 py-2 text-center font-normal">G</th>
                        <th className="px-2 py-2 text-center font-normal">Sets</th>
                        <th className="px-5 py-2 text-center font-normal">Jue.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {g.standings.map((row, i) => {
                        const qualifies = g.advance > 0 && i < g.advance
                        return (
                          <tr key={row.teamId} className={qualifies ? 'bg-forest/[0.04]' : ''}>
                            <td className="px-4 py-2.5 sm:px-5">
                              <span
                                className={`inline-flex size-5 items-center justify-center rounded-full font-mono text-[11px] ${
                                  qualifies ? 'bg-forest text-cream' : 'text-muted-foreground'
                                }`}
                              >
                                {i + 1}
                              </span>
                            </td>
                            <td className="max-w-0 truncate px-2 py-2.5 text-ink">
                              {labelFor(row.teamId)}
                            </td>
                            <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">
                              {row.played}
                            </td>
                            <td className="px-2 py-2.5 text-center font-medium tabular-nums text-ink">
                              {row.wins}
                            </td>
                            <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">
                              {row.setsFor}–{row.setsAgainst}
                            </td>
                            <td className="px-5 py-2.5 text-center tabular-nums text-muted-foreground">
                              {row.gamesFor}–{row.gamesAgainst}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* Enfrentamientos del grupo */}
                  <ul className="divide-y divide-border border-t border-border">
                    {g.matches.map((m) => {
                      const a = m.sides.find((s) => s.side === 'A')?.teamId ?? null
                      const b = m.sides.find((s) => s.side === 'B')?.teamId ?? null
                      return (
                        <li key={m.id}>
                          <Link
                            href={matchHref(m.id)}
                            className="group flex items-center gap-3 px-5 py-2.5 text-sm transition-colors hover:bg-muted/30"
                          >
                            <span className="min-w-0 flex-1">
                              <MiniTeam label={labelFor(a)} score={scoreString(m.sets, 'A')} won={m.winnerSide === 'A'} />
                              <MiniTeam label={labelFor(b)} score={scoreString(m.sets, 'B')} won={m.winnerSide === 'B'} />
                            </span>
                            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cuadro eliminatorio */}
        {rounds.length > 0 && (
          <section>
            <SectionHeading
              caption={`Fase final · ${bracketMatches.length} partidos`}
              title={
                <>
                  El <em className="italic">cuadro.</em>
                </>
              }
            />
            <div className="mt-8 overflow-x-auto pb-4">
              <div className="flex items-stretch gap-6">
                {rounds.map(({ round, matches: rms }) => (
                  <div key={round} className="flex w-[230px] shrink-0 flex-col">
                    <header className="mb-4">
                      <h3 className="font-heading text-2xl italic text-ink">
                        {roundLabel(round)}
                      </h3>
                      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                        {rms.length} {rms.length === 1 ? 'partido' : 'partidos'}
                      </p>
                    </header>
                    <div className="flex flex-1 flex-col justify-around gap-3">
                      {rms.map((m) => {
                        const a = m.sides.find((s) => s.side === 'A')?.teamId ?? null
                        const b = m.sides.find((s) => s.side === 'B')?.teamId ?? null
                        const live = m.status === 'in_progress'
                        return (
                          <Link
                            key={m.id}
                            href={matchHref(m.id)}
                            className={`relative rounded-md border bg-card p-2.5 transition-colors hover:border-terracotta/50 ${
                              live ? 'border-terracotta' : 'border-border'
                            }`}
                          >
                            {live && (
                              <span className="absolute -top-2 right-2 rounded-sm bg-terracotta px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-cream">
                                ● Live
                              </span>
                            )}
                            <MiniTeam label={labelFor(a)} score={scoreString(m.sets, 'A')} won={m.winnerSide === 'A'} />
                            <MiniTeam label={labelFor(b)} score={scoreString(m.sets, 'B')} won={m.winnerSide === 'B'} />
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Parejas inscritas */}
        <section>
          <SectionHeading
            caption={`${confirmedTeams.length} parejas`}
            title={
              <>
                Quién <em className="italic">juega.</em>
              </>
            }
          />
          {confirmedTeams.length === 0 ? (
            <p className="mt-6 rounded-md border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Aún no hay parejas inscritas en esta categoría.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {confirmedTeams.map((t) => {
                const style = teamStatusStyles[t.status] ?? teamStatusStyles.registered
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {t.seed != null && (
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs text-cream">
                          {t.seed}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">
                          {teamLabel({ name: t.name, members: t.members })}
                        </p>
                        <p className={`font-mono text-[10px] uppercase tracking-wider ${style.text}`}>
                          {teamStatusLabels[t.status] ?? t.status}
                          {t.groupNumber != null ? ` · Grupo ${t.groupNumber}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Reglamento */}
        <section>
          <SectionHeading
            caption="Cómo se juega"
            title={
              <>
                El <em className="italic">reglamento.</em>
              </>
            }
          />
          <dl className="mt-6 grid grid-cols-1 gap-x-12 gap-y-3 sm:grid-cols-2">
            <Rule label="Modalidad" value={categoryGenderLabels[category.gender] ?? category.gender} />
            <Rule label="Nivel / fuerza" value={skillLevelLabels[category.skillLevel] ?? category.skillLevel} />
            <Rule label="Formato" value={drawTypeLabels[category.drawType] ?? category.drawType} />
            <Rule label="Sets" value={`Al mejor de ${category.bestOfSets}`} />
            <Rule label="Punto de oro" value={category.goldenPoint ? 'Sí, en deuce' : 'No (ventajas)'} />
            <Rule label="Tie-break" value={`A ${category.tiebreakAt} juegos`} />
            {category.drawType === 'groups_playoff' && category.teamsPerGroup != null && (
              <Rule label="Parejas por grupo" value={String(category.teamsPerGroup)} />
            )}
            {category.drawType === 'groups_playoff' && category.advancePerGroup != null && (
              <Rule label="Avanzan por grupo" value={String(category.advancePerGroup)} />
            )}
            {category.thirdPlaceMatch && <Rule label="Tercer puesto" value="Sí, hay partido" />}
            {category.entryFee != null && (
              <Rule label="Inscripción" value={formatMoney(Number(category.entryFee), category.currency)} />
            )}
          </dl>
          {category.prize && (
            <div className="mt-6 flex items-start gap-3 rounded-md border border-border bg-card p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ochre/15 text-ochre">
                <Trophy className="size-5" strokeWidth={1.5} />
              </span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Premio
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">
                  {category.prize}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Subcomponentes                                                             */
/* -------------------------------------------------------------------------- */

/** Tira de marcador «6-4 3-6» de un lado del partido. */
function scoreString(
  sets: {
    setNumber: number
    gamesA: number
    gamesB: number
    tiebreakA: number | null
    tiebreakB: number | null
  }[],
  side: 'A' | 'B',
): string {
  const scores = setScores(sets)
  if (scores.length === 0) return ''
  return scores
    .map((s) => {
      const own = side === 'A' ? s.a : s.b
      const tb = side === 'A' ? s.tbA : s.tbB
      return tb != null ? `${own}(${tb})` : `${own}`
    })
    .join(' ')
}

function SectionHeading({
  caption,
  title,
}: {
  caption: string
  title: React.ReactNode
}) {
  return (
    <div className="border-b border-border pb-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {caption}
      </p>
      <h2 className="mt-1.5 font-heading text-4xl leading-none text-ink md:text-5xl">
        {title}
      </h2>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dd className="font-heading text-3xl leading-none text-ink">{value}</dd>
      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
    </div>
  )
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2.5">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right text-sm text-ink">{value}</dd>
    </div>
  )
}

function MiniTeam({
  label,
  score,
  won,
}: {
  label: string
  score: string
  won: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className={`size-1.5 shrink-0 rounded-full ${won ? 'bg-terracotta' : 'bg-transparent'}`} />
        <span className={`truncate text-[13px] ${won ? 'font-medium text-ink' : 'text-muted-foreground'}`}>
          {label}
        </span>
      </span>
      {score && (
        <span className={`shrink-0 font-mono text-xs tabular-nums ${won ? 'text-ink' : 'text-muted-foreground'}`}>
          {score}
        </span>
      )}
    </div>
  )
}
