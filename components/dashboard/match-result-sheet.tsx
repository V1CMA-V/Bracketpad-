'use client'

import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'

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
import {
  clearMatchResult,
  saveMatchResult,
  setMatchSchedule,
} from '@/app/dashboard/torneos/[id]/categorias/[catId]/actions'
import type { SetScore } from '@/lib/match-results'

export type FixtureSet = {
  gamesA: number
  gamesB: number
  tiebreakA: number | null
  tiebreakB: number | null
}

export type CourtOption = { id: string; name: string }

/** Datos mínimos de un partido para capturar su resultado y programación. */
export type ResultMatch = {
  id: string
  aLabel: string
  bLabel: string
  status: string
  winner: 'A' | 'B' | null
  sets: FixtureSet[]
  // Programación (hora del club): vacío = sin programar.
  date: string
  time: string
  courtId: string | null
  // Hora tentativa (sujeta a disponibilidad): la estimación puede moverse.
  timeTbd: boolean
}

const cellCls =
  'h-11 w-14 rounded-md border border-border bg-input/30 text-center text-base text-foreground tabular-nums outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const cellSmCls =
  'h-9 w-12 rounded-md border border-border bg-input/30 text-center text-sm text-foreground tabular-nums outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const inputCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

type SetRow = { a: string; b: string; ta: string; tb: string }

/** ¿El marcador de juegos del set se decidió en tie-break? (p. ej. 7-6). */
export function isTiebreakScore(a: number, b: number, tiebreakAt: number): boolean {
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  return lo === tiebreakAt && hi === tiebreakAt + 1
}

/** Resumen de un set: «6-3» o, con tie-break, «7-6(1)» (puntos del perdedor). */
export function formatSet(s: FixtureSet): string {
  const base = `${s.gamesA}-${s.gamesB}`
  if (s.tiebreakA == null || s.tiebreakB == null) return base
  return `${base}(${Math.min(s.tiebreakA, s.tiebreakB)})`
}

function buildRows(match: ResultMatch, bestOfSets: number): SetRow[] {
  return Array.from({ length: bestOfSets }, (_, i) => {
    const s = match.sets[i]
    return {
      a: s ? String(s.gamesA) : '',
      b: s ? String(s.gamesB) : '',
      ta: s?.tiebreakA != null ? String(s.tiebreakA) : '',
      tb: s?.tiebreakB != null ? String(s.tiebreakB) : '',
    }
  })
}

/**
 * Hoja lateral reutilizable para capturar el resultado (set por set, con
 * tie-break) y la programación (fecha, hora, cancha) de cualquier partido de
 * torneo —de grupo o de la llave—. Es controlada: el padre maneja `open`.
 */
