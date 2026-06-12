import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'
import {
  leagueFormatLabels,
  leagueStatusLabels,
  leagueStatusStyles,
} from '@/lib/leagues'
import { Pencil, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ligas · Bandeja',
}

// Timestamp real (`createdAt`): hora local.
const dateFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

// Fechas de calendario `@db.Date` (startDate/endDate): guardadas como medianoche
// UTC, se formatean en UTC para no mostrar un día antes en zonas con desfase.
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

/** Columnas de la tabla, aplicadas con `style` para un grid estable. */
const tableRow = 'grid items-center gap-4'
const tableGrid: React.CSSProperties = {
  gridTemplateColumns:
    '36px minmax(0, 1.6fr) 120px 110px minmax(0, 1.2fr) 84px 84px 48px',
}

export default async function LigasPage() {
  const club = await getManagedClub()

  if (!club) {
    return (
      <>
        <DashboardTopbar />
        <div className="mx-auto max-w-[1600px] px-8 py-10">
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <h1 className="font-serif text-3xl tracking-tight text-foreground">
              Aún no administras un club
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Crea tu club para empezar a organizar ligas, torneos y partidos.
            </p>
            <Button asChild className="mt-6 h-9 rounded-md px-4 text-sm">
              <Link href="/registro/club">Crear club</Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  const leagues = await prisma.league.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { registrations: true, rounds: true } },
    },
  })

  const total = leagues.length
  const active = leagues.filter((l) => l.status === 'active').length
  const drafts = leagues.filter((l) => l.status === 'draft').length
  const registered = leagues.reduce((n, l) => n + l._count.registrations, 0)

  const stats = [
    { label: 'Ligas', value: total, sub: 'Creadas' },
    { label: 'Activas', value: active, sub: 'En juego' },
    { label: 'Borradores', value: drafts, sub: 'Por publicar' },
    { label: 'Inscritos', value: registered, sub: 'Acumulado' },
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
              {club.name}
              {club.city ? ` · ${club.city}` : ''}
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {total === 0 ? (
                <>
                  Sin <em className="italic">ligas.</em>
                </>
              ) : (
                <>
                  Todas las <em className="italic">ligas.</em>
                </>
              )}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              {total === 0
                ? 'Crea tu primera liga para gestionar jornadas, inscripciones y clasificación por sets.'
                : `${total} ${total === 1 ? 'liga' : 'ligas'} en cartera — el ranking se decide por sets ganados.`}
            </p>
          </div>

          {total > 0 && (
            <dl className="grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-4 lg:gap-x-8">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1.5">
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="font-serif text-4xl leading-none text-foreground tabular-nums">
                    {stat.value}
                  </dd>
                  <dd className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {stat.sub}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {/* ---- Listado de ligas ---- */}
        <section className="mt-10 border-t border-border pt-8">
          {total === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Todavía no hay ligas. Usa{' '}
                <span className="text-foreground">Nuevo evento</span> y elige{' '}
                <span className="text-foreground">Liga</span> para crear la
                primera.
              </p>
              <Button asChild className="mt-5 h-9 gap-1.5 rounded-md px-4 text-sm">
                <Link href="/dashboard/nuevo-evento">
                  <Plus className="size-4" strokeWidth={2} />
                  Nueva liga
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Listado · {total} {total === 1 ? 'liga' : 'ligas'}
              </p>
              <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                  <div
                    style={tableGrid}
                    className={cn(
                      tableRow,
                      'border-b border-border px-3 pb-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground',
                    )}
                  >
                    <span>Nº</span>
                    <span>Liga</span>
                    <span>Formato</span>
                    <span>Estado</span>
                    <span>Fechas</span>
                    <span className="text-right">Inscritos</span>
                    <span className="text-right">Jornadas</span>
                    <span className="sr-only">Acciones</span>
                  </div>

                  <ul className="divide-y divide-border">
                    {leagues.map((league, i) => {
                      const status =
                        leagueStatusStyles[league.status] ??
                        leagueStatusStyles.draft
                      return (
                        <li key={league.id} className="relative">
                          <div
                            style={tableGrid}
                            className={cn(
                              tableRow,
                              'rounded-md px-3 py-4 transition-colors hover:bg-muted/50',
                            )}
                          >
                          {/* Enlace extendido: toda la fila abre el detalle. */}
                          <Link
                            href={`/dashboard/ligas/${league.id}`}
                            aria-label={`Abrir ${league.name}`}
                            className="absolute inset-0 rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          />
                          <span className="font-serif text-xl text-muted-foreground/70 tabular-nums">
                            {String(i + 1).padStart(2, '0')}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate font-serif text-base text-foreground">
                              {league.name}
                            </p>
                            <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              Creada {dateFmt.format(league.createdAt)}
                            </p>
                          </div>

                          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                            {leagueFormatLabels[league.format] ?? league.format}
                          </span>

                          <span
                            className={cn(
                              'flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest',
                              status.text,
                            )}
                          >
                            <span
                              className={cn('size-1.5 rounded-full', status.dot)}
                            />
                            {leagueStatusLabels[league.status] ?? league.status}
                          </span>

                          <span className="truncate font-mono text-xs text-muted-foreground">
                            {formatRange(league.startDate, league.endDate)}
                          </span>

                          <span className="text-right font-mono text-sm text-foreground tabular-nums">
                            {league._count.registrations}
                          </span>

                          <span className="text-right font-mono text-sm text-muted-foreground tabular-nums">
                            {league._count.rounds}
                          </span>

                          {/* Acción editar, por encima del enlace de fila. */}
                          <Link
                            href={`/dashboard/ligas/${league.id}/editar`}
                            aria-label={`Editar ${league.name}`}
                            title="Editar liga"
                            className="relative z-10 flex size-8 items-center justify-center justify-self-end rounded-md border border-border text-muted-foreground transition-colors hover:border-ring hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="size-4" strokeWidth={2} />
                          </Link>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  )
}
