'use client'

import { cn } from '@/lib/utils'
import {
  GENDERS,
  HANDS,
  SKILL_LEVELS,
  genderLabels,
  handLabels,
  skillLevelLabels,
} from '@/lib/players'
import type { PlayerFieldErrors } from '@/lib/validations/player'

const fieldCls =
  'h-10 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

const labelCls =
  'font-mono text-[10px] uppercase tracking-widest text-muted-foreground'

export type PlayerDefaults = {
  fullName?: string
  email?: string | null
  phone?: string | null
  gender?: string | null
  skillLevel?: string | null
  dominantHand?: string | null
  birthDate?: string | null
}

function FieldErr({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null
  return <p className="mt-1.5 text-xs text-destructive">{messages[0]}</p>
}

/**
 * Campos del formulario de jugador, reutilizados en el alta y en la edición.
 * `idPrefix` evita colisiones de `id`/`htmlFor` cuando hay varias filas en
 * edición a la vez.
 */
export function PlayerFields({
  defaults = {},
  errors,
  idPrefix,
}: {
  defaults?: PlayerDefaults
  errors?: PlayerFieldErrors
  idPrefix: string
}) {
  const id = (k: string) => `${idPrefix}-${k}`

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor={id('fullName')} className={labelCls}>
          Nombre completo
        </label>
        <input
          id={id('fullName')}
          name="fullName"
          type="text"
          defaultValue={defaults.fullName ?? ''}
          placeholder="Ej. Ana García López"
          className={cn('mt-2', fieldCls)}
          aria-invalid={!!errors?.fullName}
          required
        />
        <FieldErr messages={errors?.fullName} />
      </div>

      <div>
        <label htmlFor={id('email')} className={labelCls}>
          Email <span className="text-muted-foreground/70">(opcional)</span>
        </label>
        <input
          id={id('email')}
          name="email"
          type="email"
          defaultValue={defaults.email ?? ''}
          placeholder="correo@ejemplo.com"
          className={cn('mt-2', fieldCls)}
          aria-invalid={!!errors?.email}
        />
        <FieldErr messages={errors?.email} />
      </div>

      <div>
        <label htmlFor={id('phone')} className={labelCls}>
          Teléfono <span className="text-muted-foreground/70">(opcional)</span>
        </label>
        <input
          id={id('phone')}
          name="phone"
          type="tel"
          defaultValue={defaults.phone ?? ''}
          placeholder="55 1234 5678"
          className={cn('mt-2', fieldCls)}
          aria-invalid={!!errors?.phone}
        />
        <FieldErr messages={errors?.phone} />
      </div>

      <div>
        <label htmlFor={id('skillLevel')} className={labelCls}>
          Categoría
        </label>
        <select
          id={id('skillLevel')}
          name="skillLevel"
          defaultValue={defaults.skillLevel ?? 'unranked'}
          className={cn('mt-2', fieldCls)}
        >
          {SKILL_LEVELS.map((s) => (
            <option key={s} value={s}>
              {skillLevelLabels[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={id('gender')} className={labelCls}>
          Género <span className="text-muted-foreground/70">(opcional)</span>
        </label>
        <select
          id={id('gender')}
          name="gender"
          defaultValue={defaults.gender ?? ''}
          className={cn('mt-2', fieldCls)}
        >
          <option value="">Sin especificar</option>
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {genderLabels[g]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={id('dominantHand')} className={labelCls}>
          Mano hábil{' '}
          <span className="text-muted-foreground/70">(opcional)</span>
        </label>
        <select
          id={id('dominantHand')}
          name="dominantHand"
          defaultValue={defaults.dominantHand ?? ''}
          className={cn('mt-2', fieldCls)}
        >
          <option value="">Sin especificar</option>
          {HANDS.map((h) => (
            <option key={h} value={h}>
              {handLabels[h]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={id('birthDate')} className={labelCls}>
          Nacimiento{' '}
          <span className="text-muted-foreground/70">(opcional)</span>
        </label>
        <input
          id={id('birthDate')}
          name="birthDate"
          type="date"
          defaultValue={defaults.birthDate ?? ''}
          className={cn('mt-2', fieldCls)}
          aria-invalid={!!errors?.birthDate}
        />
        <FieldErr messages={errors?.birthDate} />
      </div>
    </div>
  )
}
