import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronRight, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Resumen del club · Bandeja',
}

/* -------------------------------------------------------------------------- */
/*  Datos de ejemplo                                                          */
/* -------------------------------------------------------------------------- */

type TournamentStatus = 'en-juego' | 'programado' | 'borrador'

const stats = [
  { label: 'En juego', value: '3', sub: 'Ahora mismo' },
  { label: 'Inscritos', value: '186', sub: '+12 esta semana' },
  { label: 'Ingresos', value: '€4.820', sub: 'Cuota inscripción' },
  { label: 'Pistas libres', value: '2/8', sub: 'Hasta 19:30' },
]

const tournaments: {
  index: string
  name: string
  meta: string
  status: TournamentStatus
  entrants: number
  progress: number | null
  prize: string | null
}[] = [
  {
    index: '01',
    name: 'Open de Verano',
    meta: '15 — 28 jun · 6 cat.',
    status: 'en-juego',
    entrants: 128,
    progress: 64,
    prize: '€3.500',
  },
  {
    index: '02',
    name: 'Torneo Solsticio',
    meta: '22 jun — 5 jul · 4 cat.',
    status: 'programado',
    entrants: 64,
    progress: null,
    prize: '€1.200',
  },
  {
    index: '03',
    name: 'Trofeo del Olivar XII',
    meta: '10 — 14 jul · 8 cat.',
    status: 'programado',
    entrants: 212,
    progress: null,
    prize: '€6.000',
  },
  {
    index: '04',
    name: 'Circuito Veteranos',
    meta: 'may — sep · 3 cat.',
    status: 'en-juego',
    entrants: 48,
    progress: 38,
    prize: '€800',
  },
  {
    index: '05',
    name: 'Mixto Nocturno',
    meta: '18 jul · 1 cat.',
    status: 'borrador',
    entrants: 16,
    progress: null,
    prize: null,
  },
]

const pendingActions = [
  {
    title: 'Confirmar pago de 2 parejas',
    meta: 'Open de Verano · 1ª fem · hace 2 h',
  },
  {
    title: 'Generar cuadro 4ª masculina',
    meta: 'Trofeo del Olivar · hace 5 h',
  },
  {
    title: 'Cargar resultado Pista 2',
    meta: 'Circuito Veteranos · semis · ayer',
  },
  {
    title: 'Aprobar wildcards (3)',
    meta: 'Trofeo del Olivar · 1ª · ayer',
  },
]

const DAY_START = 9
const DAY_END = 19.5
const timeTicks = [
  '09:00',
  '10:30',
  '12:00',
  '13:30',
  '15:00',
  '16:30',
  '18:00',
  '19:30',
]

type Slot = {
  start: number
  end: number
  label: string
  state: 'live' | 'next'
}

