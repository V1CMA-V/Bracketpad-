import { Breadcrumb } from '@/components/club/breadcrumb'
import { prisma } from '@/lib/prisma'
import { roundLabel } from '@/lib/tournament-bracket'
import {
  setScores,
  teamInitials,
  teamLabel,
  type TeamLite,
} from '@/lib/tournament-public'
import { categoryLabel } from '@/lib/tournaments'
import { Clock, MapPin, Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

const dateTimeFmt = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})
const dateFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const matchStatusLabels: Record<string, string> = {
  scheduled: 'Programado',
  in_progress: 'En juego',
  suspended: 'Suspendido',
  finished: 'Finalizado',
  walkover: 'W.O.',
  cancelled: 'Cancelado',
}

const handLabels: Record<string, string> = { left: 'Zurdo/a', right: 'Diestro/a' }
const skillLabels: Record<string, string> = {
  unranked: 'Open',
  first: '1ra fuerza',
  second: '2da fuerza',
  third: '3ra fuerza',
  fourth: '4ta fuerza',
  fifth: '5ta fuerza',
  sixth: '6ta fuerza',
}

async function getMatch(
  clubSlug: string,
  tournamentId: string,
  matchId: string,
) {
  const club = await prisma.club.findUnique({
    where: { slug: clubSlug },
    select: { id: true, name: true, slug: true },
  })
  if (!club) return null

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      clubId: club.id,
      category: { tournamentId, tournament: { status: { not: 'draft' } } },
    },
    select: {
      id: true,
      status: true,
      winnerSide: true,
      scheduledAt: true,
      timeTbd: true,
      bracketRound: true,
      groupNumber: true,
      court: { select: { name: true } },
      category: {
        select: {
          id: true,
          name: true,
          gender: true,
          skillLevel: true,
          bestOfSets: true,
          goldenPoint: true,
          tiebreakAt: true,
          tournament: { select: { id: true, name: true } },
        },
      },
      sides: {
        orderBy: { side: 'asc' },
        select: {
          side: true,
          team: {
            select: {
              name: true,
              seed: true,
              members: {
                select: {
                  player: {
                    select: { fullName: true, dominantHand: true, skillLevel: true },
                  },
                },
              },
            },
          },
        },
      },
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
  if (!match) return null

  return { club, match }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string; slug: string; matchId: string }>
}): Promise<Metadata> {
  const { clubSlug, slug, matchId } = await params
  const data = await getMatch(clubSlug, slug, matchId)
  if (!data) return { title: 'Partido no encontrado' }
  const { match } = data
  if (!match.category) return { title: 'Partido no encontrado' }
  const a = teamLabel(match.sides.find((s) => s.side === 'A')?.team ?? null)
  const b = teamLabel(match.sides.find((s) => s.side === 'B')?.team ?? null)
  const title = `${a} vs ${b} · ${match.category.name}`
  const description = `${match.category.name} · ${match.category.tournament.name}. Marcador set a set y alineaciones.`
  const canonical = `/clubs/${clubSlug}/t/${slug}/partidos/${matchId}`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title, description },
  }
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ clubSlug: string; slug: string; matchId: string }>
}) {
  const { clubSlug, slug, matchId } = await params
  const data = await getMatch(clubSlug, slug, matchId)
  if (!data) notFound()
  const { club, match } = data
  if (!match.category) notFound()
  const cat = match.category

  const teamA = match.sides.find((s) => s.side === 'A')?.team ?? null
  const teamB = match.sides.find((s) => s.side === 'B')?.team ?? null
  const scores = setScores(match.sets)
  const live = match.status === 'in_progress'

  const context =
    match.bracketRound != null
      ? roundLabel(match.bracketRound)
      : match.groupNumber != null
        ? `Grupo ${match.groupNumber}`
        : 'Partido'

  const when = match.scheduledAt
    ? match.timeTbd
      ? `${dateFmt.format(match.scheduledAt)} · hora por confirmar`
      : dateTimeFmt.format(match.scheduledAt)
    : 'Horario por confirmar'

  // Sets ganados por cada lado (para el marcador de cabecera).
  const setsWonA = scores.filter((s) => s.a > s.b).length
  const setsWonB = scores.filter((s) => s.b > s.a).length

  const meta = [
    { icon: Trophy, label: `${context} · ${cat.name}` },
    ...(match.court ? [{ icon: MapPin, label: match.court.name }] : []),
    { icon: Clock, label: when },
  ]

  return (
    <div className="flex flex-col gap-14 pb-16">
      <Breadcrumb
        items={[
          { label: 'Clubes', href: '/clubs' },
          { label: club.name, href: `/clubs/${club.slug}` },
          { label: cat.tournament.name, href: `/clubs/${club.slug}/t/${slug}` },
          { label: cat.name, href: `/clubs/${club.slug}/t/${slug}/${cat.id}` },
          { label: context },
        ]}
      />

      {/* Marcador */}
      <section className="mx-auto w-full max-w-[1100px] px-6 md:px-8">
        <div className="rounded-2xl bg-ink p-7 text-cream md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-widest text-cream/55">
              {categoryLabel(cat.gender, cat.skillLevel)}
            </p>
            <span
              className={`flex items-center gap-2 rounded-sm px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest ${
                live ? 'bg-terracotta text-cream' : 'bg-cream/10 text-cream/80'
              }`}
            >
              {live && <span className="size-1.5 rounded-full bg-cream" />}
              {matchStatusLabels[match.status] ?? match.status}
            </span>
          </div>

          <div className="mt-5 divide-y divide-cream/10 border-y border-cream/10">
            <TeamScoreRow
              team={teamA}
              scores={scores}
              side="A"
              setsWon={setsWonA}
              winner={match.winnerSide === 'A'}
            />
            <TeamScoreRow
              team={teamB}
              scores={scores}
              side="B"
              setsWon={setsWonB}
              winner={match.winnerSide === 'B'}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 border-t border-cream/10 pt-6 sm:grid-cols-3">
            {meta.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 font-mono text-xs text-cream/65">
                <Icon className="size-4 shrink-0 text-cream/35" strokeWidth={1.5} />
                <span className="capitalize">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Set a set */}
      <section className="mx-auto w-full max-w-[1100px] px-6 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Marcador · Set a set
            </p>
            <h2 className="mt-2 font-heading text-4xl leading-none tracking-tight text-ink md:text-5xl">
              Cómo cae cada <em className="italic">set.</em>
            </h2>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {setsWonA} — {setsWonB} · al mejor de {cat.bestOfSets}
          </p>
        </div>

        {scores.length === 0 ? (
          <p className="mt-8 rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Todavía no hay marcador para este partido.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {scores.map((s, i) => {
              const winA = s.a > s.b
              const winB = s.b > s.a
              return (
                <article key={i} className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    <span>Set {i + 1}</span>
                    <span>{winA || winB ? 'Finalizado' : 'En disputa'}</span>
                  </div>
                  <p className="mt-3 font-heading text-5xl leading-none text-ink tabular-nums">
                    {s.a} — {s.b}
                  </p>
                  {(s.tbA != null || s.tbB != null) && (
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      Tie-break {s.tbA ?? 0}–{s.tbB ?? 0}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {winA
                      ? `Set para ${teamLabel(teamA)}`
                      : winB
                        ? `Set para ${teamLabel(teamB)}`
                        : 'En disputa'}
                  </p>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Alineaciones */}
      <section className="mx-auto w-full max-w-[1100px] px-6 md:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Jugadores · En pista
          </p>
          <h2 className="mt-2 font-heading text-4xl leading-none tracking-tight text-ink md:text-5xl">
            Las cuatro <em className="italic">palas.</em>
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Lineup team={teamA} tone="a" winner={match.winnerSide === 'A'} />
          <Lineup team={teamB} tone="b" winner={match.winnerSide === 'B'} />
        </div>
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Subcomponentes                                                             */
/* -------------------------------------------------------------------------- */

type SetScoreLite = { a: number; b: number; tbA: number | null; tbB: number | null }

function TeamScoreRow({
  team,
  scores,
  side,
  setsWon,
  winner,
}: {
  team: TeamLite | null
  scores: SetScoreLite[]
  side: 'A' | 'B'
  setsWon: number
  winner: boolean
}) {
  const initials = teamInitials(team)
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <div className="flex shrink-0">
          <span className="flex size-10 items-center justify-center rounded-full bg-terracotta font-mono text-sm text-cream ring-2 ring-ink">
            {initials[0]}
          </span>
          <span className="-ml-3 flex size-10 items-center justify-center rounded-full bg-forest font-mono text-sm text-cream ring-2 ring-ink">
            {initials[1]}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-heading text-2xl text-cream md:text-3xl">
              {teamLabel(team)}
            </h2>
            {winner && (
              <Trophy className="size-4 shrink-0 text-lime" strokeWidth={1.75} aria-label="Ganador" />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {scores.map((s, i) => {
          const own = side === 'A' ? s.a : s.b
          const rival = side === 'A' ? s.b : s.a
          const tb = side === 'A' ? s.tbA : s.tbB
          const won = own > rival
          return (
            <span
              key={i}
              className={`flex size-10 items-center justify-center rounded-md font-mono text-lg tabular-nums ${
                won ? 'bg-lime/15 text-lime' : 'text-cream/45'
              }`}
            >
              {own}
              {tb != null && <sup className="ml-0.5 text-[9px]">{tb}</sup>}
            </span>
          )
        })}
        <span className="ml-1.5 flex size-10 items-center justify-center rounded-md bg-cream/10 font-mono text-lg text-cream tabular-nums">
          {setsWon}
        </span>
      </div>
    </div>
  )
}

function Lineup({
  team,
  tone,
  winner,
}: {
  team:
    | {
        name: string | null
        seed: number | null
        members: {
          player: { fullName: string; dominantHand: string | null; skillLevel: string }
        }[]
      }
    | null
  tone: 'a' | 'b'
  winner: boolean
}) {
  const accent = tone === 'a' ? 'bg-forest' : 'bg-terracotta'
  const dot = tone === 'a' ? 'bg-forest' : 'bg-terracotta'
  const members = team?.members ?? []

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span className={`size-3 rounded-sm ${dot}`} />
        <h3 className="font-heading text-2xl text-ink">{teamLabel(team)}</h3>
        {team?.seed != null && (
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Seed {team.seed}
          </span>
        )}
        {winner && (
          <span className="font-mono text-[11px] uppercase tracking-widest text-forest">
            Ganador
          </span>
        )}
      </div>

      {members.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
          Pareja por definir.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {members.map((m) => {
            const initial = (m.player.fullName.trim()[0] ?? '?').toUpperCase()
            return (
              <div
                key={m.player.fullName}
                className="flex flex-col rounded-lg border border-border bg-card p-5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-10 items-center justify-center rounded-full font-mono text-sm text-cream ${accent}`}
                  >
                    {initial}
                  </span>
                  <h4 className="font-heading text-lg leading-tight text-ink">
                    {m.player.fullName}
                  </h4>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 font-mono text-xs">
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Mano
                    </dt>
                    <dd className="mt-0.5 text-ink">
                      {m.player.dominantHand ? handLabels[m.player.dominantHand] : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Nivel
                    </dt>
                    <dd className="mt-0.5 text-ink">
                      {skillLabels[m.player.skillLevel] ?? m.player.skillLevel}
                    </dd>
                  </div>
                </dl>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
