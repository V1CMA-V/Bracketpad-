import { Directory } from '@/components/tournaments/directory'
import { Hero, type FeaturedTournament, type HeroStat } from '@/components/tournaments/hero'
import { type PublicTournamentItem } from '@/components/tournaments/public-tournament-card'
import { prisma } from '@/lib/prisma'
import { tournamentStatusLabels } from '@/lib/tournaments'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Torneos',
  description:
    'Explora todos los torneos de pádel de la comunidad: plazas abiertas, categorías, cuadros y resultados.',
  alternates: { canonical: '/torneos' },
}

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
function filterState(status: string): PublicTournamentItem['state'] {
  switch (status) {
    case 'registration_open':
      return 'abierto'
    case 'in_progress':
      return 'en-juego'
    default:
      return 'finalizado'
  }
}

async function getTournaments() {
  const tournaments = await prisma.tournament.findMany({
    // Públicos: no borradores y de clubes activos.
    where: { status: { not: 'draft' }, club: { isActive: true } },
    orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      location: true,
      club: { select: { name: true, slug: true, city: true } },
      categories: { select: { _count: { select: { teams: true } } } },
    },
  })

  const items: PublicTournamentItem[] = tournaments.map((t) => {
    const teamCount = t.categories.reduce((n, c) => n + c._count.teams, 0)
    return {
      id: t.id,
      name: t.name,
      status: t.status,
      statusLabel: tournamentStatusLabels[t.status] ?? t.status,
      state: filterState(t.status),
      categoryCount: t.categories.length,
      teamCount,
      dates: formatRange(t.startDate, t.endDate),
      // En el directorio global preferimos mostrar la ciudad del club.
      location: t.location ?? t.club.city,
      href: `/clubs/${t.club.slug}/t/${t.id}`,
      watermark: t.name.charAt(0).toUpperCase(),
      clubName: t.club.name,
      clubSlug: t.club.slug,
    }
  })

  // Cifras del hero.
  const liveCount = items.filter((t) => t.state === 'en-juego').length
  const openCount = items.filter((t) => t.state === 'abierto').length
  const clubCount = new Set(tournaments.map((t) => t.club.slug)).size

  const stats: HeroStat[] = [
    { label: 'Torneos en cartelera', value: String(items.length) },
    { label: 'Inscripción abierta', value: String(openCount) },
    { label: 'En juego ahora', value: String(liveCount) },
    { label: 'Clubes', value: String(clubCount) },
  ]

  // Destacado: el primero en juego; si no, uno con inscripción/por jugar; si no,
  // el primero de la lista (ya viene ordenada por fecha).
  const featuredItem =
    items.find((t) => t.state === 'en-juego') ??
    items.find((t) => t.state !== 'finalizado') ??
    items[0] ??
    null

  const featured: FeaturedTournament | null = featuredItem
    ? {
        name: featuredItem.name,
        clubName: featuredItem.clubName ?? '',
        href: featuredItem.href,
        dates: featuredItem.dates,
        teamCount: featuredItem.teamCount,
        categoryCount: featuredItem.categoryCount,
        statusLabel: featuredItem.statusLabel,
        live: featuredItem.state === 'en-juego',
      }
    : null

  return { items, stats, featured }
}

export default async function TorneosPage() {
  const { items, stats, featured } = await getTournaments()

  return (
    <div className="flex flex-col">
      <Hero stats={stats} featured={featured} />
      <Directory items={items} />
    </div>
  )
}
