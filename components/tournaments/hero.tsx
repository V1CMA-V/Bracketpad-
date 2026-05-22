import { ArrowRight, CalendarDays, Flame, Trophy, Users } from 'lucide-react'

const STATS = [
  { icon: Trophy, label: 'Torneos en cartelera', value: '18' },
  { icon: Users, label: 'Inscripción abierta', value: '07' },
  { icon: Flame, label: 'En juego ahora', value: '04' },
  { icon: CalendarDays, label: 'En premios · 2026', value: '€48k' },
]

export function Hero() {
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
            Cada cuadro abierto de la comunidad en un solo sitio. Filtra por
            estado, encuentra tu categoría e inscríbete antes de que se cierren
            las plazas.
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

        {/* Columna derecha — torneo destacado */}
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
              Destacado · En juego
            </span>
            <span className="text-cream/55">15 — 28 Jun</span>
          </div>

          <h2 className="mt-6 font-heading text-5xl leading-[0.95] tracking-tight text-cream md:text-6xl">
            Open de <em className="italic">Verano.</em>
          </h2>
          <p className="mt-4 max-w-sm font-serif text-base italic leading-relaxed text-cream/70">
            La cita grande del litoral. Ocho categorías, cuadro a 128 parejas y
            la final el domingo en pista central.
          </p>

          <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-cream/12 pt-6 font-mono">
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-cream/50">
                Parejas
              </dt>
              <dd className="mt-1 font-heading text-2xl text-cream">128</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-cream/50">
                Premio
              </dt>
              <dd className="mt-1 font-heading text-2xl text-lime">€3.500</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-cream/50">
                Sede
              </dt>
              <dd className="mt-1 font-heading text-2xl text-cream">Olivar</dd>
            </div>
          </dl>

          {/* Avance del cuadro */}
          <div className="mt-7">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-cream/55">
              <span>Cuadro completado</span>
              <span className="text-lime">81%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream/12">
              <div
                className="h-full rounded-full bg-lime"
                style={{ width: '81%' }}
              />
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <button className="flex items-center gap-2 rounded-md bg-lime px-5 py-3 font-mono text-sm text-ink transition-colors hover:bg-lime/90">
              Ver en directo
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </button>
            <span className="font-mono text-xs uppercase tracking-widest text-cream/50">
              Final · dom 28 jun
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
