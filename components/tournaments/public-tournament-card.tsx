import { cn } from '@/lib/utils'
import { Building2, ChevronRight, MapPin } from 'lucide-react'
import Link from 'next/link'

/** Estado simplificado para portada/filtros de un torneo público. */
export type FilterState = 'abierto' | 'en-juego' | 'finalizado'

export type PublicTournamentItem = {
  id: string
  name: string
  status: string
  statusLabel: string
  state: FilterState
  categoryCount: number
  teamCount: number
  dates: string
  location: string | null
  href: string
  watermark: string
  // Solo en el directorio global (varios clubes): nombre/slug del club organizador.
  clubName?: string
  clubSlug?: string
}

// Acento de la portada según el estado del torneo.
const coverStyles: Record<
  FilterState,
  { bg: string; ink: string; chip: string; dot: string }
> = {
  abierto: {
    bg: 'bg-terracotta',
    ink: 'text-cream',
    chip: 'bg-cream/15 text-cream',
    dot: 'bg-cream',
  },
  'en-juego': {
    bg: 'bg-forest',
    ink: 'text-cream',
    chip: 'bg-lime/20 text-lime',
    dot: 'bg-lime',
  },
  finalizado: {
    bg: 'bg-ink',
    ink: 'text-cream',
    chip: 'bg-cream/10 text-cream/80',
    dot: 'bg-cream/60',
  },
}

/**
 * Tarjeta enlazada de un torneo público. Se usa en el listado de un club y en el
 * directorio global `/torneos`; en este último muestra además el club organizador.
 */
export function PublicTournamentCard({
  item,
  index,
  total,
}: {
  item: PublicTournamentItem
  index: number
  total: number
}) {
  const styles = coverStyles[item.state]
  return (
    <Link
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-lg border border-foreground/10 bg-card transition-colors hover:border-terracotta/40"
    >
      {/* Portada */}
      <div
        className={cn(
          'relative flex min-h-[180px] flex-col justify-between p-5',
          styles.bg,
          styles.ink,
        )}
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent 0 22px, rgba(255,255,255,0.04) 22px 23px)',
        }}
      >
        <div className="flex items-start justify-between font-mono text-[10px] uppercase tracking-widest">
          <span className="opacity-80">Torneo</span>
          <span className="opacity-70">
            {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="select-none font-heading text-8xl italic opacity-20">
            {item.watermark}
          </span>
        </div>

        <span
          className={cn(
            'relative inline-flex w-fit items-center gap-2 rounded-sm px-2 py-1 font-mono text-[10px] uppercase tracking-widest',
            styles.chip,
          )}
        >
          <span className={cn('size-1.5 rounded-full', styles.dot)} />
          {item.statusLabel}
        </span>
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {item.categoryCount}{' '}
          {item.categoryCount === 1 ? 'categoría' : 'categorías'} · {item.dates}
        </p>

        <h3 className="font-heading text-3xl leading-tight tracking-tight text-foreground">
          {item.name}
        </h3>

        {item.clubName && (
          <p className="flex items-center gap-1.5 text-xs text-foreground/70">
            <Building2 className="size-3.5 shrink-0" strokeWidth={1.5} />
            {item.clubName}
          </p>
        )}

        {item.location && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" strokeWidth={1.5} />
            {item.location}
          </p>
        )}

        <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-foreground/10 pt-4">
          <div className="flex flex-col gap-1">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Parejas
            </dt>
            <dd className="font-mono text-base text-foreground tabular-nums">
              {item.teamCount}
            </dd>
          </div>
          <div className="flex items-end justify-end">
            <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-ink transition-colors group-hover:text-terracotta">
              Ver torneo
              <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </dl>
      </div>
    </Link>
  )
}
