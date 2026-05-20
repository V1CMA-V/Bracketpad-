'use client'

import { cn } from '@/lib/utils'
import { ChevronsUpDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { dashboardNav, isNavItemActive } from './dashboard-nav'

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-cream/10 bg-ink text-cream">
      {/* Marca */}
      <div className="flex h-16 items-center gap-2 px-6">
        <Link
          href="/dashboard"
          className="flex items-baseline gap-2 font-serif text-2xl leading-none tracking-tight"
        >
          <span className="flex items-baseline">
            bandeja
            <span className="ml-0.5 inline-block size-1.5 -translate-y-[2px] rounded-full bg-terracotta" />
          </span>
        </Link>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-cream/40">
          V.2026
        </span>
      </div>

      {/* Selector de club */}
      <div className="px-4 pb-2">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border border-cream/10 bg-cream/5 p-3 text-left transition-colors hover:bg-cream/10"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-terracotta font-serif text-base text-cream">
            M
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm leading-tight">
              Club Marítimo del Olivar
            </span>
            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-cream/45">
              Valencia · 8 pistas
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-cream/40" strokeWidth={1.5} />
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        {dashboardNav.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-widest text-cream/35">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isNavItemActive(pathname, item.href)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-cream/10 text-cream'
                          : 'text-cream/55 hover:bg-cream/5 hover:text-cream',
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-4 shrink-0 transition-colors',
                          active
                            ? 'text-lime'
                            : 'text-cream/40 group-hover:text-cream/70',
                        )}
                        strokeWidth={1.5}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge != null && (
                        <span className="rounded bg-cream/10 px-1.5 py-0.5 font-mono text-[10px] text-cream/55">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Usuario */}
      <div className="border-t border-cream/10 p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest font-mono text-[11px] text-cream">
            CR
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm leading-tight">Carla Ruiz</span>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-cream/45">
              Administradora
            </span>
          </span>
        </div>
      </div>
    </aside>
  )
}
