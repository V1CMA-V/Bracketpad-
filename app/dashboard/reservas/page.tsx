import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import {
  ReservationsBrowser,
  type ReservationListItem,
} from '@/components/dashboard/reservations-browser'
import { Button } from '@/components/ui/button'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'
import {
  formatDuration,
  type ReservationKind,
  type ReservationPaymentStatus,
} from '@/lib/reservations'
import { clubDateKey, clubTimeLabel, formatInClubTz } from '@/lib/timezone'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reservas del club',
}

export default async function ReservasPage() {
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
              Crea tu club para empezar a registrar reservas de pista.
            </p>
            <Button asChild className="mt-6 h-9 rounded-md px-4 text-sm">
              <Link href="/registro/club">Crear club</Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  // Todas las reservas del club, de la más reciente/futura a la más antigua.
  const reservations = await prisma.courtReservation.findMany({
    where: { clubId: club.id },
    orderBy: { startAt: 'desc' },
    include: {
      court: { select: { id: true, name: true } },
      coach: { select: { fullName: true } },
    },
  })

  const items: ReservationListItem[] = reservations.map((r) => ({
    id: r.id,
    holderName: r.holderName,
    phone: r.phone,
    courtId: r.courtId,
    courtName: r.court.name,
    kind: r.kind as ReservationKind,
    coachName: r.coach?.fullName ?? null,
    playerCount: r.playerCount,
    dateKey: clubDateKey(r.startAt),
    dateLabel: `${formatInClubTz(r.startAt, 'EEE')} ${formatInClubTz(
      r.startAt,
      'd LLL',
    )}`,
    timeLabel: clubTimeLabel(r.startAt),
    durationLabel: formatDuration(r.durationMinutes),
    paymentStatus: r.paymentStatus as ReservationPaymentStatus,
    paymentMethod: r.paymentMethod,
    price: r.price ? Number(r.price) : null,
    amountPaid: Number(r.amountPaid),
    currency: r.currency,
    cancelled: r.status === 'cancelled',
    notes: r.notes,
  }))

  // Opciones de pista para el filtro (las que aparecen en alguna reserva),
  // ordenadas por nombre.
  const courtMap = new Map(items.map((r) => [r.courtId, r.courtName]))
  const courts = [...courtMap.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  // Métricas (excluyen las canceladas).
  const now = new Date().getTime()
  const active = reservations.filter((r) => r.status !== 'cancelled')
  const upcoming = active.filter((r) => r.startAt.getTime() >= now).length
  const outstanding = active.filter(
    (r) => r.price != null && Number(r.amountPaid) < Number(r.price),
  ).length
  const classes = active.filter((r) => r.kind === 'class').length

  const total = active.length
  const stats = [
    { label: 'Reservas', value: total, sub: 'Vigentes' },
    { label: 'Próximas', value: upcoming, sub: 'A partir de hoy' },
    { label: 'Por cobrar', value: outstanding, sub: 'Con saldo' },
    { label: 'Clases', value: classes, sub: 'Con coach' },
  ]

  return (
    <>
      <DashboardTopbar />

      <div className="mx-auto max-w-[1600px] px-8 py-10">
        {/* ---- Encabezado + métricas ---- */}
        <section className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {club.name}
              {club.city ? ` · ${club.city}` : ''}
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {items.length === 0 ? (
                <>
                  Sin <em className="italic">reservas.</em>
                </>
              ) : (
                <>
                  Reservas de <em className="italic">clientes.</em>
                </>
              )}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {items.length === 0
                ? 'Cuando apartes pistas para juego libre o clases, aparecerán aquí para buscarlas por cliente.'
                : 'Busca cualquier reserva por nombre o teléfono del cliente. Filtra por cobro, tipo o pista y ábrela para editarla o cobrarla.'}
            </p>
          </div>

          {items.length > 0 && (
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

        {/* ---- Buscador + listado ---- */}
        <div className="mt-10 border-t border-border pt-8">
          <ReservationsBrowser reservations={items} courts={courts} />
        </div>
      </div>
    </>
  )
}
