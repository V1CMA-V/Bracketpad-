import { Breadcrumb } from '@/components/club/breadcrumb'
import { Categories } from '@/components/tournament/categories'
import { CategoriesDetails } from '@/components/tournament/categories-details'
import { ClubInfo } from '@/components/tournament/club-info'
import { FAQ } from '@/components/tournament/faq'
import { Hero } from '@/components/tournament/hero'
import { NumbersTournament } from '@/components/tournament/numbers-tournament'
import { OnLive } from '@/components/tournament/on-live'
import { Organizers } from '@/components/tournament/organizers'
import { Results } from '@/components/tournament/results'

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return (
    <div>
      <Breadcrumb path={slug} />
      <Hero tournament={slug} />
      <NumbersTournament />
      <Categories />
      <OnLive />
      <CategoriesDetails />
      <Results />
      <ClubInfo />
      <Organizers />
      <FAQ />

    </div>
  )
}
