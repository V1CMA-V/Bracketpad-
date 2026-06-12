import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { AddCoachForm } from '@/components/dashboard/add-coach-form'
import {
  CoachesTable,
  type CoachItem,
} from '@/components/dashboard/coaches-table'
import { Button } from '@/components/ui/button'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coaches del club · Bandeja',
}

export default async function CoachesPage() {
  const club = await getManagedClub()

  /* ---- Sin club: nada que gestionar ---- */
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
              Crea tu club para registrar coaches y reservar clases.
            </p>
            <Button asChild className="mt-6 h-9 rounded-md px-4 text-sm">
              <Link href="/registro/club">Crear club</Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  const coaches = await prisma.coach.findMany({
    where: { clubId: club.id },
    orderBy: { fullName: 'asc' },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      _count: { select: { reservations: true } },
    },
  })

  const items: CoachItem[] = coaches.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    email: c.email,
    phone: c.phone,
    classes: c._count.reservations,
  }))

  const total = items.length
  const withContact = items.filter((c) => c.email || c.phone).length
  const totalClasses = items.reduce((n, c) => n + c.classes, 0)

  const stats = [
    { label: 'Coaches', value: total, sub: 'Registrados' },
    { label: 'Con contacto', value: withContact, sub: 'Email o teléfono' },
    { label: 'Clases', value: totalClasses, sub: 'Reservadas' },
  ]

  return (
    <>
      <DashboardTopbar>
        <Button asChild className="h-9 gap-1.5 rounded-md px-4 text-sm">
          <Link href="#nuevo-coach">
            <Plus className="size-4" strokeWidth={2} />
            Nuevo coach
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
                  Sin <em className="italic">coaches.</em>
                </>
              ) : (
                <>
                  {total} {total === 1 ? 'coach' : 'coaches'}{' '}
                  <em className="italic">en el club.</em>
                </>
              )}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {total === 0
                ? 'Registra los coaches de tu club para poder reservar clases con ellos desde la programación.'
                : 'Los coaches del club. Edita sus datos o añade nuevos; podrás asignarlos a las clases que reserves.'}
            </p>
          </div>

          {total > 0 && (
            <dl className="grid grid-cols-3 gap-x-10 gap-y-6 lg:gap-x-8">
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

        {/* ---- Formulario para agregar coach ---- */}
        <AddCoachForm />

        {/* ---- Listado de coaches ---- */}
        <section className="mt-6">
          {total === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Todavía no hay coaches. Usa{' '}
                <span className="text-foreground">Nuevo coach</span> para añadir
                el primero.
              </p>
            </div>
          ) : (
            <CoachesTable coaches={items} />
          )}
        </section>
      </div>
    </>
  )
}