export function MatchResultSheet({
  match,
  title,
  description,
  bestOfSets,
  tiebreakAt,
  courts,
  open,
  onOpenChange,
}: {
  match: ResultMatch
  title: string
  description: string
  bestOfSets: number
  tiebreakAt: number
  courts: CourtOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [rows, setRows] = useState<SetRow[]>(() => buildRows(match, bestOfSets))
  const [date, setDate] = useState(match.date)
  const [time, setTime] = useState(match.time)
  const [courtId, setCourtId] = useState(match.courtId ?? '')
  const [tentative, setTentative] = useState(match.timeTbd)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const finished = match.status === 'finished'
  const ready = match.aLabel !== '—' && match.bLabel !== '—'

  // Reinicia los campos con los datos más recientes cada vez que se abre.
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setRows(buildRows(match, bestOfSets))
      setDate(match.date)
      setTime(match.time)
      setCourtId(match.courtId ?? '')
      setTentative(match.timeTbd)
      setError(null)
    }
    onOpenChange(o)
  }

  const saveSchedule = () => {
    setError(null)
    startTransition(async () => {
      const res = await setMatchSchedule(match.id, {
        date,
        time,
        courtId,
        timeTbd: tentative,
      })
      if (res?.error) setError(res.error)
      else onOpenChange(false)
    })
  }

  const setCell = (i: number, key: keyof SetRow, v: string) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: v } : r)))

  const save = () => {
    setError(null)
    const sets: SetScore[] = rows.map((r) => {
      const gamesA = r.a === '' ? 0 : Number(r.a)
      const gamesB = r.b === '' ? 0 : Number(r.b)
      // El tie-break solo se guarda si el set realmente se decidió en él.
      const inTiebreak = isTiebreakScore(gamesA, gamesB, tiebreakAt)
      return {
        gamesA,
        gamesB,
        tiebreakA: inTiebreak && r.ta !== '' ? Number(r.ta) : null,
        tiebreakB: inTiebreak && r.tb !== '' ? Number(r.tb) : null,
      }
    })
    startTransition(async () => {
      const res = await saveMatchResult(match.id, sets)
      if (res?.error) setError(res.error)
      else onOpenChange(false)
    })
  }

  const clear = () => {
    setError(null)
    startTransition(async () => {
      const res = await clearMatchResult(match.id)
      if (res?.error) setError(res.error)
      else onOpenChange(false)
    })
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="gap-0">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {/* Parejas */}
          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            {(['A', 'B'] as const).map((side) => (
              <div key={side} className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded font-mono text-[10px]',
                    match.winner === side
                      ? 'bg-forest text-cream'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {side}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {side === 'A' ? match.aLabel : match.bLabel}
                </span>
                {match.winner === side && (
                  <Check className="size-4 shrink-0 text-forest" strokeWidth={2.5} />
                )}
              </div>
            ))}
          </div>

          {/* Programación: fecha, hora y cancha */}
          <div className="mt-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Programación
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
                aria-label="Fecha del partido"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={inputCls}
                aria-label="Hora del partido"
              />
            </div>
            {courts.length > 0 && (
              <select
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                className={cn(inputCls, 'mt-3')}
                aria-label="Cancha"
              >
                <option value="">Sin cancha asignada</option>
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <label className="mt-3 flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm">
              <input
                type="checkbox"
                checked={tentative}
                onChange={(e) => setTentative(e.target.checked)}
                className="mt-0.5 size-4 accent-ochre"
              />
              <span>
                <span className="text-foreground">
                  Hora sujeta a disponibilidad
                </span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  Tentativa · se juega ese día pero la hora puede moverse
                </span>
              </span>
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={saveSchedule}
              disabled={pending}
              className="mt-3 h-9 rounded-md text-sm"
            >
              {pending ? 'Guardando…' : 'Guardar programación'}
            </Button>
          </div>

          {/* Resultado */}
          <p className="mt-6 border-t border-border pt-5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Resultado
          </p>
          {!ready && (
            <p className="mt-3 rounded-md border border-ochre/40 bg-ochre/5 px-3 py-2 text-xs text-ochre">
              Faltan definir las dos parejas de este partido.
            </p>
          )}
          <div className="mt-3 space-y-4">
            {rows.map((r, i) => {
              const aNum = r.a === '' ? 0 : Number(r.a)
              const bNum = r.b === '' ? 0 : Number(r.b)
              const showTiebreak = isTiebreakScore(aNum, bNum, tiebreakAt)
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-12 shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Set {i + 1}
                    </span>
                    <input
                      inputMode="numeric"
                      value={r.a}
                      onChange={(e) =>
                        setCell(i, 'a', e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="0"
                      className={cellCls}
                      aria-label={`Set ${i + 1}, juegos pareja A`}
                    />
                    <span className="text-muted-foreground">–</span>
                    <input
                      inputMode="numeric"
                      value={r.b}
                      onChange={(e) =>
                        setCell(i, 'b', e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="0"
                      className={cellCls}
                      aria-label={`Set ${i + 1}, juegos pareja B`}
                    />
                  </div>

                  {/* Tie-break: aparece al llegar a {tiebreakAt}-{tiebreakAt} */}
                  {showTiebreak && (
                    <div className="flex items-center gap-3 pl-[60px]">
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ochre">
                        Tie-break
                      </span>
                      <input
                        inputMode="numeric"
                        value={r.ta}
                        onChange={(e) =>
                          setCell(i, 'ta', e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="7"
                        className={cellSmCls}
                        aria-label={`Set ${i + 1}, tie-break pareja A`}
                      />
                      <span className="text-muted-foreground">–</span>
                      <input
                        inputMode="numeric"
                        value={r.tb}
                        onChange={(e) =>
                          setCell(i, 'tb', e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="1"
                        className={cellSmCls}
                        aria-label={`Set ${i + 1}, tie-break pareja B`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <p className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        <SheetFooter>
          <Button
            type="button"
            onClick={save}
            disabled={pending || !ready}
            className="h-9 rounded-md text-sm"
          >
            {pending ? 'Guardando…' : 'Guardar resultado'}
          </Button>
          {finished && (
            <Button
              type="button"
              variant="outline"
              onClick={clear}
              disabled={pending}
              className="h-9 rounded-md text-sm"
            >
              Borrar resultado
            </Button>
          )}
          <SheetClose asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-md text-sm text-muted-foreground"
            >
              Cancelar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
