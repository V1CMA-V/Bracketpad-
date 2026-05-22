import { Directory } from '@/components/clubs/directory'
import { Hero } from '@/components/clubs/hero'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clubs · Bandeja',
  description: 'Busca y descubre todos los clubes de pádel de la comunidad.',
}

export default function ClubsPage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Directory />
    </div>
  )
}
