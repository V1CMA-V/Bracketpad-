import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

export type TournamentTag = 'destacado' | 'abierta' | 'nuevo'

export type Tournament = {
  index: number
  total: number
  tag: TournamentTag
  status: string
  meta: string
  title: string
  subtitle: string
  location: string
  inscritos: string
  premio: string
  plazas: string
  cta: string
  watermark?: string
}

const tagLabels: Record<TournamentTag, string> = {
  destacado: 'Destacado',
  abierta: 'Inscripción abierta',
  nuevo: 'Nuevo',
}

const tagStyles: Record<
  TournamentTag,
  { bg: string; ink: string; bullet: string; chip: string }
> = {
  destacado: {
    bg: 'bg-forest',
    ink: 'text-cream',
    bullet: 'bg-lime text-cream',
    chip: 'bg-lime/15 text-lime',
  },
  abierta: {
    bg: 'bg-terracotta',
    ink: 'text-cream',
    bullet: 'bg-cream text-cream',
    chip: 'bg-cream/15 text-cream',
  },
  nuevo: {
    bg: 'bg-ochre',
    ink: 'text-ink',
    bullet: 'bg-ink text-ink',
    chip: 'bg-ink/10 text-ink',
  },
}

export function TournamentCard({
  tournament,
  className,
}: {
  tournament: Tournament
  className?: string
}) {
  const t = tournament
  const styles = tagStyles[t.tag]
  const isFeatured = t.tag === 'destacado'

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-foreground/10 bg-card',
        className,
      )}
    >
      {/* Cover */}
      <div
        className={cn(
          'relative flex flex-col justify-between p-5 min-h-[220px]',
          styles.bg,
          styles.ink,
        )}
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent 0 22px, rgba(255,255,255,0.04) 22px 23px)',
        }}
      >
        <div className="flex items-start justify-between font-mono text-[10px] uppercase tracking-widest">
          <span>{tagLabels[t.tag]}</span>
          <span className="opacity-70">
            {String(t.index).padStart(2, '0')} / {String(t.total).padStart(2, '0')}
          </span>
        </div>

        {t.watermark && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="font-serif italic text-7xl opacity-25 select-none">
              {t.watermark}
            </span>
          </div>
        )}

        <div className="relative">
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-sm px-2 py-1 font-mono text-[10px] uppercase tracking-widest',
              styles.chip,
            )}
          >
            <span className={cn('size-1.5 rounded-full', styles.bullet)} />
            {t.status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {t.meta}
        </p>

        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-3xl leading-tight tracking-tight text-foreground">
            {t.title}
          </h3>
          <p className="text-sm text-foreground/70">{t.subtitle}</p>
          <p className="text-xs text-muted-foreground">{t.location}</p>
        </div>

        <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-foreground/10 pt-4">
          <Stat label="Inscritos" value={t.inscritos} />
          <Stat label="Premio" value={t.premio} />
          <Stat label="Plazas" value={t.plazas} accent />
        </dl>

        <div className="flex items-stretch gap-2">
          <Button className="flex-1 h-10 rounded-md bg-ink text-cream hover:bg-ink/90 font-medium">
            {t.cta}
          </Button>
          {isFeatured && (
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-md border-foreground/15"
              aria-label="Ver detalle"
            >
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          'font-mono text-base',
          accent ? 'text-terracotta' : 'text-foreground',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
