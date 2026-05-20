import { BrandCarousel } from '@/components/home/brand-carousel'
import { CTA } from '@/components/home/cta'
import { FAQ } from '@/components/home/faq'
import { Features } from '@/components/home/features'
import { Hero } from '@/components/home/hero'
import { OnLive } from '@/components/home/on-live'

export default function Home() {
  return (
    <div className="space-y-16">
      <Hero />
      <BrandCarousel />
      <Features />
      <OnLive />
      <FAQ />
      <CTA />
    </div>
  )
}
