import { Clock, Eye, MapPin, Trophy } from 'lucide-react'

type Side = {
  pair: string
  initials: [string, string]
  club: string
  seed: number
  players: string
}

const teamA: Side = {
  pair: 'Puig / Marín',
  initials: ['P', 'M'],
  club: 'C. Marítimo',
  seed: 1,
  players: 'Iván Puig · Diego Marín',
}

const teamB: Side = {
  pair: 'Lozano / Roig',
  initials: ['L', 'R'],
  club: 'Padel Nord',
  seed: 12,
  players: 'Bruno Lozano · Marc Roig',
}

// Sets: a = teamA games, b = teamB games
const sets = [
  { a: 6, b: 4 },
  { a: 3, b: 6 },
  { a: 4, b: 2, live: true },
]
const game = { a: '40', b: '30' }
const serving: 0 | 1 = 0

const meta = [
  { icon: Trophy, label: 'Cuartos de final · 1ª masculina' },
  { icon: MapPin, label: 'Pista Central' },
  { icon: Clock, label: '1h 38m en juego' },
  { icon: Eye, label: '1.420 siguiendo' },
]

function Avatars({ initials }: { initials: [string, string] }) {
  return (
    <div className="flex shrink-0">
      <span className="flex size-10 items-center justify-center rounded-full bg-terracotta font-mono text-sm text-cream ring-2 ring-ink">
        {initials[0]}
      </span>
      <span className="-ml-3 flex size-10 items-center justify-center rounded-full bg-forest font-mono text-sm text-cream ring-2 ring-ink">
        {initials[1]}
      </span>
    </div>
  )
}

function TeamRow({ team, index }: { team: Side; index: 0 | 1 }) {
  const isServing = serving === index
  return (
    <div className="flex items-center gap-4 py-4">
      {/* Identidad */}
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <Avatars initials={team.initials} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-heading text-2xl text-cream md:text-3xl">
              {team.pair}
            </h2>
            {isServing && (
              <span
                className="size-2 shrink-0 rounded-full bg-lime"
                title="Al saque"
              />
            )}
          </div>
          <p className="font-mono text-[11px] tracking-widest text-cream/45 uppercase">
            Seed {team.seed} · {team.club}
          </p>
        </div>
      </div>

      {/* Sets */}
      <div className="flex items-center gap-1.5">
        {sets.map((s, i) => {
          const own = index === 0 ? s.a : s.b
          const rival = index === 0 ? s.b : s.a
          const won = !s.live && own > rival
          return (
            <span
              key={i}
              className={`flex size-10 items-center justify-center rounded-md font-mono text-lg ${
                s.live
                  ? 'border border-cream/20 text-cream'
                  : won
                    ? 'bg-lime/15 text-lime'
                    : 'text-cream/40'
              }`}
            >
              {own}
            </span>
          )
        })}
        {/* Juego en curso */}
        <span className="ml-1.5 flex size-10 items-center justify-center rounded-md bg-terracotta/90 font-mono text-lg text-cream">
          {index === 0 ? game.a : game.b}
        </span>
      </div>
    </div>
  )
}

export function MatchHero() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      <div className="rounded-2xl bg-ink p-7 text-cream md:p-10">
        {/* Barra superior */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs tracking-widest text-cream/55 uppercase">
            Partido 17 · 25 jun 2026
          </p>
          <span className="flex items-center gap-2 rounded-sm bg-terracotta px-2.5 py-1 font-mono text-[11px] tracking-widest text-cream uppercase">
            <span className="size-1.5 rounded-full bg-cream" />
            En vivo · Set 3
          </span>
        </div>

        {/* Marcador */}
        <div className="mt-5 divide-y divide-cream/10 border-y border-cream/10">
          <TeamRow team={teamA} index={0} />
          <TeamRow team={teamB} index={1} />
        </div>

        {/* Cabecera de columnas de sets */}
        <div className="mt-3 flex justify-end">
          <p className="font-mono text-[11px] tracking-widest text-cream/35 uppercase">
            Set 1 · Set 2 · Set 3 · Juego
          </p>
        </div>

        {/* Meta */}
        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-cream/10 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {meta.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 font-mono text-xs text-cream/65"
            >
              <Icon className="size-4 shrink-0 text-cream/35" strokeWidth={1.5} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
