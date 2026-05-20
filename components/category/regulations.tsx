import {
  Disc3,
  Download,
  Gavel,
  ListChecks,
  Network,
  Target,
  Zap,
} from 'lucide-react'

type Rule = {
  index: string
  icon: typeof Network
  title: string
  body: string
}

const rules: Rule[] = [
  {
    index: '01',
    icon: Network,
    title: 'Formato del cuadro',
    body: 'Eliminatoria directa a 5 rondas. 32 parejas sin repesca; la pareja con mejor ranking encabeza el cuadro como cabeza de serie.',
  },
  {
    index: '02',
    icon: ListChecks,
    title: 'Puntuación',
    body: 'Partidos al mejor de 3 sets. Cada set se juega a 6 juegos con diferencia de 2; con 6-6 se disputa un tie-break a 7 puntos.',
  },
  {
    index: '03',
    icon: Target,
    title: 'Punto de oro',
    body: 'Sin ventajas: al llegar a 40-40 se juega un único punto decisivo y la pareja restadora elige el lado de recepción.',
  },
  {
    index: '04',
    icon: Zap,
    title: 'Super tie-break',
    body: 'El tercer set se resuelve con un super tie-break a 10 puntos, siempre con una diferencia mínima de 2 puntos.',
  },
  {
    index: '05',
    icon: Disc3,
    title: 'Material y pelotas',
    body: 'Pelotas oficiales del torneo con cambio cada 9 juegos. La pala debe estar homologada por la federación.',
  },
  {
    index: '06',
    icon: Gavel,
    title: 'Conducta y sanciones',
    body: 'Tres avisos suponen la pérdida de un juego. No presentarse a la hora fijada implica walkover y eliminación directa.',
  },
]

export function Regulations() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8 mb-10">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Reglamento · Cómo se juega
          </p>
          <h2 className="mt-2 font-heading text-5xl leading-none tracking-tight text-ink md:text-6xl">
            Las reglas del <em className="italic">cuadro.</em>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Lo esencial para seguir la categoría sin dudas. El reglamento
            completo está disponible en PDF.
          </p>
        </div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          6 puntos · v2.1
        </p>
      </div>

      {/* Tarjetas de reglas */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rules.map(({ index, icon: Icon, title, body }) => (
          <article
            key={index}
            className="flex flex-col rounded-lg border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-widest text-terracotta">
                {index}
              </span>
              <Icon className="size-5 text-ink/35" strokeWidth={1.5} />
            </div>
            <h3 className="mt-5 font-heading text-xl text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {body}
            </p>
          </article>
        ))}
      </div>

      {/* Pie */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <button className="flex items-center gap-2 rounded-md bg-ink px-5 py-3 font-mono text-sm text-cream transition-colors hover:bg-ink/90">
          <Download className="size-4" strokeWidth={1.5} />
          Descargar reglamento (PDF)
        </button>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Actualizado · 20 may 2026
        </p>
      </div>
    </section>
  )
}
