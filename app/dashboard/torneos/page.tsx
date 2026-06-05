import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { TournamentsTable } from '@/components/dashboard/tournaments-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Torneos · Bandeja',
}

const stats = [
  { label: 'Activos', value: '2', sub: 'Hoy en juego' },
  { label: 'Programados', value: '3', sub: 'Próximas 8 semanas' },
  { label: 'Inscritos', value: '724', sub: 'Acumulado 2026' },
  { label: 'Ingresos', value: '€8.060', sub: '2026 · cuotas' },
]

export default function TorneosPage() {
  return (
    <>
      <DashboardTopbar>
        <Button variant="outline" className="h-9 rounded-md px-3.5 text-sm">
          Importar de CSV
        </Button>
        <Button variant="outline" className="h-9 rounded-md px-3.5 text-sm">
          Duplicar último
        </Button>
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
              Temporada · Primavera-Verano 2026
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Todos los <em className="italic">torneos.</em>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              9 torneos en cartera —{' '}
              <span className="text-foreground">2 en juego</span>, 3 programados,
              2 borradores y 2 archivados de la temporada pasada.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-4 lg:gap-x-8">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="font-serif text-4xl leading-none text-foreground">
                  {stat.value}
                </dd>
                <dd className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  {stat.sub}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- Listado de torneos ---- */}
        <section className="mt-10 border-t border-border pt-8">
          <TournamentsTable />
        </section>
      </div>
    </>
  )
}
