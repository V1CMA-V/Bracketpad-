import { headers } from 'next/headers'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/** Id del club que administra el usuario (owner o admin), o null. */
export async function resolveManagedClubId(userId: string): Promise<string | null> {
  const membership = await prisma.clubMembership.findFirst({
    where: { userId, role: { in: ['owner', 'admin'] } },
    orderBy: { createdAt: 'asc' },
    select: { clubId: true },
  })
  return membership?.clubId ?? null
}

/** Datos para el shell del dashboard: usuario de la sesión + su club. */
export async function getDashboardData() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const membership = await prisma.clubMembership.findFirst({
    where: { userId: session.user.id, role: { in: ['owner', 'admin'] } },
    orderBy: { createdAt: 'asc' },
    include: {
      club: { include: { _count: { select: { courts: true } } } },
    },
  })

  return {
    user: {
      name: session.user.name,
      accountType: session.user.accountType ?? 'player',
    },
    club: membership
      ? {
          name: membership.club.name,
          slug: membership.club.slug,
          city: membership.club.city,
          courtCount: membership.club._count.courts,
          role: membership.role,
        }
      : null,
  }
}

/** Club que administra el usuario de la sesión actual (owner o admin), o null. */
export async function getManagedClub() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const membership = await prisma.clubMembership.findFirst({
    where: { userId: session.user.id, role: { in: ['owner', 'admin'] } },
    orderBy: { createdAt: 'asc' },
    include: { club: true },
  })
  return membership?.club ?? null
}
