type Player = {
  name: string
  initial: string
  position: 'Drive' | 'Revés'
  age: number
  hand: string
  ranking: string
}

type Lineup = {
  pair: string
  club: string
  tone: 'a' | 'b'
  players: [Player, Player]
}

const lineups: Lineup[] = [
  {
    pair: 'Puig / Marín',
    club: 'C. Marítimo · Seed 1',
    tone: 'a',
    players: [
      { name: 'Iván Puig', initial: 'P', position: 'Drive', age: 27, hand: 'Diestro', ranking: '#14' },
      { name: 'Diego Marín', initial: 'M', position: 'Revés', age: 29, hand: 'Zurdo', ranking: '#19' },
    ],
  },
  {
    pair: 'Lozano / Roig',
    club: 'Padel Nord · Seed 12',
    tone: 'b',
    players: [
      { name: 'Bruno Lozano', initial: 'L', position: 'Drive', age: 24, hand: 'Diestro', ranking: '#41' },
      { name: 'Marc Roig', initial: 'R', position: 'Revés', age: 31, hand: 'Diestro', ranking: '#37' },
    ],
  },
]

function PlayerCard({ player, tone }: { player: Player; tone: 'a' | 'b' }) {
  const accent = tone === 'a' ? 'bg-forest' : 'bg-terracotta'
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 items-center justify-center rounded-full font-mono text-sm text-cream ${accent}`}
        >
          {player.initial}
        </span>
        <div>
          <h4 className="font-heading text-lg text-ink">{player.name}</h4>
          <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
            {player.position}
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 font-mono text-xs">
        <div>
          <dt className="text-[10px] tracking-widest text-muted-foreground uppercase">
            Edad
          </dt>
          <dd className="mt-0.5 text-ink">{player.age}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-widest text-muted-foreground uppercase">
            Mano
          </dt>
          <dd className="mt-0.5 text-ink">{player.hand}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-widest text-muted-foreground uppercase">
            Ranking
          </dt>
          <dd className="mt-0.5 text-ink">{player.ranking}</dd>
        </div>
      </dl>
    </div>
  )
}

export function MatchLineups() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      {/* Encabezado */}
      <div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Jugadores · En pista
        </p>
        <h2 className="mt-2 font-heading text-4xl leading-none tracking-tight text-ink md:text-5xl">
          Las cuatro <em className="italic">palas.</em>
        </h2>
      </div>

      {/* Parejas */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {lineups.map((l) => (
          <div key={l.pair}>
            <div className="flex items-center gap-2.5">
              <span
                className={`size-3 rounded-sm ${
                  l.tone === 'a' ? 'bg-forest' : 'bg-terracotta'
                }`}
              />
              <h3 className="font-heading text-2xl text-ink">{l.pair}</h3>
              <span className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                {l.club}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {l.players.map((p) => (
                <PlayerCard key={p.name} player={p} tone={l.tone} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
