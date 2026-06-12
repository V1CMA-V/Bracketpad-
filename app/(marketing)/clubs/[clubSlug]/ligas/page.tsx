import { prisma } from '@/lib/prisma'
import { leagueFormatLabels, leagueStatusLabels } from '@/lib/leagues'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

// startDate/endDate son `@db.Date` (medianoche UTC): se formatean en UTC para
// no mostrar un día antes en zonas horarias con desfase negativo.
const dateFmt = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${dateFmt.format(start)} — ${dateFmt.format(end)}`
  if (start) return `Desde ${dateFmt.format(start)}`
  if (end) return `Hasta ${dateFmt.format(end)}`
  return 'Fechas por confirmar'
}

// Estilo del punto de estado en la tarjeta pública.
const statusDot: Record<string, string> = {
  active: 'bg-terracotta',
  finished: 'bg-forest',
  archived: 'bg-ink/30',
}

async function getClubLeagues(clubSlug: string) {
  const club = await prisma.club.findUnique({
    where: { slug: clubSlug },
    select: { id: true, name: true, slug: true, city: true },
  })
  if (!club) return null

  const leagues = await prisma.league.findMany({
    where: { clubId: club.id, status: { not: 'draft' } },
    orderBy: [{ status: 'asc' }, { startDate: 'desc' }, { createdAt: 'desc' }],
    include: {
      _count: { select: { registrations: true, rounds: true, matches: true } },
    },
  })

  return { club, leagues }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>
}): Promise<Metadata> {
  const { clubSlug } = await params
  const data = await getClubLeagues(clubSlug)
  if (!data) return { title: 'Club no encontrado' }
  return {
    title: `Ligas · ${data.club.name}`,
    description: `Ligas y clasificaciones del ${data.club.name}.`,
  }
}

export default async function ClubLeaguesPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>
}) {
  const { clubSlug } = await params
  const data = await getClubLeagues(clubSlug)
  if (!data) notFound()
  const { club, leagues } = data

  const activeCount = leagues.filter((l) => l.status === 'active').length

  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-cream">
        <nav className="mx-auto flex max-w-[1400px] items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-wider md:px-12">
          <Link
            href="/clubs"
            className="text-muted-foreground transition-colors hover:text-ink"
          >
            Clubes
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href={`/clubs/${club.slug}`}
            className="text-muted-foreground transition-colors hover:text-ink"
          >
            {club.name}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-ink">Ligas</span>
        </nav>
      </div>

      {/* Encabezado */}
      <section className="border-b border-border bg-cream px-6 py-14 md:px-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {club.name} · Ligas
          </p>
          <h1 className="mt-4 font-heading text-6xl leading-[1.02] tracking-tight text-ink md:text-7xl">
            Las ligas <em className="italic">del club.</em>
          </h1>
          <p className="mt-5 max-w-xl font-serif text-lg italic leading-relaxed text-ink/80">
            Competiciones por sets ganados, jornada a jornada. Entra en una liga
            para ver su clasificación, calendario y resultados.
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8 md:grid-cols-3">
            <Stat value={String(leagues.length)} label="Ligas publicadas" />
            <Stat value={String(activeCount)} label="En juego ahora" />
            <Stat
              value={String(
                leagues.reduce((n, l) => n + l._count.registrations, 0),
              )}
              label="Jugadores inscritos"
            />
          </dl>
        </div>
      </section>

      {/* Listado */}
      <section className="bg-background px-6 py-16 md:px-12">
        <div className="mx-auto max-w-[1400px]">
          {leagues.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card py-20 text-center">
              <p className="font-heading text-2xl text-ink">Nada por aquí</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Este club todavía no tiene ligas públicas. Vuelve pronto.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {leagues.map((league) => (
                <Link
                  key={league.id}
                  href={`/clubs/${club.slug}/l/${league.id}`}
                  className="group flex flex-col rounded-sm border border-border bg-card p-5 transition-colors hover:border-ink/30"
                >
                  <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`size-1.5 rounded-full ${statusDot[league.status] ?? 'bg-ink/30'}`}
                      />
                      {leagueStatusLabels[league.status] ?? league.status}
                    </span>
                    <span>{leagueFormatLabels[league.format] ?? league.format}</span>
                  </div>

                  <h2 className="mt-4 font-heading text-2xl leading-tight text-ink">
                    {league.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatRange(league.startDate, league.endDate)}
                  </p>

                  <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4">
                    <CardStat value={league._count.registrations} label="Inscritos" />
                    <CardStat value={league._count.rounds} label="Jornadas" />
                    <CardStat value={league._count.matches} label="Partidos" />
                  </dl>

                  <span className="mt-5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink transition-colors group-hover:text-terracotta">
                    Ver clasificación
                    <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dd className="font-heading text-4xl leading-none text-ink tabular-nums">
        {value}
      </dd>
      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
    </div>
  )
}

function CardStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dd className="font-heading text-xl leading-none text-ink tabular-nums">
        {value}
      </dd>
      <dt className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
    </div>
  )
}
