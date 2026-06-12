import { Directory } from '@/components/clubs/directory'
import { Hero } from '@/components/clubs/hero'
import { getDirectoryClubs } from '@/lib/club-directory'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clubs · Bandeja',
  description: 'Busca y descubre todos los clubes de pádel de la comunidad.',
}

export default async function ClubsPage() {
  const { clubs, regions } = await getDirectoryClubs()

  return (
    <div className="flex flex-col">
      <Hero />
      <Directory clubs={clubs} regions={regions} />
    </div>
  )
}
