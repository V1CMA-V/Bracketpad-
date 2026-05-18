import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-16 md:py-24 lg:flex-row lg:items-center lg:gap-16">
      <div className="flex flex-1 flex-col gap-8">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <span className="inline-block w-6 border-t border-muted-foreground/60" />
          <span>Error 404</span>
          <span aria-hidden>·</span>
          <span className="text-terracotta flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-terracotta" />
            Fuera de pista
          </span>
        </p>

        <div className="flex flex-col gap-2">
          <p
            className="font-serif text-[clamp(6rem,18vw,11rem)] leading-[0.85] tracking-tight text-foreground/15"
            aria-hidden
          >
            404
          </p>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl -mt-16 sm:-mt-20 md:-mt-24">
            Esta jugada no está
            <br />
            <span className="italic text-foreground/75">en el cuadro.</span>
          </h1>
        </div>

        <p className="font-serif italic text-lg text-foreground/80 max-w-lg leading-snug">
          La URL que buscas no existe, cambió de categoría o el torneo ya cerró
          inscripciones. Vuelve a la bandeja principal o explora torneos abiertos.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-terracotta text-cream hover:bg-terracotta/90 rounded-md"
          >
            <Link href="/">
              Volver al inicio <ArrowLeft />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-md border-foreground/20"
          >
            <Link href="/torneos">
              Ver torneos abiertos <ArrowRight />
            </Link>
          </Button>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Código · BP-404 · Partido no encontrado
        </p>
      </div>

      <aside
        className="relative flex-1 rounded-lg border border-foreground/10 bg-card p-8 md:p-10"
        aria-hidden
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-6">
          Cuadro · vista previa
        </p>

        <div className="flex flex-col gap-4">
          <BracketRow label="SF · Pista 1" home="Open de Verano" away="Trofeo Olivar" />
          <BracketRow
            label="SF · Pista 2"
            home="Circuito Costa"
            away="—"
            missing
          />
          <div className="my-2 border-t border-dashed border-foreground/15" />
          <BracketRow label="Final" home="?" away="?" ghost />
        </div>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-widest text-terracotta">
          ● Falta un emparejamiento
        </p>

        <span className="pointer-events-none absolute -right-4 -bottom-6 font-serif italic text-[10rem] leading-none text-foreground/4 select-none">
          ?
        </span>
      </aside>
    </section>
  )
}

function BracketRow({
  label,
  home,
  away,
  missing,
  ghost,
}: {
  label: string
  home: string
  away: string
  missing?: boolean
  ghost?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="grid grid-cols-2 gap-2">
        <span
          className={`rounded-md border px-3 py-2 text-sm ${
            ghost
              ? 'border-dashed border-foreground/15 text-muted-foreground'
              : 'border-foreground/10 bg-background text-foreground'
          }`}
        >
          {home}
        </span>
        <span
          className={`rounded-md border px-3 py-2 text-sm ${
            missing
              ? 'border-dashed border-terracotta/40 bg-terracotta/5 text-terracotta'
              : ghost
                ? 'border-dashed border-foreground/15 text-muted-foreground'
                : 'border-foreground/10 bg-background text-foreground'
          }`}
        >
          {away}
        </span>
      </div>
    </div>
  )
}
