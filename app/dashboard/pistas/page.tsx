import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { AddCourtForm } from '@/components/dashboard/add-court-form'
import { CourtCard } from '@/components/dashboard/court-card'
import { Button } from '@/components/ui/button'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'
import { type CourtSurface } from '@/lib/courts'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pistas del club · Bandeja',
}

export default async function PistasPage() {
  const club = await getManagedClub()

  /* ---- Sin club: no hay nada que gestionar ---- */
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
              Crea tu club para empezar a registrar pistas, ligas y torneos.
            </p>
            <Button asChild className="mt-6 h-9 rounded-md px-4 text-sm">
              <Link href="/registro/club">Crear club</Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  const courts = await prisma.court.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: 'asc' },
  })

  const total = courts.length
  const active = courts.filter((c) => c.isActive).length
  const indoor = courts.filter((c) => c.isIndoor).length
  const stats = [
    { label: 'Pistas', value: total, sub: 'Registradas' },
    { label: 'Activas', value: active, sub: 'Disponibles' },
    { label: 'Cubiertas', value: indoor, sub: 'Indoor' },
    { label: 'Exterior', value: total - indoor, sub: 'Al aire libre' },
  ]

  return (
    <>
      <DashboardTopbar>
        <Button asChild className="h-9 gap-1.5 rounded-md px-4 text-sm">
          <Link href="#nueva-pista">
            <Plus className="size-4" strokeWidth={2} />
            Nueva pista
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
                  Sin <em className="italic">pistas.</em>
                </>
              ) : (
                <>
                  {total} {total === 1 ? 'pista' : 'pistas'}{' '}
                  <em className="italic">registradas.</em>
                </>
              )}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {total === 0
                ? 'Registra las pistas de tu club para poder programar partidos y asignarlas a las jornadas.'
                : 'Gestiona las pistas de tu club: actívalas o desactívalas y añade nuevas cuando lo necesites.'}
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

        {/* ---- Formulario para agregar pista ---- */}
        <AddCourtForm />

        {/* ---- Listado de pistas ---- */}
        <section className="mt-6">
          {total === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Todavía no hay pistas. Usa{' '}
                <span className="text-foreground">Nueva pista</span> para añadir
                la primera.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Listado · {total} {total === 1 ? 'pista' : 'pistas'}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {courts.map((court, i) => (
                  <CourtCard
                    key={court.id}
                    index={i}
                    court={{
                      id: court.id,
                      name: court.name,
                      surface: court.surface as CourtSurface,
                      isIndoor: court.isIndoor,
                      isActive: court.isActive,
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  )
}
