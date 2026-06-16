import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  AtSign,
  Bell,
  Radio,
  Receipt,
  RefreshCw,
  Trophy,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notificaciones',
}

/* -------------------------------------------------------------------------- */
/*  Modelo + datos de ejemplo                                                 */
/* -------------------------------------------------------------------------- */

type EventKind = 'en-juego' | 'aviso' | 'pago' | 'resultado' | 'mensaje' | 'sistema'

type KindMeta = {
  label: string
  icon: LucideIcon
  /** Pastilla de tipo. */
  tag: string
  /** Punto de la línea temporal + barra lateral. */
  bar: string
  /** Color del icono circular. */
  chip: string
}

const kindMeta: Record<EventKind, KindMeta> = {
  'en-juego': {
    label: 'En juego',
    icon: Radio,
    tag: 'bg-forest text-cream',
    bar: 'bg-forest',
    chip: 'border-forest/30 bg-forest/10 text-forest',
  },
  aviso: {
    label: 'Aviso',
    icon: TriangleAlert,
    tag: 'bg-terracotta/12 text-terracotta',
    bar: 'bg-terracotta',
    chip: 'border-terracotta/30 bg-terracotta/10 text-terracotta',
  },
  pago: {
    label: 'Pago',
    icon: Receipt,
    tag: 'bg-forest/12 text-forest',
    bar: 'bg-forest/45',
    chip: 'border-forest/30 bg-forest/10 text-forest',
  },
  resultado: {
    label: 'Resultado',
    icon: Trophy,
    tag: 'bg-ochre/20 text-ochre',
    bar: 'bg-ochre',
    chip: 'border-ochre/35 bg-ochre/12 text-ochre',
  },
  mensaje: {
    label: 'Mensaje',
    icon: AtSign,
    tag: 'bg-muted text-muted-foreground',
    bar: 'bg-muted-foreground/35',
    chip: 'border-border bg-muted text-muted-foreground',
  },
  sistema: {
    label: 'Sistema',
    icon: RefreshCw,
    tag: 'bg-muted text-muted-foreground',
    bar: 'bg-border',
    chip: 'border-border bg-muted text-muted-foreground',
  },
}

type Notification = {
  time: string
  kind: EventKind
  title: string
  meta: string
  /** Texto del botón de acción, si lo hay. */
  action?: string
  /** Variante visual del botón de acción. */
  actionTone?: 'solid' | 'outline'
  unread?: boolean
}

type DayGroup = {
  label: string
  count: string
  items: Notification[]
}

const timeline: DayGroup[] = [
  {
    label: 'Hoy · Martes 25 jun',
    count: '6 eventos',
    items: [
      {
        time: '16:32',
        kind: 'en-juego',
        title: 'Partido en juego sin árbitro asignado',
        meta: 'P4 · 2ª M cuartos · Lozano / Reig · por Sistema',
        action: 'Asignar',
        actionTone: 'outline',
        unread: true,
      },
      {
        time: '16:18',
        kind: 'aviso',
        title: 'Conflicto de pista detectado',
        meta: 'P3 · 17:30 · doble reserva · por Programación',
        action: 'Resolver',
        actionTone: 'solid',
        unread: true,
      },
      {
        time: '15:55',
        kind: 'pago',
        title: 'Pago recibido · €40',
        meta: 'Inscripción · Climent + sin pareja · por Stripe',
        unread: true,
      },
      {
        time: '14:22',
        kind: 'resultado',
        title: 'Resultado cargado por jugador',
        meta: 'García / Ros · 2ª M oct. · 6-4 4-6 7-6⁵ · por I. Puig',
        action: 'Confirmar',
        actionTone: 'outline',
        unread: true,
      },
      {
        time: '12:08',
        kind: 'mensaje',
        title: '4 jugadores piden cambio de horario',
        meta: 'Open Verano · 1ª jornada · por Bandeja',
        action: 'Ver mensajes',
        actionTone: 'outline',
      },
      {
        time: '09:30',
        kind: 'sistema',
        title: 'Sincronización con Google Calendar OK',
        meta: '74 eventos enviados · 0 errores · por Sistema',
      },
    ],
  },
  {
    label: 'Ayer · Lunes 24 jun',
    count: '4 eventos',
    items: [
      {
        time: '21:47',
        kind: 'resultado',
        title: 'Final 4ª M veteranos finalizada',
        meta: 'Climent / Beneyto campeones · 7-6 6-4 · por T. Reig',
        action: 'Publicar reseña',
        actionTone: 'outline',
      },
      {
        time: '19:12',
        kind: 'pago',
        title: '5 pagos confirmados · €200',
        meta: 'Inscripciones Trofeo del Olivar · por Stripe',
      },
      {
        time: '17:08',
        kind: 'mensaje',
        title: 'Comunicado enviado a 128 jugadores',
        meta: 'Open Verano · cuadros publicados · por Tú · Carla',
      },
      {
        time: '10:24',
        kind: 'aviso',
        title: 'Vidrio panel 3 con grieta',
        meta: 'P6 · Mistral · reportado por jugador · por M. Cervera',
        action: 'Crear orden',
        actionTone: 'outline',
      },
    ],
  },
  {
    label: 'Esta semana',
    count: '4 eventos',
    items: [
      {
        time: '22 jun',
        kind: 'sistema',
        title: 'Cuadros generados automáticamente',
        meta: 'Open de Verano · 6 categorías · 94 partidos · por Sistema',
      },
      {
        time: '21 jun',
        kind: 'pago',
        title: 'Cierre de inscripciones · Open Verano',
        meta: '128 inscritos · €5.120 recaudado · por Sistema',
      },
      {
        time: '20 jun',
        kind: 'resultado',
        title: 'Trofeo del Olivar archivado',
        meta: '7 categorías · 142 partidos · por Sistema',
      },
      {
        time: '19 jun',
        kind: 'mensaje',
        title: 'Carla respondió a 12 jugadores',
        meta: 'Dudas de inscripción · Open Verano · por Carla',
      },
    ],
  },
]

