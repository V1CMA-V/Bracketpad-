'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Reloj en vivo + auto-refresco para el modo pantalla. El reloj se actualiza cada
 * segundo en la zona horaria del club; cada `refreshSeconds` se vuelve a pedir la
 * página al servidor (router.refresh) para traer los partidos al día sin que nadie
 * tenga que recargar la pantalla del club.
 */
export function PantallaLive({
  timeZone,
  refreshSeconds = 30,
}: {
  timeZone: string
  refreshSeconds?: number
}) {
  const router = useRouter()
  // Vacío en el render del servidor; se rellena en el cliente para no provocar un
  // desajuste de hidratación entre la hora del servidor y la del navegador.
  const [now, setNow] = useState<string>('')

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('es', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const tick = () => setNow(fmt.format(new Date()))
    // El primer tick va en un timeout para no llamar a setState de forma síncrona
    // dentro del efecto; el intervalo lo mantiene al segundo.
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [timeZone])

  useEffect(() => {
    const id = setInterval(() => router.refresh(), refreshSeconds * 1000)
    return () => clearInterval(id)
  }, [router, refreshSeconds])

  return <span className="tabular-nums">{now || ' '}</span>
}
