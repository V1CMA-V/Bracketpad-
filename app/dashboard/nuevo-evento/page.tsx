import { EventWizard } from '@/components/dashboard/event-wizard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nuevo evento',
}

export default function NuevoEventoPage() {
  return <EventWizard />
}
