'use client'

import { useState } from 'react'

type Team = { name: string; seed?: number }
type Match = {
  a: Team
  b: Team
  score?: string
  winner?: 0 | 1
  status?: string
  live?: boolean
}

const r32: Match[] = [
  { a: { name: 'Puig / Marín', seed: 1 }, b: { name: 'Caro / Vera', seed: 32 }, score: '6-1 6-2', winner: 0 },
  { a: { name: 'Hidalgo / Ll.', seed: 16 }, b: { name: 'Toro / Gil', seed: 17 }, score: '7-5 6-4', winner: 0 },
  { a: { name: 'Bru / Pla', seed: 8 }, b: { name: 'Salút / Rey', seed: 25 }, score: '6-3 6-2', winner: 0 },
  { a: { name: 'Mtz / Valid', seed: 9 }, b: { name: 'Romero / G.', seed: 24 }, score: '6-4 4-6 10-8', winner: 0 },
  { a: { name: 'García / Ros', seed: 4 }, b: { name: 'Bonet / Mir', seed: 29 }, score: '6-2 6-1', winner: 0 },
  { a: { name: 'Pons / Lara', seed: 13 }, b: { name: 'Clement / S.', seed: 20 }, score: '7-6 4-6 10-7', winner: 0 },
  { a: { name: 'Verdú / Mas', seed: 5 }, b: { name: 'Orti / Vidal', seed: 28 }, score: '6-4 6-4', winner: 0 },
  { a: { name: 'Lozano / Roig', seed: 12 }, b: { name: 'Vázquez / B.', seed: 21 }, score: '7-6 6-3', winner: 0 },
  { a: { name: 'Asensi / Toro', seed: 3 }, b: { name: 'Soro / Pi', seed: 30 }, score: '6-0 6-1', winner: 0 },
  { a: { name: 'López / Van', seed: 14 }, b: { name: 'Mtz / Solar', seed: 19 }, score: '7-5 7-6', winner: 0 },
  { a: { name: 'Roig / Vall', seed: 7 }, b: { name: 'Bru / Carrera', seed: 26 }, score: '6-4 6-2', winner: 0 },
  { a: { name: 'Calabuig / N.', seed: 10 }, b: { name: 'Sanz / M.', seed: 23 }, score: '6-3 6-2', winner: 0 },
  { a: { name: 'Estruch / D.', seed: 6 }, b: { name: 'Oliva / Penya', seed: 27 }, score: '6-3 6-2', winner: 0 },
  { a: { name: 'Solà / Calbó', seed: 11 }, b: { name: 'Pérez / R.', seed: 22 }, score: '6-1 7-6', winner: 0 },
  { a: { name: 'Soler / Gil', seed: 15 }, b: { name: 'Pastor / N.', seed: 18 }, score: '6-4 7-5', winner: 0 },
  { a: { name: 'Nadal / Vives', seed: 2 }, b: { name: 'Riba / Coll', seed: 31 }, score: '6-2 6-3', winner: 0 },
]

const octavos: Match[] = [
  { a: { name: 'Puig / Marín', seed: 1 }, b: { name: 'Hidalgo / Ll.', seed: 16 }, score: '6-3 6-4', winner: 0 },
  { a: { name: 'Bru / Pla', seed: 8 }, b: { name: 'Mtz / Valid', seed: 9 }, score: '6-7 4-6', winner: 1 },
  { a: { name: 'García / Ros', seed: 4 }, b: { name: 'Pons / Lara', seed: 13 }, score: '7-5 6-3', winner: 0 },
  { a: { name: 'Verdú / Mas', seed: 5 }, b: { name: 'Lozano / Roig', seed: 12 }, score: '3-6 4-6', winner: 1 },
  { a: { name: 'Asensi / Toro', seed: 3 }, b: { name: 'López / Van', seed: 14 }, score: '6-2 6-3', winner: 0 },
  { a: { name: 'Roig / Vall', seed: 7 }, b: { name: 'Calabuig / N.', seed: 10 }, score: '6-4 7-5', winner: 0 },
  { a: { name: 'Estruch / D.', seed: 6 }, b: { name: 'Solà / Calbó', seed: 11 }, score: '6-1 7-6', winner: 0 },
  { a: { name: 'Soler / Gil', seed: 15 }, b: { name: 'Nadal / Vives', seed: 2 }, score: '6-3 6-4', winner: 0 },
]

const cuartos: Match[] = [
  {
    a: { name: 'Puig / Marín', seed: 1 },
    b: { name: 'Lozano / Roig', seed: 12 },
    score: 'En juego · 6-4 3-6 4-2',
    live: true,
  },
  { a: { name: 'Mtz / Valid', seed: 9 }, b: { name: 'García / Ros', seed: 4 }, score: '4-6 7-6 10-8', winner: 0 },
  { a: { name: 'Asensi / Toro', seed: 3 }, b: { name: 'Roig / Vall', seed: 7 }, status: '17:00 · Central' },
  { a: { name: 'Estruch / D.', seed: 6 }, b: { name: 'Soler / Gil', seed: 15 }, status: '19:00 · Pacífico' },
]

