import Link from 'next/link'

export function Breadcrumb({
  path,
  region = 'Comunidad Valenciana',
  player = 'Iván Puig',
  liveNow = false,
}: {
  path: string
  region?: string
  player?: string
  liveNow?: boolean
}) {
  void path
  return (
    <div className="border-b border-border bg-cream">
      <div className="flex items-center justify-between px-6 py-3 font-mono text-xs uppercase tracking-wider text-ink">
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="text-muted-foreground transition-colors hover:text-ink"
          >
            Jugadores
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href="/"
            className="text-muted-foreground transition-colors hover:text-ink"
          >
            {region}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-ink">{player}</span>
        </nav>
        {liveNow ? (
          <Link
            href="#"
            className="flex items-center gap-2 text-terracotta transition-opacity hover:opacity-80"
          >
            <span className="text-[0.7em]">●</span>
            <span className="underline decoration-1 underline-offset-4">
              Jugando ahora
            </span>
          </Link>
        ) : (
          <span className="text-muted-foreground">Ficha pública</span>
        )}
      </div>
    </div>
  )
}
