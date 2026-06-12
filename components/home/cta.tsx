import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

type Stat = { value: string; label: string }

type CtaCardProps = {
  variant: 'dark' | 'light'
  eyebrow: string
  title: React.ReactNode
  italic: string
  description: string
  stats: Stat[]
  cta: string
  ornament: string
}

function CtaCard({
  variant,
  eyebrow,
  title,
  italic,
  description,
  stats,
  cta,
  ornament,
}: CtaCardProps) {
  const isDark = variant === 'dark'

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-lg p-8 md:p-10 min-h-[280px]',
        isDark ? 'bg-forest text-cream' : 'bg-card text-foreground border border-foreground/10',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-6 -bottom-10 font-serif italic text-[18rem] leading-none select-none',
          isDark ? 'text-cream/5' : 'text-foreground/5',
        )}
      >
        {ornament}
      </span>

      <div className="relative flex h-full flex-col gap-6">
        <p
          className={cn(
            'font-mono text-[11px] uppercase tracking-widest',
            isDark ? 'text-lime' : 'text-terracotta',
          )}
        >
          {eyebrow}
        </p>

        <h3
          className={cn(
            'font-serif text-3xl md:text-4xl leading-[1.05] tracking-tight max-w-md',
            isDark ? 'text-cream' : 'text-foreground',
          )}
        >
          {title}{' '}
          <span className={cn('italic', isDark ? 'text-cream/85' : 'text-foreground/85')}>
            {italic}
          </span>
        </h3>

        <p
          className={cn(
            'max-w-md text-sm md:text-base leading-snug',
            isDark ? 'text-cream/70' : 'text-muted-foreground',
          )}
        >
          {description}
        </p>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pt-4">
          <dl className="flex flex-wrap gap-x-8 gap-y-3">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <dt
                  className={cn(
                    'order-2 font-mono text-[10px] uppercase tracking-widest',
                    isDark ? 'text-cream/60' : 'text-muted-foreground',
                  )}
                >
                  {s.label}
                </dt>
                <dd
                  className={cn(
                    'order-1 font-serif text-3xl leading-none',
                    isDark ? 'text-cream' : 'text-foreground',
                  )}
                >
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          <Button
            className={cn(
              'h-10 rounded-md px-5 font-medium',
              isDark
                ? 'bg-cream text-ink hover:bg-cream/90'
                : 'bg-ink text-cream hover:bg-ink/90',
            )}
          >
            {cta} <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  )
}

export function CTA() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid gap-6 md:grid-cols-2">
        <CtaCard
          variant="dark"
          ornament="C"
          eyebrow="Para clubes"
          title="Crea un torneo"
          italic="en doce minutos."
          description="Cuadros, inscripciones, programación de pistas, scoring en vivo y comunicación con jugadores — todo en un único panel."
          stats={[
            { value: '312', label: 'Clubes' },
            { value: '4.820', label: 'Torneos' },
            { value: '98%', label: 'Cuadros sin retraso' },
          ]}
          cta="Empezar gratis"
        />
        <CtaCard
          variant="light"
          ornament="J"
          eyebrow="Para jugadores"
          title="Tu próximo partido,"
          italic="en el bolsillo."
          description="Sigue el cuadro en vivo, recibe avisos antes de salir a pista y registra tu ranking de pareja temporada tras temporada."
          stats={[
            { value: '18.420', label: 'Jugadores' },
            { value: '26.3k', label: 'Partidos disputados' },
            { value: '4,9★', label: 'Valoración media' },
          ]}
          cta="Crear mi ficha"
        />
      </div>
    </section>
  )
}
