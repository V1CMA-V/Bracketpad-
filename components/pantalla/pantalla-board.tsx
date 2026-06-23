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

// Separación (px) entre tarjetas del carrusel. Debe ser la misma dentro de cada
// copia y entre copias para que el bucle case sin saltos.
const CARD_GAP = 18

/**
 * Tablero del modo pantalla (TV): ocupa todo el alto sin scroll. Los partidos
 * «en juego» quedan fijos arriba (lo más importante) y los próximos pasan en un
 * CARRUSEL vertical continuo que se desplaza solo a una velocidad legible, así un
 * jugador identifica su partido sin tocar nada. Las tarjetas son grandes: su
 * tipografía escala al ancho de la tarjeta (ver `.pantalla-*` en globals.css).
 */
export function PantallaBoard({
  live,
  upcoming,
  // Velocidad del carrusel en píxeles por segundo. Lenta a propósito (legible).
  speed = 55,
}: {
  live: PantallaRow[]
  upcoming: PantallaRow[]
  speed?: number
}) {
  if (live.length === 0 && upcoming.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-cream/40">
          Sin partidos
        </p>
        <p className="mt-4 font-serif text-5xl tracking-tight text-cream/70">
          No hay partidos programados para hoy.
        </p>
      </div>
    )
  }

  // Cuando no hay próximos, «en juego» llena todo el alto; si hay ambos, se acota
  // para no comerse la pantalla (y rota si hay muchos en juego).
  const liveFills = upcoming.length === 0

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden">
      {/* ---- En juego (acotado + carrusel si hay muchos) ---- */}
      {live.length > 0 && (
        <section
          className={cn('flex flex-col', liveFills ? 'min-h-0 flex-1' : 'shrink-0')}
        >
          <SectionHeader dot="bg-lime" label="En juego" count={live.length} />
          <VerticalMarquee
            speed={speed}
            className={cn('mt-4', liveFills ? 'min-h-0 flex-1' : 'max-h-[40vh]')}
          >
            <div className="flex flex-col" style={{ gap: CARD_GAP }}>
              {live.map((r) => (
                <MatchCard key={r.id} row={r} live />
              ))}
            </div>
          </VerticalMarquee>
        </section>
      )}

      {/* ---- A continuación (carrusel) ---- */}
      {upcoming.length > 0 && (
        <section className="flex min-h-0 flex-1 flex-col">
          <SectionHeader
            dot="bg-ochre"
            label="A continuación"
            count={upcoming.length}
          />
          <VerticalMarquee speed={speed} className="mt-4 min-h-0 flex-1">
            <div className="flex flex-col" style={{ gap: CARD_GAP }}>
              {upcoming.map((r) => (
                <MatchCard key={r.id} row={r} />
              ))}
            </div>
          </VerticalMarquee>
        </section>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Carrusel vertical                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Viewport que desplaza su contenido hacia arriba en bucle continuo cuando éste
 * no cabe en el alto que se le da. Mide el alto real del bloque y lo duplica (la
 * 2ª copia oculta a lectores) para que el bucle sea perfecto; la duración se
 * calcula desde la velocidad para que el ritmo sea constante, lo haya 4 partidos
 * o 40. Si todo cabe, no se mueve. El bloque (`children`) trae su propia
 * distribución (lista o rejilla) con hueco `CARD_GAP`, igual que el hueco con que
 * se separan las dos copias, para que el ciclo encaje sin saltos.
 */
function VerticalMarquee({
  children,
  speed,
  className,
}: {
  children: ReactNode
  speed: number
  className?: string
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
      const overflow = copyH > viewport.offsetHeight + 4
      setScroll(overflow)
      // Distancia de un ciclo: una copia completa + el hueco que la separa de la
      // siguiente, para que la 2ª copia caiga justo donde empezaba la 1ª.
      setShift(copyH + CARD_GAP)
    }
    const ro = new ResizeObserver(measure)
    ro.observe(viewport)
    ro.observe(copy)
    return () => ro.disconnect()
  }, [children])

  const duration = shift > 0 ? shift / speed : 0

  return (
    <div ref={viewportRef} className={cn('relative overflow-hidden', className)}>
      {/* Difuminado superior/inferior para que las tarjetas entren y salgan suave
          (solo cuando el carrusel se está desplazando). */}
      {scroll && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-ink to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-ink to-transparent" />
        </>
      )}

      <div
        className={cn('flex flex-col', scroll && 'pantalla-marquee')}
        style={
          {
            gap: CARD_GAP,
            ...(scroll
              ? {
                  animationDuration: `${duration}s`,
                  '--pantalla-shift': `${shift}px`,
                }
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

/* -------------------------------------------------------------------------- */
/*  Subcomponentes                                                             */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  dot,
  label,
  count,
}: {
  dot: string
  label: string
  count: number
}) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <span className={cn('size-2.5 rounded-full', dot)} />
      <h2 className="font-mono text-sm uppercase tracking-[0.3em] text-cream/80">
        {label}
      </h2>
      <span className="font-mono text-sm tabular-nums text-cream/35">
        {String(count).padStart(2, '0')}
      </span>
      <span className="h-px flex-1 bg-cream/10" />
    </div>
  )
}

function MatchCard({ row, live = false }: { row: PantallaRow; live?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-stretch gap-5 overflow-hidden rounded-2xl border px-6 py-5 lg:gap-6 lg:px-8 lg:py-7',
        live ? 'border-lime/25 bg-forest/40' : 'border-cream/10 bg-cream/[0.03]',
      )}
    >
      {/* Acento lateral en los partidos en juego. */}
      {live && (
        <span className="-my-5 -ml-6 w-1.5 shrink-0 bg-lime lg:-my-7 lg:-ml-8" />
      )}

      {/* Hora + estado */}
      <div className="flex w-40 shrink-0 flex-col justify-center border-r border-cream/10 pr-5 lg:w-48 lg:pr-6">
        <span className="font-mono text-4xl leading-none tabular-nums lg:text-5xl">
          {row.timeLabel}
        </span>
        <span
          className={cn(
            'mt-2 font-mono text-[11px] uppercase tracking-[0.25em] lg:text-xs',
            live ? 'text-lime' : 'text-cream/45',
          )}
        >
          {live ? 'En juego' : 'Próximo'}
        </span>
      </div>

      {/* Enfrentamiento + competición */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="truncate font-serif text-3xl leading-[1.05] tracking-tight lg:text-5xl">
          {row.sideA}
        </p>
        <p className="my-1 font-mono text-[11px] uppercase tracking-[0.4em] text-cream/30 lg:text-xs">
          vs
        </p>
        <p className="truncate font-serif text-3xl leading-[1.05] tracking-tight lg:text-5xl">
          {row.sideB}
        </p>
        <p className="mt-3 truncate font-mono text-[11px] uppercase tracking-[0.2em] text-cream/45 lg:text-sm">
          {row.competition}
        </p>
      </div>

      {/* Cancha */}
      <div className="flex w-28 shrink-0 flex-col items-end justify-center border-l border-cream/10 pl-5 text-right lg:w-40 lg:pl-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream/40 lg:text-xs">
          Cancha
        </span>
        <span className="mt-1 max-w-full truncate font-serif text-2xl leading-tight tracking-tight lg:text-4xl">
          {row.court ?? '—'}
        </span>
      </div>
    </div>
  )
}
