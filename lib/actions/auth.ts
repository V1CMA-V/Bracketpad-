'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() })
  // nextCookies() limpia la cookie de sesión al cerrar sesión.
  redirect('/')
}
