'use client'

import { createContext, useContext } from 'react'

export type DashboardData = {
  user: { name: string; accountType: string }
  club: {
    name: string
    city: string | null
    courtCount: number
    role: string
  } | null
}

const DashboardContext = createContext<DashboardData | null>(null)

export function DashboardProvider({
  value,
  children,
}: {
  value: DashboardData
  children: React.ReactNode
}) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard(): DashboardData {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error('useDashboard debe usarse dentro de <DashboardProvider>')
  }
  return ctx
}

/* ---- Helpers de presentación ---- */

export function initials(name: string, max = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  return parts
    .slice(0, max)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

const clubRoleLabels: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  staff: 'Staff',
  viewer: 'Lector',
}

const accountTypeLabels: Record<string, string> = {
  player: 'Jugador',
  club_staff: 'Gestor de club',
  super_admin: 'Administrador',
}

export function roleLabel(data: DashboardData): string {
  if (data.club) return clubRoleLabels[data.club.role] ?? data.club.role
  return accountTypeLabels[data.user.accountType] ?? 'Cuenta'
}
