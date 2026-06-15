'use client'

import { useMemo, useState, useTransition } from 'react'
import { ChevronDown, Pencil, Plus, Trash2, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { currencyOptions, formatMoney } from '@/lib/money'
import {
  categoryGenderLabels,
  categoryLabel,
  drawTypeLabels,
  skillLevelLabels,
} from '@/lib/tournaments'
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryState,
} from '@/app/dashboard/torneos/[id]/actions'

const fieldCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const labelCls =
  'font-mono text-[10px] uppercase tracking-widest text-muted-foreground'

const initialState: CategoryState = {}

export type CategoryItem = {
  id: string
  name: string
  gender: string
  skillLevel: string
  drawType: string
  maxTeams: number | null
  bestOfSets: number
  goldenPoint: boolean
  tiebreakAt: number
  teamsPerGroup: number | null
  advancePerGroup: number | null
  prize: string | null
  entryFee: number | null
  currency: string
  teamCount: number
}

type CategoryValues = {
  name: string
  gender: string
  skillLevel: string
  drawType: string
  maxTeams: string
  bestOfSets: number
  goldenPoint: boolean
  tiebreakAt: number
  teamsPerGroup: string
  advancePerGroup: string
  prize: string
  entryFee: string
  currency: string
}

const emptyValues: CategoryValues = {
  name: '',
  gender: 'mixed',
  skillLevel: 'unranked',
  drawType: 'groups_playoff',
  maxTeams: '',
  bestOfSets: 3,
  goldenPoint: true,
  tiebreakAt: 6,
  teamsPerGroup: '',
  advancePerGroup: '',
  prize: '',
  entryFee: '',
  currency: 'MXN',
}

function itemToValues(c: CategoryItem): CategoryValues {
  return {
    name: c.name,
    gender: c.gender,
    skillLevel: c.skillLevel,
    drawType: c.drawType,
    maxTeams: c.maxTeams != null ? String(c.maxTeams) : '',
    bestOfSets: c.bestOfSets,
    goldenPoint: c.goldenPoint,
    tiebreakAt: c.tiebreakAt,
    teamsPerGroup: c.teamsPerGroup != null ? String(c.teamsPerGroup) : '',
    advancePerGroup: c.advancePerGroup != null ? String(c.advancePerGroup) : '',
    prize: c.prize ?? '',
    entryFee: c.entryFee != null ? String(c.entryFee) : '',
    currency: c.currency,
  }
}

/* -------------------------------------------------------------------------- */
/*  Formulario (crear / editar)                                               */
/* -------------------------------------------------------------------------- */

