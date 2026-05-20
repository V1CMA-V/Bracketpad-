import { TournamentWizard } from '@/components/dashboard/tournament-wizard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nuevo torneo · Bandeja',
}

export default function NuevoTorneoPage() {
  return <TournamentWizard />
}