const stats = [
  { label: 'Sin leer', value: '4', sub: 'Requieren acción' },
  { label: 'Avisos', value: '2', sub: 'Alta prioridad' },
  { label: 'Mensajes', value: '6', sub: 'Esta semana' },
  { label: 'Eventos', value: '38', sub: 'Últimos 7 días' },
]

const tabs = [
  { label: 'Todas', count: '38' },
  { label: 'Sin leer', count: '4' },
  { label: 'Mencionan a Carla', count: '2' },
  { label: 'Acción requerida', count: '4' },
  { label: 'Archivadas', count: '12' },
]

const typeFilters = ['Sistema', 'Resultados', 'Pagos', 'Avisos', 'Mensajes']

type ActionItem = {
  title: string
  when: string
  cta: string
  tone: 'terracotta' | 'ochre'
}

const actionItems: ActionItem[] = [
  {
    title: 'Resolver conflicto P3',
    when: 'Hace 12 min',
    cta: 'Reasignar',
    tone: 'terracotta',
  },
  {
    title: 'Confirmar resultado García / Ros',
    when: 'Hace 2 h',
    cta: 'Validar',
    tone: 'ochre',
  },
  {
    title: 'Publicar reseña de la final V+45',
    when: 'Ayer 21:47',
    cta: 'Redactar',
    tone: 'terracotta',
  },
  {
    title: 'Crear orden vidrio P6',
    when: 'Ayer 10:24',
    cta: 'Crear',
    tone: 'terracotta',
  },
]

const preferences = [
  { label: 'Conflictos de pista', on: true },
  { label: 'Resultados sin confirmar', on: true },
  { label: 'Pagos confirmados', on: true },
  { label: 'Inscripciones nuevas', on: true },
  { label: 'Mensajes de jugadores', on: true },
  { label: 'Eventos del sistema', on: false },
  { label: 'Resumen diario · 21:00', on: true },
]

/* -------------------------------------------------------------------------- */
/*  Página                                                                    */
/* -------------------------------------------------------------------------- */

