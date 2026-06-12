'use client'

import { useTransition } from 'react'
import { Check, Phone, X, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import {
  paymentStatusLabels,
  type ReservationPaymentStatus,
} from '@/lib/reservations'
import {
  cancelReservation,
  deleteReservation,
  markReservationPaid,
} from '@/app/dashboard/programacion/actions'

export type ReservationRow = {
  id: string
  courtName: string
  holderName: string
  phone: string | null
  timeLabel: string
  durationLabel: string
  paymentStatus: ReservationPaymentStatus
  price: number | null
  amountPaid: number
  currency: string
  cancelled: boolean
  notes: string | null
}

const paymentTone: Record<ReservationPaymentStatus, string> = {
  paid: 'bg-forest/15 text-forest',
  pending: 'bg-terracotta/15 text-terracotta',
  partial: 'bg-ochre/20 text-ochre',
}

function RowActions({ r }: { r: ReservationRow }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-1">
      {!r.cancelled && r.paymentStatus !== 'paid' && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs"
          disabled={pending}
          onClick={() => startTransition(() => markReservationPaid(r.id))}
        >
          <Check className="size-3.5" />
          Marcar pagado
        </Button>
      )}
      {!r.cancelled && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
          disabled={pending}
          onClick={() => startTransition(() => cancelReservation(r.id))}
        >
          <X className="size-3.5" />
          Cancelar
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-destructive"
        disabled={pending}
        title="Eliminar reserva"
        onClick={() => startTransition(() => deleteReservation(r.id))}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}

type CashTotals = { billed: number; collected: number; outstanding: number }

/** Suma por moneda de las reservas vigentes (las canceladas no entran a caja). */
function cashByCurrency(rows: ReservationRow[]): Map<string, CashTotals> {
  const totals = new Map<string, CashTotals>()
  for (const r of rows) {
    if (r.cancelled) continue
    const t = totals.get(r.currency) ?? { billed: 0, collected: 0, outstanding: 0 }
    t.collected += r.amountPaid
    if (r.price != null) {
      t.billed += r.price
      t.outstanding += Math.max(r.price - r.amountPaid, 0)
    }
    totals.set(r.currency, t)
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

function CashSummary({ rows }: { rows: ReservationRow[] }) {
  const totals = cashByCurrency(rows)
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

export function ReservationList({ rows }: { rows: ReservationRow[] }) {
  if (rows.length === 0) return null

  return (
    <section className="mt-8">
      <CashSummary rows={rows} />

      <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Reservas del día · {rows.length}
      </p>
      <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {rows.map((r) => {
          const balance =
            r.price != null ? Math.max(r.price - r.amountPaid, 0) : null
          return (
            <div
              key={r.id}
              className={cn(
                'flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3',
                r.cancelled && 'opacity-50',
              )}
            >
              <div className="w-16 shrink-0 font-mono text-sm text-foreground">
                {r.timeLabel}
                <span className="block text-[10px] text-muted-foreground">
                  {r.durationLabel}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-sm font-medium text-foreground',
                    r.cancelled && 'line-through',
                  )}
                >
                  {r.holderName}
                </p>
                <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {r.courtName}
                  {r.phone && (
                    <span className="ml-2 inline-flex items-center gap-1 normal-case tracking-normal">
                      <Phone className="size-3" />
                      {r.phone}
                    </span>
                  )}
                </p>
                {r.notes && (
                  <p className="truncate text-xs text-muted-foreground">
                    {r.notes}
                  </p>
                )}
              </div>

              <div className="text-right">
                <span
                  className={cn(
                    'inline-block rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
                    r.cancelled
                      ? 'bg-muted text-muted-foreground'
                      : paymentTone[r.paymentStatus],
                  )}
                >
                  {r.cancelled ? 'Cancelada' : paymentStatusLabels[r.paymentStatus]}
                </span>
                {r.price != null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatMoney(r.amountPaid, r.currency)} /{' '}
                    {formatMoney(r.price, r.currency)}
                    {balance != null && balance > 0 && (
                      <span className="text-terracotta">
                        {' '}
                        · saldo {formatMoney(balance, r.currency)}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <RowActions r={r} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
