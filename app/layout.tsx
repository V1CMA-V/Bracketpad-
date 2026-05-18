import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { Geist, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// Instrument Serif — display / headings
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-heading',
})

// Geist — interfaz, etiquetas, párrafos
const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})

// JetBrains Mono — datos, scoring, código
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Bandeja - AI-powered branding',
  description:
    'Bandeja is a platform for creating and managing your own brand.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        'h-full',
        'antialiased',
        'font-sans',
        geistSans.variable,
        instrumentSerif.variable,
        jetbrainsMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col ">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
