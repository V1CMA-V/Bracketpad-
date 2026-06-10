import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import {
  LeagueSettingsForm,
  type LeagueSettingsValues,
} from '@/components/dashboard/league-settings'
import { DeleteLeagueSection } from '@/components/dashboard/delete-league'
import { Button } from '@/components/ui/button'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'
import { leagueStatusLabels } from '@/lib/leagues'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

/** Date (@db.Date, medianoche UTC) → "YYYY-MM-DD" para <input type="date">. */
function toDateInput(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : ''
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
  return { title: `Editar ${league?.name ?? 'liga'} · Bandeja` }
}

export default async function LigaEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const club = await getManagedClub()
  if (!club) notFound()

  const league = await prisma.league.findFirst({
    where: { id, clubId: club.id },
    include: { scoringConfig: true },
  })
  if (!league) notFound()

  const cfg = league.scoringConfig
  const values: LeagueSettingsValues = {
    name: league.name,
    status: league.status,
    format: league.format,
    playKind: league.playKind,
    startDate: toDateInput(league.startDate),
    endDate: toDateInput(league.endDate),
    prizes: league.prizes ?? '',
    entryFee: league.entryFee != null ? league.entryFee.toString() : '',
    currency: league.currency,
    bestOfSets: cfg?.bestOfSets ?? 3,
    goldenPoint: cfg?.goldenPoint ?? true,
    tiebreakAt: cfg?.tiebreakAt ?? 6,
    rankingBy: cfg?.rankingBy ?? 'sets',
    noShowGamesAgainst: cfg?.noShowGamesAgainst ?? 9,
    totalRounds: league.totalRounds,
    playWeekdays: league.playWeekdays,
    playTimes: league.playTimes,
  }

  return (
    <>
      <DashboardTopbar>
        <Button
          asChild
          variant="outline"
          className="h-9 gap-1.5 rounded-md px-4 text-sm"
        >
          <Link href={`/dashboard/ligas/${league.id}`}>
            <ArrowLeft className="size-4" strokeWidth={2} />
            Volver a la liga
          </Link>
        </Button>
      </DashboardTopbar>

      <div className="mx-auto max-w-2xl px-8 py-10">
        <header className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Ajustes · {leagueStatusLabels[league.status] ?? league.status}
          </p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight text-foreground">
            Editar liga
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {league.name}
          </p>
        </header>

        <LeagueSettingsForm leagueId={league.id} values={values} />

        <div className="mt-10 border-t border-border pt-8">
          <DeleteLeagueSection
            leagueId={league.id}
            leagueName={league.name}
            isDraft={league.status === 'draft'}
          />
        </div>
      </div>
    </>
  )
}
