import { ClubSettings } from '@/components/dashboard/club-settings'
import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { Button } from '@/components/ui/button'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ajustes del club · Bandeja',
}

export default async function AjustesPage() {
  const club = await getManagedClub()

  /* ---- Sin club: nada que ajustar ---- */
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
              Crea tu club para configurar su ficha, contacto y horario.
            </p>
            <Button asChild className="mt-6 h-9 rounded-md px-4 text-sm">
              <Link href="/registro/club">Crear club</Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  const [hours, courtCount, pricing, courtRateRows] = await Promise.all([
    prisma.clubHours.findMany({
      where: { clubId: club.id },
      select: { dayOfWeek: true, openTime: true, closeTime: true },
    }),
    prisma.court.count({ where: { clubId: club.id } }),
    prisma.clubClassPricing.findUnique({ where: { clubId: club.id } }),
    prisma.clubCourtRate.findMany({
      where: { clubId: club.id },
      orderBy: { sortOrder: 'asc' },
      select: {
        label: true,
        days: true,
        startTime: true,
        endTime: true,
        price: true,
        currency: true,
      },
    }),
  ])

  const classPricing = {
    price1: pricing?.price1 ? Number(pricing.price1) : null,
    price2: pricing?.price2 ? Number(pricing.price2) : null,
    price3: pricing?.price3 ? Number(pricing.price3) : null,
    price4: pricing?.price4 ? Number(pricing.price4) : null,
    currency: pricing?.currency ?? 'MXN',
  }

  const courtRates = courtRateRows.map((r) => ({
    label: r.label,
    days: r.days,
    startTime: r.startTime,
    endTime: r.endTime,
    price: Number(r.price),
  }))
  // La moneda es común a todas las reglas; toma la de la primera si existe.
  const courtRateCurrency = courtRateRows[0]?.currency ?? 'MXN'

  return (
    <ClubSettings
      club={{
        name: club.name,
        slug: club.slug,
        legalName: club.legalName,
        taxId: club.taxId,
        foundedYear: club.foundedYear,
        description: club.description,
        email: club.email,
        phone: club.phone,
        website: club.website,
        instagram: club.instagram,
        address: club.address,
        city: club.city,
        state: club.state,
        postalCode: club.postalCode,
        country: club.country,
        latitude: club.latitude,
        longitude: club.longitude,
        timezone: club.timezone,
        isActive: club.isActive,
      }}
      hours={hours}
      courtCount={courtCount}
      classPricing={classPricing}
      courtRates={courtRates}
      courtRateCurrency={courtRateCurrency}
    />
  )
}
