import { Trophy } from 'lucide-react'

type Title = {
  year: string
  competition: string
  category: string
  partner: string
  result: 'Campeón' | 'Finalista'
}

const TITLES: Title[] = [
  { year: '2026', competition: 'Trofeo Olivar', category: '1ª masculina', partner: 'Diego Marín', result: 'Campeón' },
  { year: '2026', competition: 'Liga Mediterránea · Invierno', category: '1ª masculina', partner: 'Diego Marín', result: 'Campeón' },
  { year: '2025', competition: 'Open de Verano', category: '1ª masculina', partner: 'Diego Marín', result: 'Campeón' },
  { year: '2025', competition: 'Circuito Costa Azahar', category: '1ª masculina', partner: 'Adrián Soler', result: 'Finalista' },
  { year: '2024', competition: 'Máster Comunidad Valenciana', category: '2ª masculina', partner: 'Adrián Soler', result: 'Campeón' },
  { year: '2023', competition: 'Trofeo Olivar', category: '2ª masculina', partner: 'Adrián Soler', result: 'Finalista' },
]

export function Palmares() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Palmarés · 8 campeonatos · 3 finales
          </p>
          <h2 className="mt-2 font-heading text-4xl leading-none tracking-tight text-ink md:text-5xl">
            Lo que ha <em className="italic">ganado.</em>
          </h2>
        </div>
      </div>

      <ol className="mt-8 border-l border-border">
        {TITLES.map((t, i) => {
          const champ = t.result === 'Campeón'
          return (
            <li key={i} className="relative pb-8 pl-8 last:pb-0">
              <span
                className={`absolute -left-[6.5px] top-1.5 size-3 rounded-full ring-4 ring-background ${
                  champ ? 'bg-terracotta' : 'bg-muted-foreground'
                }`}
              />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  {t.year} · {t.category}
                </span>
                <span
                  className={`flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${
                    champ
                      ? 'bg-terracotta text-cream'
                      : 'border border-border text-muted-foreground'
                  }`}
                >
                  {champ && <Trophy className="size-2.5" strokeWidth={1.5} />}
                  {t.result}
                </span>
              </div>
              <p className="mt-1.5 font-heading text-xl text-ink">
                {t.competition}
              </p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                Con {t.partner}
              </p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
