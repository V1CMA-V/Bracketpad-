type Tone = 'live' | 'standing' | 'out'

type Seed = {
  seed: string
  status: string
  tone: Tone
  pair: string
  initials: [string, string]
  club: string
  players: string
  form: ('W' | 'L')[]
  ranking: string
  footer: string
  cuota: string
}

const seeds: Seed[] = [
  {
    seed: '01',
    status: 'En juego',
    tone: 'live',
    pair: 'Puig / Marín',
    initials: ['P', 'M'],
    club: 'C. Marítimo',
    players: 'Iván Puig / Diego Marín',
    form: ['W', 'W', 'W', 'W', 'L'],
    ranking: '2480',
    footer: 'Cuartos en juego',
    cuota: '1.8',
  },
  {
    seed: '02',
    status: 'En pie',
    tone: 'standing',
    pair: 'Asensi / Toro',
    initials: ['A', 'T'],
    club: 'Padel Nord',
    players: 'Marc Asensi / Pau Toro',
    form: ['W', 'L', 'W', 'W', 'W'],
    ranking: '2310',
    footer: 'Espera rival cuartos',
    cuota: '2.1',
  },
  {
    seed: '03',
    status: 'En pie',
    tone: 'standing',
    pair: 'Bru / Pla',
    initials: ['B', 'P'],
    club: 'Olimpic',
    players: 'Lluís Bru / Toni Pla',
    form: ['W', 'L', 'W', 'W', 'W'],
    ranking: '2140',
    footer: 'Cuartos · 17:00',
    cuota: '4.5',
  },
  {
    seed: '04',
    status: 'Eliminada',
    tone: 'out',
    pair: 'García / Ros',
    initials: ['G', 'R'],
    club: 'Mediterráneo',
    players: 'Jaime García / Álex Ros',
    form: ['W', 'W', 'W', 'L'],
    ranking: '2090',
    footer: 'Eliminado · Cuartos',
    cuota: '—',
  },
]

function SeedCard({ data }: { data: Seed }) {
  const dark = data.tone === 'live'
  const out = data.tone === 'out'

  const card = dark
    ? 'bg-ink text-cream'
    : 'bg-card text-ink border border-border'
  const label = dark ? 'text-lime' : 'text-muted-foreground'
  const muted = dark ? 'text-cream/45' : 'text-muted-foreground'
  const divider = dark ? 'border-cream/12' : 'border-border'
  const players = dark ? 'text-cream/80' : 'text-ink/80'
  const ranking = dark ? 'text-cream' : 'text-ink'
  const status =
    data.tone === 'live'
      ? 'text-lime'
      : data.tone === 'out'
        ? 'text-terracotta'
        : muted

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-lg p-5 ${card} ${
        out ? 'opacity-65' : ''
      }`}
    >
      {/* Marca de agua */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 font-heading leading-none ${
          dark ? 'text-cream/[0.05]' : 'text-ink/[0.04]'
        } text-[11rem]`}
      >
        {data.seed.replace(/^0/, '')}
      </span>

      <div className="relative flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between font-mono text-xs tracking-widest uppercase">
          <span className={label}>Seed · {data.seed}</span>
          <span className={`flex items-center gap-1.5 ${status}`}>
            {data.tone === 'live' && <span className="text-[0.7em]">●</span>}
            {data.status}
          </span>
        </div>

        {/* Identidad */}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex">
            <span
              className={`flex size-9 items-center justify-center rounded-full bg-terracotta font-mono text-xs text-cream ring-2 ${
                dark ? 'ring-ink' : 'ring-card'
              }`}
            >
              {data.initials[0]}
            </span>
            <span
              className={`-ml-3 flex size-9 items-center justify-center rounded-full bg-forest font-mono text-xs text-cream ring-2 ${
                dark ? 'ring-ink' : 'ring-card'
              }`}
            >
              {data.initials[1]}
            </span>
          </div>
          <div className="leading-tight">
            <h3 className="font-heading text-2xl text-current">{data.pair}</h3>
            <p
              className={`font-mono text-[11px] tracking-widest uppercase ${muted}`}
            >
              {data.club}
            </p>
          </div>
        </div>

        {/* Jugadores */}
        <p className={`mt-4 text-sm ${players}`}>{data.players}</p>

        {/* Forma + ranking */}
        <div
          className={`mt-5 flex items-end justify-between border-t pt-4 ${divider}`}
        >
          <div>
            <p
              className={`font-mono text-[11px] tracking-widest uppercase ${muted}`}
            >
              Forma · Últimos 5
            </p>
            <div className="mt-2 flex gap-1">
              {data.form.map((r, i) => (
                <span
                  key={i}
                  className={`flex size-5 items-center justify-center rounded-sm font-mono text-[10px] ${
                    r === 'W'
                      ? 'bg-lime text-ink'
                      : dark
                        ? 'bg-cream/10 text-cream/35'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p
              className={`font-mono text-[11px] tracking-widest uppercase ${muted}`}
            >
              Ranking
            </p>
            <p className={`font-heading text-3xl leading-none ${ranking}`}>
              {data.ranking}
              <span className={`ml-1 font-mono text-xs ${muted}`}>pts</span>
            </p>
          </div>
        </div>

        {/* Pie */}
        <div
          className={`mt-4 flex items-center justify-between border-t pt-3 font-mono text-xs tracking-widest uppercase ${divider}`}
        >
          <span className={muted}>{data.footer}</span>
          <span className={dark ? 'text-cream' : 'text-ink'}>
            Cuota {data.cuota}
          </span>
        </div>
      </div>
    </article>
  )
}

export function Favorites() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Favoritas · Cabezas de serie
          </p>
          <h2 className="mt-2 font-heading text-5xl leading-none tracking-tight text-ink md:text-6xl">
            Las cuatro <em className="italic">cabezas de serie.</em>
          </h2>
        </div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          1 eliminada · 3 en pie
        </p>
      </div>

      {/* Tarjetas */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {seeds.map((s) => (
          <SeedCard key={s.seed} data={s} />
        ))}
      </div>
    </section>
  )
}
