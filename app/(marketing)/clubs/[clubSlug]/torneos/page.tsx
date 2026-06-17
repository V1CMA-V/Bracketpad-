import { Breadcrumb } from '@/components/club/breadcrumb'
import {
  TournamentsList,
  type TournamentListItem,
} from '@/components/club/tournaments-list'
import { prisma } from '@/lib/prisma'
import { tournamentStatusLabels } from '@/lib/tournaments'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

// Fechas de calendario (`@db.Date`): se formatean en UTC para no restar un día.
const dateFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

function formatRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${dateFmt.format(start)} — ${dateFmt.format(end)}`
  if (start) return `Desde ${dateFmt.format(start)}`
  if (end) return `Hasta ${dateFmt.format(end)}`
  return 'Fechas por confirmar'
}

/** Estado del filtro a partir del estado del torneo. */
function filterState(status: string): TournamentListItem['state'] {
  switch (status) {
    case 'registration_open':
      return 'abierto'
    case 'in_progress':
      return 'en-juego'
    default:
      return 'finalizado'
  }
}

async function getClubTournaments(clubSlug: string) {
  const club = await prisma.club.findUnique({
    where: { slug: clubSlug },
    select: { id: true, name: true, slug: true },
  })
  if (!club) return null

  const tournaments = await prisma.tournament.findMany({
    // Los borradores no son públicos.
    where: { clubId: club.id, status: { not: 'draft' } },
    orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      location: true,
      categories: { select: { _count: { select: { teams: true } } } },
    },
  })

  return { club, tournaments }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>
}): Promise<Metadata> {
  const { clubSlug } = await params
  const data = await getClubTournaments(clubSlug)
  if (!data) return { title: 'Club no encontrado' }
  const title = `Torneos · ${data.club.name}`
  const description = `Todos los torneos de pádel que organiza ${data.club.name}: inscripción, categorías, cuadros y resultados.`
  const canonical = `/clubs/${clubSlug}/torneos`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title, description },
  }
}

export default async function ClubTorneosPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>
}) {
  const { clubSlug } = await params
  const data = await getClubTournaments(clubSlug)
  if (!data) notFound()
  const { club, tournaments } = data

  const items: TournamentListItem[] = tournaments.map((t) => {
    const teams = t.categories.reduce((n, c) => n + c._count.teams, 0)
    return {
      id: t.id,
      name: t.name,
      status: t.status,
      statusLabel: tournamentStatusLabels[t.status] ?? t.status,
      state: filterState(t.status),
      categoryCount: t.categories.length,
      teamCount: teams,
      dates: formatRange(t.startDate, t.endDate),
      location: t.location,
      href: `/clubs/${club.slug}/t/${t.id}`,
      watermark: t.name.charAt(0).toUpperCase(),
    }
  })

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Clubes', href: '/clubs' },
          { label: club.name, href: `/clubs/${club.slug}` },
          { label: 'Torneos' },
        ]}
      />
      <TournamentsList items={items} clubName={club.name} />
    </div>
  )
}
