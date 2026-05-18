import { ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'

export function Hero() {
  return (
    <section className="flex flex-col md:flex-row py-12 md:py-16 w-full max-w-7xl mx-auto h-screen">
      <div className="flex-2 flex flex-col justify-center items-start gap-8">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <span className="inline-block w-6 border-t border-muted-foreground/60" />
          <span>Nº 042</span>
          <span aria-hidden>·</span>
          <span>Primavera 2026</span>
          <span aria-hidden>·</span>
          <span className="text-terracotta flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-terracotta" />
            12 torneos en curso
          </span>
        </p>

        <h1 className="font-serif font-bold leading-[0.95] tracking-tight text-foreground text-6xl sm:text-7xl md:text-9xl">
          La cancha,
          <br />
          <span className="text-foreground/70">el cuadro,</span>
          <br />
          la <span className="text-terracotta">bandeja</span>
          <span className="text-foreground">.</span>
        </h1>

        <p className="font-serif italic text-lg md:text-xl text-foreground/80 max-w-xl leading-snug">
          Plataforma editorial para clubes que organizan torneos de pádel.
          Inscripciones, cuadros, programación y resultados — en un solo gesto.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            className="bg-terracotta text-cream hover:bg-terracotta/90 rounded-md"
          >
            Ver torneos abiertos <ArrowRight />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-md border-foreground/20"
          >
            Soy un club
          </Button>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground ml-2">
            312 clubes inscritos · 18.420 jugadores
          </span>
        </div>
      </div>
      <div className="flex-1 bg-green-400 flex items-center justify-center w-full rounded-lg"></div>
    </section>
  )
}
