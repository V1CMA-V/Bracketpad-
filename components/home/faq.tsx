import { Plus } from 'lucide-react'
import { SectionHeader } from '../ui/section-header'

type FaqItem = {
  number: string
  category: string
  question: string
  answer: string
}

const faqs: FaqItem[] = [
  {
    number: '01',
    category: 'Inscripción',
    question: '¿Cómo me inscribo en un torneo?',
    answer:
      'Elige un torneo con plazas abiertas, selecciona categoría y pareja, y completa el pago en un solo gesto. Recibirás confirmación por email con tu posición en el cuadro en cuanto se cierre el plazo.',
  },
  {
    number: '02',
    category: 'Pareja',
    question: 'Todavía no tengo pareja, ¿puedo inscribirme igual?',
    answer:
      'Sí. Cada torneo abre un tablón de búsqueda de pareja por categoría. Publica tu nivel, horario y club de referencia: nuestro sistema sugiere coincidencias hasta 48 h antes del cierre de inscripciones.',
  },
  {
    number: '03',
    category: 'Cuadros',
    question: '¿Cuándo se publican los cuadros y horarios?',
    answer:
      'En cuanto se cierra el plazo, el cuadro se genera automáticamente respetando siembras y categorías. Los horarios se confirman 24–48 h antes del primer partido y se notifican a ambas parejas.',
  },
  {
    number: '04',
    category: 'Resultados',
    question: '¿Cómo se reporta el resultado de un partido?',
    answer:
      'Cualquiera de las cuatro jugadoras puede introducir el marcador set a set desde la ficha del partido. La pareja contraria confirma con un toque y queda firmado — sin papeleo en pista.',
  },
  {
    number: '05',
    category: 'Clubes',
    question: 'Soy club y quiero organizar mi torneo aquí',
    answer:
      'Dale a "Soy un club" y verifica tus pistas. En menos de un día tienes una página editorial, inscripciones online, cobros y la gestión completa del cuadro. Cobramos solo cuando hay inscritos.',
  },
  {
    number: '06',
    category: 'Pagos',
    question: '¿Qué pasa si se cancela un torneo o no consigo plaza?',
    answer:
      'Reembolso íntegro al método de pago original en 3–5 días hábiles. Si quedas en lista de espera y no entras al cuadro, la devolución se dispara automáticamente al publicarse los cabezas de serie.',
  },
]

export function FAQ() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="grid gap-10 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-4 md:sticky md:top-24 md:self-start">
          <SectionHeader
            eyebrow="Sección · Manual de uso"
            title="Preguntas"
            italic="frecuentes"
            description="Lo esencial para jugadoras, parejas y clubes. Si no encuentras la respuesta, escríbenos — abrimos un nuevo capítulo cada semana."
          />
        </div>

        <ul className="md:col-span-8 flex flex-col">
          {faqs.map((item, i) => (
            <li
              key={item.number}
              className={i === 0 ? 'border-t border-foreground/10' : ''}
            >
              <details className="group border-b border-foreground/10 py-5">
                <summary className="flex cursor-pointer list-none items-start gap-3 sm:gap-6">
                  <span className="hidden w-8 shrink-0 pt-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground sm:inline">
                    {item.number}
                  </span>

                  <div className="flex flex-1 flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
                      {item.category}
                    </span>
                    <span className="font-serif text-xl leading-snug text-foreground sm:text-2xl">
                      {item.question}
                    </span>
                  </div>

                  <span className="mt-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-foreground/15 transition-transform group-open:rotate-45 group-open:bg-ink group-open:text-cream">
                    <Plus className="size-4" />
                  </span>
                </summary>

                <p className="mt-4 max-w-2xl pl-0 font-serif italic text-base leading-relaxed text-foreground/75 sm:pl-14">
                  {item.answer}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
