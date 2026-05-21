import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pistas del club · Bandeja',
}

/* -------------------------------------------------------------------------- */
/*  Modelo + datos de ejemplo                                                 */
/* -------------------------------------------------------------------------- */

type CourtStatus = 'en-juego' | 'proxima' | 'libre' | 'cerrada'

type Court = {
  n: string
  code: string
  name: string
  surface: string
  status: CourtStatus
  current: string | null
  currentCat: string | null
  next: string
  uptime: number | null
  revision: string
}

const statusMeta: Record<
  CourtStatus,
  { label: string; card: string; dot: string; text: string }
> = {
  'en-juego': {
    label: 'En juego',
    card: 'bg-forest text-cream',
    dot: 'bg-lime',
    text: 'text-forest',
  },
  proxima: {
    label: 'Próxima',
    card: 'bg-ochre text-ink',
    dot: 'bg-ochre',
    text: 'text-ochre',
  },
  libre: {
    label: 'Libre',
    card: 'border border-border bg-card text-foreground',
    dot: 'bg-forest',
    text: 'text-muted-foreground',
  },
  cerrada: {
    label: 'Cerrada',
    card: 'bg-muted text-muted-foreground',
    dot: 'bg-terracotta',
    text: 'text-terracotta',
  },
}

const courts: Court[] = [
  {
    n: '01',
    code: 'P 01',
    name: 'Central',
    surface: 'Cristal · cubierta',
    status: 'en-juego',
    current: 'Puig / Marín vs. Lozano / Reig',
    currentCat: '1ª M · cuartos',
    next: 'Siguiente · 17:30 · QF 2ª F',
    uptime: 96,
    revision: '15 may',
  },
  {
    n: '02',
    code: 'P 02',
    name: 'Pacífico',
    surface: 'Cristal · exterior',
    status: 'en-juego',
    current: 'Cruz / Mira vs. Gil / Soler',
    currentCat: '1ª F · cuartos',
    next: 'Siguiente · 17:30 · Mixto',
    uptime: 94,
    revision: '02 may',
  },
  {
    n: '03',
    code: 'P 03',
    name: 'Atlántico',
    surface: 'Cristal · exterior',
    status: 'en-juego',
    current: 'García / Ros vs. Bru / Tur',
    currentCat: '2ª M · octavos',
    next: 'Siguiente · 18:00 · 2ª F',
    uptime: 91,
    revision: '21 abr',
  },
  {
    n: '04',
    code: 'P 04',
    name: 'Sirocco',
    surface: 'Cristal · exterior',
    status: 'proxima',
    current: null,
    currentCat: null,
    next: 'Siguiente · 16:30 · 2ª F oct.',
    uptime: 97,
    revision: '28 may',
  },
  {
    n: '05',
    code: 'P 05',
    name: 'Levante',
    surface: 'Cristal · exterior',
    status: 'libre',
    current: null,
    currentCat: null,
    next: 'Libre hasta las 18:00',
    uptime: 98,
    revision: '10 jun',
  },
  {
    n: '06',
    code: 'P 06',
    name: 'Mistral',
    surface: 'Cristal · cubierta',
    status: 'proxima',
    current: null,
    currentCat: null,
    next: 'Siguiente · 17:30 · 2ª M oct.',
    uptime: 88,
    revision: '04 jun',
  },
  {
    n: '07',
    code: 'P 07',
    name: 'Tramuntana',
    surface: 'Muro · exterior',
    status: 'proxima',
    current: null,
    currentCat: null,
    next: 'Siguiente · 18:00 · Sub-18',
    uptime: 95,
    revision: '12 jun',
  },
  {
    n: '08',
    code: 'P 08',
    name: 'Garbí',
    surface: 'Muro · cubierta',
    status: 'cerrada',
    current: null,
    currentCat: null,
    next: 'Cerrada · cambio de césped',
    uptime: null,
    revision: 'En curso',
  },
]

