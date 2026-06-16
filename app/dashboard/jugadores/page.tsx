import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { AddPlayerForm } from '@/components/dashboard/add-player-form'
import {
  PlayersTable,
  type PlayerItem,
} from '@/components/dashboard/players-table'
import { Button } from '@/components/ui/button'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jugadores del club',
}

/** Date (solo fecha) → "YYYY-MM-DD" para los inputs de tipo date. */
function dateInputValue(d: Date | null): string | null {
  if (!d) return null
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}

export default async function JugadoresPage() {
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
              Crea tu club para empezar a registrar jugadores, ligas y torneos.
            </p>
            <Button asChild className="mt-6 h-9 rounded-md px-4 text-sm">
              <Link href="/registro/club">Crear club</Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  const players = await prisma.player.findMany({
    where: { clubId: club.id },
    orderBy: { fullName: 'asc' },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      gender: true,
      skillLevel: true,
      dominantHand: true,
      birthDate: true,
      _count: {
        select: {
          leagueRegistrations: true,
          leaguePartnerRegistrations: true,
          teamMemberships: true,
          matchSidePlayers: true,
        },
      },
    },
  })

  const items: PlayerItem[] = players.map((p) => {
    const c = p._count
    const links =
      c.leagueRegistrations +
      c.leaguePartnerRegistrations +
      c.teamMemberships +
      c.matchSidePlayers
    return {
      id: p.id,
      fullName: p.fullName,
      email: p.email,
      phone: p.phone,
      gender: p.gender,
      skillLevel: p.skillLevel,
      dominantHand: p.dominantHand,
      birthDate: dateInputValue(p.birthDate),
      // Participaciones = inscripciones (jugador o pareja) + equipos de torneo.
      participations:
        c.leagueRegistrations +
        c.leaguePartnerRegistrations +
        c.teamMemberships,
      deletable: links === 0,
    }
  })

  const total = items.length
  const men = items.filter((p) => p.gender === 'M').length
  const women = items.filter((p) => p.gender === 'F').length
  const ranked = items.filter((p) => p.skillLevel !== 'unranked').length

  const stats = [
    { label: 'Jugadores', value: total, sub: 'Registrados' },
    { label: 'Hombres', value: men, sub: 'Género masc.' },
    { label: 'Mujeres', value: women, sub: 'Género fem.' },
    { label: 'Con categoría', value: ranked, sub: 'Nivel asignado' },
  ]

  return (
    <>
      <DashboardTopbar>
        <Button asChild className="h-9 gap-1.5 rounded-md px-4 text-sm">
          <Link href="#nuevo-jugador">
            <Plus className="size-4" strokeWidth={2} />
            Nuevo jugador
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
                  Sin <em className="italic">jugadores.</em>
                </>
              ) : (
                <>
                  {total} {total === 1 ? 'jugador' : 'jugadores'}{' '}
                  <em className="italic">registrados.</em>
                </>
              )}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {total === 0
                ? 'Registra los jugadores de tu club para inscribirlos en ligas y torneos.'
                : 'El padrón de jugadores del club. Edita sus datos o añade nuevos cuando lo necesites.'}
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

        {/* ---- Formulario para agregar jugador ---- */}
        <AddPlayerForm />

        {/* ---- Listado de jugadores ---- */}
        <section className="mt-6">
          {total === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Todavía no hay jugadores. Usa{' '}
                <span className="text-foreground">Nuevo jugador</span> para
                añadir el primero.
              </p>
            </div>
          ) : (
            <PlayersTable players={items} />
          )}
        </section>
      </div>
    </>
  )
}
