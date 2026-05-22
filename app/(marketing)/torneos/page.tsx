import { Directory } from '@/components/tournaments/directory'
import { Hero } from '@/components/tournaments/hero'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Torneos · Bandeja',
  description: 'Todos los torneos de pádel disponibles en la comunidad.',
}

export default function TorneosPage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Directory />
    </div>
  )
}
