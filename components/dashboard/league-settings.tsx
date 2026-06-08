'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  leagueFormatLabels,
  leagueRankingBasisLabels,
  leagueStatusLabels,
} from '@/lib/leagues'
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

export type LeagueSettingsValues = {
  name: string
  status: string
  format: string
  playKind: string
  startDate: string // "YYYY-MM-DD" o ""
  endDate: string
  prizes: string
  bestOfSets: number
  goldenPoint: boolean
  tiebreakAt: number
  rankingBy: string
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
        </div>

        <p className="text-xs text-muted-foreground">
          «Por juegos ganados» ignora los sets y ordena la clasificación solo
          por juegos. «Por sets y juegos» ordena por sets, pero muestra ambas
          columnas en la tabla.
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
