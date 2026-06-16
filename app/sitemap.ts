import { prisma } from '@/lib/prisma'
import { siteConfig } from '@/lib/site'
import type { MetadataRoute } from 'next'

/**
 * Sitemap dinámico. Combina las rutas estáticas de marketing con el contenido
 * público en base de datos: clubes activos, sus páginas de ligas y cada liga
 * publicada (activa o finalizada). Las páginas de torneo individuales aún usan
 * datos de ejemplo, así que se omiten hasta que estén conectadas a la BD.
 *
 * Si la consulta falla (p. ej. la BD no está disponible durante el build) se
 * devuelven al menos las rutas estáticas para no romper la generación.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: now, changeFrequency: 'daily', priority: 1 },
    {
      url: `${siteConfig.url}/clubs`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/torneos`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/como-funciona`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  try {
    const clubs = await prisma.club.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        updatedAt: true,
        leagues: {
          where: { status: { in: ['active', 'finished'] } },
          select: { id: true, createdAt: true },
        },
      },
    })

    const clubRoutes: MetadataRoute.Sitemap = clubs.flatMap((club) => {
      const base = `${siteConfig.url}/clubs/${club.slug}`
      const entries: MetadataRoute.Sitemap = [
        {
          url: base,
          lastModified: club.updatedAt,
          changeFrequency: 'daily',
          priority: 0.8,
        },
        {
          url: `${base}/ligas`,
          lastModified: club.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.6,
        },
      ]

      for (const league of club.leagues) {
        entries.push({
          url: `${base}/l/${league.id}`,
          lastModified: league.createdAt,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }

      return entries
    })

    return [...staticRoutes, ...clubRoutes]
  } catch {
    return staticRoutes
  }
}
