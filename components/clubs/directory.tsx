'use client'

import { ClubCard, type Club } from '@/components/clubs/club-card'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

export function Directory({
  clubs,
  regions,
}: {
  clubs: Club[]
  regions: string[]
}) {
  const [region, setRegion] = useState<string>('Todas')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clubs.filter((c) => {
      const matchesRegion = region === 'Todas' || c.region === region
      const matchesQuery =
        q === '' ||
        `${c.name} ${c.tagline} ${c.city} ${c.region}`
          .toLowerCase()
          .includes(q)
      return matchesRegion && matchesQuery
    })
  }, [clubs, region, query])

  return (
    <section className="bg-background px-5 py-14 sm:px-6 sm:py-16 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        {/* Encabezado */}
        <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
              Directorio · {visible.length} de {clubs.length} clubs
            </p>
            <h2 className="mt-3 font-heading text-4xl leading-none text-ink sm:text-5xl md:text-6xl">
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
              className="h-11 w-full rounded-md border border-input bg-card pr-3 pl-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 sm:h-10"
            />
          </div>
        </div>

        {/* Filtros por provincia */}
        <div className="mt-7 border-t border-border pt-6 sm:mt-8">
          <div className="-mx-5 flex items-center gap-2 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
            {regions.map((r) => {
              const isActive = r === region
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(r)}
                  aria-pressed={isActive}
                  className={cn(
                    'shrink-0 whitespace-nowrap rounded-sm px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors',
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
        </div>

        {/* Rejilla */}
        {visible.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => (
              <ClubCard key={c.slug} club={c} />
            ))}
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center sm:py-20">
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
