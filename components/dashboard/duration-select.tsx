'use client'

import { DEFAULT_MATCH_MINUTES } from '@/lib/league-rules'

const selectCls =
  'h-9 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

// Duraciones (minutos) que un partido aparta la cancha.
const options = [30, 45, 60, 75, 90, 105, 120, 150]

/**
 * Selector de duración por partido ("apartado de cancha"). Envía `durationMinutes`.
 * Por defecto, la duración estándar de la liga.
 */
export function DurationSelect({
  defaultValue,
}: {
  defaultValue?: number | null
}) {
  return (
    <select
      name="durationMinutes"
      defaultValue={String(defaultValue ?? DEFAULT_MATCH_MINUTES)}
      className={selectCls}
      aria-label="Duración por partido"
    >
      {options.map((m) => (
        <option key={m} value={m}>
          {m} min
        </option>
      ))}
    </select>
  )
}
