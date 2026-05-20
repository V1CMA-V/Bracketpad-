import { ArrowRight } from 'lucide-react'

type EstadoTone = 'live' | 'scheduled' | 'advance' | 'out'

type Pair = {
  seed: string
  pair: string
  players: string
  club: string
  pts: string
  estado: string
  tone: EstadoTone
}

const pairs: Pair[] = [
  { seed: '01', pair: 'Puig / Marín', players: 'I. Puig · D. Marín', club: 'C. Marítimo', pts: '2480', estado: 'Cuartos · En juego', tone: 'live' },
  { seed: '02', pair: 'Asensi / Toro', players: 'M. Asensi · P. Toro', club: 'Padel Nord', pts: '2310', estado: 'Cuartos · 17:00', tone: 'scheduled' },
  { seed: '03', pair: 'Estruch / D.', players: 'V. Estruch · J. Díaz', club: 'Mediterráneo', pts: '2210', estado: 'Cuartos · 17:00', tone: 'scheduled' },
  { seed: '04', pair: 'García / Ros', players: 'J. García · Á. Ros', club: 'Mediterráneo', pts: '2090', estado: 'Out · Cuartos', tone: 'out' },
  { seed: '05', pair: 'Verdú / Mas', players: 'D. Verdú · O. Mas', club: 'Olimpic', pts: '1980', estado: 'Out · Octavos', tone: 'out' },
  { seed: '06', pair: 'Soler / Gil', players: 'A. Soler · R. Gil', club: 'Padel Nord', pts: '1890', estado: 'Cuartos · 17:00', tone: 'scheduled' },
  { seed: '07', pair: 'Roig / Vall', players: 'F. Roig · L. Vall', club: 'Olimpic', pts: '1820', estado: 'Cuartos · 17:00', tone: 'scheduled' },
  { seed: '08', pair: 'Bru / Pla', players: 'Ll. Bru · T. Pla', club: 'Olimpic', pts: '1780', estado: 'Out · Octavos', tone: 'out' },
  { seed: '09', pair: 'Mtz / Vidal', players: 'R. Mtz · S. Vidal', club: 'C. Marítimo', pts: '1690', estado: 'Pasa a semis', tone: 'advance' },
  { seed: '10', pair: 'Calabuig / N.', players: 'J. Calabuig · A. N.', club: 'Mediterráneo', pts: '1640', estado: 'Out · Octavos', tone: 'out' },
  { seed: '11', pair: 'Reig / Forn', players: 'X. Reig · I. Forn', club: 'Padel Nord', pts: '1580', estado: 'Out · R32', tone: 'out' },
  { seed: '12', pair: 'Lozano / Reig', players: 'B. Lozano · M. Reig', club: 'C. Marítimo', pts: '1520', estado: 'Cuartos · En juego', tone: 'live' },
]

const tabs = [
  { label: 'Ordenar · Seed', solid: true },
  { label: 'Todas', solid: true },
  { label: 'En pie · 6', solid: false },
  { label: 'Eliminadas · 6', solid: false },
]

function initials(pair: string): [string, string] {
  const parts = pair.split('/').map((p) => p.trim())
  return [parts[0]?.[0] ?? '?', parts[1]?.[0] ?? '?']
}

function estadoClass(tone: EstadoTone) {
  if (tone === 'live' || tone === 'scheduled') return 'text-terracotta'
  if (tone === 'advance') return 'text-ink'
  return 'text-muted-foreground'
}

const COLS =
  'grid grid-cols-[56px_minmax(180px,1.5fr)_minmax(150px,1.2fr)_minmax(120px,1fr)_72px_minmax(150px,1.4fr)] items-center gap-4'

export function PlayersRegistered() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Parejas inscritas · 32 / 32
          </p>
          <h2 className="mt-2 font-heading text-5xl leading-none tracking-tight text-ink md:text-6xl">
            Todas las <em className="italic">inscritas.</em>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Mostrando 12 de 32 — ordenadas por cabeza de serie. Filtrá por club,
            estado o ranking para ver las restantes.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.label}
              className={`rounded-sm px-3 py-1.5 font-mono text-xs tracking-widest uppercase transition-colors ${
                t.solid
                  ? 'bg-ink text-cream'
                  : 'border border-border text-muted-foreground hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="mt-8 overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[920px]">
          {/* Cabecera de tabla */}
          <div
            className={`${COLS} border-b border-border px-5 py-3 font-mono text-[11px] tracking-widest text-muted-foreground uppercase`}
          >
            <span>Seed</span>
            <span>Pareja</span>
            <span>Jugadores</span>
            <span>Club</span>
            <span>Pts</span>
            <span className="text-right">Estado</span>
          </div>

          {/* Filas */}
          {pairs.map((p) => {
            const out = p.tone === 'out'
            const [i1, i2] = initials(p.pair)
            return (
              <div
                key={p.seed}
                className={`${COLS} border-b border-border px-5 py-4 last:border-b-0 ${
                  out ? 'opacity-55' : ''
                }`}
              >
                {/* Seed */}
                <span
                  className={`font-heading text-xl ${
                    out ? 'text-muted-foreground' : 'text-terracotta'
                  }`}
                >
                  {p.seed}
                </span>

                {/* Pareja */}
                <div className="flex items-center gap-2.5">
                  <div className="flex shrink-0">
                    <span className="flex size-6 items-center justify-center rounded-full bg-terracotta font-mono text-[10px] text-cream ring-2 ring-card">
                      {i1}
                    </span>
                    <span className="-ml-2 flex size-6 items-center justify-center rounded-full bg-forest font-mono text-[10px] text-cream ring-2 ring-card">
                      {i2}
                    </span>
                  </div>
                  <span className="font-heading text-base text-ink">
                    {p.pair}
                  </span>
                </div>

                {/* Jugadores */}
                <span className="font-mono text-xs text-muted-foreground">
                  {p.players}
                </span>

                {/* Club */}
                <span className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                  {p.club}
                </span>

                {/* Pts */}
                <span className="font-mono text-sm text-ink">{p.pts}</span>

                {/* Estado */}
                <span
                  className={`flex items-center justify-end gap-1.5 font-mono text-[11px] tracking-widest uppercase ${estadoClass(
                    p.tone,
                  )}`}
                >
                  <span className="text-[0.7em]">●</span>
                  {p.estado}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pie */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">
        <span>12 / 32 mostradas</span>
        <button className="flex items-center gap-2 transition-colors hover:text-ink">
          Ver las 32 parejas
          <ArrowRight className="size-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </section>
  )
}
