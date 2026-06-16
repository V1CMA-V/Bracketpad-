import { siteConfig } from '@/lib/site'
import type { MetadataRoute } from 'next'

/**
 * Web App Manifest (`/manifest.webmanifest`). Mejora la instalabilidad como PWA
 * y aporta señales de marca a los buscadores y al navegador.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} · ${siteConfig.tagline}`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#fdfcf9',
    theme_color: '#fdfcf9',
    lang: 'es',
    categories: ['sports', 'productivity'],
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
