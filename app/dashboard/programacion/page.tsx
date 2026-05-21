import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Programación de pistas · Bandeja',
}

/* -------------------------------------------------------------------------- */
/*  Modelo + datos de ejemplo                                                 */
/* -------------------------------------------------------------------------- */

const DAY_START = 9
const DAY_SPAN = 12 // columnas: 09:00 — 20:00
const NOW = 16.25 // hora actual (línea roja)

const hours = Array.from({ length: DAY_SPAN }, (_, i) => DAY_START + i)

type SlotState = 'en-juego' | 'proximo' | 'disputado' | 'conflicto' | 'bloqueo'

type Match = {
  start: number
  span: number
  tag?: string
  label: string
  state: SlotState
}

type Court = {
  n: number
  name: string
  surface: string
  featured?: boolean
  matches: Match[]
}

const courts: Court[] = [
  {
    n: 1,
    name: 'Pista 1',
    surface: 'Cristal · Centro',
    matches: [
      { start: 9, span: 1, tag: '05 · 3ª M', label: 'Cruz / Mira · Ver…', state: 'disputado' },
      { start: 11, span: 1, tag: '07 · 2ª M', label: 'Sanz / López · F…', state: 'disputado' },
      { start: 16, span: 1, tag: 'QF1 · 2ª M', label: 'Puig / Marín', state: 'en-juego' },
      { start: 18, span: 1, tag: 'QF2 · 3ª F', label: 'García / Pi · Bru…', state: 'proximo' },
      { start: 20, span: 1, tag: '05 · 4ª M', label: 'X. veteranos', state: 'proximo' },
    ],
  },
  {
    n: 2,
    name: 'Pista 2',
    surface: 'Cristal',
    matches: [
      { start: 10, span: 1, tag: '02 · 2ª M', label: 'Cruz / Mira', state: 'disputado' },
      { start: 12, span: 1, tag: 'Bloqueo', label: 'Mantenimiento', state: 'bloqueo' },
      { start: 16, span: 1, tag: '03 · 1ª M', label: 'Soler / Gil · Bru…', state: 'proximo' },
      { start: 18, span: 1, tag: 'X1 · Mixto', label: 'Reig / Tur', state: 'proximo' },
    ],
  },
  {
    n: 3,
    name: 'Pista 3',
    surface: 'Cristal',
    matches: [
      { start: 9, span: 1, tag: '01 · 2ª M', label: 'Puig / Marín · Po…', state: 'disputado' },
      { start: 11, span: 1, tag: 'X2 · Mixto', label: 'Asensi / Toro', state: 'proximo' },
      { start: 15, span: 1, tag: 'QF Vets +45', label: 'Mora / Cano', state: 'proximo' },
      { start: 18, span: 1, tag: '2ª F', label: 'Vidal / Roca', state: 'proximo' },
    ],
  },
  {
    n: 4,
    name: 'Pista 4',
    surface: 'Central · Streaming',
    featured: true,
    matches: [
      { start: 10, span: 1, tag: '06 · 1ª F', label: 'Mtz / Vidal', state: 'disputado' },
      { start: 16, span: 1, tag: 'QF3 · 2ª M', label: 'Lozano / Reig', state: 'en-juego' },
      { start: 18, span: 1, tag: 'QF4 · 2ª M', label: 'Sanz / López · N…', state: 'proximo' },
      { start: 20, span: 1, tag: 'Final 3ª M', label: 'Por definir', state: 'proximo' },
    ],
  },
  {
    n: 5,
    name: 'Pista 5',
    surface: 'Cristal',
    matches: [
      { start: 9, span: 1, tag: '03 · 4ª M', label: 'Gil / Peris', state: 'disputado' },
      { start: 13, span: 1, tag: 'X3 · Mixto', label: 'Bru / Sanz', state: 'proximo' },
      { start: 16, span: 1, tag: 'Cuartos 3ª F', label: 'Pi / Verdú', state: 'en-juego' },
      { start: 18, span: 1, tag: 'X4 · Mixto', label: 'Cano / Luna', state: 'proximo' },
    ],
  },
  {
    n: 6,
    name: 'Pista 6',
    surface: 'Cristal',
    matches: [
      { start: 10, span: 1, tag: '04 · 3ª M', label: 'Tur / Bru', state: 'disputado' },
      { start: 13, span: 1, tag: 'X5 · Mixto', label: 'Soler / Gil', state: 'proximo' },
      { start: 15, span: 1, tag: 'Vets +35', label: 'Ortí / Díaz', state: 'proximo' },
      { start: 16, span: 1, tag: 'Conflicto', label: 'Doble reserva', state: 'conflicto' },
      { start: 19, span: 1, tag: '4ª F', label: 'Roca / Mas', state: 'proximo' },
    ],
  },
  {
    n: 7,
    name: 'Pista 7',
    surface: 'Muro',
    matches: [
      { start: 9, span: 1, tag: '02 · 4ª M', label: 'Peris / Mora', state: 'disputado' },
      { start: 14, span: 1, tag: 'Sub-18', label: 'Promesas club', state: 'proximo' },
      { start: 18, span: 1, tag: 'X6 · Mixto', label: 'Díaz / Tur', state: 'proximo' },
    ],
  },
  {
    n: 8,
    name: 'Pista 8',
    surface: 'Muro · Cubierta',
    matches: [
      { start: 11, span: 1, tag: '01 · 4ª F', label: 'Mas / Luna', state: 'disputado' },
      { start: 13, span: 1, tag: 'Bloqueo', label: 'Clase escuela', state: 'bloqueo' },
      { start: 16, span: 1, tag: 'Padel social', label: 'Liga interna', state: 'proximo' },
      { start: 20, span: 1, tag: '3ª F', label: 'García / Pi', state: 'proximo' },
    ],
  },
]

