import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export type CompetitionItem = {
  id: string
  kind: 'liga' | 'torneo'
  name: string
  meta: string
  statusLabel: string
  live: boolean
  dates: string
  countLabel: string
  countValue: number
  href: string
}

export function Competitions({
  items,
  activeCount,
  clubSlug,
}: {
  items: CompetitionItem[]
  activeCount: number
  clubSlug: string
}) {
  const total = items.length

  return (
    <section className="bg-cream px-6 py-16 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Cartelera del club
            </p>
            <h2 className="mt-3 font-heading text-5xl leading-none text-ink md:text-6xl">
              {total === 0 ? (
                <>
                  Sin competiciones <em className="italic">aún.</em>
                </>
              ) : activeCount > 0 ? (
                <>
                  {activeCount} {activeCount === 1 ? 'competición' : 'competiciones'}{' '}
                  <em className="italic">en juego.</em>
                </>
              ) : (
                <>
                  {total} {total === 1 ? 'competición' : 'competiciones'}{' '}
                  <em className="italic">en agenda.</em>
                </>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider">
            <Link
              href={`/clubs/${clubSlug}/ligas`}
              className="rounded-sm border border-ink/15 px-4 py-2 text-ink transition-colors hover:bg-ink/5"
            >
              Ligas
            </Link>
            <Link
              href={`/clubs/${clubSlug}/torneos`}
              className="rounded-sm border border-ink/15 px-4 py-2 text-ink transition-colors hover:bg-ink/5"
            >
              Torneos
            </Link>
          </div>
        </div>

        {total === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card py-20 text-center">
            <p className="font-heading text-2xl text-ink">Nada en cartelera</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Este club todavía no tiene ligas ni torneos públicos. Vuelve pronto.
            </p>
          </div>
        ) : (
          <div className="mt-10 overflow-hidden rounded-md border border-border bg-card">
            {items.map((t, i) => (
              <Link
                key={`${t.kind}-${t.id}`}
                href={t.href}
                className={
                  'group flex w-full items-center gap-6 px-6 py-6 text-left transition-colors hover:bg-muted/40 ' +
                  (i > 0 ? 'border-t border-border' : '')
                }
              >
                <span className="w-12 shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t.kind}
                </span>

                <div className="min-w-0 flex-[2]">
                  <p className="truncate font-heading text-2xl leading-tight text-ink">
                    {t.name}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {t.meta}
                  </p>
                </div>

                <div className="flex min-w-0 flex-[2] flex-col gap-2">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-muted/70 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-ink">
                    {t.live && <span className="text-forest">●</span>}
                    {t.statusLabel}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {t.dates}
                  </span>
                </div>

                <div className="hidden w-28 shrink-0 flex-col items-start sm:flex">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {t.countLabel}
                  </span>
                  <span className="font-heading text-2xl text-ink tabular-nums">
                    {t.countValue}
                  </span>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
