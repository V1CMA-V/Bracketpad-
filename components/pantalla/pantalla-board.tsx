'use client'

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import { cn } from '@/lib/utils'

export type PantallaRow = {
  id: string
  live: boolean
  timeLabel: string
  court: string | null
  sideA: string
  sideB: string
  competition: string
}

/**
 * Tablero del modo pantalla (TV), estilo retransmisión: «en juego» es una tarjeta
 * protagonista que rota una a una (estable y legible) y «a continuación» es una
 * marquesina vertical tipo panel de salidas. Una sola zona se desplaza, así que
 * nunca se solapan. Ocupa todo el alto sin scroll manual.
 */
export function PantallaBoard({
  live,
  upcoming,
  // Velocidad de la marquesina (px/seg) y cadencia de la tarjeta en juego (ms).
  speed = 50,
  liveIntervalMs = 7000,
}: {
  live: PantallaRow[]
  upcoming: PantallaRow[]
  speed?: number
  liveIntervalMs?: number
}) {
  if (live.length === 0 && upcoming.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="font-mono text-sm uppercase tracking-[0.4em] text-cream/40">
          Sin partidos
        </p>
        <p className="mt-5 font-serif text-5xl tracking-tight text-cream/70">
          No hay partidos programados para hoy.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-7 overflow-hidden">
      {live.length > 0 && (
        <LiveFeature
          rows={live}
          intervalMs={liveIntervalMs}
          fill={upcoming.length === 0}
        />
      )}

      {upcoming.length > 0 && (
        <section className="flex min-h-0 flex-1 flex-col">
          <Heading dot="ochre" label="A continuación" count={upcoming.length} />
          <VerticalMarquee speed={speed} className="mt-2 min-h-0 flex-1">
            <div className="flex flex-col">
              {upcoming.map((r) => (
                <UpcomingRow key={r.id} row={r} />
              ))}
            </div>
          </VerticalMarquee>
        </section>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  En juego — tarjeta protagonista rotatoria                                  */
/* -------------------------------------------------------------------------- */

function LiveFeature({
  rows,
  intervalMs,
  fill,
}: {
  rows: PantallaRow[]
  intervalMs: number
  fill: boolean
}) {
  const n = rows.length
  const multi = n > 1
  const [i, setI] = useState(0)
  const idx = i % n

  useEffect(() => {
    if (!multi) return
    const id = setInterval(() => setI((p) => (p + 1) % n), intervalMs)
    return () => clearInterval(id)
  }, [n, multi, intervalMs])

  const row = rows[idx]

  return (
    <section className={cn('flex flex-col', fill ? 'min-h-0 flex-1' : 'shrink-0')}>
      <Heading
        dot="lime"
        label="En juego"
        count={n}
        right={
          multi ? (
            <div className="flex items-center gap-1.5">
              {rows.map((_, k) => (
                <span
                  key={k}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    k === idx ? 'w-7 bg-lime' : 'w-1.5 bg-cream/20',
                  )}
                />
              ))}
            </div>
          ) : null
        }
      />
      <div className={cn('relative mt-2', fill ? 'min-h-0 flex-1' : '')}>
        <LiveCard key={idx} row={row} fill={fill} durationMs={multi ? intervalMs : 0} />
      </div>
    </section>
  )
}

function LiveCard({
  row,
  fill,
  durationMs,
}: {
  row: PantallaRow
  fill: boolean
  durationMs: number
}) {
  return (
    <article
      className={cn(
        'relative flex items-stretch gap-6 overflow-hidden rounded-3xl border border-lime/25 bg-gradient-to-br from-forest/55 via-forest/25 to-ink px-8 py-6 duration-700 animate-in fade-in slide-in-from-bottom-2 lg:gap-10 lg:px-10 lg:py-8',
        fill && 'h-full',
      )}
    >
      {/* Glow de ambiente. */}
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-lime/10 blur-3xl" />
      {/* Acento lateral. */}
      <span className="absolute inset-y-0 left-0 w-1.5 bg-lime" />

      {/* Hora + estado */}
      <div className="relative flex w-44 shrink-0 flex-col justify-center lg:w-56">
        <span className="font-mono text-5xl leading-none tabular-nums text-cream lg:text-6xl">
          {row.timeLabel}
        </span>
        <span className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-lime lg:text-xs">
          <span className="size-2 animate-pulse rounded-full bg-lime" />
          En directo
        </span>
      </div>

      {/* Enfrentamiento */}
      <div className="relative flex min-w-0 flex-1 flex-col justify-center">
        <p className="truncate font-serif text-4xl leading-[1.04] tracking-tight text-cream lg:text-6xl">
          {row.sideA}
        </p>
        <p className="my-1.5 font-mono text-[11px] uppercase tracking-[0.5em] text-cream/35 lg:text-xs">
          vs
        </p>
        <p className="truncate font-serif text-4xl leading-[1.04] tracking-tight text-cream lg:text-6xl">
          {row.sideB}
        </p>
        <p className="mt-4 truncate font-mono text-[11px] uppercase tracking-[0.25em] text-cream/45 lg:text-sm">
          {row.competition}
        </p>
      </div>

      {/* Cancha */}
      <CourtToken court={row.court} tone="lime" size="lg" />

      {/* Barra de avance hacia el siguiente partido en juego. */}
      {durationMs > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-cream/10">
          <div
            className="h-full origin-left bg-lime"
            style={{ animation: `pantalla-progress ${durationMs / 1000}s linear` }}
          />
        </div>
      )}
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/*  A continuación — marquesina vertical (panel de salidas)                    */
/* -------------------------------------------------------------------------- */

function UpcomingRow({ row }: { row: PantallaRow }) {
  return (
    <div className="flex items-center gap-6 border-b border-cream/10 py-5 lg:gap-10 lg:py-6">
      {/* Hora + estado */}
      <div className="flex w-32 shrink-0 flex-col lg:w-44">
        <span className="font-mono text-3xl leading-none tabular-nums text-cream lg:text-4xl">
          {row.timeLabel}
        </span>
        <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-ochre/90 lg:text-[11px]">
          Próximo
        </span>
      </div>

      {/* Enfrentamiento */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-2xl leading-[1.1] tracking-tight text-cream/95 lg:text-4xl">
          {row.sideA}
        </p>
        <p className="truncate font-serif text-2xl leading-[1.1] tracking-tight text-cream/70 lg:text-4xl">
          <span className="mr-2 font-mono text-[11px] uppercase tracking-[0.4em] text-cream/30 align-middle">
            vs
          </span>
          {row.sideB}
        </p>
        <p className="mt-2 truncate font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40 lg:text-xs">
          {row.competition}
        </p>
      </div>

      {/* Cancha */}
      <CourtToken court={row.court} tone="neutral" size="sm" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Piezas compartidas                                                         */
/* -------------------------------------------------------------------------- */

function Heading({
  dot,
  label,
  count,
  right,
}: {
  dot: 'lime' | 'ochre'
  label: string
  count: number
  right?: ReactNode
}) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <span
        className={cn(
          'size-2.5 rounded-full',
          dot === 'lime' ? 'animate-pulse bg-lime' : 'bg-ochre',
        )}
      />
      <h2 className="font-mono text-sm uppercase tracking-[0.35em] text-cream/80">
        {label}
      </h2>
      <span className="font-mono text-sm tabular-nums text-cream/35">
        {String(count).padStart(2, '0')}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-cream/15 to-transparent" />
      {right}
    </div>
  )
}

function CourtToken({
  court,
  tone,
  size,
}: {
  court: string | null
  tone: 'lime' | 'neutral'
  size: 'lg' | 'sm'
}) {
  const big = size === 'lg'
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border text-center',
        big ? 'w-32 lg:w-44' : 'w-24 py-3 lg:w-32',
        tone === 'lime'
          ? 'border-lime/30 bg-lime/[0.06]'
          : 'border-cream/12 bg-cream/[0.02]',
      )}
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-cream/40 lg:text-[10px]">
        Cancha
      </span>
      <span
        className={cn(
          'max-w-full truncate px-2 font-serif leading-none tracking-tight',
          big ? 'text-2xl lg:text-4xl' : 'text-xl lg:text-3xl',
          tone === 'lime' ? 'text-lime' : 'text-cream',
        )}
      >
        {court ?? '—'}
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Marquesina vertical                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Desplaza su contenido hacia arriba en bucle continuo cuando no cabe en el alto
 * que se le da. Mide el alto del bloque y lo duplica (la 2ª copia oculta) para un
 * bucle perfecto; la duración deriva de la velocidad para un ritmo constante.
 */
function VerticalMarquee({
  children,
  speed,
  className,
  gap = 0,
}: {
  children: ReactNode
  speed: number
  className?: string
  gap?: number
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const [scroll, setScroll] = useState(false)
  const [shift, setShift] = useState(0)

  useEffect(() => {
    const viewport = viewportRef.current
    const copy = copyRef.current
    if (!viewport || !copy) return
    const measure = () => {
      const copyH = copy.offsetHeight
      setScroll(copyH > viewport.offsetHeight + 4)
      setShift(copyH + gap)
    }
    const ro = new ResizeObserver(measure)
    ro.observe(viewport)
    ro.observe(copy)
    return () => ro.disconnect()
  }, [children, gap])

  const duration = shift > 0 ? shift / speed : 0

  return (
    <div ref={viewportRef} className={cn('relative overflow-hidden', className)}>
      {scroll && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-ink to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-ink to-transparent" />
        </>
      )}

      <div
        className={cn('flex flex-col', scroll && 'pantalla-marquee')}
        style={
          {
            gap,
            ...(scroll
              ? { animationDuration: `${duration}s`, '--pantalla-shift': `${shift}px` }
              : {}),
          } as CSSProperties
        }
      >
        <div ref={copyRef}>{children}</div>
        {scroll && <div aria-hidden>{children}</div>}
      </div>
    </div>
  )
}
