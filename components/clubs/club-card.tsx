import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type ClubTag = 'destacado' | 'afiliado' | 'nuevo'

export type Club = {
  slug: string
  initial: string
  tag: ClubTag
  name: string
  tagline: string
  region: string
  city: string
  founded: number
  courts: string
  members: string
  tournaments: string
  leagues: string
  liveTournaments?: number
}

const tagLabels: Record<ClubTag, string> = {
  destacado: 'Destacado',
  afiliado: 'Club afiliado',
  nuevo: 'Nuevo',
}

const tagStyles: Record<
  ClubTag,
  { bg: string; ink: string; chip: string; bullet: string }
> = {
  destacado: {
    bg: 'bg-forest',
    ink: 'text-cream',
    chip: 'bg-lime/15 text-lime',
    bullet: 'bg-lime',
  },
  afiliado: {
    bg: 'bg-ink',
    ink: 'text-cream',
    chip: 'bg-cream/15 text-cream',
    bullet: 'bg-cream',
  },
  nuevo: {
    bg: 'bg-ochre',
    ink: 'text-ink',
    chip: 'bg-ink/10 text-ink',
    bullet: 'bg-ink',
  },
}

export function ClubCard({
  club,
  className,
}: {
  club: Club
  className?: string
}) {
  const styles = tagStyles[club.tag]

  return (
    <Link
      href={`/clubs/${club.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-lg border border-foreground/10 bg-card transition-colors hover:border-foreground/25',
        className,
      )}
    >
      {/* Cover */}
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
          <span>{tagLabels[club.tag]}</span>
          <span className="opacity-70">{club.courts} pistas</span>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-7xl italic opacity-25 select-none">
            {club.initial}
          </span>
        </div>

        <div className="relative">
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-sm px-2 py-1 font-mono text-[10px] uppercase tracking-widest',
              styles.chip,
            )}
          >
            {club.liveTournaments ? (
              <>
                <span className={cn('size-1.5 rounded-full', styles.bullet)} />
                {club.liveTournaments} torneos en juego
              </>
            ) : (
              <>Afiliado desde {club.founded}</>
            )}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {club.region} · {club.city}
        </p>

        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-3xl leading-tight tracking-tight text-foreground">
            {club.name}
          </h3>
          <p className="text-sm text-foreground/70">{club.tagline}</p>
        </div>

        <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-4 border-t border-foreground/10 pt-4 min-[380px]:grid-cols-4 min-[380px]:gap-y-3">
          <Stat label="Pistas" value={club.courts} />
          <Stat label="Socios" value={club.members} />
          <Stat label="Torneos" value={club.tournaments} accent />
          <Stat label="Ligas" value={club.leagues} accent />
        </dl>

        <span className="flex items-center justify-between border-t border-foreground/10 pt-4 font-mono text-xs uppercase tracking-widest text-foreground">
          Ver club
          <ArrowRight
            className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            strokeWidth={1.5}
          />
        </span>
      </div>
    </Link>
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
