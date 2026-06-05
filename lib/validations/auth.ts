import { z } from 'zod'

export const registerClubOwnerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres.')
      .max(80, 'El nombre es demasiado largo.'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email('Introduce un correo electrónico válido.')),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .max(128, 'La contraseña es demasiado larga.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export type RegisterClubOwnerInput = z.infer<typeof registerClubOwnerSchema>
