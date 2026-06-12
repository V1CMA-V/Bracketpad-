import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '../ui/button'

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="flex flex-col gap-8">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs">
          <span className="hidden w-6 border-t border-muted-foreground/60 sm:inline-block" />
          <span>Manual de uso</span>
          <span aria-hidden>·</span>
          <span>Edición club</span>
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1.5 text-terracotta">
            <span className="inline-block size-1.5 rounded-full bg-terracotta" />
            Jugadores · próximamente
          </span>
        </p>

        <h1 className="max-w-4xl font-serif font-bold leading-[0.95] tracking-tight text-foreground text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
          Cómo
          <br />
          <span className="text-foreground/70">funciona</span>
          <span className="text-terracotta">.</span>
        </h1>

        <p className="max-w-2xl font-serif text-lg italic leading-snug text-foreground/80 md:text-xl">
          Una sola plataforma para que un club organice su pádel de principio a
          fin — torneos, ligas, pistas, reservas y clases. Aquí te contamos el
          recorrido completo, paso a paso.
        </p>

        <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            asChild
            size="lg"
            className="w-full rounded-md bg-terracotta text-cream hover:bg-terracotta/90 sm:w-auto"
          >
            <Link href="/registro/club">
              Empezar como club <ArrowRight />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full rounded-md border-foreground/20 sm:w-auto"
          >
            <Link href="#club">Ver el recorrido</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
