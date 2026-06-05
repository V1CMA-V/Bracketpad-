import { z } from 'zod'

import { COURT_SURFACES } from '@/lib/courts'

export const createCourtSchema = z.object({
  // Opcional: si se deja vacío, el servidor asigna "Pista N" automáticamente.
  name: z.string().trim().max(60, 'El nombre es demasiado largo.').optional(),
  surface: z.enum(COURT_SURFACES, { error: 'Elige una superficie.' }),
  isIndoor: z.boolean(),
})

export type CreateCourtInput = z.infer<typeof createCourtSchema>
