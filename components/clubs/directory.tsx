'use client'

import { ClubCard, type Club } from '@/components/clubs/club-card'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

const REGIONS = ['Todas', 'Valencia', 'Castellón', 'Alicante'] as const

type Region = (typeof REGIONS)[number]

const TOTAL = 32

const CLUBS: Club[] = [
  {
    slug: 'maritimo-olivar',
    initial: 'M',
    tag: 'destacado',
    name: 'Club Marítimo del Olivar',
    tagline: 'Ocho pistas frente al puerto',
    region: 'Valencia',
    city: 'Valencia',
    founded: 1978,
    courts: '8',
    members: '612',
    tournaments: '24',
    liveTournaments: 4,
  },
  {
    slug: 'padel-nord',
    initial: 'N',
    tag: 'afiliado',
    name: 'Padel Nord',
    tagline: 'Pádel indoor durante todo el año',
    region: 'Valencia',
    city: 'Valencia',
    founded: 2009,
    courts: '6',
    members: '380',
    tournaments: '11',
    liveTournaments: 1,
  },
  {
    slug: 'olimpic-padel',
    initial: 'O',
    tag: 'afiliado',
    name: 'Olimpic Padel',
    tagline: 'El club con más cuadro de la ciudad',
    region: 'Valencia',
    city: 'Valencia',
    founded: 2015,
    courts: '10',
    members: '540',
    tournaments: '9',
    liveTournaments: 2,
  },
  {
    slug: 'tenis-valencia',
    initial: 'V',
    tag: 'afiliado',
    name: 'Club de Tenis Valencia',
    tagline: 'Tradición de tenis, pasión de pádel',
    region: 'Valencia',
    city: 'Valencia',
    founded: 1905,
    courts: '5',
    members: '290',
    tournaments: '6',
  },
  {
    slug: 'club-mediterraneo',
    initial: 'M',
    tag: 'destacado',
    name: 'Club Mediterráneo',
    tagline: 'Frente al mar de Castellón',
    region: 'Castellón',
    city: 'Castellón',
    founded: 1992,
    courts: '7',
    members: '410',
    tournaments: '14',
    liveTournaments: 2,
  },
  {
    slug: 'padel-azahar',
    initial: 'A',
    tag: 'nuevo',
    name: 'Padel Azahar',
    tagline: 'Recién estrenado en Benicàssim',
    region: 'Castellón',
    city: 'Benicàssim',
    founded: 2024,
    courts: '6',
    members: '120',
    tournaments: '3',
  },
  {
    slug: 'club-castalia',
    initial: 'C',
    tag: 'afiliado',
    name: 'Club Castalia',
    tagline: 'Pádel y comunidad en el centro',
    region: 'Castellón',
    city: 'Castellón',
    founded: 2011,
    courts: '4',
    members: '210',
    tournaments: '5',
  },
  {
    slug: 'ciudad-del-padel',
    initial: 'P',
    tag: 'destacado',
    name: 'Ciudad del Pádel',
    tagline: 'El mayor complejo de la provincia',
    region: 'Alicante',
    city: 'Alicante',
    founded: 2018,
    courts: '16',
    members: '880',
    tournaments: '21',
    liveTournaments: 3,
  },
  {
    slug: 'club-lucentum',
    initial: 'L',
    tag: 'nuevo',
    name: 'Club Lucentum',
    tagline: 'Pádel de barrio, ambiente de club',
    region: 'Alicante',
    city: 'Alicante',
    founded: 2023,
    courts: '5',
    members: '160',
    tournaments: '4',
  },
]

export function Directory() {
  const [region, setRegion] = useState<Region>('Todas')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CLUBS.filter((c) => {
      const matchesRegion = region === 'Todas' || c.region === region
      const matchesQuery =
        q === '' ||
        `${c.name} ${c.tagline} ${c.city} ${c.region}`
          .toLowerCase()
          .includes(q)
      return matchesRegion && matchesQuery
    })
  }, [region, query])

  return (
    <section className="bg-background px-6 py-16 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        {/* Encabezado */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Directorio · {CLUBS.length} de {TOTAL} clubs
            </p>
            <h2 className="mt-3 font-heading text-5xl leading-none text-ink md:text-6xl">
              Busca tu <em className="italic">club.</em>
            </h2>
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o ciudad..."
              className="h-10 w-full rounded-md border border-input bg-card pr-3 pl-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
            />
          </div>
        </div>

        {/* Filtros por provincia */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-border pt-6">
          {REGIONS.map((r) => {
            const isActive = r === region
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                aria-pressed={isActive}
                className={cn(
                  'rounded-sm px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors',
                  isActive
                    ? 'bg-ink text-cream'
                    : 'border border-ink/15 bg-transparent text-ink hover:bg-ink/5',
                )}
              >
                {r}
              </button>
            )
          })}
        </div>

        {/* Rejilla */}
        {visible.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => (
              <ClubCard key={c.slug} club={c} />
            ))}
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card py-20 text-center">
            <p className="font-heading text-2xl text-ink">Sin resultados</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              No hay clubs que coincidan con tu búsqueda. Prueba con otra
              provincia o limpia el buscador.
            </p>
          </div>
        )}

        {/* Pie */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span>
            {visible.length} {visible.length === 1 ? 'club' : 'clubs'} en
            pantalla
          </span>
          <span>Actualizado hoy · 09:00</span>
        </div>
      </div>
    </section>
  )
}
