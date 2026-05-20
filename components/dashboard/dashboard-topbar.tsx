'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { currentNavLabel } from './dashboard-nav'

export function DashboardTopbar() {
  const pathname = usePathname()
  const section = currentNavLabel(pathname)

  return (
    <header className="flex h-16 shrink-0 items-center gap-6 border-b border-border bg-background px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Club Marítimo <span className="mx-1 text-foreground/25">/</span>
        <span className="text-foreground">{section}</span>
      </p>

      <div className="relative ml-auto hidden lg:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.5}
        />
        <Input
          type="search"
          placeholder="Buscar torneo, jugador, pista..."
          className="h-9 w-72 rounded-md pl-9 pr-12 text-sm"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <Button variant="outline" className="h-9 rounded-md px-4 text-sm">
        Exportar
      </Button>
      <Button className="h-9 gap-1.5 rounded-md px-4 text-sm">
        <Plus className="size-4" strokeWidth={2} />
        Nuevo torneo
      </Button>
    </header>
  )
}
