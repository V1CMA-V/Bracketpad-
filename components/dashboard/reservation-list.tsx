'use client'

import Link from 'next/link'
import { ChevronRight, Phone } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/money'
import {
  paymentMethodLabels,
  paymentStatusLabels,
  type PaymentMethod,
  type ReservationKind,
  type ReservationPaymentStatus,
} from '@/lib/reservations'

/* -------------------------------------------------------------------------- */
/*  Tipos del itinerario                                                       */
/* -------------------------------------------------------------------------- */

export type ReservationRow = {
  id: string
  courtName: string
  kind: ReservationKind
  coachName: string | null
  playerCount: number | null
  holderName: string
  phone: string | null
  timeLabel: string
  durationLabel: string
  paymentStatus: ReservationPaymentStatus
  paymentMethod: PaymentMethod | null
  price: number | null
  amountPaid: number
  currency: string
  cancelled: boolean
  notes: string | null
}

/** Estado visible de un partido en el itinerario. */
export type MatchState = 'en-juego' | 'proximo' | 'disputado' | 'conflicto'

export type MatchRow = {
  id: string
  courtName: string
  timeLabel: string
  durationLabel: string
  // label = "Jugador A vs Jugador B"; subtitle = liga/categoría; tag = grupo/ronda.
  label: string
  subtitle?: string
  tag: string
  state: MatchState
  // Hora tentativa (sujeta a disponibilidad): se marca con ≈ y una etiqueta.
  tentative?: boolean
  href?: string
}

/**
 * Una fila del itinerario: o una reserva/clase (apartado privado, con cobro) o
 * un partido de competición (sin cobro, enlaza a su jornada).
 */
export type ItineraryItem =
  | ({ type: 'reservation' } & ReservationRow)
  | ({ type: 'match' } & MatchRow)

const paymentTone: Record<ReservationPaymentStatus, string> = {
  paid: 'bg-forest/15 text-forest',
  pending: 'bg-terracotta/15 text-terracotta',
  partial: 'bg-ochre/20 text-ochre',
}

const matchStateTone: Record<MatchState, string> = {
  'en-juego': 'bg-forest/15 text-forest',
  proximo: 'bg-ochre/20 text-ochre',
  disputado: 'bg-muted text-muted-foreground',
  conflicto: 'bg-terracotta/15 text-terracotta',
}

const matchStateLabel: Record<MatchState, string> = {
  'en-juego': 'En juego',
  proximo: 'Próximo',
  disputado: 'Disputado',
  conflicto: 'Conflicto',
}

/* -------------------------------------------------------------------------- */
/*  Caja del día (solo reservas/clases)                                        */
/* -------------------------------------------------------------------------- */

type CashTotals = { billed: number; collected: number; outstanding: number }

/** Suma por moneda de las reservas vigentes (las canceladas no entran a caja). */
function cashByCurrency(items: ItineraryItem[]): Map<string, CashTotals> {
  const totals = new Map<string, CashTotals>()
  for (const it of items) {
    if (it.type !== 'reservation' || it.cancelled) continue
    const t = totals.get(it.currency) ?? {
      billed: 0,
      collected: 0,
      outstanding: 0,
    }
    t.collected += it.amountPaid
    if (it.price != null) {
      t.billed += it.price
      t.outstanding += Math.max(it.price - it.amountPaid, 0)
    }
    totals.set(it.currency, t)
  }
  return totals
}

