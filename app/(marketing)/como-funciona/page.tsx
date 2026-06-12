import type { Metadata } from 'next'
import { Audience } from '@/components/how-it-works/audience'
import { ClosingCta } from '@/components/how-it-works/closing-cta'
import { ClubFlow } from '@/components/how-it-works/club-flow'
import { Hero } from '@/components/how-it-works/hero'
import { PlayersSoon } from '@/components/how-it-works/players-soon'

export const metadata: Metadata = {
  title: 'Cómo funciona · Bandeja',
  description:
    'Cómo funciona Bandeja para clubes de pádel: torneos, ligas, programación de pistas, reservas y clases. La experiencia para jugadores llegará pronto.',
}

export default function ComoFuncionaPage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Audience />
      <ClubFlow />
      <PlayersSoon />
      <ClosingCta />
    </div>
  )
}
