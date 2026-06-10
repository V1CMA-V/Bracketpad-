'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Plus, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  leagueFormatLabels,
  leagueRankingBasisLabels,
  leagueStatusLabels,
} from '@/lib/leagues'
import { currencyOptions } from '@/lib/money'
import {
  updateLeague,
  type LeagueSettingsState,
} from '@/app/dashboard/ligas/[id]/actions'

const fieldCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60'

const labelCls =
  'font-mono text-[10px] uppercase tracking-widest text-muted-foreground'

const initialState: LeagueSettingsState = {}

const playKindLabels: Record<string, string> = {
  individual: 'Individual',
  pairs: 'Por parejas',
}

// Días de la semana (0=domingo … 6=sábado), abreviados para los chips.
const weekdayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export type LeagueSettingsValues = {
  name: string
  status: string
  format: string
  playKind: string
  startDate: string // "YYYY-MM-DD" o ""
  endDate: string
  prizes: string
  entryFee: string // importe como texto, "" si no hay
  currency: string
  bestOfSets: number
  goldenPoint: boolean
  tiebreakAt: number
  rankingBy: string
  noShowGamesAgainst: number
  // Calendario de la temporada (estructural: editable solo en borrador).
  totalRounds: number | null
  playWeekdays: number[]
  playTimes: string[]
}

