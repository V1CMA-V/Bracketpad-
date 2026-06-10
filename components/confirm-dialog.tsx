'use client'

import * as React from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

/**
 * Diálogo de confirmación reutilizable (sustituye al `confirm()` nativo). El
 * `trigger` es el elemento que lo abre (se renderiza con `asChild`); al
 * confirmar se ejecuta `onConfirm` y el diálogo se cierra solo.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Continuar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
}: {
  trigger: React.ReactNode
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Resalta la acción como destructiva (rojo). */
  destructive?: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
