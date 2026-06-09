import { z } from 'zod'

export const createRoundSchema = z.object({
  name: z.string().trim().max(60, 'El nombre es demasiado largo.').optional(),
  scheduledDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.')
    .optional(),
})

// Edición de una jornada: mismos campos que al crearla. El estado se cambia
// con su propia acción, no desde este formulario.
export const updateRoundSchema = createRoundSchema

export const createMatchSchema = z.object({
  courtId: z.string().trim().optional(),
  // Grupo/nivel del partido: 1 = mejores, números mayores = niveles inferiores.
  groupNumber: z.coerce
    .number()
    .int('El grupo debe ser un número entero.')
    .min(1, 'El grupo debe ser 1 o mayor.')
    .max(99, 'Grupo demasiado alto.')
    .optional(),
  // Formato de <input type="datetime-local">: YYYY-MM-DDTHH:MM
  scheduledAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Fecha y hora inválidas.')
    .optional(),
  a1: z.string().trim().min(1, 'Selecciona al menos un jugador para el lado A.'),
  a2: z.string().trim().optional(),
  b1: z.string().trim().min(1, 'Selecciona al menos un jugador para el lado B.'),
  b2: z.string().trim().optional(),
})

// Crear un grupo de 4 jugadores individuales (genera los 3 sets rotativos).
export const createGroupSchema = z.object({
  courtId: z.string().trim().optional(),
  // Grupo/nivel: 1 = más alto. Vacío = se asigna el siguiente disponible.
  groupNumber: z.coerce
    .number()
    .int('El grupo debe ser un número entero.')
    .min(1, 'El grupo debe ser 1 o mayor.')
    .max(99, 'Grupo demasiado alto.')
    .optional(),
  scheduledAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Fecha y hora inválidas.')
    .optional(),
  p1: z.string().trim().min(1, 'Selecciona al jugador 1.'),
  p2: z.string().trim().min(1, 'Selecciona al jugador 2.'),
  p3: z.string().trim().min(1, 'Selecciona al jugador 3.'),
  p4: z.string().trim().min(1, 'Selecciona al jugador 4.'),
})

// Crear un grupo de 4 parejas (genera los 6 partidos a un set, repartidos en
// 2 canchas). t1..t4 son ids de inscripción (LeagueRegistration), no de jugador.
export const createPairGroupSchema = z.object({
  courtAId: z.string().trim().min(1, 'Selecciona la cancha A.'),
  courtBId: z.string().trim().min(1, 'Selecciona la cancha B.'),
  // Grupo/nivel: 1 = más alto. Vacío = se asigna el siguiente disponible.
  groupNumber: z.coerce
    .number()
    .int('El grupo debe ser un número entero.')
    .min(1, 'El grupo debe ser 1 o mayor.')
    .max(99, 'Grupo demasiado alto.')
    .optional(),
  scheduledAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Fecha y hora inválidas.')
    .optional(),
  t1: z.string().trim().min(1, 'Selecciona la pareja 1.'),
  t2: z.string().trim().min(1, 'Selecciona la pareja 2.'),
  t3: z.string().trim().min(1, 'Selecciona la pareja 3.'),
  t4: z.string().trim().min(1, 'Selecciona la pareja 4.'),
})

export type CreateRoundInput = z.infer<typeof createRoundSchema>
export type CreateMatchInput = z.infer<typeof createMatchSchema>
export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type CreatePairGroupInput = z.infer<typeof createPairGroupSchema>
