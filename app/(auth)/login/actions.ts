'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { APIError } from 'better-auth/api'
import { z } from 'zod'

import { auth } from '@/auth'
import { loginSchema } from '@/lib/validations/auth'

export type LoginState = {
  error?: string
  fieldErrors?: Partial<Record<'email' | 'password', string[]>>
  // El correo se devuelve para repoblar el formulario si algo falla;
  // la contraseña nunca se reenvía al cliente.
  values?: { email: string }
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const values = {
    email: (formData.get('email') as string | null) ?? '',
  }

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { values, fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const { email, password } = parsed.data

  let accountType = 'player'
  try {
    // Verifica las credenciales e inicia sesión. nextCookies() fija la cookie
    // de sesión automáticamente al llamar desde una Server Action.
    const result = await auth.api.signInEmail({
      headers: await headers(),
      body: { email, password },
    })
    accountType =
      (result.user as { accountType?: string }).accountType ?? 'player'
  } catch (err) {
    if (err instanceof APIError) {
      // Mensaje genérico para no revelar si el correo existe.
      return { values, error: 'Correo o contraseña incorrectos.' }
    }
    throw err
  }

  // El personal del club va al panel; el resto, a su cuenta.
  redirect(accountType === 'club_staff' ? '/dashboard' : '/cuenta')
}