const courts: { name: string; slots: Slot[] }[] = [
  {
    name: 'Pista 1',
    slots: [
      { start: 9, end: 10.75, label: 'Puig / Marín', state: 'live' },
      { start: 13, end: 14.25, label: 'Soler / Gil', state: 'next' },
      { start: 16.5, end: 17.75, label: 'Verdú / Mas', state: 'next' },
    ],
  },
  {
    name: 'Pista 2',
    slots: [
      { start: 9.5, end: 11, label: 'Lozano / Reig', state: 'live' },
      { start: 12, end: 13.25, label: 'Cano / Díaz', state: 'next' },
      { start: 15, end: 16.5, label: 'Roca / Vidal', state: 'next' },
    ],
  },
  {
    name: 'Pista 3',
    slots: [
      { start: 10.5, end: 12, label: 'Ferrer / Luna', state: 'next' },
      { start: 14, end: 15.5, label: 'Ortí / Bru', state: 'next' },
    ],
  },
  {
    name: 'Pista 4',
    slots: [
      { start: 9, end: 10.5, label: 'Nadal / Sanz', state: 'live' },
      { start: 11.5, end: 13, label: 'Gil / Peris', state: 'next' },
      { start: 17, end: 18.75, label: 'Mora / Tur', state: 'next' },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  Subcomponentes                                                            */
/* -------------------------------------------------------------------------- */

function StatusPill({ status }: { status: TournamentStatus }) {
  const map = {
    'en-juego': {
      label: 'En juego',
      text: 'text-forest',
      border: 'border-forest/25',
      dot: 'bg-forest',
    },
    programado: {
      label: 'Programado',
      text: 'text-ochre',
      border: 'border-ochre/35',
      dot: 'bg-ochre',
    },
    borrador: {
      label: 'Borrador',
      text: 'text-terracotta',
      border: 'border-terracotta/35',
      dot: 'bg-terracotta',
    },
  } as const
  const s = map[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest',
        s.text,
        s.border,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

function pct(hour: number) {
  return ((hour - DAY_START) / (DAY_END - DAY_START)) * 100
}

/* -------------------------------------------------------------------------- */
/*  Página                                                                    */
/* -------------------------------------------------------------------------- */

export default function DashboardResumenPage() {
  return (
    <>
      <DashboardTopbar>
        <Button variant="outline" className="h-9 rounded-md px-4 text-sm">
          Exportar
        </Button>
        <Button asChild className="h-9 gap-1.5 rounded-md px-4 text-sm">
          <Link href="/dashboard/torneos/nuevo">
            <Plus className="size-4" strokeWidth={2} />
            Nuevo torneo
          </Link>
        </Button>
      </DashboardTopbar>

      <div className="mx-auto max-w-[1600px] px-8 py-10">
        {/* ---- Saludo + métricas ---- */}
      <section className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Temporada · Primavera 2026
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Buenas tardes, <em className="italic">Carla.</em>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Hoy se disputan <span className="text-foreground">14 partidos</span>{' '}
            en 6 pistas. Quedan 2 inscripciones por confirmar antes del cierre
            del Open de Verano.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-4 lg:gap-x-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1.5">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="font-serif text-4xl leading-none text-foreground">
                {stat.value}
              </dd>
              <dd className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                {stat.sub}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---- Torneos · partido en vivo · pendientes ---- */}
      <section className="mt-10 grid grid-cols-1 gap-6 border-t border-border pt-10 lg:grid-cols-5">
        {/* Lista de torneos */}
        <div className="rounded-xl border border-border bg-card lg:col-span-3">
          <div className="flex items-center justify-between gap-4 px-6 pt-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Torneos activos
              </p>
              <h2 className="mt-1.5 font-serif text-2xl tracking-tight text-foreground">
                En curso &amp; próximos
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-md border border-border p-0.5">
              {['Todos', 'Activos', 'Borradores'].map((tab, i) => (
                <span
                  key={tab}
                  className={cn(
                    'rounded px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider',
                    i === 0
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground',
                  )}
                >
                  {tab}
                </span>
              ))}
            </div>
          </div>

          <ul className="mt-4 divide-y divide-border border-t border-border">
            {tournaments.map((t) => (
              <li key={t.index}>
                <Link
                  href="/dashboard/torneos"
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40"
                >
                  <span className="w-6 shrink-0 font-mono text-xs text-muted-foreground/60">
                    {t.index}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{t.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {t.meta}
                    </p>
                  </div>
                  <StatusPill status={t.status} />
                  <div className="hidden w-40 shrink-0 sm:block">
                    <p className="font-mono text-sm text-foreground">
                      {t.entrants}
                    </p>
                    {t.progress != null ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full bg-forest"
                            style={{ width: `${t.progress}%` }}
                          />
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {t.progress}%
                        </span>
                      </div>
                    ) : (
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
                        Cuadro no generado
                      </p>
                    )}
                  </div>
                  <span className="w-16 shrink-0 text-right font-mono text-sm text-foreground">
                    {t.prize ?? '—'}
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Partido en vivo */}
          <div className="rounded-xl bg-forest p-6 text-cream">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-lime">
                <span className="inline-block size-1.5 rounded-full bg-lime" />
                En vivo · Pista 4
              </span>
              <span className="text-cream/55">1h 24m</span>
            </div>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-cream/70">
              2ª masculina · Cuartos
            </p>

            <div className="mt-4 space-y-3">
              {[
                { tag: 'P', pair: 'Puig / Marín', seed: 3, sets: [6, 4, 3] },
                { tag: 'L', pair: 'Lozano / Reig', seed: 6, sets: [3, 6, 4] },
              ].map((row) => (
                <div key={row.pair} className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-cream/10 font-mono text-xs">
                    {row.tag}
                  </span>
                  <span className="flex-1 text-sm">
                    {row.pair}{' '}
                    <span className="font-mono text-[11px] text-cream/45">
                      ({row.seed})
                    </span>
                  </span>
                  <span className="flex gap-2 font-mono text-sm tabular-nums">
                    {row.sets.map((set, i) => (
                      <span
                        key={i}
                        className={cn(
                          'w-4 text-center',
                          i === 2 ? 'text-lime' : 'text-cream/70',
                        )}
                      >
                        {set}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-cream/15 pt-4 font-mono text-[10px] uppercase tracking-widest">
              <span className="text-lime">Golden point · 40–40</span>
              <span className="text-cream/50">Restan 6 partidos hoy</span>
            </div>
          </div>

          {/* Acciones pendientes */}
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Pendiente · 5 acciones
            </p>
            <ul className="mt-4 divide-y divide-border">
              {pendingActions.map((action) => (
                <li
                  key={action.title}
                  className="flex gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-terracotta" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{action.title}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {action.meta}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---- Programación de pistas ---- */}
      <section className="mt-10 border-t border-border pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Hoy · Martes 16 de junio
            </p>
            <h2 className="mt-1.5 font-serif text-2xl tracking-tight text-foreground">
              Programación de pistas
            </h2>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {[
              { label: 'En juego', cls: 'bg-forest' },
              { label: 'Próximo', cls: 'bg-ochre' },
              { label: 'Libre', cls: 'bg-muted border border-border' },
            ].map((legend) => (
              <span key={legend.label} className="flex items-center gap-1.5">
                <span className={cn('size-2.5 rounded-sm', legend.cls)} />
                {legend.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          {/* Cabecera de horas */}
          <div className="grid grid-cols-[64px_1fr] gap-4">
            <span />
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {timeTicks.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
          </div>

          {/* Pistas */}
          <div className="mt-3 space-y-2">
            {courts.map((court) => (
              <div
                key={court.name}
                className="grid grid-cols-[64px_1fr] items-center gap-4"
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {court.name}
                </span>
                <div className="relative h-9 rounded-md bg-muted/50">
                  {court.slots.map((slot, i) => (
                    <div
                      key={i}
                      className={cn(
                        'absolute inset-y-0 flex items-center overflow-hidden rounded-md px-2',
                        slot.state === 'live'
                          ? 'bg-forest text-cream'
                          : 'border border-ochre/40 bg-ochre/15 text-foreground',
                      )}
                      style={{
                        left: `${pct(slot.start)}%`,
                        width: `${pct(slot.end) - pct(slot.start)}%`,
                      }}
                    >
                      <span className="truncate font-mono text-[11px]">
                        {slot.label}
                      </span>
                      {slot.state === 'live' && (
                        <span className="ml-auto inline-block size-1.5 shrink-0 rounded-full bg-lime" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>
    </>
  )
}
