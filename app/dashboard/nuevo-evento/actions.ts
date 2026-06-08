'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { resolveManagedClubId } from '@/lib/club'
import { createEventSchema } from '@/lib/validations/event'

export type CreateEventState = {
  error?: string
  fieldErrors?: Record<string, string[]>
}

function toDate(value?: string): Date | null {
  return value ? new Date(`${value}T00:00:00`) : null
}

export async function createEvent(input: unknown): Promise<CreateEventState> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { error: 'Tu sesión ha expirado. Vuelve a iniciar sesión.' }
  }

  const clubId = await resolveManagedClubId(session.user.id)
  if (!clubId) {
    return { error: 'No administras ningún club. Crea un club antes de crear eventos.' }
  }

  const parsed = createEventSchema.safeParse(input)
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const data = parsed.data

  if (data.type === 'torneo') {
    await prisma.tournament.create({
      data: {
        clubId,
        name: data.name,
        startDate: toDate(data.startDate),
        endDate: toDate(data.endDate),
        location: data.location ?? null,
        description: data.description ?? null,
      },
    })
    redirect('/dashboard/torneos')
  }

  // Liga: se crea con su configuración de puntuación (resto de valores por
  // defecto del modelo LeagueScoringConfig).
  await prisma.league.create({
    data: {
      clubId,
      name: data.name,
      format: data.format,
      playKind: data.playKind,
      startDate: toDate(data.startDate),
      endDate: toDate(data.endDate),
      scoringConfig: {
        create: {
          bestOfSets: data.bestOfSets,
          rankingBy: data.rankingBy,
        },
      },
    },
  })
  redirect('/dashboard')
}
