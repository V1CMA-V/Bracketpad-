import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import {
  TournamentsTable,
  type TournamentRow,
} from '@/components/dashboard/tournaments-table'
import { Button } from '@/components/ui/button'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Torneos · Bandeja',
}

// Fechas de calendario `@db.Date` se guardan como medianoche UTC: se formatean
// en UTC para no mostrarse un día antes en zonas con desfase negativo.
const dayFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
})

function formatRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${dayFmt.format(start)} — ${dayFmt.format(end)}`
  if (start) return dayFmt.format(start)
  if (end) return `Hasta ${dayFmt.format(end)}`
  return 'Sin fechas'
}

export default async function TorneosPage() {
  const club = await getManagedClub()
  if (!club) notFound()

  const tournaments = await prisma.tournament.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { categories: true } },
      categories: { select: { _count: { select: { teams: true } } } },
    },
  })

  const rows: TournamentRow[] = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status,
    dateLabel: formatRange(t.startDate, t.endDate),
    startMs: t.startDate ? t.startDate.getTime() : null,
    categoryCount: t._count.categories,
    teamCount: t.categories.reduce((sum, c) => sum + c._count.teams, 0),
  }))

  const activos = rows.filter((t) => t.status === 'in_progress').length
  const inscripcion = rows.filter(
    (t) => t.status === 'registration_open',
  ).length
  const borradores = rows.filter((t) => t.status === 'draft').length

  const stats = [
    { label: 'En juego', value: activos },
    { label: 'Inscripción', value: inscripcion },
    { label: 'Borradores', value: borradores },
    { label: 'Total', value: rows.length },
  ]

  return (
    <>
      <DashboardTopbar>
        <Button asChild className="h-9 gap-1.5 rounded-md px-4 text-sm">
          <Link href="/dashboard/nuevo-evento">
            <Plus className="size-4" strokeWidth={2} />
            Nuevo evento
          </Link>
        </Button>
      </DashboardTopbar>

      <div className="mx-auto max-w-[1600px] px-8 py-10">
        {/* ---- Encabezado + métricas ---- */}
        <section className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {club.name} · Torneos
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Todos los <em className="italic">torneos.</em>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              {rows.length === 0
                ? 'Aún no has creado torneos. Crea el primero para empezar a organizar categorías y cuadros.'
                : `${rows.length} torneo${rows.length === 1 ? '' : 's'} en cartera.`}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-4 lg:gap-x-8">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="font-serif text-4xl leading-none text-foreground tabular-nums">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- Listado de torneos ---- */}
        <section className="mt-10 border-t border-border pt-8">
          <TournamentsTable tournaments={rows} />
        </section>
      </div>
    </>
  )
}
