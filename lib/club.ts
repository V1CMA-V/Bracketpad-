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
