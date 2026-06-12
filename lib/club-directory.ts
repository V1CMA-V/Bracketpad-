import type { Club } from '@/components/clubs/club-card'
import { compact } from '@/lib/format'
import { prisma } from '@/lib/prisma'

/**
 * Carga el directorio público de clubes para la página `/clubs`, mapeando cada
 * registro al shape que consume `ClubCard` y derivando la etiqueta visual:
 *
 * - `destacado`: tiene torneos en juego (status `in_progress`).
 * - `nuevo`: fundado el año pasado o este, o dado de alta hace poco.
 * - `afiliado`: el resto.
 */
export async function getDirectoryClubs(): Promise<{
  clubs: Club[]
  regions: string[]
}> {
  const rows = await prisma.club.findMany({
    where: { isActive: true },
    orderBy: [{ tournaments: { _count: 'desc' } }, { name: 'asc' }],
    select: {
      name: true,
      slug: true,
      city: true,
      state: true,
      country: true,
      foundedYear: true,
      description: true,
      createdAt: true,
      _count: { select: { courts: true, players: true, leagues: true } },
      tournaments: { select: { status: true } },
    },
  })

  const currentYear = new Date().getFullYear()
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const clubs: Club[] = rows.map((c) => {
    const liveTournaments = c.tournaments.filter(
      (t) => t.status === 'in_progress',
    ).length
    const totalTournaments = c.tournaments.length

    const isNew =
      (c.foundedYear !== null && c.foundedYear >= currentYear - 1) ||
      c.createdAt >= ninetyDaysAgo

    const tag = liveTournaments > 0 ? 'destacado' : isNew ? 'nuevo' : 'afiliado'

    const region = c.state ?? c.city ?? c.country ?? 'Comunidad'

    return {
      slug: c.slug,
      initial: c.name.trim().charAt(0).toUpperCase() || '·',
      tag,
      name: c.name,
      tagline: c.description?.trim() || `${c._count.courts} pistas de pádel`,
      region,
      city: c.city ?? region,
      founded: c.foundedYear ?? c.createdAt.getFullYear(),
      courts: String(c._count.courts),
      members: compact(c._count.players),
      tournaments: String(totalTournaments),
      leagues: String(c._count.leagues),
      liveTournaments: liveTournaments || undefined,
    }
  })

  const regions = [
    'Todas',
    ...Array.from(new Set(clubs.map((c) => c.region))).sort((a, b) =>
      a.localeCompare(b, 'es'),
    ),
  ]

  return { clubs, regions }
}
