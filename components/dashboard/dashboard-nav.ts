import {
  BarChart3,
  Bell,
  CalendarDays,
  LayoutGrid,
  Network,
  Settings,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

/** Shared navigation model — consumed by the sidebar and the topbar breadcrumb. */
export const dashboardNav: NavGroup[] = [
  {
    label: 'Gestión',
    items: [
      { label: 'Resumen', href: '/dashboard', icon: BarChart3 },
      { label: 'Torneos', href: '/dashboard/torneos', icon: Trophy, badge: 4 },
      { label: 'Cuadros', href: '/dashboard/cuadros', icon: Network },
      { label: 'Programación', href: '/dashboard/programacion', icon: CalendarDays },
      { label: 'Jugadores', href: '/dashboard/jugadores', icon: Users, badge: 312 },
      { label: 'Pistas', href: '/dashboard/pistas', icon: LayoutGrid },
    ],
  },
  {
    label: 'Club',
    items: [
      { label: 'Ajustes', href: '/dashboard/ajustes', icon: Settings },
      { label: 'Notificaciones', href: '/dashboard/notificaciones', icon: Bell },
    ],
  },
]

export const dashboardNavItems: NavItem[] = dashboardNav.flatMap((g) => g.items)

/** True when `href` is the active route for `pathname`. */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Label of the deepest nav item matching the current route. */
export function currentNavLabel(pathname: string): string {
  const match = dashboardNavItems
    .filter((item) => isNavItemActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return match?.label ?? 'Resumen'
}
