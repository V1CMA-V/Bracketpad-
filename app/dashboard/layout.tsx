import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'

/**
 * Reusable shell for every `/dashboard/*` page: a fixed menu on the left and a
 * scrollable content column on the right. Each page renders its own
 * `<DashboardTopbar>` (sticky) at the top of its content.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
