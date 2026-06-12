'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarSearch } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Botón para saltar a cualquier fecha de la programación. El selector de día
 * de la barra solo cubre la semana visible; este abre el calendario nativo del
 * navegador para ir a un día concreto fuera de esa semana.
 *
 * El `<input type="date">` queda oculto (renderizado, no `display:none`, para
 * que `showPicker()` funcione) y el botón visible dispara el calendario.
 */
export function DayJump({ value }: { value: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const open = () => {
    const el = inputRef.current
    if (!el) return
    try {
      el.showPicker()
    } catch {
      el.focus()
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={open}
        className={cn(
          'flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5',
          'font-mono text-[11px] uppercase tracking-wider text-muted-foreground',
          'transition-colors hover:bg-muted hover:text-foreground',
        )}
      >
        <CalendarSearch className="size-3.5" />
        Ir a fecha
      </button>
      <input
        ref={inputRef}
        type="date"
        defaultValue={value}
        onChange={(e) => {
          const v = e.target.value
          if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
            router.push(`/dashboard/programacion?d=${v}`)
          }
        }}
        aria-label="Ir a una fecha"
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 -z-10 opacity-0"
      />
    </div>
  )
}
