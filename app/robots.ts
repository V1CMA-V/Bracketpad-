import { siteConfig } from '@/lib/site'
import type { MetadataRoute } from 'next'

/**
 * `/robots.txt` generado por Next. Permite el rastreo de las páginas públicas
 * (marketing, clubes, torneos y ligas) y bloquea las zonas privadas o sin valor
 * para buscadores: panel del club, cuenta, autenticación y la API.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/cuenta', '/login', '/registro', '/api/'],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
