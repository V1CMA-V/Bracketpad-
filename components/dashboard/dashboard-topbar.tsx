'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { currentNavLabel } from './dashboard-nav'
import { useDashboard } from './dashboard-context'

/**
 * Sticky header for dashboard pages: route-aware breadcrumb + global search.
 * Each page renders its own `<DashboardTopbar>` and passes page-specific
 * actions (buttons) as `children`.
 */
export function DashboardTopbar({
  children,
}: {
  children?: React.ReactNode
}) {
  const pathname = usePathname()
  const section = currentNavLabel(pathname)
  const { club } = useDashboard()

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-6 border-b border-border bg-background/95 px-8 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {club?.name ?? 'Mi cuenta'}{' '}
        <span className="mx-1 text-foreground/25">/</span>
        <span className="text-foreground">{section}</span>
      </p>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden lg:block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="search"
            placeholder="Buscar torneo, jugador, pista..."
            className="h-9 w-64 rounded-md pl-9 pr-12 text-sm"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>
        {children}
      </div>
    </header>
  )
}
