import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '../ui/button'

export function ClosingCta() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <article className="relative overflow-hidden rounded-lg bg-ink p-8 text-cream md:p-12">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -bottom-14 select-none font-serif text-[18rem] italic leading-none text-cream/5"
        >
          B
        </span>

        <div className="relative flex flex-col gap-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-lime">
            ● Empieza hoy
          </p>
          <h2 className="max-w-2xl font-serif text-3xl leading-[1.05] tracking-tight text-cream md:text-5xl">
            Monta tu primer torneo{' '}
            <span className="italic text-cream/85">esta misma semana.</span>
          </h2>
          <p className="max-w-xl text-sm leading-snug text-cream/70 md:text-base">
            Crea la cuenta de tu club, da de alta tus pistas y abre
            inscripciones. Sin instalaciones ni configuraciones eternas.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="w-full rounded-md bg-cream text-ink hover:bg-cream/90 sm:w-auto"
            >
              <Link href="/registro/club">
                Crear cuenta de club <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-md border-cream/20 bg-transparent text-cream hover:bg-cream/10 hover:text-cream sm:w-auto"
            >
              <Link href="/torneos">Ver torneos en curso</Link>
            </Button>
          </div>
        </div>
      </article>
    </section>
  )
}
