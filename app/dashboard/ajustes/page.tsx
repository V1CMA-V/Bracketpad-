import { ClubSettings } from '@/components/dashboard/club-settings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ajustes del club · Bandeja',
}

export default function AjustesPage() {
  return <ClubSettings />
}
