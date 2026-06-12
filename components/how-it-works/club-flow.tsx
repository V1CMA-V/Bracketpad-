import {
  Bell,
  CalendarDays,
  GraduationCap,
  LayoutGrid,
  ListOrdered,
  Radio,
  Ticket,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { SectionHeader } from '../ui/section-header'

type Step = {
  number: string
  icon: LucideIcon
  title: string
  description: string
  features: string[]
}

const steps: Step[] = [
  {
    number: '01',
    icon: LayoutGrid,
    title: 'Configura tu club',
    description:
      'Da de alta tus pistas, horarios y datos del club. Es la base sobre la que se apoyan torneos, ligas y reservas.',
    features: ['Pistas', 'Ajustes'],
  },
  {
    number: '02',
    icon: Trophy,
    title: 'Crea torneos y ligas',
    description:
      'Define categorías, formato y calendario. Los cuadros y las clasificaciones se generan y actualizan solos a medida que avanza la competición.',
    features: ['Torneos', 'Ligas'],
  },
  {
    number: '03',
    icon: Users,
    title: 'Gestiona inscripciones',
    description:
      'Centraliza a tus jugadores: inscripciones por categoría, parejas y estado de pago, todo desde la ficha de cada competición.',
    features: ['Jugadores'],
  },
  {
    number: '04',
    icon: CalendarDays,
    title: 'Programa las pistas',
    description:
      'Asigna partidos, clases y reservas a cada pista sin solapamientos. Salta entre días y reorganiza el cuadro cuando haga falta.',
    features: ['Programación'],
  },
  {
    number: '05',
    icon: Ticket,
    title: 'Abre reservas y clases',
    description:
      'Más allá del torneo, gestiona el día a día del club: reservas de pista y clases impartidas por tus coaches.',
    features: ['Reservas', 'Coaches'],
  },
  {
    number: '06',
    icon: Radio,
    title: 'Resultados y avisos',
    description:
      'El marcador se actualiza en vivo y los cambios llegan a jugadores y staff por notificación. El cuadro siempre refleja lo que pasa en pista.',
    features: ['Scoring en vivo', 'Notificaciones'],
  },
]

const iconFor: Record<string, LucideIcon> = {
  Pistas: LayoutGrid,
  Ajustes: LayoutGrid,
  Torneos: Trophy,
  Ligas: ListOrdered,
  Jugadores: Users,
  Programación: CalendarDays,
  Reservas: Ticket,
  Coaches: GraduationCap,
  'Scoring en vivo': Radio,
  Notificaciones: Bell,
}

export function ClubFlow() {
  return (
    <section
      id="club"
      className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20"
    >
      <SectionHeader
        eyebrow="El recorrido · Para clubes"
        title="De la idea al"
        italic="primer saque"
        description="Seis pasos para llevar tu club de pádel al completo. Cada uno corresponde a una sección de tu panel — y todos comparten los mismos datos."
      />

      <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {steps.map((step) => (
          <li key={step.number}>
            <article className="group flex h-full flex-col gap-4 rounded-lg border border-foreground/10 bg-card p-6 transition-colors hover:border-foreground/25">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Paso {step.number}
                </span>
                <span className="inline-flex size-9 items-center justify-center rounded-full border border-foreground/10 text-terracotta transition-colors group-hover:bg-terracotta group-hover:text-cream">
                  <step.icon className="size-4" />
                </span>
              </div>

              <h3 className="font-serif text-2xl leading-tight tracking-tight text-foreground">
                {step.title}
              </h3>

              <p className="text-sm leading-snug text-muted-foreground">
                {step.description}
              </p>

              <ul className="mt-auto flex flex-wrap gap-2 pt-2">
                {step.features.map((feature) => {
                  const Icon = iconFor[feature]
                  return (
                    <li
                      key={feature}
                      className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground/70"
                    >
                      {Icon && <Icon className="size-3" />}
                      {feature}
                    </li>
                  )
                })}
              </ul>
            </article>
          </li>
        ))}
      </ol>
    </section>
  )
}
