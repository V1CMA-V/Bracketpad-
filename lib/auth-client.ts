import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import type { auth } from '@/auth'

export const authClient = createAuthClient({
  // Infiere los campos extra del servidor (p. ej. user.accountType)
  plugins: [inferAdditionalFields<typeof auth>()],
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
