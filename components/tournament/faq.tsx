import { ArrowRight, Plus } from 'lucide-react'

type Item = {
  index: string
  topic: string
  question: string
  answer: string
}

const ITEMS: Item[] = [
  {
    index: '01',
    topic: 'Inscripción',
    question: '¿Puedo apuntarme aún?',
    answer:
      'Las inscripciones para el Open de Verano cerraron el 20 de junio. Quedan plazas en lista de espera para las categorías 3ª y 4ª — escríbenos a open@maritimoolivar.es y te avisamos si se libera un cuadro.',
  },
  {
    index: '02',
    topic: 'Acceso',
    question: '¿Cuánto cuesta la entrada?',
    answer:
      'La entrada al club es libre durante todo el torneo. Los socios tienen acceso prioritario a la grada de pista central las jornadas de semifinales (27 jun) y final (28 jun) desde las 17:30.',
  },
  {
    index: '03',
    topic: 'Reglamento',
    question: '¿Se juega con punto de oro?',
    answer:
      'Sí. Todos los partidos se disputan al mejor de 3 sets con punto de oro a 40-40. El tercer set se resuelve con Super Tie-Break a 10. Las finales mantienen el mismo formato.',
  },
  {
    index: '04',
    topic: 'Horarios',
    question: '¿Cuándo juega mi pareja?',
    answer:
      'Las órdenes de juego se publican cada día a las 21:00 en bracketpad y en el tablón de la sede. Recibirás un email automático con tu pista y hora si confirmaste tu inscripción.',
  },
  {
    index: '05',
    topic: 'Material',
    question: '¿Qué pelotas se utilizan?',
    answer:
      'Bullpadel Premium Pro, oficiales del circuito. Cada partido estrena un bote nuevo y se cambian de bote al inicio del tercer set. Hay venta en la tienda del club a precio de torneo.',
  },
  {
    index: '06',
    topic: 'WO',
    question: '¿Y si llego tarde?',
    answer:
      'Se aplican 15 minutos de cortesía desde la hora oficial de pista. Pasado ese tiempo el partido se da por perdido (WO). Si la pista se retrasa por el partido anterior, el contador empieza cuando esté libre.',
  },
]

export function FAQ() {
  return (
    <section className="bg-cream px-6 py-16 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Preguntas frecuentes · {ITEMS.length}
            </p>
            <h2 className="mt-3 font-heading text-5xl leading-none text-ink md:text-6xl">
              Antes de <em className="italic">entrar a pista.</em>
            </h2>
            <p className="mt-4 font-mono text-sm text-muted-foreground">
              Si tu duda no está aquí, escríbenos a open@maritimoolivar.es o pregunta en
              recepción.
            </p>
          </div>

          <a
            href="mailto:open@maritimoolivar.es"
            className="inline-flex items-center gap-2 rounded-sm bg-ink px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-cream hover:bg-ink/90 transition-colors"
          >
            Escribir al torneo <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {ITEMS.map((item) => (
            <details
              key={item.index}
              className="group rounded-md border border-border bg-card p-6 transition-colors open:border-ink/40"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    <span>{item.index}</span>
                    <span className="text-ink/30">/</span>
                    <span className="rounded-sm bg-muted/70 px-2 py-0.5 text-ink">
                      {item.topic}
                    </span>
                  </div>
                  <h3 className="font-heading text-2xl leading-tight text-ink">
                    {item.question}
                  </h3>
                </div>
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-cream transition-transform group-open:rotate-45 group-open:bg-terracotta group-open:text-cream group-open:border-terracotta"
                >
                  <Plus className="h-4 w-4" />
                </span>
              </summary>

              <p className="mt-4 max-w-md font-serif text-base italic leading-relaxed text-ink/80">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
