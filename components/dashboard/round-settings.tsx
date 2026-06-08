'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, Lock, Pencil, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
}: {
  roundId: string
  roundNumber: number
  status: string
  name: string | null
  scheduledDate: string // "YYYY-MM-DD" o ""
}) {
  const [editing, setEditing] = useState(false)
  const [state, setState] = useState<RoundState>({})
  const [savePending, startSave] = useTransition()
  const [statusPending, startStatus] = useTransition()

  const isClosed = status === 'closed'
  const isPublished = status === 'published'
  const st = leagueRoundStatusStyles[status] ?? leagueRoundStatusStyles.draft

  const togglePublish = () => {
    startStatus(() => {
      void setRoundStatus(roundId, isPublished ? 'draft' : 'published')
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
        <div className="flex items-center gap-3">
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
        </div>

        {isClosed ? (
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ochre">
            <Lock className="size-3.5" strokeWidth={2} />
            Bloqueada
          </span>
        ) : (
          <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {isClosed
          ? 'La jornada está cerrada: el nombre y la fecha ya no se pueden modificar.'
          : isPublished
            ? 'Publicada: visible en la página pública de la liga.'
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
        </form>
      )}
    </div>
  )
}
