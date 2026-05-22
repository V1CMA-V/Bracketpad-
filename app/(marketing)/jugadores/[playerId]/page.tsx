import { Breadcrumb } from '@/components/player/breadcrumb'
import { Hero } from '@/components/player/hero'
import { Numbers } from '@/components/player/numbers'
import { Palmares } from '@/components/player/palmares'
import { Partners } from '@/components/player/partners'
import { PlayingStyle } from '@/components/player/playing-style'
import { RecentMatches } from '@/components/player/recent-matches'

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ playerId: string }>
}) {
  const { playerId } = await params

  return (
    <div className="flex flex-col gap-12 pb-16">
      <Breadcrumb path={playerId} />
      <Hero playerId={playerId} />
      <Numbers />
      <PlayingStyle />
      <RecentMatches />
      <Palmares />
      <Partners />
    </div>
  )
}
