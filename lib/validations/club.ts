import { z } from 'zod'

export const createClubSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre del club debe tener al menos 2 caracteres.')
    .max(80, 'El nombre es demasiado largo.'),
  city: z.string().trim().max(80, 'La ciudad es demasiado larga.').optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Introduce un correo electrónico válido.'))
    .optional(),
  phone: z.string().trim().max(30, 'El teléfono es demasiado largo.').optional(),
})

export type CreateClubInput = z.infer<typeof createClubSchema>