function Labeled({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className={labelCls}>{label}</p>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function CategoryForm({
  action,
  defaults,
  submitLabel,
  onDone,
}: {
  action: (state: CategoryState, formData: FormData) => Promise<CategoryState>
  defaults: CategoryValues
  submitLabel: string
  onDone?: () => void
}) {
  const [state, setState] = useState<CategoryState>(initialState)
  const [pending, startTransition] = useTransition()
  // El tipo de cuadro controla si se piden los parámetros de grupo.
  const [drawType, setDrawType] = useState(defaults.drawType)
  const fe = state.fieldErrors

  // Ejecuta la acción en una transición (no en un efecto) para cerrar el panel
  // solo cuando el guardado fue correcto.
  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const res = await action(initialState, formData)
      setState(res)
      if (res.success) onDone?.()
    })
  }

  const isGroups = drawType === 'groups_playoff'

  return (
    <form action={onSubmit} noValidate className="space-y-5">
      {state.error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.error}
        </p>
      )}

      {/* Identidad de la categoría */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled
          label="Nombre"
          hint="Lo que verán los jugadores, p. ej. «Mixta C» o «3ra Femenil»."
          error={fe?.name?.[0]}
        >
          <input
            name="name"
            defaultValue={defaults.name}
            placeholder="Ej. Mixta · 4ta"
            className={fieldCls}
            aria-invalid={!!fe?.name}
            autoComplete="off"
          />
        </Labeled>
        <Labeled label="Distinción" error={fe?.gender?.[0]}>
          <select name="gender" defaultValue={defaults.gender} className={fieldCls}>
            {Object.entries(categoryGenderLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Labeled>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled label="Nivel / fuerza" hint="«Open» = sin distinción de nivel.">
          <select
            name="skillLevel"
            defaultValue={defaults.skillLevel}
            className={fieldCls}
          >
            {Object.entries(skillLevelLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Labeled>
        <Labeled label="Sistema de clasificación" error={fe?.drawType?.[0]}>
          <select
            name="drawType"
            value={drawType}
            onChange={(e) => setDrawType(e.target.value)}
            className={fieldCls}
          >
            {Object.entries(drawTypeLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Labeled>
      </div>

      {/* Fase de grupos (condicional) */}
      {isGroups && (
        <div className="grid gap-4 rounded-lg border border-dashed border-border bg-card/50 p-4 sm:grid-cols-2">
          <Labeled
            label="Parejas por grupo"
            hint="Cuántas parejas integran cada grupo."
            error={fe?.teamsPerGroup?.[0]}
          >
            <input
              name="teamsPerGroup"
              type="number"
              min={3}
              max={16}
              defaultValue={defaults.teamsPerGroup}
              placeholder="Ej. 4"
              className={fieldCls}
              aria-invalid={!!fe?.teamsPerGroup}
            />
          </Labeled>
          <Labeled
            label="Avanzan por grupo"
            hint="Cuántas parejas pasan a la eliminatoria."
            error={fe?.advancePerGroup?.[0]}
          >
            <input
              name="advancePerGroup"
              type="number"
              min={1}
              max={8}
              defaultValue={defaults.advancePerGroup}
              placeholder="Ej. 2"
              className={fieldCls}
              aria-invalid={!!fe?.advancePerGroup}
            />
          </Labeled>
        </div>
      )}

      {/* Reglas de juego */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Labeled label="Sets (al mejor de)" error={fe?.bestOfSets?.[0]}>
          <input
            name="bestOfSets"
            type="number"
            min={1}
            max={5}
            defaultValue={defaults.bestOfSets}
            className={fieldCls}
            aria-invalid={!!fe?.bestOfSets}
          />
        </Labeled>
        <Labeled label="Tie-break en (juegos)" error={fe?.tiebreakAt?.[0]}>
          <input
            name="tiebreakAt"
            type="number"
            min={1}
            max={20}
            defaultValue={defaults.tiebreakAt}
            className={fieldCls}
            aria-invalid={!!fe?.tiebreakAt}
          />
        </Labeled>
        <Labeled label="Cupo de parejas" hint="Máx. inscritas (opcional)." error={fe?.maxTeams?.[0]}>
          <input
            name="maxTeams"
            type="number"
            min={2}
            max={256}
            defaultValue={defaults.maxTeams}
            placeholder="Sin límite"
            className={fieldCls}
            aria-invalid={!!fe?.maxTeams}
          />
        </Labeled>
      </div>

      <label className="flex items-start gap-2.5">
        <input
          type="checkbox"
          name="goldenPoint"
          defaultChecked={defaults.goldenPoint}
          className="mt-0.5 size-4 shrink-0 rounded border-border accent-forest"
        />
        <span className="text-xs leading-relaxed text-muted-foreground">
          <span className="text-foreground">Punto de oro</span> — se juega punto
          decisivo en el deuce (sin ventajas).
        </span>
      </label>

      {/* Inscripción y premio */}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
        <Labeled label="Costo de inscripción" hint="Por pareja. Vacío = gratuita." error={fe?.entryFee?.[0]}>
          <input
            name="entryFee"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            defaultValue={defaults.entryFee}
            placeholder="Ej. 800"
            className={fieldCls}
            aria-invalid={!!fe?.entryFee}
          />
        </Labeled>
        <Labeled label="Moneda">
          <select name="currency" defaultValue={defaults.currency} className={fieldCls}>
            {currencyOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Labeled>
      </div>

      <Labeled
        label="Premio"
        hint="Texto libre: efectivo, trofeos, productos… No es lo mismo ganar 5ta que 1ra."
        error={fe?.prize?.[0]}
      >
        <textarea
          name="prize"
          defaultValue={defaults.prize}
          placeholder="Ej. 1º $5,000 + trofeo · 2º $2,000"
          className={cn(fieldCls, 'h-auto min-h-20 py-2.5')}
        />
      </Labeled>

      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" disabled={pending} className="h-9 rounded-md px-4 text-sm">
          {pending ? 'Guardando…' : submitLabel}
        </Button>
        {onDone && (
          <Button
            type="button"
            variant="ghost"
            onClick={onDone}
            disabled={pending}
            className="h-9 rounded-md px-3 text-sm text-muted-foreground"
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*  Fila de categoría                                                         */
/* -------------------------------------------------------------------------- */

function CategoryRow({ category }: { category: CategoryItem }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  const boundUpdate = useMemo(
    () => updateCategory.bind(null, category.id),
    [category.id],
  )

  const remove = () => {
    startTransition(() => {
      void deleteCategory(category.id)
    })
  }

  const isGroups = category.drawType === 'groups_playoff'
  const meta = [
    `Al mejor de ${category.bestOfSets}`,
    category.goldenPoint ? 'Punto de oro' : 'Con ventajas',
    isGroups && category.teamsPerGroup
      ? `Grupos de ${category.teamsPerGroup}${
          category.advancePerGroup ? ` · pasan ${category.advancePerGroup}` : ''
        }`
      : null,
    category.maxTeams ? `Cupo ${category.maxTeams}` : null,
    category.entryFee != null
      ? formatMoney(category.entryFee, category.currency)
      : 'Gratuita',
  ].filter(Boolean) as string[]

  return (
    <li className={cn('px-3 py-4', pending && 'opacity-50')}>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm text-foreground">
            <span className="font-serif text-base">{category.name}</span>
            <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {categoryLabel(category.gender, category.skillLevel)}
            </span>
            <span className="rounded-sm bg-forest/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-forest">
              {drawTypeLabels[category.drawType] ?? category.drawType}
            </span>
          </p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {meta.join(' · ')}
          </p>
          {category.prize && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              <span className="text-foreground">Premio:</span> {category.prize}
            </p>
          )}
        </div>

        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
          {category.teamCount} {category.teamCount === 1 ? 'pareja' : 'parejas'}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            title="Editar categoría"
            className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {editing ? <X className="size-4" /> : <Pencil className="size-4" />}
          </button>
          <ConfirmDialog
            title={`¿Eliminar la categoría «${category.name}»?`}
            description={
              category.teamCount > 0
                ? `Se eliminarán también sus ${category.teamCount} pareja(s) inscrita(s) y sus partidos. Esta acción no se puede deshacer.`
                : 'Esta acción no se puede deshacer.'
            }
            confirmLabel="Eliminar"
            destructive
            onConfirm={remove}
            trigger={
              <button
                type="button"
                disabled={pending}
                title="Eliminar categoría"
                className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-terracotta/40 hover:bg-terracotta/10 hover:text-terracotta disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            }
          />
        </div>
      </div>

      {editing && (
        <div className="mt-5 border-t border-border pt-5">
          <CategoryForm
            action={boundUpdate}
            defaults={itemToValues(category)}
            submitLabel="Guardar cambios"
            onDone={() => setEditing(false)}
          />
        </div>
      )}
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/*  Módulo                                                                    */
/* -------------------------------------------------------------------------- */

export function TournamentCategories({
  tournamentId,
  categories,
}: {
  tournamentId: string
  categories: CategoryItem[]
}) {
  const [adding, setAdding] = useState(false)

  const boundCreate = useMemo(
    () => createCategory.bind(null, tournamentId),
    [tournamentId],
  )

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={labelCls}>Cuadros</p>
          <h2 className="mt-1.5 font-serif text-2xl tracking-tight text-foreground">
            Categorías
          </h2>
        </div>
        <Button
          type="button"
          onClick={() => setAdding((v) => !v)}
          variant={adding ? 'outline' : 'default'}
          className="h-9 gap-1.5 rounded-md px-4 text-sm"
        >
          {adding ? (
            <>
              <ChevronDown className="size-4" strokeWidth={2} />
              Cerrar
            </>
          ) : (
            <>
              <Plus className="size-4" strokeWidth={2} />
              Añadir categoría
            </>
          )}
        </Button>
      </div>

      {adding && (
        <div className="mt-5 rounded-xl border border-border bg-card p-5">
          <CategoryForm
            action={boundCreate}
            defaults={emptyValues}
            submitLabel="Crear categoría"
            onDone={() => setAdding(false)}
          />
        </div>
      )}

      {categories.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no hay categorías. Añade la primera para distribuir a los
            jugadores por nivel y distinción.
          </p>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-border rounded-xl border border-border">
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </ul>
      )}
    </section>
  )
}
