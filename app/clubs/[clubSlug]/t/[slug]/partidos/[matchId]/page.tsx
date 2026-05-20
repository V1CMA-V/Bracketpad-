import { Breadcrumb } from '@/components/club/breadcrumb'
import { MatchHero } from '@/components/match/match-hero'
import { MatchLineups } from '@/components/match/match-lineups'
import { MatchStats } from '@/components/match/match-stats'
import { MatchTimeline } from '@/components/match/match-timeline'
import { SetBreakdown } from '@/components/match/set-breakdown'

export default async function MatchPage({
  params,
}: {
  params: Promise<{ clubSlug: string; slug: string; matchId: string }>
}) {
  const { matchId } = await params

  return (
    <div className="flex flex-col gap-12 pb-16">
      <Breadcrumb path={matchId} />
      <MatchHero />
      <SetBreakdown />
      <MatchStats />
      <MatchTimeline />
      <MatchLineups />
    </div>
  )
}