function CashStat({
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
          'font-serif text-3xl leading-none',
          accent ? 'text-terracotta' : 'text-foreground',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function CashSummary({ items }: { items: ItineraryItem[] }) {
  const totals = cashByCurrency(items)
  if (totals.size === 0) return null
  const multiCurrency = totals.size > 1

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Caja del día
      </p>
      <div className="mt-4 space-y-5">
        {[...totals].map(([currency, t]) => (
          <div key={currency}>
            {multiCurrency && (
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                {currency}
              </p>
            )}
            <dl className="grid grid-cols-3 gap-4">
              <CashStat
                label="Cobrado"
                value={formatMoney(t.collected, currency)}
              />
              <CashStat
                label="Por cobrar"
                value={formatMoney(t.outstanding, currency)}
                accent={t.outstanding > 0}
              />
              <CashStat
                label="Facturado"
                value={formatMoney(t.billed, currency)}
              />
            </dl>
          </div>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Filas                                                                      */
/* -------------------------------------------------------------------------- */

/** Columna izquierda común: hora de inicio + duración. */
function TimeCol({
  timeLabel,
  durationLabel,
}: {
  timeLabel: string
  durationLabel: string
}) {
  return (
    <div className="w-16 shrink-0 font-mono text-sm text-foreground">
      {timeLabel}
      <span className="block text-[10px] text-muted-foreground">
        {durationLabel}
      </span>
    </div>
  )
}

function ReservationItem({ row, day }: { row: ReservationRow; day: string }) {
  const balance = row.price != null ? Math.max(row.price - row.amountPaid, 0) : null
  return (
    <Link
      href={`/dashboard/programacion?d=${day}&edit=${row.id}`}
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-muted/40',
        row.cancelled && 'opacity-50',
      )}
    >
      <TimeCol timeLabel={row.timeLabel} durationLabel={row.durationLabel} />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-medium text-foreground',
            row.cancelled && 'line-through',
          )}
        >
          {row.holderName}
        </p>
        <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {row.courtName}
          {row.kind === 'class' && (
            <span className="ml-2 text-plum">
              · Clase
              {row.coachName ? ` · ${row.coachName}` : ''}
              {row.playerCount ? ` · ${row.playerCount} jug.` : ''}
            </span>
          )}
          {row.phone && (
            <span className="ml-2 inline-flex items-center gap-1 normal-case tracking-normal">
              <Phone className="size-3" />
              {row.phone}
            </span>
          )}
        </p>
        {row.notes && (
          <p className="truncate text-xs text-muted-foreground">{row.notes}</p>
        )}
      </div>

      <div className="text-right">
        <span
          className={cn(
            'inline-block rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
            row.cancelled
              ? 'bg-muted text-muted-foreground'
              : paymentTone[row.paymentStatus],
          )}
        >
          {row.cancelled ? 'Cancelada' : paymentStatusLabels[row.paymentStatus]}
        </span>
        {row.price != null && (
          <p className="mt-1 text-xs text-muted-foreground">
            {formatMoney(row.amountPaid, row.currency)} /{' '}
            {formatMoney(row.price, row.currency)}
            {balance != null && balance > 0 && (
              <span className="text-terracotta">
                {' '}
                · saldo {formatMoney(balance, row.currency)}
              </span>
            )}
          </p>
        )}
        {!row.cancelled && row.paymentMethod && (
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
            {paymentMethodLabels[row.paymentMethod]}
          </p>
        )}
      </div>

      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground"
        strokeWidth={1.5}
      />
    </Link>
  )
}

function MatchItem({ row }: { row: MatchRow }) {
  const inner = (
    <>
      <TimeCol
        timeLabel={`${row.tentative ? '≈ ' : ''}${row.timeLabel}`}
        durationLabel={row.durationLabel}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {row.label}
        </p>
        <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {row.courtName} · {row.tag}
          {row.subtitle && (
            <span className="ml-2 text-muted-foreground/70">{row.subtitle}</span>
          )}
        </p>
      </div>

      <div className="text-right">
        <span
          className={cn(
            'inline-block rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
            matchStateTone[row.state],
          )}
        >
          {matchStateLabel[row.state]}
        </span>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
          {row.tentative ? 'Tentativo' : 'Partido'}
        </p>
      </div>

      <ChevronRight
        className={cn(
          'size-4 shrink-0 text-muted-foreground',
          !row.href && 'opacity-0',
        )}
        strokeWidth={1.5}
      />
    </>
  )

  const base =
    'flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors'
  return row.href ? (
    <Link href={row.href} className={cn(base, 'hover:bg-muted/40')}>
      {inner}
    </Link>
  ) : (
    <div className={base}>{inner}</div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Itinerario                                                                 */
/* -------------------------------------------------------------------------- */

export function DayItinerary({
  items,
  day,
}: {
  items: ItineraryItem[]
  // Día visible ("YYYY-MM-DD"), para construir el enlace de edición de reservas.
  day: string
}) {
  if (items.length === 0) return null

  return (
    <section className="mt-8">
      <CashSummary items={items} />

      <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Itinerario del día · {items.length}
      </p>
      <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {items.map((it) =>
          it.type === 'reservation' ? (
            <ReservationItem key={it.id} row={it} day={day} />
          ) : (
            <MatchItem key={it.id} row={it} />
          ),
        )}
      </div>
    </section>
  )
}
