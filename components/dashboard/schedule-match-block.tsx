'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export type SlotState =
  | 'en-juego'
  | 'proximo'
  | 'disputado'
  | 'conflicto'
  | 'reserva'
  | 'clase'

export type MatchSet = {
  gamesA: number
  gamesB: number
  tiebreakA: number | null
  tiebreakB: number | null
}

/** Detalle de un partido para el panel de información (solo lectura). */
export type MatchDetail = {
  competition: string // torneo o liga
  competitionKind: 'torneo' | 'liga'
  category: string | null // categoría del torneo
  phase: string // «Grupo 1», «Cuartos», «Jornada 3»…
  aLabel: string
  bLabel: string
  courtName: string
  dateLabel: string
  timeLabel: string
  durationLabel: string
  statusLabel: string
  sets: MatchSet[]
  winner: 'A' | 'B' | null
  href: string | null
  hrefLabel: string
}

/** Bloque posicionable de la rejilla (lo mínimo para dibujarlo). */
export type ScheduledBlock = {
  id: string
  kind: 'match' | 'reserva'
  start: number
  duration: number
  subtitle?: string
  tag: string
  label: string
  timeLabel: string
  state: SlotState
  lane: number
  lanes: number
  href?: string
  title: string
  detail?: MatchDetail
}

const toneByState: Record<SlotState, string> = {
  'en-juego': 'bg-forest text-cream',
  proximo: 'bg-ochre text-ink',
  reserva: 'bg-ink text-cream',
  clase: 'bg-plum text-cream',
  disputado: 'border border-border bg-muted/60 text-muted-foreground',
  conflicto: 'bg-terracotta text-cream',
}

/** Resumen de un set: «6-3» o, con tie-break, «7-6(1)» (puntos del perdedor). */
function formatSet(s: MatchSet): string {
  const base = `${s.gamesA}-${s.gamesB}`
  if (s.tiebreakA == null || s.tiebreakB == null) return base
  return `${base}(${Math.min(s.tiebreakA, s.tiebreakB)})`
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right text-sm text-foreground">{value}</dd>
    </div>
  )
}

function MatchDetailSheet({
  detail,
  open,
  onOpenChange,
}: {
  detail: MatchDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const finished = detail.sets.length > 0 && detail.winner != null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0">
        <SheetHeader>
          <SheetTitle>{detail.competition}</SheetTitle>
          <SheetDescription>
            {[detail.category, detail.phase].filter(Boolean).join(' · ')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {/* Parejas + resultado */}
          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            {(['A', 'B'] as const).map((side) => {
              const label = side === 'A' ? detail.aLabel : detail.bLabel
              const isWinner = detail.winner === side
              return (
                <div key={side} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded font-mono text-[10px]',
                      isWinner
                        ? 'bg-forest text-cream'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {side}
                  </span>
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-sm',
                      isWinner
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {label}
                  </span>
                  {isWinner && (
                    <Check className="size-4 shrink-0 text-forest" strokeWidth={2.5} />
                  )}
                </div>
              )
            })}
          </div>

          {finished ? (
            <div className="mt-4 rounded-lg border border-border bg-input/20 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Resultado
              </p>
              <p className="mt-2 font-mono text-lg text-foreground tabular-nums">
                {detail.sets.map(formatSet).join('   ')}
              </p>
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-dashed border-border bg-card/50 px-4 py-3 text-xs text-muted-foreground">
              El partido aún no tiene resultado.
            </p>
          )}

          {/* Datos del partido */}
          <dl className="mt-5 divide-y divide-border border-t border-border">
            <DetailRow
              label="Tipo"
              value={detail.competitionKind === 'torneo' ? 'Torneo' : 'Liga'}
            />
            <DetailRow label="Fase" value={detail.phase} />
            <DetailRow label="Cancha" value={detail.courtName} />
            <DetailRow label="Fecha" value={detail.dateLabel} />
            <DetailRow label="Hora" value={detail.timeLabel} />
            <DetailRow label="Duración" value={detail.durationLabel} />
            <DetailRow label="Estado" value={detail.statusLabel} />
          </dl>
        </div>

        <SheetFooter>
          {detail.href && (
            <Button asChild className="h-9 gap-1.5 rounded-md text-sm">
              <Link href={detail.href}>
                {detail.hrefLabel}
                <ArrowUpRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          )}
          <SheetClose asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-md text-sm text-muted-foreground"
            >
              Cerrar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Bloque de un partido/reserva en la rejilla de programación. Las reservas
 * enlazan a su panel de edición (?edit=); los partidos abren un panel de solo
 * lectura con su información (competición, fase, resultado…).
 */
export function ScheduledMatchBlock({
  match,
  windowStart,
  windowHours,
}: {
  match: ScheduledBlock
  windowStart: number
  windowHours: number
}) {
  const [open, setOpen] = useState(false)

  const baseLeft = ((match.start - windowStart) / windowHours) * 100
  const slotWidth = Math.min((match.duration / windowHours) * 100, 100 - baseLeft)
  const width = slotWidth / match.lanes
  const left = baseLeft + match.lane * width

  const inner = (
    <div
      className={cn(
        'relative flex h-full flex-col justify-center gap-0.5 overflow-hidden rounded-md px-2 py-1 transition-shadow',
        toneByState[match.state],
        'hover:ring-2 hover:ring-foreground/20',
      )}
    >
      {match.state === 'en-juego' && (
        <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-lime" />
      )}
      <span className="truncate font-mono text-[9px] uppercase tracking-wider opacity-80">
        {match.timeLabel} · {match.tag}
      </span>
      <span className="truncate text-[11px] font-medium leading-tight">
        {match.label}
      </span>
      {match.subtitle && (
        <span className="truncate font-mono text-[8px] uppercase tracking-wider opacity-60">
          {match.subtitle}
        </span>
      )}
    </div>
  )

  return (
    <div
      className="absolute inset-y-1 p-1"
      style={{ left: `${left}%`, width: `${width}%` }}
      title={match.title}
    >
      {match.kind === 'reserva' && match.href ? (
        <Link href={match.href} className="block h-full">
          {inner}
        </Link>
      ) : match.detail ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="block h-full w-full text-left"
          >
            {inner}
          </button>
          <MatchDetailSheet
            detail={match.detail}
            open={open}
            onOpenChange={setOpen}
          />
        </>
      ) : (
        inner
      )}
    </div>
  )
}
