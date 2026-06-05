import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import {
  DashboardProvider,
  type DashboardData,
} from '@/components/dashboard/dashboard-context'
import { getDashboardData } from '@/lib/club'

/**
 * Reusable shell for every `/dashboard/*` page: a fixed menu on the left and a
 * scrollable content column on the right. Each page renders its own
 * `<DashboardTopbar>` (sticky) at the top of its content.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const data = await getDashboardData()
  const value: DashboardData = data ?? {
    user: { name: 'Cuenta', accountType: 'player' },
    club: null,
  }

  return (
    <DashboardProvider value={value}>
      <div className="flex h-screen overflow-hidden bg-background">
        <DashboardSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </DashboardProvider>
  )
}
