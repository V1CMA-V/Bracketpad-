'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, Lock, LockOpen, Pencil, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  leagueRoundStatusLabels,
  leagueRoundStatusStyles,
} from '@/lib/leagues'
import {
  setRoundStatus,
  updateRound,
  type RoundState,
} from '@/app/dashboard/ligas/[id]/actions'

const fieldCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const labelCls =
  'font-mono text-[10px] uppercase tracking-widest text-muted-foreground'

export function RoundSettings({
  roundId,
  roundNumber,
  status,
  name,
  scheduledDate,
  isPreliminary,
}: {
  roundId: string
  roundNumber: number
  status: string
  name: string | null
  scheduledDate: string // "YYYY-MM-DD" o ""
  isPreliminary: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [state, setState] = useState<RoundState>({})
  const [savePending, startSave] = useTransition()
  const [statusPending, startStatus] = useTransition()
  const [closePending, startClose] = useTransition()

  const isClosed = status === 'closed'
  const isPublished = status === 'published'
  const st = leagueRoundStatusStyles[status] ?? leagueRoundStatusStyles.draft

  const togglePublish = () => {
    startStatus(() => {
      void setRoundStatus(roundId, isPublished ? 'draft' : 'published')
    })
  }

  // Cierre manual de la jornada: la bloquea para edición y publica sus
  // resultados en la página pública. Disponible para cualquier liga (en las
  // individuales también existe «Cerrar y generar siguiente», que además crea
  // la jornada siguiente con el ascenso/descenso). Se puede reabrir.
  const closeRound = () => {
    startClose(() => {
      void setRoundStatus(roundId, 'closed')
    })
  }

  const reopenRound = () => {
    startClose(() => {
      void setRoundStatus(roundId, 'published')
    })
  }

  const onSave = (formData: FormData) => {
    startSave(async () => {
      const result = await updateRound(roundId, state, formData)
      if (result.success) {
        setState({})
        setEditing(false)
      } else {
        setState(result)
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className={labelCls}>Estado de la jornada</span>
          <span
            className={cn(
              'flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest',
              st.text,
            )}
          >
            <span className={cn('size-1.5 rounded-full', st.dot)} />
            {leagueRoundStatusLabels[status] ?? status}
          </span>
          {isPreliminary && (
            <span className="flex items-center gap-1.5 rounded-full bg-ochre/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ochre">
              Previa · no puntúa
            </span>
          )}
        </div>

        {isClosed ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ochre">
              <Lock className="size-3.5" strokeWidth={2} />
              Cerrada
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={reopenRound}
              disabled={closePending}
              className="h-9 gap-1.5 rounded-md px-3 text-sm"
            >
              <LockOpen className="size-4" strokeWidth={2} />
              {closePending ? 'Reabriendo…' : 'Reabrir'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={togglePublish}
              disabled={statusPending}
              className="h-9 gap-1.5 rounded-md px-3 text-sm"
            >
              {isPublished ? (
                <>
                  <EyeOff className="size-4" strokeWidth={2} />
                  Despublicar
                </>
              ) : (
                <>
                  <Eye className="size-4" strokeWidth={2} />
                  Publicar
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setState({})
                setEditing((v) => !v)
              }}
              className="h-9 gap-1.5 rounded-md px-3 text-sm"
            >
              {editing ? (
                <>
                  <X className="size-4" strokeWidth={2} />
                  Cancelar
                </>
              ) : (
                <>
                  <Pencil className="size-4" strokeWidth={2} />
                  Editar
                </>
              )}
            </Button>
            <ConfirmDialog
              title="¿Cerrar la jornada?"
              description="Quedará bloqueada para edición y sus resultados se mostrarán en la página pública. Podrás reabrirla."
              confirmLabel="Cerrar jornada"
              onConfirm={closeRound}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  disabled={closePending}
                  className="h-9 gap-1.5 rounded-md px-3 text-sm"
                >
                  <Lock className="size-4" strokeWidth={2} />
                  {closePending ? 'Cerrando…' : 'Cerrar jornada'}
                </Button>
              }
            />
          </div>
        )}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {isClosed
          ? 'Cerrada: bloqueada para edición y con sus resultados visibles en la página pública. Reábrela para volver a modificarla.'
          : isPublished
            ? 'Publicada: visible en la página pública de la liga. Ciérrala cuando termine para mostrar sus resultados.'
            : 'Borrador: solo visible en el panel hasta que la publiques.'}
      </p>

      {editing && !isClosed && (
        <form
          action={onSave}
          noValidate
          className="mt-4 border-t border-border pt-4"
        >
          {state.error && (
            <p className="mb-3 text-xs text-destructive">{state.error}</p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <label htmlFor="round-name" className={labelCls}>
                Nombre
              </label>
              <input
                id="round-name"
                name="name"
                type="text"
                defaultValue={name ?? ''}
                placeholder={`Jornada ${roundNumber}`}
                className={cn(fieldCls, 'mt-1.5')}
                aria-invalid={!!state.fieldErrors?.name}
                autoComplete="off"
              />
              {state.fieldErrors?.name?.[0] && (
                <p className="mt-1 text-xs text-destructive">
                  {state.fieldErrors.name[0]}
                </p>
              )}
            </div>
            <div className="sm:w-44">
              <label htmlFor="round-date" className={labelCls}>
                Fecha
              </label>
              <input
                id="round-date"
                name="scheduledDate"
                type="date"
                defaultValue={scheduledDate}
                className={cn(fieldCls, 'mt-1.5')}
                aria-invalid={!!state.fieldErrors?.scheduledDate}
              />
              {state.fieldErrors?.scheduledDate?.[0] && (
                <p className="mt-1 text-xs text-destructive">
                  {state.fieldErrors.scheduledDate[0]}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="h-9 shrink-0 self-end rounded-md px-4 text-sm"
              disabled={savePending}
            >
              {savePending ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>

          <label className="mt-4 flex items-start gap-2.5 border-t border-border pt-4">
            <input
              type="checkbox"
              name="isPreliminary"
              defaultChecked={isPreliminary}
              className="mt-0.5 size-4 shrink-0 rounded border-border accent-ochre"
            />
            <span>
              <span className="text-sm text-foreground">Jornada previa</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                Se juega para ver el nivel y acomodar los grupos. Sus resultados
                no cuentan para la clasificación general de la liga.
              </span>
            </span>
          </label>
        </form>
      )}
    </div>
  )
}
