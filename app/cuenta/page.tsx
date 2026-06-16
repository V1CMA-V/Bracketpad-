import { AccountSettings } from '@/components/player/account-settings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configuración de la cuenta',
  robots: { index: false, follow: false },
}

export default function CuentaPage() {
  return <AccountSettings />
}
