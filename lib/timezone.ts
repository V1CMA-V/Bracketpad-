import { es } from 'date-fns/locale'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

/**
 * Zona horaria del club. Todas las fechas de juego (partidos, reservas y clases)
 * se interpretan al guardar y se muestran al leer en esta zona, con
 * independencia de la zona horaria del proceso (tu máquina local vs. el servidor
 * de producción). Así la hora que se programa no varía entre entornos.
 *
 * Ciudad de México ya no aplica horario de verano (offset fijo −06:00), pero al
 * usar la zona IANA el cálculo sigue siendo correcto aunque eso cambie.
 */
export const CLUB_TIME_ZONE = 'America/Mexico_City'

const pad = (n: number) => String(n).padStart(2, '0')

/* -------------------------------------------------------------------------- */
/*  Escritura: hora de pared del club → instante UTC                          */
/* -------------------------------------------------------------------------- */

/**
 * Hora de pared del club (`YYYY-MM-DDTHH:MM[:SS]`, sin zona) → instante UTC. Es
 * la inversa de las funciones de lectura: lo que se teclea como «10:00» se
 * guarda como el instante que en la zona del club son las 10:00.
 */
export function clubWallTimeToUtc(localDateTime: string): Date {
  return fromZonedTime(localDateTime, CLUB_TIME_ZONE)
}

/** Combina fecha (`YYYY-MM-DD`) y hora (`HH:MM`) del club en un instante UTC. */
export function clubDateAndTimeToUtc(date: string, time: string): Date {
  return clubWallTimeToUtc(`${date}T${time}:00`)
}

/* -------------------------------------------------------------------------- */
/*  Lectura: instante UTC → hora de pared del club                            */
/* -------------------------------------------------------------------------- */

/** Formatea un instante con un patrón date-fns en la zona del club (locale es). */
export function formatInClubTz(date: Date, pattern: string): string {
  return formatInTimeZone(date, CLUB_TIME_ZONE, pattern, { locale: es })
}

/** Etiqueta «HH:MM» en hora del club. */
export function clubTimeLabel(date: Date): string {
  return formatInTimeZone(date, CLUB_TIME_ZONE, 'HH:mm')
}

/** Clave «YYYY-MM-DD» del día natural del club. */
export function clubDateKey(date: Date): string {
  return formatInTimeZone(date, CLUB_TIME_ZONE, 'yyyy-MM-dd')
}

/** Valor para `<input type="datetime-local">` (`YYYY-MM-DDTHH:MM`) en hora del club. */
export function clubDateTimeLocal(date: Date): string {
  return formatInTimeZone(date, CLUB_TIME_ZONE, "yyyy-MM-dd'T'HH:mm")
}

/** Minutos transcurridos desde la medianoche del club (10:30 → 630). */
export function clubMinutesOfDay(date: Date): number {
  const [h, m] = formatInTimeZone(date, CLUB_TIME_ZONE, 'HH:mm').split(':')
  return Number(h) * 60 + Number(m)
}

/** Hora decimal en la zona del club (08:30 → 8.5). */
export function clubDecimalHour(date: Date): number {
  return clubMinutesOfDay(date) / 60
}

/** Día de la semana del club, convención JS (0 = domingo … 6 = sábado). */
export function clubWeekday(date: Date): number {
  // `i` es el día ISO (1 = lunes … 7 = domingo); el módulo lleva domingo a 0.
  return Number(formatInTimeZone(date, CLUB_TIME_ZONE, 'i')) % 7
}

/* -------------------------------------------------------------------------- */
/*  Rango de un día natural del club                                          */
/* -------------------------------------------------------------------------- */

/** Suma un día a una clave «YYYY-MM-DD» (aritmética de calendario, sin zona). */
function nextDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + 1)
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

/**
 * Rango UTC `[start, end)` que cubre el día natural del club indicado por su
 * clave «YYYY-MM-DD». Sirve para acotar consultas Prisma por día sin que el
 * límite de medianoche dependa de la zona del servidor.
 */
export function clubDayRange(dayKey: string): { start: Date; end: Date } {
  return {
    start: clubWallTimeToUtc(`${dayKey}T00:00:00`),
    end: clubWallTimeToUtc(`${nextDayKey(dayKey)}T00:00:00`),
  }
}

/** Ancla a mediodía UTC de una clave de día: mismo día natural en el club. */
export function clubDayNoon(dayKey: string): Date {
  const [y, m, d] = dayKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12))
}
