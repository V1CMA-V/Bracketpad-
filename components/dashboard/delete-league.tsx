'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteLeague } from '@/app/dashboard/ligas/[id]/actions'

/**
 * Zona de peligro de la edición de liga: botón para eliminarla por completo.
 * Pide confirmación antes de invocar el server action (que borra en cascada y
 * redirige al listado).
 */
export function DeleteLeagueSection({
  leagueId,
  leagueName,
  isDraft,
}: {
  leagueId: string
  leagueName: string
  /** Solo las ligas en borrador se pueden eliminar. */
  isDraft: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onDelete = () => {
    setError(null)
    startTransition(async () => {
      // En caso de éxito el action redirige; aquí solo llegamos con error.
      const result = await deleteLeague(leagueId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-destructive">
        Zona de peligro
      </p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-foreground">Eliminar liga</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {isDraft
              ? 'Borra la liga y todo su contenido: jornadas, inscripciones, partidos y clasificación. No se puede deshacer.'
              : 'Solo se pueden eliminar ligas en borrador. Una vez activa conserva partidos y clasificación; archívala si ya no la usas.'}
          </p>
        </div>
        {isDraft && (
          <ConfirmDialog
            title={`¿Eliminar la liga «${leagueName}»?`}
            description="Se borrarán sus jornadas, inscripciones, partidos y clasificación. Esta acción no se puede deshacer."
            confirmLabel="Eliminar liga"
            destructive
            onConfirm={onDelete}
            trigger={
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                className="h-9 shrink-0 gap-1.5 rounded-md px-4 text-sm"
              >
                <Trash2 className="size-4" strokeWidth={2} />
                {pending ? 'Eliminando…' : 'Eliminar liga'}
              </Button>
            }
          />
        )}
      </div>
      {error && (
        <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