// Por ahora el único formato disponible es «grupos» (antes «divisiones»).
const formatOptions: [string, string][] = [
  ['divisions', leagueFormatLabels.divisions],
]

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function LeagueSettingsForm({
  leagueId,
  values,
}: {
  leagueId: string
  values: LeagueSettingsValues
}) {
  const router = useRouter()
  const [state, setState] = useState<LeagueSettingsState>(initialState)
  const [pending, startTransition] = useTransition()
  // Lista editable de horarios recurrentes (solo se modifica en borrador).
  const [times, setTimes] = useState<string[]>(values.playTimes)

  // Solo en borrador se pueden cambiar los datos estructurales (formato, tipo
  // de juego y puntuación). Activa/finalizada/archivada → solo datos menores.
  const isDraft = values.status === 'draft'

  // Ejecuta el server action en una transición; al guardar vuelve a la liga.
  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateLeague(leagueId, state, formData)
      if (result.success) {
        router.push(`/dashboard/ligas/${leagueId}`)
        router.refresh()
      } else {
        setState(result)
      }
    })
  }

  return (
    <form action={onSubmit} noValidate className="space-y-8">
      {state.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.error}
        </p>
      )}

      {/* ---- Datos generales (siempre editables) ---- */}
      <fieldset className="space-y-5 rounded-xl border border-border bg-card p-6">
        <legend className="-mb-1 px-1">
          <span className={labelCls}>Datos generales</span>
        </legend>

        <Field
          label="Nombre"
          htmlFor="ls-name"
          error={state.fieldErrors?.name?.[0]}
        >
          <input
            id="ls-name"
            name="name"
            type="text"
            defaultValue={values.name}
            className={fieldCls}
            aria-invalid={!!state.fieldErrors?.name}
            autoComplete="off"
            required
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field
            label="Estado"
            htmlFor="ls-status"
            error={state.fieldErrors?.status?.[0]}
          >
            <select
              id="ls-status"
              name="status"
              defaultValue={values.status}
              className={fieldCls}
            >
              {Object.entries(leagueStatusLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Inicio"
            htmlFor="ls-start"
            error={state.fieldErrors?.startDate?.[0]}
          >
            <input
              id="ls-start"
              name="startDate"
              type="date"
              defaultValue={values.startDate}
              className={fieldCls}
              aria-invalid={!!state.fieldErrors?.startDate}
            />
          </Field>

          <Field
            label="Fin"
            htmlFor="ls-end"
            error={state.fieldErrors?.endDate?.[0]}
          >
            <input
              id="ls-end"
              name="endDate"
              type="date"
              defaultValue={values.endDate}
              className={fieldCls}
              aria-invalid={!!state.fieldErrors?.endDate}
            />
          </Field>
        </div>

        <Field
          label="Premios"
          htmlFor="ls-prizes"
          error={state.fieldErrors?.prizes?.[0]}
        >
          <textarea
            id="ls-prizes"
            name="prizes"
            rows={3}
            defaultValue={values.prizes}
            placeholder="Ej. El campeón de la clasificación se lleva una raqueta y bono de pista; el mejor de cada grupo, material deportivo…"
            className={cn(fieldCls, 'h-auto py-2 leading-relaxed')}
            aria-invalid={!!state.fieldErrors?.prizes}
          />
        </Field>
        <p className="-mt-2 text-xs text-muted-foreground">
          Texto libre. Se mostrará en la página pública de la liga.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Field
            label="Costo de inscripción"
            htmlFor="ls-entryfee"
            error={state.fieldErrors?.entryFee?.[0]}
          >
            <input
              id="ls-entryfee"
              name="entryFee"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              defaultValue={values.entryFee}
              placeholder="Vacío = gratuita"
              className={fieldCls}
              aria-invalid={!!state.fieldErrors?.entryFee}
            />
          </Field>

          <Field label="Moneda" htmlFor="ls-currency">
            <select
              id="ls-currency"
              name="currency"
              defaultValue={values.currency}
              className={fieldCls}
            >
              {currencyOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          Lo que paga cada jugador para entrar. Se mostrará en la página
          pública.
        </p>
      </fieldset>

      {/* ---- Configuración estructural (solo en borrador) ---- */}
      <fieldset className="space-y-5 rounded-xl border border-border bg-card p-6">
        <legend className="-mb-1 flex items-center gap-2 px-1">
          <span className={labelCls}>Formato y puntuación</span>
          {!isDraft && (
            <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-ochre">
              <Lock className="size-3" strokeWidth={2} />
              Bloqueado
            </span>
          )}
        </legend>

        {!isDraft && (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            La liga ya no está en borrador. El formato, el tipo de juego y la
            puntuación quedan bloqueados para no invalidar los partidos y la
            clasificación ya registrados.
          </p>
        )}

        {/* Cuando está bloqueado, mostramos los valores como solo lectura y
            enviamos los originales por inputs ocultos para que la validación
            del formulario siga siendo válida. */}
        {!isDraft && (
          <>
            <input type="hidden" name="format" value={values.format} />
            <input type="hidden" name="playKind" value={values.playKind} />
            <input type="hidden" name="bestOfSets" value={values.bestOfSets} />
            <input type="hidden" name="tiebreakAt" value={values.tiebreakAt} />
            <input type="hidden" name="rankingBy" value={values.rankingBy} />
            <input
              type="hidden"
              name="noShowGamesAgainst"
              value={values.noShowGamesAgainst}
            />
            {values.goldenPoint && (
              <input type="hidden" name="goldenPoint" value="on" />
            )}
          </>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label="Formato"
            htmlFor="ls-format"
            error={state.fieldErrors?.format?.[0]}
          >
            <select
              id="ls-format"
              name={isDraft ? 'format' : undefined}
              defaultValue={
                formatOptions.some(([v]) => v === values.format)
                  ? values.format
                  : 'divisions'
              }
              disabled={!isDraft}
              className={fieldCls}
            >
              {formatOptions.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Tipo de juego"
            htmlFor="ls-playkind"
            error={state.fieldErrors?.playKind?.[0]}
          >
            <select
              id="ls-playkind"
              name={isDraft ? 'playKind' : undefined}
              defaultValue={values.playKind}
              disabled={!isDraft}
              className={fieldCls}
            >
              {Object.entries(playKindLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Sets (mejor de)"
            htmlFor="ls-bestof"
            error={state.fieldErrors?.bestOfSets?.[0]}
          >
            <input
              id="ls-bestof"
              name={isDraft ? 'bestOfSets' : undefined}
              type="number"
              min={1}
              max={5}
              defaultValue={values.bestOfSets}
              disabled={!isDraft}
              className={fieldCls}
            />
          </Field>

          <Field
            label="Tie-break en (juegos)"
            htmlFor="ls-tiebreak"
            error={state.fieldErrors?.tiebreakAt?.[0]}
          >
            <input
              id="ls-tiebreak"
              name={isDraft ? 'tiebreakAt' : undefined}
              type="number"
              min={1}
              max={20}
              defaultValue={values.tiebreakAt}
              disabled={!isDraft}
              className={fieldCls}
            />
          </Field>

          <Field label="Clasificación por" htmlFor="ls-ranking">
            <select
              id="ls-ranking"
              name={isDraft ? 'rankingBy' : undefined}
              defaultValue={values.rankingBy}
              disabled={!isDraft}
              className={fieldCls}
            >
              {Object.entries(leagueRankingBasisLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Sanción por inasistencia (juegos)"
            htmlFor="ls-noshow"
            error={state.fieldErrors?.noShowGamesAgainst?.[0]}
          >
            <input
              id="ls-noshow"
              name={isDraft ? 'noShowGamesAgainst' : undefined}
              type="number"
              min={0}
              max={30}
              defaultValue={values.noShowGamesAgainst}
              disabled={!isDraft}
              className={fieldCls}
              aria-invalid={!!state.fieldErrors?.noShowGamesAgainst}
            />
          </Field>
        </div>

        <p className="text-xs text-muted-foreground">
          «Por juegos ganados» ignora los sets y ordena la clasificación solo
          por juegos. «Por sets y juegos» ordena por sets, pero muestra ambas
          columnas en la tabla. La «sanción por inasistencia» son los juegos en
          contra que se anotan a quien no se presenta (9 por defecto; usa el
          número que maneje tu club, p. ej. 6 o 0).
        </p>

        <label
          className={cn(
            'flex items-center gap-2.5 text-sm text-foreground',
            !isDraft && 'cursor-not-allowed opacity-60',
          )}
        >
          <input
            name={isDraft ? 'goldenPoint' : undefined}
            type="checkbox"
            defaultChecked={values.goldenPoint}
            disabled={!isDraft}
            className="size-4 rounded border-border accent-forest"
          />
          Punto de oro en deuce
        </label>
      </fieldset>

      {/* ---- Calendario (solo en borrador) ---- */}
      <fieldset className="space-y-5 rounded-xl border border-border bg-card p-6">
        <legend className="-mb-1 flex items-center gap-2 px-1">
          <span className={labelCls}>Calendario</span>
          {!isDraft && (
            <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-ochre">
              <Lock className="size-3" strokeWidth={2} />
              Bloqueado
            </span>
          )}
        </legend>

        {!isDraft && (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            El calendario (jornadas, días y horarios) solo se puede editar
            mientras la liga está en borrador.
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label="Número de jornadas"
            htmlFor="ls-rounds"
            error={state.fieldErrors?.totalRounds?.[0]}
          >
            <input
              id="ls-rounds"
              name={isDraft ? 'totalRounds' : undefined}
              type="number"
              min={1}
              max={50}
              defaultValue={values.totalRounds ?? ''}
              disabled={!isDraft}
              placeholder="Ej. 6"
              className={fieldCls}
              aria-invalid={!!state.fieldErrors?.totalRounds}
            />
          </Field>

          <Field label="Días de juego">
            <div className="flex flex-wrap gap-1.5 pt-1">
              {weekdayLabels.map((label, d) => (
                <label
                  key={d}
                  className={cn(
                    'inline-flex cursor-pointer select-none items-center rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background',
                    !isDraft && 'cursor-not-allowed opacity-60',
                  )}
                >
                  <input
                    type="checkbox"
                    name={isDraft ? 'playWeekdays' : undefined}
                    value={d}
                    defaultChecked={values.playWeekdays.includes(d)}
                    disabled={!isDraft}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </Field>
        </div>

        <Field label="Horarios recurrentes">
          <div className="space-y-2">
            {times.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  name={isDraft ? 'playTimes' : undefined}
                  value={t}
                  disabled={!isDraft}
                  onChange={(e) =>
                    setTimes((arr) =>
                      arr.map((x, j) => (j === i ? e.target.value : x)),
                    )
                  }
                  className={cn(fieldCls, 'max-w-40')}
                />
                {isDraft && (
                  <button
                    type="button"
                    onClick={() =>
                      setTimes((arr) => arr.filter((_, j) => j !== i))
                    }
                    aria-label="Quitar horario"
                    className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-terracotta/40 hover:bg-terracotta/10 hover:text-terracotta"
                  >
                    <X className="size-4" strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
            {times.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {isDraft
                  ? 'Sin horarios. Añade las horas de inicio (p. ej. 19:00 y 20:30).'
                  : 'Sin horarios definidos.'}
              </p>
            )}
            {isDraft && (
              <Button
                type="button"
                variant="outline"
                className="h-9 gap-1.5 rounded-md px-3 text-sm"
                onClick={() => setTimes((arr) => [...arr, ''])}
              >
                <Plus className="size-4" strokeWidth={2} />
                Añadir horario
              </Button>
            )}
          </div>
        </Field>
      </fieldset>

      {/* ---- Acciones ---- */}
      <div className="flex items-center justify-end gap-2">
        <Button
          asChild
          type="button"
          variant="outline"
          className="h-9 rounded-md px-4 text-sm"
        >
          <Link href={`/dashboard/ligas/${leagueId}`}>Cancelar</Link>
        </Button>
        <Button
          type="submit"
          className="h-9 rounded-md px-5 text-sm"
          disabled={pending}
        >
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
