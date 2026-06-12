import { Heart, Search, Trophy, type LucideIcon } from 'lucide-react'
import { SectionHeader } from '../ui/section-header'

type Item = {
  icon: LucideIcon
  title: string
  description: string
}

const items: Item[] = [
  {
    icon: Search,
    title: 'Inscríbete y busca pareja',
    description:
      'Encuentra torneos con plazas abiertas y completa tu pareja desde el tablón de cada categoría.',
  },
  {
    icon: Trophy,
    title: 'Sigue tu cuadro en vivo',
    description:
      'Marcador en tiempo real y avisos antes de salir a pista, para no perderte ningún partido.',
  },
  {
    icon: Heart,
    title: 'Tu ranking, contigo',
    description:
      'Historial de partidos y evolución de tu pareja, temporada tras temporada.',
  },
]

export function PlayersSoon() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="overflow-hidden rounded-lg border border-foreground/10 bg-muted/40 p-8 md:p-12">
        <SectionHeader
          eyebrow="● En preparación · Para jugadores"
          title="Tu próximo partido,"
          italic="en el bolsillo"
          description="La experiencia para jugadores llegará pronto. Esto es lo que estamos construyendo."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.title}
              className="flex flex-col gap-3 rounded-lg border border-foreground/10 bg-background p-6"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-full border border-foreground/10 text-muted-foreground">
                <item.icon className="size-4" />
              </span>
              <h3 className="font-serif text-xl leading-tight tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="text-sm leading-snug text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
