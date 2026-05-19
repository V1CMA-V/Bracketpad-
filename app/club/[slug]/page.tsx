import { Breadcrumb } from '@/components/club/breadcrumb'
import { Hero } from '@/components/club/hero'
import { InfoClub } from '@/components/club/info-club'
import { Installations } from '@/components/club/installations'
import { NumberClub } from '@/components/club/number-club'
import { Tournaments } from '@/components/club/tournaments'

export default async function ClubPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return (
    <div>

      <Breadcrumb path={slug} />
      <Hero club={slug} />
      <NumberClub />
      <Tournaments />
      <Installations />
      <InfoClub />

    </div>
  )
}
