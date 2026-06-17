import { ArrowRight, CalendarDays, Flame, Trophy, Users } from 'lucide-react'
import Link from 'next/link'

export type HeroStat = { label: string; value: string }

export type FeaturedTournament = {
  name: string
  clubName: string
  href: string
  dates: string
  teamCount: number
  categoryCount: number
  statusLabel: string
  live: boolean
}

// Iconos para las 4 cifras del hero, en el mismo orden que llegan por props.
const statIcons = [Trophy, Users, Flame, CalendarDays]

export function Hero({
  stats,
  featured,
}: {
  stats: HeroStat[]
  featured: FeaturedTournament | null
}) {
  return (
    <section className="bg-cream px-6 py-14 md:px-12 md:py-16">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
        {/* Columna izquierda */}
        <div className="flex flex-col">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Directorio · Temporada 2026
          </p>

          <h1 className="mt-5 font-heading text-6xl leading-[1.02] tracking-tight text-ink md:text-7xl lg:text-[5.5rem]">
            Todos los{' '}
            <span className="block">
              <em className="italic">torneos.</em>
            </span>
          </h1>

          <p className="mt-6 max-w-md font-serif text-lg italic leading-relaxed text-ink/80">
            Cada torneo de la comunidad en un solo sitio. Filtra por estado,
            encuentra tu categoría e inscríbete antes de que se cierren las
            plazas.
          </p>

          <dl className="mt-auto grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8">
            {stats.map((stat, i) => {
              const Icon = statIcons[i] ?? Trophy
              return (
                <div key={stat.label} className="flex flex-col gap-1.5">
                  <Icon className="size-4 text-ink/40" strokeWidth={1.5} />
                  <dd className="font-heading text-4xl leading-none text-ink tabular-nums">
                    {stat.value}
                  </dd>
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </dt>
                </div>
              )
            })}
          </dl>
        </div>

        {/* Columna derecha — torneo destacado */}
        {featured ? (
          <Link
            href={featured.href}
            className="group flex flex-col rounded-xl bg-forest p-7 text-cream transition-colors hover:bg-forest/95 md:p-9"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, transparent 0 18px, rgba(255,255,255,0.04) 18px 19px)',
            }}
          >
            <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest">
              <span className="flex items-center gap-2 text-lime">
                <span className="size-1.5 rounded-full bg-lime" />
                Destacado · {featured.statusLabel}
              </span>
              <span className="text-cream/55">{featured.dates}</span>
            </div>

            <h2 className="mt-6 font-heading text-5xl leading-[0.95] tracking-tight text-cream md:text-6xl">
              {featured.name}
            </h2>
            <p className="mt-4 max-w-sm font-serif text-base italic leading-relaxed text-cream/70">
              Organiza {featured.clubName}. Revisa categorías, cuadros y
              resultados, e infórmate de cómo inscribirte.
            </p>

            <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-cream/12 pt-6 font-mono">
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-cream/50">
                  Parejas
                </dt>
                <dd className="mt-1 font-heading text-2xl text-cream tabular-nums">
                  {featured.teamCount}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-cream/50">
                  Categorías
                </dt>
                <dd className="mt-1 font-heading text-2xl text-lime tabular-nums">
                  {featured.categoryCount}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-cream/50">
                  Club
                </dt>
                <dd className="mt-1 truncate font-heading text-2xl text-cream">
                  {featured.clubName}
                </dd>
              </div>
            </dl>

            <div className="mt-7 flex items-center justify-between">
              <span className="flex items-center gap-2 rounded-md bg-lime px-5 py-3 font-mono text-sm text-ink transition-colors group-hover:bg-lime/90">
                Ver torneo
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-9 text-center">
            <p className="font-heading text-3xl text-ink">Aún no hay torneos</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Cuando los clubes publiquen sus torneos, aparecerán aquí.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
