/**
 * Configuración central del sitio para SEO y metadatos. Cualquier metadata que
 * necesite la URL pública, el nombre de marca o la descripción por defecto debe
 * leer de aquí para mantener todo consistente.
 *
 * La URL base se puede sobreescribir con `NEXT_PUBLIC_SITE_URL` (p. ej. en
 * previews de Vercel); en producción cae a `https://bandeja.es`.
 */
export const siteConfig = {
  name: 'Bandeja',
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'https://bandeja.es',
  locale: 'es_ES',
  description:
    'Bandeja es la plataforma para clubes de pádel: organiza torneos y ligas, programa pistas, gestiona reservas y clases, y publica resultados en vivo.',
  // Eslogan corto para títulos / Open Graph.
  tagline: 'Torneos, ligas y reservas de pádel para tu club',
} as const

/** Construye una URL absoluta a partir de una ruta relativa (`/clubs`). */
export function absoluteUrl(path = '/'): string {
  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`
}
