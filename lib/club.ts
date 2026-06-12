import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * Verificación autoritativa de acceso al dashboard. Solo el personal de club
 * (`accountType === 'club_staff'`) puede entrar.
 *
 * - Sin sesión → `/login`.
 * - Con sesión pero sin rol de club → `/cuenta` (su área personal).
 *
 * Devuelve el usuario de la sesión para que la página/layout lo reutilice sin
 * volver a pedir la sesión.
 */
export async function requireClubAccess() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')
  if (session.user.accountType !== 'club_staff') redirect('/cuenta')
  return session.user
}

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
      club: { include: { _count: { select: { courts: true, players: true } } } },
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
          playerCount: membership.club._count.players,
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
