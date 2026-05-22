import { ArrowRight, Building2, CalendarDays, LayoutGrid, Users } from 'lucide-react'
import Link from 'next/link'

const STATS = [
  { icon: Building2, label: 'Clubs afiliados', value: '32' },
  { icon: LayoutGrid, label: 'Pistas en la red', value: '214' },
  { icon: Users, label: 'Socios activos', value: '11k' },
  { icon: CalendarDays, label: 'Torneos · 2026', value: '96' },
]

export function Hero() {
  return (
    <section className="bg-cream px-6 py-14 md:px-12 md:py-16">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
        {/* Columna izquierda */}
        <div className="flex flex-col">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Directorio · Clubes 2026
          </p>

          <h1 className="mt-5 font-heading text-6xl leading-[1.02] tracking-tight text-ink md:text-7xl lg:text-[5.5rem]">
            Encuentra tu{' '}
            <span className="block">
              <em className="italic">club.</em>
            </span>
          </h1>

          <p className="mt-6 max-w-md font-serif text-lg italic leading-relaxed text-ink/80">
            Todos los clubes de pádel de la comunidad, con sus pistas, torneos y
            comunidad. Busca por nombre o provincia y entra a su ficha.
          </p>

          <dl className="mt-auto grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8">
            {STATS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <Icon className="size-4 text-ink/40" strokeWidth={1.5} />
                <dd className="font-heading text-4xl leading-none text-ink">
                  {value}
                </dd>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        {/* Columna derecha — club destacado */}
        <div
          className="flex flex-col rounded-xl bg-forest p-7 text-cream md:p-9"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent 0 18px, rgba(255,255,255,0.04) 18px 19px)',
          }}
        >
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest">
            <span className="flex items-center gap-2 text-lime">
              <span className="size-1.5 rounded-full bg-lime" />
              Club destacado
            </span>
            <span className="text-cream/55">Valencia</span>
          </div>

          <h2 className="mt-6 font-heading text-5xl leading-[0.95] tracking-tight text-cream md:text-6xl">
            Club Marítimo <em className="italic">del Olivar.</em>
          </h2>
          <p className="mt-4 max-w-sm font-serif text-base italic leading-relaxed text-cream/70">
            Ocho pistas frente al puerto y casa del Open de Verano desde 2008.
            El club con más cuadro de la costa.
          </p>

          <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-cream/12 pt-6 font-mono">
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-cream/50">
                Pistas
              </dt>
              <dd className="mt-1 font-heading text-2xl text-cream">8</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-cream/50">
                Socios
              </dt>
              <dd className="mt-1 font-heading text-2xl text-cream">612</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-cream/50">
                Torneos
              </dt>
              <dd className="mt-1 font-heading text-2xl text-lime">24</dd>
            </div>
          </dl>

          <div className="mt-auto flex items-center justify-between pt-8">
            <Link
              href="/clubs/maritimo-olivar"
              className="flex items-center gap-2 rounded-md bg-lime px-5 py-3 font-mono text-sm text-ink transition-colors hover:bg-lime/90"
            >
              Ver el club
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Link>
            <span className="font-mono text-xs uppercase tracking-widest text-cream/50">
              Fundado en 1978
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
