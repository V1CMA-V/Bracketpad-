import { ArrowRight, Building2, CalendarDays, LayoutGrid, Users } from 'lucide-react'
import Link from 'next/link'

import { compact } from '@/lib/format'
import { prisma } from '@/lib/prisma'

async function getHeroData() {
  const year = new Date().getFullYear()
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year + 1, 0, 1)

  const [clubCount, courtCount, playerCount, tournamentsThisYear, featured] =
    await Promise.all([
      prisma.club.count({ where: { isActive: true } }),
      prisma.court.count({ where: { isActive: true } }),
      prisma.player.count(),
      prisma.tournament.count({
        where: { startDate: { gte: yearStart, lt: yearEnd } },
      }),
      prisma.club.findFirst({
        where: { isActive: true },
        orderBy: [
          { tournaments: { _count: 'desc' } },
          { courts: { _count: 'desc' } },
        ],
        select: {
          name: true,
          slug: true,
          city: true,
          state: true,
          country: true,
          foundedYear: true,
          description: true,
          _count: {
            select: { courts: true, players: true, tournaments: true },
          },
        },
      }),
    ])

  return { year, clubCount, courtCount, playerCount, tournamentsThisYear, featured }
}

export async function Hero() {
  const {
    year,
    clubCount,
    courtCount,
    playerCount,
    tournamentsThisYear,
    featured,
  } = await getHeroData()

  const stats = [
    { icon: Building2, label: 'Clubs afiliados', value: compact(clubCount) },
    { icon: LayoutGrid, label: 'Pistas en la red', value: compact(courtCount) },
    { icon: Users, label: 'Socios activos', value: compact(playerCount) },
    {
      icon: CalendarDays,
      label: `Torneos · ${year}`,
      value: compact(tournamentsThisYear),
    },
  ]

  return (
    <section className="bg-cream px-5 py-12 sm:px-6 sm:py-14 md:px-12 md:py-16">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Columna izquierda */}
        <div className="flex flex-col">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
            Directorio · Clubes {year}
          </p>

          <h1 className="mt-4 font-heading text-5xl leading-[1.02] tracking-tight text-ink sm:mt-5 sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Encuentra tu{' '}
            <span className="block">
              <em className="italic">club.</em>
            </span>
          </h1>

          <p className="mt-5 max-w-md font-serif text-base italic leading-relaxed text-ink/80 sm:mt-6 sm:text-lg">
            Todos los clubes de pádel de la comunidad, con sus pistas, torneos y
            comunidad. Busca por nombre o provincia y entra a su ficha.
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-border pt-8 sm:gap-x-8 lg:mt-auto">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <Icon className="size-4 text-ink/40" strokeWidth={1.5} />
                <dd className="font-heading text-4xl leading-none text-ink">
                  {value}
                </dd>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        {/* Columna derecha — club destacado */}
        {featured ? (
          <FeaturedClub club={featured} />
        ) : (
          <EmptyFeatured />
        )}
      </div>
    </section>
  )
}

type FeaturedData = {
  name: string
  slug: string
  city: string | null
  state: string | null
  country: string | null
  foundedYear: number | null
  description: string | null
  _count: { courts: number; players: number; tournaments: number }
}

function FeaturedClub({ club }: { club: FeaturedData }) {
  const region = club.state ?? club.city ?? club.country ?? 'Comunidad'
  const tagline =
    club.description?.trim() ||
    `${club._count.courts} ${club._count.courts === 1 ? 'pista' : 'pistas'} y ${
      club._count.tournaments
    } ${club._count.tournaments === 1 ? 'torneo' : 'torneos'} organizados.`

  return (
    <div
      className="flex flex-col rounded-xl bg-forest p-6 text-cream sm:p-7 md:p-9"
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, transparent 0 18px, rgba(255,255,255,0.04) 18px 19px)',
      }}
    >
      <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-widest sm:text-xs">
        <span className="flex items-center gap-2 text-lime">
          <span className="size-1.5 shrink-0 rounded-full bg-lime" />
          Club destacado
        </span>
        <span className="truncate text-cream/55">{region}</span>
      </div>

      <h2 className="mt-5 font-heading text-4xl leading-[0.95] tracking-tight text-cream sm:mt-6 sm:text-5xl md:text-6xl">
        {club.name}
        <span className="text-lime">.</span>
      </h2>
      <p className="mt-4 max-w-sm font-serif text-base italic leading-relaxed text-cream/70">
        {tagline}
      </p>

      <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-cream/12 pt-6 font-mono">
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-cream/50">
            Pistas
          </dt>
          <dd className="mt-1 font-heading text-2xl text-cream">
            {club._count.courts}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-cream/50">
            Socios
          </dt>
          <dd className="mt-1 font-heading text-2xl text-cream">
            {compact(club._count.players)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-cream/50">
            Torneos
          </dt>
          <dd className="mt-1 font-heading text-2xl text-lime">
            {club._count.tournaments}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between pt-8">
        <Link
          href={`/clubs/${club.slug}`}
          className="flex items-center gap-2 rounded-md bg-lime px-5 py-3 font-mono text-sm text-ink transition-colors hover:bg-lime/90"
        >
          Ver el club
          <ArrowRight className="size-4" strokeWidth={1.5} />
        </Link>
        {club.foundedYear && (
          <span className="font-mono text-xs uppercase tracking-widest text-cream/50">
            Fundado en {club.foundedYear}
          </span>
        )}
      </div>
    </div>
  )
}

function EmptyFeatured() {
  return (
    <div
      className="flex flex-col justify-between rounded-xl bg-forest p-6 text-cream sm:p-7 md:p-9"
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, transparent 0 18px, rgba(255,255,255,0.04) 18px 19px)',
      }}
    >
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-lime sm:text-xs">
        <span className="size-1.5 rounded-full bg-lime" />
        Tu club aquí
      </div>

      <h2 className="mt-5 font-heading text-4xl leading-[0.95] tracking-tight text-cream sm:mt-6 sm:text-5xl md:text-6xl">
        Sé el primero<span className="text-lime">.</span>
      </h2>
      <p className="mt-4 max-w-sm font-serif text-base italic leading-relaxed text-cream/70">
        Aún no hay clubes en el directorio. Da de alta el tuyo y aparece como
        club destacado de la comunidad.
      </p>

      <div className="mt-auto pt-8">
        <Link
          href="/registro/club"
          className="inline-flex items-center gap-2 rounded-md bg-lime px-5 py-3 font-mono text-sm text-ink transition-colors hover:bg-lime/90"
        >
          Registrar mi club
          <ArrowRight className="size-4" strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  )
}
