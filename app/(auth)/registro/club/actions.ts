'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { APIError } from 'better-auth/api'
import { z } from 'zod'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slug'
import { registerClubOwnerSchema } from '@/lib/validations/auth'
import { createClubSchema } from '@/lib/validations/club'

/* -------------------------------------------------------------------------- */
/*  Paso 1 — Crear la cuenta del dueño (rol global club_staff)                 */
/* -------------------------------------------------------------------------- */

export type RegisterState = {
  success?: boolean
  error?: string
  fieldErrors?: Partial<
    Record<'name' | 'email' | 'password' | 'confirmPassword', string[]>
  >
  // Datos no sensibles que se devuelven para repoblar el formulario si algo
  // falla (las contraseñas nunca se reenvían al cliente).
  values?: { name: string; email: string }
}

export async function registerClubOwner(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  // Valores tal cual los escribió el usuario, para devolverlos si hay error.
  const values = {
    name: (formData.get('name') as string | null) ?? '',
    email: (formData.get('email') as string | null) ?? '',
  }

  const parsed = registerClubOwnerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { values, fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const { name, email, password } = parsed.data

  try {
    // Crea el usuario + cuenta y, con autoSignIn, inicia sesión.
    // nextCookies() fija la cookie de sesión automáticamente.
    await auth.api.signUpEmail({
      headers: await headers(),
      body: { name, email, password },
    })
  } catch (err) {
    if (err instanceof APIError) {
      // p. ej. correo ya registrado
      return { values, error: err.message }
    }
    throw err
  }

  // El dueño de un club opera la plataforma: rol global `club_staff`.
  // (El ClubRole `owner` se asigna por club al crear el club, paso 2.)
  // Se hace en el servidor para impedir escalado de privilegios desde el cliente.
  await prisma.user.update({
    where: { email },
    data: { accountType: 'club_staff' },
  })

  // No redirigimos: el asistente avanza al paso 2 (crear el club).
  return { success: true }
}

/* -------------------------------------------------------------------------- */
/*  Paso 2 — Crear el club y asignar al usuario como owner                     */
/* -------------------------------------------------------------------------- */

export type CreateClubState = {
  error?: string
  fieldErrors?: Partial<Record<'name' | 'city' | 'email' | 'phone', string[]>>
  values?: { name: string; city: string; email: string; phone: string }
}

async function uniqueClubSlug(name: string): Promise<string> {
  const base = slugify(name) || 'club'
  let slug = base
  let n = 1
  // El @unique de Club.slug es la garantía final; esto evita choques comunes.
  while (await prisma.club.findUnique({ where: { slug }, select: { id: true } })) {
    n += 1
    slug = `${base}-${n}`
  }
  return slug
}

export async function createClub(
  _prevState: CreateClubState,
  formData: FormData,
): Promise<CreateClubState> {
  const values = {
    name: (formData.get('name') as string | null) ?? '',
    city: (formData.get('city') as string | null) ?? '',
    email: (formData.get('email') as string | null) ?? '',
    phone: (formData.get('phone') as string | null) ?? '',
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { values, error: 'Tu sesión ha expirado. Vuelve a iniciar sesión.' }
  }

  const parsed = createClubSchema.safeParse({
    name: formData.get('name'),
    city: (formData.get('city') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
  })

  if (!parsed.success) {
    return { values, fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const { name, city, email, phone } = parsed.data
  const slug = await uniqueClubSlug(name)

  // Club + membresía owner en una sola transacción.
  await prisma.$transaction(async (tx) => {
    const club = await tx.club.create({
      data: {
        name,
        slug,
        city: city ?? null,
        email: email ?? null,
        phone: phone ?? null,
      },
    })

    await tx.clubMembership.create({
      data: {
        clubId: club.id,
        userId: session.user.id,
        role: 'owner',
      },
    })
  })

  redirect('/dashboard')
}
