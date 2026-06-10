'use client'

import { useTransition } from 'react'
import { Power, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteCourt, setCourtActive } from '@/app/dashboard/pistas/actions'

export function CourtActions({
  courtId,
  isActive,
}: {
  courtId: string
  isActive: boolean
}) {
  const [pending, startTransition] = useTransition()

  const toggle = () =>
    startTransition(() => {
      void setCourtActive(courtId, !isActive)
    })

  const remove = () => {
    startTransition(() => {
      void deleteCourt(courtId)
    })
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        title={isActive ? 'Desactivar pista' : 'Activar pista'}
        className={cn(
          'flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50',
          isActive && 'text-forest',
        )}
      >
        <Power className="size-4" strokeWidth={2} />
      </button>
      <ConfirmDialog
        title="¿Eliminar esta pista?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={remove}
        trigger={
          <button
            type="button"
            disabled={pending}
            title="Eliminar pista"
            className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-terracotta/40 hover:bg-terracotta/10 hover:text-terracotta disabled:opacity-50"
          >
            <Trash2 className="size-4" strokeWidth={2} />
          </button>
        }
      />
    </div>
  )
}
