import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Card = {
  variant: 'dark' | 'muted'
  ornament: string
  eyebrow: string
  title: string
  description: string
  points: string[]
  cta: string
  href?: string
  disabled?: boolean
}

const cards: Card[] = [
  {
    variant: 'dark',
    ornament: 'C',
    eyebrow: 'Disponible hoy',
    title: 'Para clubes',
    description:
      'Monta torneos y ligas, programa pistas, gestiona reservas, jugadores y coaches desde un único panel.',
    points: [
      'Torneos y ligas con cuadros automáticos',
      'Programación de pistas y scoring en vivo',
      'Reservas y clases con tus coaches',
    ],
    cta: 'Empezar como club',
    href: '/registro/club',
  },
  {
    variant: 'muted',
    ornament: 'J',
    eyebrow: 'Próximamente',
    title: 'Para jugadores',
    description:
      'Sigue tus torneos, encuentra pareja, reserva pista y guarda tu ranking temporada tras temporada.',
    points: [
      'Inscripción y búsqueda de pareja',
      'Avisos antes de salir a pista',
      'Ranking e historial personal',
    ],
    cta: 'En preparación',
    disabled: true,
  },
]

export function Audience() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((card) => (
          <AudienceCard key={card.title} card={card} />
        ))}
      </div>
    </section>
  )
}

function AudienceCard({ card }: { card: Card }) {
  const isDark = card.variant === 'dark'

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-lg p-8 md:p-10',
        isDark
          ? 'bg-forest text-cream'
          : 'border border-foreground/10 bg-card text-foreground',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-6 -bottom-10 select-none font-serif text-[16rem] italic leading-none',
          isDark ? 'text-cream/5' : 'text-foreground/[0.04]',
        )}
      >
        {card.ornament}
      </span>

      <div className="relative flex flex-col gap-5">
        <p
          className={cn(
            'flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest',
            isDark ? 'text-lime' : 'text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'inline-block size-1.5 rounded-full',
              isDark ? 'bg-lime' : 'bg-muted-foreground/50',
            )}
          />
          {card.eyebrow}
        </p>

        <h2
          className={cn(
            'font-serif text-3xl leading-tight tracking-tight md:text-4xl',
            isDark ? 'text-cream' : 'text-foreground',
          )}
        >
          {card.title}
        </h2>

        <p
          className={cn(
            'max-w-md text-sm leading-snug md:text-base',
            isDark ? 'text-cream/70' : 'text-muted-foreground',
          )}
        >
          {card.description}
        </p>

        <ul className="flex flex-col gap-2.5 pt-1">
          {card.points.map((point) => (
            <li
              key={point}
              className={cn(
                'flex items-start gap-2.5 text-sm',
                isDark ? 'text-cream/80' : 'text-foreground/80',
              )}
            >
              <ArrowRight
                className={cn(
                  'mt-0.5 size-3.5 shrink-0',
                  isDark ? 'text-lime' : 'text-terracotta',
                )}
              />
              {point}
            </li>
          ))}
        </ul>

        {card.href && !card.disabled ? (
          <Link
            href={card.href}
            className={cn(
              'group/cta mt-2 inline-flex w-fit items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest',
              isDark ? 'text-cream' : 'text-terracotta',
            )}
          >
            {card.cta}
            <ArrowRight className="size-3.5 transition-transform group-hover/cta:translate-x-0.5" />
          </Link>
        ) : (
          <p className="mt-2 inline-flex w-fit items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
            {card.cta}
          </p>
        )}
      </div>
    </article>
  )
}
