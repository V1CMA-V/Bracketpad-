'use client'

import { cn } from '@/lib/utils'
import { ChevronsUpDown, ExternalLink, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { dashboardNav, isNavItemActive } from './dashboard-nav'
import { initials, roleLabel, useDashboard } from './dashboard-context'
import { useSidebar } from './dashboard-sidebar-context'

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, club } = useDashboard()
  const { open, setOpen } = useSidebar()
  const data = { user, club }

  // Cierra el drawer al navegar (solo afecta a móvil).
  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])

  // Mientras el drawer está abierto (solo móvil): bloquea el scroll del fondo
  // y permite cerrarlo con Escape. En `lg` el sidebar es estático y `open`
  // permanece en false, así que este efecto no se activa.
  useEffect(() => {
    if (!open) return
    const { body } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, setOpen])

  const clubSubtitle = club
    ? [club.city, `${club.courtCount} ${club.courtCount === 1 ? 'pista' : 'pistas'}`]
        .filter(Boolean)
        .join(' · ')
    : null

  return (
    <>
      {/* Backdrop (solo móvil, cuando el drawer está abierto) */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col border-r border-cream/10 bg-ink text-cream transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
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
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
          className="ml-2 flex size-8 items-center justify-center rounded-md text-cream/60 transition-colors hover:bg-cream/10 hover:text-cream lg:hidden"
        >
          <X className="size-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Selector de club */}
      <div className="px-4 pb-2">
        {club ? (
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg border border-cream/10 bg-cream/5 p-3 text-left transition-colors hover:bg-cream/10"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-terracotta font-serif text-base text-cream">
              {initials(club.name, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm leading-tight">
                {club.name}
              </span>
              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-cream/45">
                {clubSubtitle}
              </span>
            </span>
            <ChevronsUpDown
              className="size-3.5 shrink-0 text-cream/40"
              strokeWidth={1.5}
            />
          </button>
        ) : null}

        {club && (
          <Link
            href={`/clubs/${club.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 rounded-md border border-cream/10 bg-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-cream/60 transition-colors hover:bg-cream/5 hover:text-cream"
          >
            Ver perfil público
            <ExternalLink className="size-3.5 shrink-0" strokeWidth={1.5} />
          </Link>
        )}

        {!club && (
          <Link
            href="/registro/club"
            className="flex w-full items-center gap-3 rounded-lg border border-dashed border-cream/15 bg-cream/5 p-3 text-left transition-colors hover:bg-cream/10"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-cream/10 text-cream/60">
              <Plus className="size-4" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm leading-tight">
                Crear club
              </span>
              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-cream/45">
                Sin club asignado
              </span>
            </span>
          </Link>
        )}
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
            {initials(user.name, 2)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm leading-tight">
              {user.name}
            </span>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-cream/45">
              {roleLabel(data)}
            </span>
          </span>
        </div>
      </div>
      </aside>
    </>
  )
}
