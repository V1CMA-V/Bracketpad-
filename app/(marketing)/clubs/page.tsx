import { Directory } from '@/components/clubs/directory'
import { Hero } from '@/components/clubs/hero'
import { getDirectoryClubs } from '@/lib/club-directory'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clubs',
  description:
    'Busca y descubre clubes de pádel: pistas, ligas y torneos cerca de ti.',
  alternates: { canonical: '/clubs' },
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