const semis: Match[] = [
  { a: { name: '?' }, b: { name: '?' }, status: '27 jun · 18:00' },
  { a: { name: '?' }, b: { name: '?' }, status: '27 jun · 18:00' },
]

const final: Match[] = [{ a: { name: '?' }, b: { name: '?' }, status: '28 jun · 19:00' }]

const filters = ['Completo', 'Solo en juego', 'Mi pareja', 'Apuestas']

function TeamRow({ team, won, faded }: { team: Team; won?: boolean; faded?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-1.5">
        <span
          className={`size-1.5 shrink-0 rounded-full ${
            won ? 'bg-terracotta' : 'bg-transparent'
          }`}
        />
        <span
          className={`truncate text-[13px] ${
            faded
              ? 'text-muted-foreground'
              : won
                ? 'font-medium text-ink'
                : 'text-muted-foreground'
          }`}
        >
          {team.name}
        </span>
      </span>
      {team.seed != null && (
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          ({team.seed})
        </span>
      )}
    </div>
  )
}

function MatchCard({ match }: { match: Match }) {
  const upcoming = !match.score && !match.live
  return (
    <div
      className={`relative rounded-md border bg-card p-2.5 ${
        match.live ? 'border-terracotta' : 'border-border'
      }`}
    >
      {match.live && (
        <span className="absolute -top-2 right-2 rounded-sm bg-terracotta px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-cream uppercase">
          ● Live
        </span>
      )}
      <div className="flex flex-col gap-1">
        <TeamRow
          team={match.a}
          won={match.winner === 0}
          faded={upcoming}
        />
        <TeamRow
          team={match.b}
          won={match.winner === 1}
          faded={upcoming}
        />
      </div>
      {(match.score || match.status) && (
        <div className="mt-2 border-t border-border pt-1.5 font-mono text-[10px] tracking-wide text-muted-foreground">
          {match.live ? (
            <span>
              <span className="text-terracotta">En juego</span>
              {match.score?.replace('En juego', '')}
            </span>
          ) : (
            match.score ?? match.status
          )}
        </div>
      )}
    </div>
  )
}

function RoundColumn({
  date,
  highlight,
  name,
  count,
  matches,
  natural,
}: {
  date: string
  highlight?: string
  name: string
  count: string
  matches: Match[]
  natural?: boolean
}) {
  return (
    <div className="flex w-[210px] shrink-0 flex-col">
      <header className="mb-4">
        <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
          {date}
          {highlight && <span className="text-terracotta"> · {highlight}</span>}
        </p>
        <h3 className="mt-1 font-heading text-2xl italic text-ink">{name}</h3>
        <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
          {count}
        </p>
      </header>
      <div
        className={`flex flex-1 flex-col ${
          natural ? 'gap-2.5' : 'justify-around'
        }`}
      >
        {matches.map((m, i) => (
          <MatchCard key={`${name}-${i}`} match={m} />
        ))}
      </div>
    </div>
  )
}

export function SquareBracket() {
  const [active, setActive] = useState('Completo')

  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Cuadro completo · 32 parejas
          </p>
          <h2 className="mt-2 font-heading text-5xl leading-none tracking-tight text-ink md:text-6xl">
            El <em className="italic">cuadro</em> al detalle.
          </h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`rounded-sm px-3 py-1.5 font-mono text-xs tracking-widest uppercase transition-colors ${
                active === f
                  ? 'bg-ink text-cream'
                  : 'border border-border text-muted-foreground hover:text-ink'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Cuadro */}
      <div className="mt-10 overflow-x-auto pb-4">
        <div className="flex min-w-[1240px] items-stretch gap-6">
          <RoundColumn date="22 jun" name="R32" count="16 de 16" matches={r32} natural />
          <RoundColumn date="24 jun" name="Octavos" count="8 de 8" matches={octavos} />
          <RoundColumn
            date="25 jun"
            highlight="Hoy"
            name="Cuartos"
            count="1 de 4"
            matches={cuartos}
          />
          <RoundColumn date="27 jun" name="Semifinales" count="—" matches={semis} />

          {/* Final + promo */}
          <div className="flex w-[230px] shrink-0 flex-col">
            <header className="mb-4">
              <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                28 jun
              </p>
              <h3 className="mt-1 font-heading text-2xl italic text-ink">
                Final
              </h3>
              <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                —
              </p>
            </header>
            <div className="flex flex-1 flex-col justify-center gap-10">
              <MatchCard match={final[0]} />

              {/* Promo */}
              <div className="rounded-lg bg-ink p-6 text-center text-cream">
                <p className="font-mono text-[11px] tracking-widest text-lime uppercase">
                  ● La final
                </p>
                <p className="mt-3 font-heading text-2xl italic leading-tight">
                  ¿quién levantará
                  <br />
                  el trofeo?
                </p>
                <p className="mt-4 font-mono text-[11px] tracking-widest text-cream/55 uppercase">
                  28 jun · 19:00 · Pista
                  <br />
                  Central
                </p>
                <p className="mt-2 font-mono text-xs tracking-widest uppercase">
                  €1.200 · <span className="text-lime">trofeo</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
