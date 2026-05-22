import Link from 'next/link'

export function Breadcrumb({
  path,
  region = 'Comunidad Valenciana',
  club = 'Club Marítimo del Olivar',
  liveMatches = 3,
}: {
  path: string
  region?: string
  club?: string
  liveMatches?: number
}) {
  void path
  return (
    <div className="bg-cream border-b border-border">
      <div className="flex items-center justify-between px-6 py-3 font-mono text-xs uppercase tracking-wider text-ink">
        <nav className="flex items-center gap-2">
          <Link href="/clubs" className="text-muted-foreground hover:text-ink transition-colors">
            Clubes
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href="/clubs"
            className="text-muted-foreground hover:text-ink transition-colors"
          >
            {region}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-ink">{club}</span>
        </nav>
        <Link
          href="#live"
          className="flex items-center gap-2 text-terracotta hover:opacity-80 transition-opacity"
        >
          <span aria-hidden>*</span>
          <span className="underline underline-offset-4 decoration-1">
            {liveMatches} Partidos en vivo
          </span>
        </Link>
      </div>
    </div>
  )
}
