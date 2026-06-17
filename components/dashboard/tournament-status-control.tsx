'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ExternalLink, Eye, EyeOff, Globe, Lock } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  tournamentStatusLabels,
  tournamentStatusStyles,
} from '@/lib/tournaments'
import { setTournamentStatus } from '@/app/dashboard/torneos/[id]/actions'

const labelCls =
  'font-mono text-[10px] uppercase tracking-widest text-muted-foreground'

const fieldCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60'

/**
 * Control rápido del estado del torneo. Cambia el estado al instante (sin abrir
 * el formulario completo de ajustes) y, como solo los torneos publicados tienen
 * página pública, ofrece atajos para «Publicar» y «Ocultar».
 */
export function TournamentStatusControl({
  tournamentId,
  status,
  publicHref,
}: {
  tournamentId: string
  status: string
  publicHref: string
}) {
  const [current, setCurrent] = useState(status)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const isPublic = current !== 'draft'
  const style = tournamentStatusStyles[current] ?? tournamentStatusStyles.draft

  const apply = (next: string) => {
    if (next === current) return
    const prev = current
    setCurrent(next) // optimista
    setError(null)
    startTransition(async () => {
      const res = await setTournamentStatus(tournamentId, next)
      if (res.error) {
        setCurrent(prev)
        setError(res.error)
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className={labelCls}>Estado y publicación</p>
        <span
          className={cn(
            'flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest',
            isPublic ? 'text-forest' : 'text-muted-foreground',
          )}
        >
          {isPublic ? <Globe className="size-3.5" /> : <Lock className="size-3.5" />}
          {isPublic ? 'Visible en la web' : 'Oculto'}
        </span>
      </div>

      {/* Estado actual */}
      <div className="mt-3 flex items-center gap-2">
        <span className={cn('size-2 rounded-full', style.dot)} />
        <span className="text-sm text-foreground">
          {tournamentStatusLabels[current] ?? current}
        </span>
      </div>

      {/* Selector rápido de estado */}
      <label className="mt-4 block">
        <span className={labelCls}>Cambiar estado</span>
        <select
          value={current}
          disabled={pending}
          onChange={(e) => apply(e.target.value)}
          className={cn(fieldCls, 'mt-1.5')}
        >
          {Object.entries(tournamentStatusLabels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {pending && (
        <p className="mt-2 text-xs text-muted-foreground">Guardando…</p>
      )}

      {/* Acción contextual */}
      {isPublic ? (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
          <Link
            href={publicHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-foreground transition-colors hover:text-terracotta"
          >
            <ExternalLink className="size-3.5" />
            Ver página pública
          </Link>
          <button
            type="button"
            onClick={() => apply('draft')}
            disabled={pending}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <EyeOff className="size-3.5" />
            Ocultar
          </button>
        </div>
      ) : (
        <div className="mt-4 border-t border-border pt-4">
          <Button
            type="button"
            onClick={() => apply('registration_open')}
            disabled={pending}
            className="h-9 w-full gap-1.5 rounded-md text-sm"
          >
            <Eye className="size-4" />
            Publicar torneo
          </Button>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Los borradores no aparecen en la web. Publícalo para abrir su página
            pública.
          </p>
        </div>
      )}
    </div>
  )
}
