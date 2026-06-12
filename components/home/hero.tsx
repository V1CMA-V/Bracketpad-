import { ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'

export function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 md:h-screen md:flex-row md:gap-12 md:py-16">
      <div className="flex flex-2 flex-col items-start justify-center gap-6 sm:gap-8">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs">
          <span className="hidden w-6 border-t border-muted-foreground/60 sm:inline-block" />
          <span>Nº 042</span>
          <span aria-hidden>·</span>
          <span>Primavera 2026</span>
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1.5 text-terracotta">
            <span className="inline-block size-1.5 rounded-full bg-terracotta" />
            12 torneos en curso
          </span>
        </p>

        <h1 className="font-serif font-bold leading-[0.95] tracking-tight text-foreground text-6xl sm:text-7xl md:text-8xl lg:text-9xl">
          La cancha,
          <br />
          <span className="text-foreground/70">el cuadro,</span>
          <br />
          la <span className="text-terracotta">bandeja</span>
          <span className="text-foreground">.</span>
        </h1>

        <p className="max-w-xl font-serif text-lg italic leading-snug text-foreground/80 md:text-xl">
          Plataforma editorial para clubes que organizan torneos de pádel.
          Inscripciones, cuadros, programación y resultados — en un solo gesto.
        </p>

        <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            size="lg"
            className="w-full rounded-md bg-terracotta text-cream hover:bg-terracotta/90 sm:w-auto"
          >
            Ver torneos abiertos <ArrowRight />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full rounded-md border-foreground/20 sm:w-auto"
          >
            Soy un club
          </Button>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:ml-2 sm:text-xs">
            312 clubes inscritos · 18.420 jugadores
          </span>
        </div>
      </div>

      <HeroBoard />
    </section>
  )
}

function HeroBoard() {
  return (
    <div
      className="relative hidden flex-1 flex-col justify-between overflow-hidden rounded-lg bg-forest p-6 text-cream md:flex"
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, transparent 0 22px, rgba(255,255,255,0.04) 22px 23px)',
      }}
    >
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-cream/70">
        <span className="flex items-center gap-2 text-lime">
          <span className="size-1.5 rounded-full bg-lime" />
          En vivo · Pista central
        </span>
        <span>2ª M · Cuartos</span>
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="select-none font-serif text-[12rem] italic leading-none text-cream/5">
          042
        </span>
      </div>

      <div className="relative flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-serif text-3xl leading-none text-cream">
            García / Ros
          </span>
          <span className="font-mono text-3xl text-lime">6 · 3</span>
        </div>
        <div className="h-px bg-cream/10" />
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-serif text-3xl italic leading-none text-cream/60">
            Bru / Pla
          </span>
          <span className="font-mono text-3xl text-cream/50">4 · 5</span>
        </div>

        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-cream/50">
          Open de Verano · Club Marítimo del Olivar
        </p>
      </div>
    </div>
  )
}