export default function NotificacionesPage() {
  return (
    <>
      <DashboardTopbar>
        <Button variant="outline" className="h-9 rounded-md px-4 text-sm">
          Marcar todo como leído
        </Button>
        <Button variant="outline" className="h-9 rounded-md px-4 text-sm">
          Preferencias
        </Button>
        <Button className="h-9 gap-1.5 rounded-md px-4 text-sm">
          <Bell className="size-4" strokeWidth={2} />
          Crear comunicado
        </Button>
      </DashboardTopbar>

      <div className="mx-auto max-w-[1600px] px-8 py-10">
        {/* ---- Encabezado + métricas ---- */}
        <section className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Bandeja de entrada · Martes 25 jun
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Lo que pasa <em className="italic">en el club.</em>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Resultados cargados, pagos recibidos, avisos de mantenimiento y
              mensajes de jugadores — todo en orden cronológico.
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

        {/* ---- Filtros ---- */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <div className="flex flex-wrap items-center gap-1">
            {tabs.map((tab, i) => (
              <span
                key={tab.label}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider',
                  i === 0
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground',
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'tabular-nums',
                    i === 0 ? 'text-background/55' : 'text-muted-foreground/55',
                  )}
                >
                  {tab.count}
                </span>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {typeFilters.map((filter) => (
              <span
                key={filter}
                className="rounded-md border border-border px-2.5 py-1"
              >
                {filter}
              </span>
            ))}
          </div>
        </div>

        {/* ---- Cuerpo: línea temporal + panel lateral ---- */}
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* Línea temporal */}
          <div className="min-w-0 space-y-9">
            {timeline.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {group.label}
                  </p>
                  <span className="h-px flex-1 bg-border" />
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                    {group.count}
                  </p>
                </div>

                <ul className="mt-3 space-y-2">
                  {group.items.map((item) => {
                    const meta = kindMeta[item.kind]
                    const Icon = meta.icon
                    return (
                      <li
                        key={item.time + item.title}
                        className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-border bg-card py-3.5 pl-5 pr-4"
                      >
                        {/* Barra lateral por tipo */}
                        <span
                          className={cn(
                            'absolute inset-y-0 left-0 w-1',
                            meta.bar,
                          )}
                        />

                        {/* Hora */}
                        <span className="w-12 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                          {item.time}
                        </span>

                        {/* Icono de tipo */}
                        <span
                          className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-full border',
                            meta.chip,
                          )}
                        >
                          <Icon className="size-3.5" strokeWidth={1.75} />
                        </span>

                        {/* Texto */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm text-foreground">
                              {item.title}
                            </p>
                            <span
                              className={cn(
                                'shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest',
                                meta.tag,
                              )}
                            >
                              {meta.label}
                            </span>
                            {item.unread && (
                              <span className="size-1.5 shrink-0 rounded-full bg-terracotta" />
                            )}
                          </div>
                          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {item.meta}
                          </p>
                        </div>

                        {/* Acción */}
                        {item.action && (
                          <Button
                            variant={
                              item.actionTone === 'solid'
                                ? 'default'
                                : 'outline'
                            }
                            className="h-8 shrink-0 rounded-md px-3 text-xs"
                          >
                            {item.action}
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Panel lateral */}
          <aside className="space-y-6">
            {/* Acción requerida */}
            <div className="rounded-xl border border-terracotta/40 bg-terracotta/5 p-5">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-terracotta">
                <span className="size-1.5 rounded-full bg-terracotta" />
                4 esperan tu respuesta
              </p>
              <h2 className="mt-1.5 font-serif text-xl tracking-tight text-foreground">
                Acción requerida.
              </h2>
              <ul className="mt-4 divide-y divide-terracotta/15">
                {actionItems.map((item) => (
                  <li
                    key={item.title}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {item.when}
                      </p>
                    </div>
                    <Button
                      className={cn(
                        'h-7 shrink-0 rounded-md px-3 text-xs text-cream',
                        item.tone === 'ochre'
                          ? 'bg-ochre hover:bg-ochre/90'
                          : 'bg-terracotta hover:bg-terracotta/90',
                      )}
                    >
                      {item.cta}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preferencias */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Preferencias · qué te avisamos
              </p>
              <ul className="mt-4 space-y-3">
                {preferences.map((pref) => (
                  <li
                    key={pref.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <span
                      className={cn(
                        'text-sm',
                        pref.on
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {pref.label}
                    </span>
                    <span
                      role="switch"
                      aria-checked={pref.on}
                      className={cn(
                        'flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors',
                        pref.on ? 'bg-forest' : 'bg-muted-foreground/25',
                      )}
                    >
                      <span
                        className={cn(
                          'size-4 rounded-full bg-cream shadow-sm transition-transform',
                          pref.on && 'translate-x-4',
                        )}
                      />
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                Recibes en: email · push · WhatsApp. Las urgencias siempre se
                notifican, incluso fuera del horario silencio.
              </p>
            </div>

            {/* Horario silencio */}
            <div className="rounded-xl bg-forest p-5 text-cream">
              <p className="font-mono text-[10px] uppercase tracking-widest text-cream/55">
                Horario silencio
              </p>
              <p className="mt-2 font-serif text-3xl tracking-tight">
                23:00 — 08:30
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-cream/55">
                Sin push · sin WhatsApp · email se acumula
              </p>
            </div>
          </aside>
        </section>
      </div>
    </>
  )
}