const days = [
  { d: 'Lun', n: 15 },
  { d: 'Mar', n: 16 },
  { d: 'Mié', n: 17 },
  { d: 'Jue', n: 18 },
  { d: 'Vie', n: 19 },
  { d: 'Sáb', n: 20 },
  { d: 'Dom', n: 21 },
]

const stats = [
  { label: 'Programados', value: '14' },
  { label: 'En juego', value: '3' },
  { label: 'Conflictos', value: '1', accent: true },
  { label: 'Ocupación', value: '78%' },
]

const legend: { label: string; cls: string; hatch?: boolean }[] = [
  { label: 'En juego', cls: 'bg-forest' },
  { label: 'Próximo', cls: 'bg-ochre' },
  { label: 'Disputado', cls: 'bg-muted border border-border' },
  { label: 'Conflicto', cls: 'bg-terracotta' },
  { label: 'Bloqueo', cls: 'border border-dashed border-border', hatch: true },
]

const hatchStyle: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(45deg, var(--border) 0 1px, transparent 1px 6px)',
}

/* Plantilla de columnas compartida por la cabecera y cada fila de pista. */
const GRID_COLS = 'grid grid-cols-[184px_repeat(12,minmax(0,1fr))]'

/* -------------------------------------------------------------------------- */
/*  Subcomponentes                                                            */
/* -------------------------------------------------------------------------- */

function MatchBlock({ match }: { match: Match }) {
  const tone: Record<SlotState, string> = {
    'en-juego': 'bg-forest text-cream',
    proximo: 'bg-ochre text-ink',
    disputado: 'border border-border bg-muted/60 text-muted-foreground',
    conflicto: 'bg-terracotta text-cream',
    bloqueo: 'border border-dashed border-border bg-card text-muted-foreground',
  }
  return (
    <div
      className="border-l border-border/50 p-1"
      style={{ gridColumn: `span ${match.span}` }}
    >
      <div
        className={cn(
          'relative flex h-full flex-col justify-center gap-0.5 overflow-hidden rounded-md px-2 py-1',
          tone[match.state],
        )}
        style={match.state === 'bloqueo' ? hatchStyle : undefined}
      >
        {match.state === 'en-juego' && (
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-lime" />
        )}
        {match.tag && (
          <span className="truncate font-mono text-[9px] uppercase tracking-wider opacity-80">
            {match.tag}
          </span>
        )}
        <span className="truncate text-[11px] leading-tight">{match.label}</span>
      </div>
    </div>
  )
}

function EmptyCell() {
  return <div className="border-l border-border/50" />
}

