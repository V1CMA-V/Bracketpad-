import { AccountSettings } from '@/components/player/account-settings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configuración de la cuenta · Bandeja',
}

export default function CuentaPage() {
  return <AccountSettings />
}
