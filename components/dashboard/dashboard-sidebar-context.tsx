'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react'

type SidebarState = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const SidebarContext = createContext<SidebarState | null>(null)

export function DashboardSidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen((v) => !v), [])

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar(): SidebarState {
  const ctx = useContext(SidebarContext)
  if (!ctx) {
    throw new Error('useSidebar debe usarse dentro de <DashboardSidebarProvider>')
  }
  return ctx
}