/** Construye las celdas de una fila: bloques de partido + huecos vacíos. */
function rowCells(matches: Match[]) {
  const sorted = [...matches].sort((a, b) => a.start - b.start)
  const cells: React.ReactNode[] = []
  let h = DAY_START
  for (const m of sorted) {
    while (h < m.start) {
      cells.push(<EmptyCell key={`e${h}`} />)
      h += 1
    }
    cells.push(<MatchBlock key={`m${h}`} match={m} />)
    h += m.span
  }
  while (h < DAY_START + DAY_SPAN) {
    cells.push(<EmptyCell key={`e${h}`} />)
    h += 1
  }
  return cells
}

/* -------------------------------------------------------------------------- */
/*  Página                                                                    */
/* -------------------------------------------------------------------------- */

export default function ProgramacionPage() {
  const nowFraction = (NOW - DAY_START) / DAY_SPAN
  const nowLeft = `calc(184px + (100% - 184px) * ${nowFraction})`

  return (
    <>
      <DashboardTopbar>
        <Button variant="outline" className="h-9 rounded-md px-4 text-sm">
          Auto-programar
        </Button>
        <Button variant="outline" className="h-9 rounded-md px-4 text-sm">
          Imprimir
        </Button>
        <Button className="h-9 gap-1.5 rounded-md px-4 text-sm">
          <Plus className="size-4" strokeWidth={2} />
          Reserva
        </Button>
      </DashboardTopbar>

      <div className="mx-auto max-w-[1600px] px-8 py-10">
        {/* ---- Encabezado + métricas ---- */}
        <section className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Open de Verano · Día 2
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Martes <em className="italic">16 de junio</em>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              14 partidos programados · 2 pistas con bloqueo de mantenimiento ·{' '}
              <span className="text-terracotta">1 conflicto detectado</span> en
              Pista 6. Reasigna pista o reprograma la hora desde cada bloque.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-4 lg:gap-x-8">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </dt>
                <dd
                  className={cn(
                    'font-serif text-4xl leading-none',
                    stat.accent ? 'text-terracotta' : 'text-foreground',
                  )}
                >
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- Selector de día + leyenda ---- */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <div className="flex flex-wrap items-center gap-1">
            {days.map((day) => {
              const active = day.n === 16
              return (
                <button
                  key={day.n}
                  type="button"
                  className={cn(
                    'rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors',
                    active
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {day.d} {day.n}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {legend.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span
                  className={cn('size-2.5 rounded-sm', item.cls)}
                  style={item.hatch ? hatchStyle : undefined}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* ---- Calendario de pistas ---- */}
        <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-card">
          <div className="min-w-[1180px]">
            {/* Cabecera de horas */}
            <div className={cn(GRID_COLS, 'border-b border-border bg-muted/30')}>
              <div className="flex flex-col justify-center border-r border-border px-4 py-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Pistas · 8
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  Disponibles
                </span>
              </div>
              {hours.map((h) => (
                <div
                  key={h}
                  className="border-l border-border/50 px-2 py-3 font-mono"
                >
                  <span className="block text-[11px] text-foreground">
                    {String(h).padStart(2, '0')}:00
                  </span>
                  <span className="block text-[10px] text-muted-foreground/60">
                    1h
                  </span>
                </div>
              ))}
            </div>

            {/* Filas de pistas */}
            <div className="relative">
              {courts.map((court) => (
                <div
                  key={court.n}
                  className={cn(
                    GRID_COLS,
                    'min-h-[68px] border-b border-border last:border-b-0',
                  )}
                >
                  {/* Etiqueta de pista */}
                  <div className="flex items-center gap-3 border-r border-border px-4">
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded font-mono text-[11px]',
                        court.featured
                          ? 'bg-ink text-cream'
                          : 'border border-border text-muted-foreground',
                      )}
                    >
                      {court.n}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">
                        {court.name}
                      </p>
                      <p className="truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        {court.surface}
                      </p>
                    </div>
                  </div>

                  {/* Bloques de la jornada */}
                  {rowCells(court.matches)}
                </div>
              ))}

              {/* Línea de hora actual */}
              <div
                className="pointer-events-none absolute inset-y-0 z-10 w-px bg-terracotta"
                style={{ left: nowLeft }}
              >
                <span className="absolute -top-px left-1/2 -translate-x-1/2 rounded-sm bg-terracotta px-1 py-0.5 font-mono text-[9px] leading-none text-cream">
                  {Math.floor(NOW)}:
                  {String(Math.round((NOW % 1) * 60)).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