const stats = [
  { label: 'En juego', value: '3', sub: 'Ahora' },
  { label: 'Programadas', value: '3', sub: 'Hoy más tarde' },
  { label: 'Libres', value: '1', sub: 'Hasta 18:00' },
  { label: 'Mantenim.', value: '1', sub: 'Garbí · 3 días' },
]

const tabs = ['Plano del club', 'Listado', 'Tabla horaria', 'Mantenimiento']

const alerts = [
  {
    court: 'P6 · Mistral',
    text: 'Vidrio panel 3 con grieta — revisar antes del próximo partido.',
    tag: 'Aviso',
    tagCls: 'text-ochre border-ochre/40',
  },
  {
    court: 'P8 · Garbí',
    text: 'Mantenimiento programado · cambio de césped en curso.',
    tag: 'Cerrada',
    tagCls: 'text-terracotta border-terracotta/40',
  },
]

const maintenance = [
  {
    date: '28 JUN',
    title: 'Garbí · Cambio de césped — cuatro paneles',
    vendor: 'Padeltech SL',
  },
  {
    date: '02 JUL',
    title: 'Mistral · Reemplazo vidrio panel 3',
    vendor: 'Cristalería del Sur',
  },
  {
    date: '15 JUL',
    title: 'Todas · Revisión iluminación LED',
    vendor: 'Igensport',
  },
  {
    date: '18 JUL',
    title: 'Atlántico · Repintado de líneas',
    vendor: 'Personal interno',
  },
]

/**
 * Plantilla de columnas de la tabla. Se aplica con `style` (en lugar de un
 * `grid-cols-[…]` arbitrario) para evitar que el `minmax()` rompa la rejilla.
 */
const tableRow = 'grid items-center gap-4'
const tableGrid: React.CSSProperties = {
  gridTemplateColumns: '40px minmax(0, 1.3fr) 124px minmax(0, 1.9fr) 72px 84px',
}

/* -------------------------------------------------------------------------- */
/*  Página                                                                    */
/* -------------------------------------------------------------------------- */

