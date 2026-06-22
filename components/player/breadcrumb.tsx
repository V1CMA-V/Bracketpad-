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
      <div className="flex items-center justify-between gap-3 px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink sm:px-6">
        <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/"
            className="shrink-0 text-muted-foreground transition-colors hover:text-ink"
          >
            Jugadores
          </Link>
          <span className="hidden shrink-0 text-muted-foreground sm:inline">/</span>
          <Link
            href="/"
            className="hidden shrink-0 text-muted-foreground transition-colors hover:text-ink sm:inline"
          >
            {region}
          </Link>
          <span className="shrink-0 text-muted-foreground">/</span>
          <span className="shrink-0 font-semibold text-ink">{player}</span>
        </nav>
        {liveNow ? (
          <Link
            href="#"
            className="flex shrink-0 items-center gap-2 text-terracotta transition-opacity hover:opacity-80"
          >
            <span className="text-[0.7em]">●</span>
            <span className="underline decoration-1 underline-offset-4">
              Jugando ahora
            </span>
          </Link>
        ) : (
          <span className="hidden shrink-0 text-muted-foreground sm:inline">
            Ficha pública
          </span>
        )}
      </div>
    </div>
  )
}
