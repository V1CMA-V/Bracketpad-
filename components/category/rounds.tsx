import { ArrowRight } from 'lucide-react'

type Badge = 'sorpresa' | 'live' | 'prox'

type RoundMatch = {
  teams: [string, string]
  score: string
  note?: string
  badge?: Badge
}

type Day = {
  date: string
  status: string
  live?: boolean
  title: string
  summary: string
  matches: RoundMatch[]
}

const days: Day[] = [
  {
    date: '22 jun',
    status: 'Finalizada',
    title: '32avos · día 1',
    summary: '16 partidos · 5 sorpresas · más largo 2h 14m',
    matches: [
      { teams: ['Puig / Marín', 'Cano / Vera'], score: '6·1 · 6·2' },
      {
        teams: ['Mtz / Vidal', 'Romero / G.'],
        score: '6·4 · 4·6 · 10·8',
        note: '(9) elimina (24) en super TB',
        badge: 'sorpresa',
      },
      {
        teams: ['López / Mas', 'Sanz / Pi'],
        score: '6·4 · 6·4',
        note: '(18) elimina (15)',
        badge: 'sorpresa',
      },
    ],
  },
  {
    date: '24 jun',
    status: 'Finalizada',
    title: 'Octavos · día 3',
    summary: '8 partidos · 3 a tres sets · 12 pto. oro',
    matches: [
      {
        teams: ['Mtz / Vidal', 'Bru / Pla'],
        score: '6·4 · 7·6⁵',
        note: '(9) elimina (8)',
        badge: 'sorpresa',
      },
      { teams: ['Lozano / Reig', 'Verdú / Mas'], score: '6·3 · 6·4' },
      { teams: ['Estruch / D.', 'Asín / Calbo'], score: '6·1 · 7·6³' },
    ],
  },
  {
    date: '25 jun',
    status: 'En curso',
    live: true,
    title: 'Cuartos · hoy',
    summary: '1 partido finalizado · 1 en juego · 2 a las 17:00',
    matches: [
      {
        teams: ['Mtz / Vidal', 'García / Ros'],
        score: '4·6 · 7·6³ · 10-8',
        note: '(5) elimina (4) · 2h 38m',
        badge: 'sorpresa',
      },
      {
        teams: ['Puig / Marín', 'Lozano / Reig'],
        score: '6·4 · 3-6 · 4·3 ●',
        badge: 'live',
      },
      {
        teams: ['Asensi / Toro', 'Roig / Vall'],
        score: '— · 17:00 Central',
        badge: 'prox',
      },
    ],
  },
]

function MatchBadge({ badge }: { badge: Badge }) {
  if (badge === 'prox') {
    return (
      <span className="shrink-0 rounded-sm border border-border px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
        Próx.
      </span>
    )
  }
  return (
    <span className="shrink-0 rounded-sm bg-terracotta px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-cream uppercase">
      {badge === 'live' ? 'Live' : 'Sorpresa'}
    </span>
  )
}

export function Rounds() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Por rondas · Narrativa del cuadro
          </p>
          <h2 className="mt-2 font-heading text-5xl leading-none tracking-tight text-ink md:text-6xl">
            Cómo ha ido <em className="italic">cayendo.</em>
          </h2>
        </div>
        <button className="flex items-center gap-2 font-mono text-xs tracking-widest text-muted-foreground uppercase transition-colors hover:text-ink">
          Ver tabla completa
          <ArrowRight className="size-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Tarjetas por día */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {days.map((day) => (
          <article
            key={day.title}
            className={`rounded-lg border bg-card p-6 ${
              day.live ? 'border-terracotta' : 'border-border'
            }`}
          >
            {/* Cabecera de la tarjeta */}
            <div className="flex items-center justify-between font-mono text-[11px] tracking-widest uppercase">
              <span className="text-muted-foreground">{day.date}</span>
              <span
                className={`flex items-center gap-1.5 ${
                  day.live ? 'text-terracotta' : 'text-muted-foreground'
                }`}
              >
                {day.live && <span className="text-[0.7em]">●</span>}
                {day.status}
              </span>
            </div>

            {/* Título y resumen */}
            <h3 className="mt-3 font-heading text-3xl text-ink">{day.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {day.summary}
            </p>

            {/* Partidos */}
            <div className="mt-5 flex flex-col">
              {day.matches.map((m, i) => (
                <div
                  key={i}
                  className="border-t border-border pt-3.5 pb-3.5 first:border-t-0 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-heading text-[15px] leading-snug text-ink">
                      {m.teams[0]}{' '}
                      <span className="font-sans text-[11px] text-muted-foreground italic">
                        vs.
                      </span>{' '}
                      {m.teams[1]}
                    </p>
                    {m.badge && <MatchBadge badge={m.badge} />}
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {m.score}
                  </p>
                  {m.note && (
                    <p className="mt-0.5 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                      {m.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
