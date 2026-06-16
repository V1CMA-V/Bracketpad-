import { Directory } from '@/components/tournaments/directory'
import { Hero } from '@/components/tournaments/hero'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Torneos',
  description:
    'Explora todos los torneos de pádel de la comunidad: plazas abiertas, categorías, cuadros y resultados en vivo.',
  alternates: { canonical: '/torneos' },
}

export default function TorneosPage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Directory />
    </div>
  )
}
