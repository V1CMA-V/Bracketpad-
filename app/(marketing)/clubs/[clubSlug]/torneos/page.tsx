import { Breadcrumb } from '@/components/club/breadcrumb'
import { TournamentsList } from '@/components/club/tournaments-list'

export default async function ClubTorneosPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>
}) {
  const { clubSlug } = await params

  return (
    <div>
      <Breadcrumb path={clubSlug} />
      <TournamentsList clubSlug={clubSlug} />
    </div>
  )
}
