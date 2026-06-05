import { prisma } from '@/lib/prisma'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      // Rol GLOBAL de plataforma. `input: false` impide que el cliente lo
      // establezca en el alta (evita escalado a super_admin); se asigna
      // siempre en el servidor. El default de la columna es `player`.
      accountType: {
        type: 'string',
        required: false,
        defaultValue: 'player',
        input: false,
      },
    },
  },
  // nextCookies() debe ir SIEMPRE al final para que las cookies de sesión se
  // fijen automáticamente al llamar a auth.api.* desde Server Actions.
  plugins: [nextCookies()],
})
