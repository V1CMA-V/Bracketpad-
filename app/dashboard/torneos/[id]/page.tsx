import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import {
  TournamentCategories,
  type CategoryItem,
} from '@/components/dashboard/tournament-categories'
import { TournamentSettings } from '@/components/dashboard/tournament-settings'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'
import {
  tournamentStatusLabels,
  tournamentStatusStyles,
} from '@/lib/tournaments'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

// Para `createdAt` (timestamp real): hora local.
const dateFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

// Para fechas de calendario `@db.Date` (startDate, endDate): se guardan como
// medianoche UTC, así que se formatean en UTC para no mostrarse un día antes.
const dayFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${dayFmt.format(start)} → ${dayFmt.format(end)}`
  if (start) return `Desde ${dayFmt.format(start)}`
  if (end) return `Hasta ${dayFmt.format(end)}`
  return 'Sin fechas'
}

/** `@db.Date` → "YYYY-MM-DD" (UTC) para precargar un <input type="date">. */
function toDateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : ''
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { name: true },
  })
  return { title: `${tournament?.name ?? 'Torneo'} · Bandeja` }
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right text-sm text-foreground">{value}</dd>
    </div>
  )
}

export default async function TorneoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const club = await getManagedClub()
  if (!club) notFound()

  const tournament = await prisma.tournament.findFirst({
    where: { id, clubId: club.id },
    include: {
      categories: {
        orderBy: { name: 'asc' },
        include: { _count: { select: { teams: true } } },
      },
    },
  })

  if (!tournament) notFound()

  const categories: CategoryItem[] = tournament.categories.map((c) => ({
    id: c.id,
    name: c.name,
    gender: c.gender,
    skillLevel: c.skillLevel,
    drawType: c.drawType,
    maxTeams: c.maxTeams,
    bestOfSets: c.bestOfSets,
    goldenPoint: c.goldenPoint,
    tiebreakAt: c.tiebreakAt,
    teamsPerGroup: c.teamsPerGroup,
    advancePerGroup: c.advancePerGroup,
    prize: c.prize,
    entryFee: c.entryFee != null ? Number(c.entryFee) : null,
    currency: c.currency,
    teamCount: c._count.teams,
  }))

  const totalTeams = categories.reduce((sum, c) => sum + c.teamCount, 0)
  const status =
    tournamentStatusStyles[tournament.status] ?? tournamentStatusStyles.draft

  const stats = [
    { label: 'Categorías', value: categories.length },
    { label: 'Parejas', value: totalTeams },
  ]

  return (
    <>
      <DashboardTopbar>
        <Button
          asChild
          variant="outline"
          className="h-9 gap-1.5 rounded-md px-4 text-sm"
        >
          <Link href="/dashboard/torneos">
            <ArrowLeft className="size-4" strokeWidth={2} />
            Torneos
          </Link>
        </Button>
      </DashboardTopbar>

      <div className="mx-auto max-w-[1600px] px-8 py-10">
        {/* ---- Encabezado ---- */}
        <section className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <span className={cn('flex items-center gap-1.5', status.text)}>
                <span className={cn('size-1.5 rounded-full', status.dot)} />
                {tournamentStatusLabels[tournament.status] ?? tournament.status}
              </span>
              {tournament.location && (
                <>
                  <span className="text-foreground/25">·</span>
                  {tournament.location}
                </>
              )}
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {tournament.name}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {formatRange(tournament.startDate, tournament.endDate)}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-10 gap-y-6 lg:gap-x-8">
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

        {/* ---- Módulos ---- */}
        <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-12 border-t border-border pt-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Columna principal */}
          <div className="space-y-12">
            <TournamentCategories
              tournamentId={tournament.id}
              categories={categories}
            />
          </div>

          {/* Columna lateral */}
          <aside className="space-y-6">
            <TournamentSettings
              tournament={{
                id: tournament.id,
                name: tournament.name,
                status: tournament.status,
                startDate: toDateInput(tournament.startDate),
                endDate: toDateInput(tournament.endDate),
                location: tournament.location ?? '',
                description: tournament.description ?? '',
              }}
            />

            {/* Datos del torneo */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Datos del torneo
              </p>
              <dl className="mt-3 divide-y divide-border">
                <DataRow
                  label="Estado"
                  value={
                    tournamentStatusLabels[tournament.status] ??
                    tournament.status
                  }
                />
                <DataRow
                  label="Inicio"
                  value={
                    tournament.startDate
                      ? dayFmt.format(tournament.startDate)
                      : '—'
                  }
                />
                <DataRow
                  label="Fin"
                  value={
                    tournament.endDate ? dayFmt.format(tournament.endDate) : '—'
                  }
                />
                <DataRow
                  label="Sede"
                  value={tournament.location ?? '—'}
                />
                <DataRow
                  label="Creado"
                  value={dateFmt.format(tournament.createdAt)}
                />
              </dl>
            </div>

            {/* Descripción */}
            {tournament.description && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Descripción
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {tournament.description}
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  )
}
