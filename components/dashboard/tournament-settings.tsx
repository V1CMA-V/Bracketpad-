'use client'

import { useMemo, useState, useTransition } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { tournamentStatusLabels } from '@/lib/tournaments'
import {
  deleteTournament,
  updateTournament,
  type TournamentState,
} from '@/app/dashboard/torneos/[id]/actions'

const fieldCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const labelCls =
  'font-mono text-[10px] uppercase tracking-widest text-muted-foreground'

const initialState: TournamentState = {}

export type TournamentValues = {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  location: string
  description: string
}

export function TournamentSettings({ tournament }: { tournament: TournamentValues }) {
  const [editing, setEditing] = useState(false)
  const [deletePending, startDelete] = useTransition()
  const [state, setState] = useState<TournamentState>(initialState)
  const [pending, startUpdate] = useTransition()

  const boundUpdate = useMemo(
    () => updateTournament.bind(null, tournament.id),
    [tournament.id],
  )
  const fe = state.fieldErrors

  const onSubmit = (formData: FormData) => {
    startUpdate(async () => {
      const res = await boundUpdate(initialState, formData)
      setState(res)
      if (res.success) setEditing(false)
    })
  }

  const isDraft = tournament.status === 'draft'

  const remove = () => {
    startDelete(() => {
      // La acción redirige al listado al borrar.
      void deleteTournament(tournament.id).then((res) => {
        if (res?.error) window.alert(res.error)
      })
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className={labelCls}>Ajustes del torneo</p>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          {editing ? (
            <>
              <X className="size-3.5" /> Cerrar
            </>
          ) : (
            <>
              <Pencil className="size-3.5" /> Editar
            </>
          )}
        </button>
      </div>

      {!editing ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Edita el nombre, las fechas, la sede y el estado del torneo (borrador,
          inscripción abierta, en juego…).
        </p>
      ) : (
        <form action={onSubmit} noValidate className="mt-4 space-y-4">
          {state.error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {state.error}
            </p>
          )}

          <div>
            <p className={labelCls}>Nombre</p>
            <input
              name="name"
              defaultValue={tournament.name}
              className={cn(fieldCls, 'mt-1.5')}
              aria-invalid={!!fe?.name}
              autoComplete="off"
            />
            {fe?.name?.[0] && (
              <p className="mt-1 text-xs text-destructive">{fe.name[0]}</p>
            )}
          </div>

          <div>
            <p className={labelCls}>Estado</p>
            <select
              name="status"
              defaultValue={tournament.status}
              className={cn(fieldCls, 'mt-1.5')}
            >
              {Object.entries(tournamentStatusLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelCls}>Inicio</p>
              <input
                name="startDate"
                type="date"
                defaultValue={tournament.startDate}
                className={cn(fieldCls, 'mt-1.5')}
              />
            </div>
            <div>
              <p className={labelCls}>Fin</p>
              <input
                name="endDate"
                type="date"
                defaultValue={tournament.endDate}
                className={cn(fieldCls, 'mt-1.5')}
              />
            </div>
          </div>

          <div>
            <p className={labelCls}>Sede / ubicación</p>
            <input
              name="location"
              defaultValue={tournament.location}
              placeholder="Ej. Club Marítimo, Pista Central"
              className={cn(fieldCls, 'mt-1.5')}
            />
          </div>

          <div>
            <p className={labelCls}>Descripción</p>
            <textarea
              name="description"
              defaultValue={tournament.description}
              className={cn(fieldCls, 'mt-1.5 h-auto min-h-20 py-2.5')}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" disabled={pending} className="h-9 rounded-md px-4 text-sm">
              {pending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(false)}
              disabled={pending}
              className="h-9 rounded-md px-3 text-sm text-muted-foreground"
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* Eliminar (solo borradores) */}
      <div className="mt-4 border-t border-border pt-4">
        {isDraft ? (
          <ConfirmDialog
            title="¿Eliminar este torneo?"
            description="Se eliminarán también sus categorías, parejas y partidos. Esta acción no se puede deshacer."
            confirmLabel="Eliminar torneo"
            destructive
            onConfirm={remove}
            trigger={
              <button
                type="button"
                disabled={deletePending}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-terracotta transition-colors hover:text-terracotta/80 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
                {deletePending ? 'Eliminando…' : 'Eliminar torneo'}
              </button>
            }
          />
        ) : (
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
            Archiva el torneo desde el estado en lugar de eliminarlo.
          </p>
        )}
      </div>
    </div>
  )
}
