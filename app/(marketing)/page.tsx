import { BrandCarousel } from '@/components/home/brand-carousel'
import { CTA } from '@/components/home/cta'
import { FAQ, faqs } from '@/components/home/faq'
import { Features } from '@/components/home/features'
import { Hero } from '@/components/home/hero'
import { OnLive } from '@/components/home/on-live'
import { siteConfig } from '@/lib/site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  // El inicio usa el título por defecto (con marca), así que lo fijamos como
  // absoluto para no duplicar la marca con la plantilla `%s · Bandeja`.
  title: {
    absolute: `${siteConfig.name} · ${siteConfig.tagline}`,
  },
  description: siteConfig.description,
  alternates: { canonical: '/' },
}

export default function Home() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  return (
    <div className="space-y-12 sm:space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Hero />
      <BrandCarousel />
      <Features />
      <OnLive />
      <FAQ />
      <CTA />
    </div>
  )
}