export default function PistasPage() {
  return (
    <>
      <DashboardTopbar>
        <Button variant="outline" className="h-9 rounded-md px-4 text-sm">
          Programar mantenimiento
        </Button>
        <Button variant="outline" className="h-9 rounded-md px-4 text-sm">
          Ver planos
        </Button>
        <Button className="h-9 gap-1.5 rounded-md px-4 text-sm">
          <Plus className="size-4" strokeWidth={2} />
          Nueva pista
        </Button>
      </DashboardTopbar>

      <div className="mx-auto max-w-[1600px] px-8 py-10">
        {/* ---- Encabezado + métricas ---- */}
        <section className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Sede · Av. del Puerto 238
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Las ocho <em className="italic">pistas.</em>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Tres pistas en juego ahora mismo, una cerrada por mantenimiento
              (Garbí — cambio de césped) y dos partidos en cola para las 16:30.
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

        {/* ---- Pestañas + leyenda ---- */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <div className="flex flex-wrap items-center gap-1">
            {tabs.map((tab, i) => (
              <span
                key={tab}
                className={cn(
                  'rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider',
                  i === 0
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground',
                )}
              >
                {tab}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {(['en-juego', 'proxima', 'libre', 'cerrada'] as CourtStatus[]).map(
              (s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span
                    className={cn('size-2.5 rounded-sm', statusMeta[s].dot)}
                  />
                  {statusMeta[s].label}
                </span>
              ),
            )}
          </div>
        </div>

        {/* ---- Plano del club ---- */}
        <section className="mt-5 rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Vista aérea · club
              </p>
              <p className="mt-0.5 font-serif text-lg italic text-foreground">
                Av. del Puerto, 238
              </p>
            </div>
            <p className="text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
              ↑ Norte
              <br />
              Recepción · vestuarios al sur
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {courts.map((court) => {
              const meta = statusMeta[court.status]
              return (
                <div
                  key={court.code}
                  className={cn(
                    'flex min-h-[120px] flex-col justify-between rounded-lg p-4',
                    meta.card,
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">
                      {court.code}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest opacity-80">
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          court.status === 'en-juego'
                            ? 'bg-lime'
                            : 'bg-current',
                        )}
                      />
                      {meta.label}
                    </span>
                  </div>
                  <div>
                    <p className="font-serif text-2xl leading-none tracking-tight">
                      {court.name}
                    </p>
                    <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider opacity-60">
                      {court.surface}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
            <span>↑ Acceso · pasillo central · vestuarios</span>
            <span>Cafetería · grada · 80 plazas →</span>
          </div>
        </section>

        {/* ---- Estado individual + alertas ---- */}
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Tabla de estado */}
          <div className="lg:col-span-2">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Estado individual · 8 pistas
                </p>
                <h2 className="mt-1.5 font-serif text-2xl tracking-tight text-foreground">
                  Lo que pasa ahora mismo
                </h2>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                Actualizado · hace 12 s
              </span>
            </div>

            <div className="mt-5 overflow-x-auto">
              <div className="min-w-[680px]">
                <div
                  style={tableGrid}
                  className={cn(
                    tableRow,
                    'border-b border-border px-3 pb-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground',
                  )}
                >
                  <span>Nº</span>
                  <span>Pista</span>
                  <span>Estado</span>
                  <span>En curso / próximo</span>
                  <span className="text-right">Uptime</span>
                  <span className="text-right">Revisión</span>
                </div>

                <ul className="divide-y divide-border">
                  {courts.map((court) => {
                    const meta = statusMeta[court.status]
                    return (
                      <li
                        key={court.code}
                        style={tableGrid}
                        className={cn(tableRow, 'px-3 py-4')}
                      >
                        <span className="font-serif text-xl text-muted-foreground/70">
                          {court.n}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate font-serif text-base text-foreground">
                            {court.name}
                          </p>
                          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {court.surface}
                          </p>
                        </div>

                        <span
                          className={cn(
                            'flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest',
                            meta.text,
                          )}
                        >
                          <span
                            className={cn('size-1.5 rounded-full', meta.dot)}
                          />
                          {meta.label}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">
                            {court.current ?? '—'}
                            {court.currentCat && (
                              <span className="text-muted-foreground">
                                {' · '}
                                {court.currentCat}
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {court.next}
                          </p>
                        </div>

                        <span
                          className={cn(
                            'text-right font-mono text-sm tabular-nums',
                            court.uptime == null
                              ? 'text-muted-foreground'
                              : court.uptime < 90
                                ? 'text-terracotta'
                                : 'text-foreground',
                          )}
                        >
                          {court.uptime == null ? '—' : `${court.uptime}%`}
                        </span>

                        <span className="text-right font-mono text-xs text-muted-foreground">
                          {court.revision}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* Alertas + mantenimiento */}
          <div className="space-y-6">
            {/* Alertas */}
            <div className="rounded-xl border border-terracotta/40 bg-terracotta/5 p-5">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-terracotta">
                <span className="size-1.5 rounded-full bg-terracotta" />
                Alertas · 2 activas
              </p>
              <h3 className="mt-1.5 font-serif text-xl tracking-tight text-foreground">
                Requieren atención
              </h3>
              <ul className="mt-4 divide-y divide-terracotta/15">
                {alerts.map((alert) => (
                  <li key={alert.court} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-foreground">{alert.court}</p>
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest',
                          alert.tagCls,
                        )}
                      >
                        {alert.tag}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {alert.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Calendario de mantenimiento */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Mantenimiento · próximos 30 días
              </p>
              <ul className="mt-4 divide-y divide-border">
                {maintenance.map((item) => (
                  <li
                    key={item.date + item.title}
                    className="flex gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="w-12 shrink-0 font-mono text-[11px] uppercase tracking-wider text-terracotta">
                      {item.date}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {item.vendor}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
