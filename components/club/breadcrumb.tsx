import Link from 'next/link'

export type Crumb = { label: string; href?: string }

/**
 * Migas de pan reutilizables para las páginas públicas (club, torneo, categoría,
 * partido). El último elemento se muestra como texto activo; los anteriores
 * enlazan con `href`. Opcionalmente muestra un atajo a los partidos en vivo.
 */
export function Breadcrumb({
  items,
  liveHref,
  liveCount,
}: {
  items: Crumb[]
  liveHref?: string
  liveCount?: number
}) {
  return (
    <div className="border-b border-border bg-cream">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 md:px-12">
        <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap font-mono text-xs uppercase tracking-wider [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <span key={`${item.label}-${i}`} className="flex shrink-0 items-center gap-2">
                {i > 0 && <span className="text-muted-foreground">/</span>}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-ink"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-ink">{item.label}</span>
                )}
              </span>
            )
          })}
        </nav>

        {liveHref && liveCount != null && liveCount > 0 && (
          <Link
            href={liveHref}
            className="flex shrink-0 items-center gap-2 font-mono text-xs uppercase tracking-wider text-terracotta transition-opacity hover:opacity-80"
          >
            <span className="size-1.5 rounded-full bg-terracotta" aria-hidden />
            <span className="underline decoration-1 underline-offset-4">
              {liveCount} {liveCount === 1 ? 'partido en vivo' : 'partidos en vivo'}
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}
