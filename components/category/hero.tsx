import {
  ArrowRight,
  CalendarDays,
  Disc3,
  LayoutGrid,
  Network,
  Trophy,
  Users,
} from 'lucide-react'

const stats = [
  { icon: Users, label: '32 parejas · 64 jugadores' },
  { icon: Network, label: 'Eliminatoria · 5 rondas' },
  { icon: CalendarDays, label: '22 — 28 jun · 7 días' },
  { icon: LayoutGrid, label: 'Central · Pacífico · Atlántico' },
  { icon: Disc3, label: '2 sets · super TB · pto. oro' },
  { icon: Trophy, label: '€1.200 · trofeo Olivar', accent: true },
]

const rounds = [
  {
    code: 'R32',
    name: 'Treintaidosavos',
    progress: 100,
    value: '16/16',
    tone: 'done',
  },
  { code: 'R16', name: 'Octavos', progress: 100, value: '8/8', tone: 'done' },
  { code: 'QF', name: 'Cuartos', progress: 25, value: '1/4', tone: 'active' },
  { code: 'SF', name: 'Semis', progress: 0, value: '27 jun', tone: 'upcoming' },
  { code: 'F', name: 'Final', progress: 0, value: '28 jun', tone: 'upcoming' },
] as const

export function Hero(_props: { name: string }) {
  return (
    <section className="bg-cream px-6 py-12 md:px-8 md:py-14 mx-auto max-w-[1600px]">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
        {/* ---- Columna izquierda ---- */}
        <div className="flex flex-col">
          {/* Etiqueta superior */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs tracking-widest uppercase">
            <span className="text-muted-foreground">— Categoría 01 / 06</span>
            <span className="text-muted-foreground">·</span>
            <span className="rounded-sm border border-ink/20 px-1.5 py-0.5 text-ink">
              M · 1ª
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1.5 text-terracotta">
              <span className="text-[0.7em]">●</span> Cuartos en juego
            </span>
          </div>

          {/* Título */}
          <h1 className="mt-6 font-heading text-6xl leading-[0.95] tracking-tight text-ink md:text-7xl lg:text-[8rem]">
            1<sup className="text-[0.45em] align-super">ª</sup>{' '}
            <em className="italic">masculina.</em>
          </h1>

          {/* Descripción */}
          <p className="mt-6 max-w-md font-heading text-lg leading-relaxed text-muted-foreground italic md:text-xl">
            El cuadro reina del Open. Treinta y dos parejas, eliminatoria
            directa, dos sets y super tiebreak — y un solo trofeo esperando el
            domingo en pista central.
          </p>

          {/* Datos */}
          <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-3 font-mono text-[13px] sm:grid-cols-2 xl:grid-cols-3">
            {stats.map(({ icon: Icon, label, accent }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 ${
                  accent ? 'text-terracotta' : 'text-ink/75'
                }`}
              >
                <Icon
                  className={`size-4 shrink-0 ${
                    accent ? 'text-ochre' : 'text-ink/40'
                  }`}
                  strokeWidth={1.5}
                />
                <span>{label}</span>
              </div>
            ))}
          </dl>

          {/* Acciones */}
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button className="flex items-center gap-2 rounded-md bg-ink px-5 py-3 font-mono text-sm text-cream transition-colors hover:bg-ink/90">
              Ver cuadro completo
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </button>
            <button className="rounded-md border border-ink/25 px-5 py-3 font-mono text-sm text-ink transition-colors hover:bg-ink/5">
              Descargar PDF
            </button>
            <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              1.420 siguen esta categoría
            </span>
          </div>
        </div>

        {/* ---- Columna derecha: avance del cuadro ---- */}
        <div className="flex flex-col rounded-xl bg-forest p-7 text-cream md:p-9">
          {/* Cabecera de la tarjeta */}
          <div className="flex items-center justify-between font-mono text-xs tracking-widest uppercase">
            <span className="text-lime">Avance del cuadro</span>
            <span className="text-cream/55">25 partidos · 6 restantes</span>
          </div>

          {/* Porcentaje */}
          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-heading text-7xl leading-none text-lime md:text-8xl">
              81%
            </span>
            <span className="font-mono text-xs tracking-widest text-cream/70 uppercase">
              Completado
            </span>
          </div>

          {/* Rondas */}
          <div className="mt-8 flex flex-col gap-5">
            {rounds.map((round) => {
              const active = round.tone === 'active'
              return (
                <div key={round.code} className="flex items-center gap-4">
                  <div className="w-24 shrink-0">
                    <div
                      className={`font-mono text-xs tracking-widest uppercase ${
                        active ? 'text-lime' : 'text-cream/55'
                      }`}
                    >
                      {round.code}
                    </div>
                    <div
                      className={`font-heading text-sm italic ${
                        active ? 'text-cream' : 'text-cream/65'
                      }`}
                    >
                      {round.name}
                    </div>
                  </div>

                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream/12">
                    <div
                      className={`h-full rounded-full ${
                        active ? 'bg-lime' : 'bg-cream/65'
                      }`}
                      style={{ width: `${round.progress}%` }}
                    />
                  </div>

                  <div
                    className={`w-16 shrink-0 text-right font-mono text-xs tracking-wide ${
                      active ? 'text-lime' : 'text-cream/55'
                    }`}
                  >
                    {round.value}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pie de la tarjeta */}
          <div className="mt-auto flex items-center justify-between border-t border-cream/12 pt-6 font-mono text-xs tracking-widest uppercase">
            <span className="flex items-center gap-2 text-lime">
              <span className="text-[0.7em]">●</span> Siguiente: Cuartos 14:00
            </span>
            <span className="text-cream/50">3 días para la final</span>
          </div>
        </div>
      </div>
    </section>
  )
}
