'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Phone, Search, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/money'
import {
  paymentMethodLabels,
  paymentStatusLabels,
  RESERVATION_PAYMENT_STATUSES,
  reservationKindLabels,
  type PaymentMethod,
  type ReservationKind,
  type ReservationPaymentStatus,
} from '@/lib/reservations'

/** Una reserva lista para mostrar (ya formateada en el servidor). */
export type ReservationListItem = {
  id: string
  holderName: string
  phone: string | null
  courtId: string
  courtName: string
  kind: ReservationKind
  coachName: string | null
  playerCount: number | null
  dateKey: string // "YYYY-MM-DD" (para el enlace de edición)
  dateLabel: string // "jue 12 jun"
  timeLabel: string // "18:00"
  durationLabel: string
  paymentStatus: ReservationPaymentStatus
  paymentMethod: PaymentMethod | null
  price: number | null
  amountPaid: number
  currency: string
  cancelled: boolean
  notes: string | null
}

type CourtOption = { id: string; name: string }
type PaymentFilter = 'all' | ReservationPaymentStatus
type KindFilter = 'all' | ReservationKind

const paymentTone: Record<ReservationPaymentStatus, string> = {
  paid: 'bg-forest/15 text-forest',
  pending: 'bg-terracotta/15 text-terracotta',
  partial: 'bg-ochre/20 text-ochre',
}

const fieldCls =
  'h-9 rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const labelCls =
  'font-mono text-[10px] uppercase tracking-widest text-muted-foreground'

function ReservationRow({ row }: { row: ReservationListItem }) {
  const balance =
    row.price != null ? Math.max(row.price - row.amountPaid, 0) : null

  return (
    <Link
      href={`/dashboard/programacion?d=${row.dateKey}&edit=${row.id}`}
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-muted/40',
        row.cancelled && 'opacity-50',
      )}
    >
      {/* Fecha + hora */}
      <div className="w-28 shrink-0">
        <p className="text-sm capitalize text-foreground">{row.dateLabel}</p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {row.timeLabel} · {row.durationLabel}
        </p>
      </div>

      {/* Titular + contacto + pista */}
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
      </div>

      {/* Cobro */}
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

/**
 * Buscador de reservas del club: filtra por titular o teléfono y por estado de
 * cobro, tipo (juego libre / clase) y pista. Cada fila enlaza al panel de
 * edición de la reserva en la programación de su día.
 */
export function ReservationsBrowser({
  reservations,
  courts,
}: {
  reservations: ReservationListItem[]
  courts: CourtOption[]
}) {
  const [query, setQuery] = useState('')
  const [payment, setPayment] = useState<PaymentFilter>('all')
  const [kind, setKind] = useState<KindFilter>('all')
  const [court, setCourt] = useState<string>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return reservations.filter((r) => {
      if (payment !== 'all' && r.paymentStatus !== payment) return false
      if (kind !== 'all' && r.kind !== kind) return false
      if (court !== 'all' && r.courtId !== court) return false
      if (
        q &&
        !r.holderName.toLowerCase().includes(q) &&
        !(r.phone?.toLowerCase().includes(q) ?? false)
      )
        return false
      return true
    })
  }, [reservations, query, payment, kind, court])

  const hasFilters =
    query.trim() !== '' || payment !== 'all' || kind !== 'all' || court !== 'all'

  const clearFilters = () => {
    setQuery('')
    setPayment('all')
    setKind('all')
    setCourt('all')
  }

  return (
    <section>
      {/* ---- Barra de filtros ---- */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor="reservation-search" className={labelCls}>
            Buscar cliente
          </label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="reservation-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre o teléfono…"
              className={cn(fieldCls, 'w-full pl-9')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="filter-payment" className={labelCls}>
            Cobro
          </label>
          <select
            id="filter-payment"
            value={payment}
            onChange={(e) => setPayment(e.target.value as PaymentFilter)}
            className={cn(fieldCls, 'mt-2 w-40')}
          >
            <option value="all">Todos</option>
            {RESERVATION_PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {paymentStatusLabels[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-kind" className={labelCls}>
            Tipo
          </label>
          <select
            id="filter-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as KindFilter)}
            className={cn(fieldCls, 'mt-2 w-36')}
          >
            <option value="all">Todos</option>
            {(['free_play', 'class'] as const).map((k) => (
              <option key={k} value={k}>
                {reservationKindLabels[k]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-court" className={labelCls}>
            Pista
          </label>
          <select
            id="filter-court"
            value={court}
            onChange={(e) => setCourt(e.target.value)}
            className={cn(fieldCls, 'mt-2 w-40')}
          >
            <option value="all">Todas</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
            Limpiar
          </button>
        )}
      </div>

      {/* ---- Listado ---- */}
      <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'reserva' : 'reservas'}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          {hasFilters
            ? 'No hay reservas que coincidan con la búsqueda.'
            : 'Todavía no hay reservas registradas.'}
        </div>
      ) : (
        <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {filtered.map((r) => (
            <ReservationRow key={r.id} row={r} />
          ))}
        </div>
      )}
    </section>
  )
}
