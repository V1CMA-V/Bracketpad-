'use client'

import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { ClubHoursForm } from '@/components/dashboard/club-hours-form'
import { Button } from '@/components/ui/button'
import { TIMEZONES, timezoneLabels } from '@/lib/clubs'
import { cn } from '@/lib/utils'
import {
  updateClubSettings,
  setClubActive,
  type ClubSettingsState,
} from '@/app/dashboard/ajustes/actions'
import type { ClubFieldErrors } from '@/lib/validations/club'
import { ExternalLink, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useState, useTransition } from 'react'

/* -------------------------------------------------------------------------- */
/*  Datos                                                                      */
/* -------------------------------------------------------------------------- */

export type ClubData = {
  name: string
  slug: string
  legalName: string | null
  taxId: string | null
  foundedYear: number | null
  description: string | null
  email: string | null
  phone: string | null
  website: string | null
  instagram: string | null
  address: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  timezone: string
  isActive: boolean
}

type DayHours = { dayOfWeek: number; openTime: string; closeTime: string }

type SectionId = 'ficha' | 'contacto' | 'horario' | 'pistas' | 'estado'

type Section = {
  id: SectionId
  n: string
  label: string
  eyebrow: string
  title: React.ReactNode
  lead: string
}

const sections: Section[] = [
  {
    id: 'ficha',
    n: '01',
    label: 'Ficha del club',
    eyebrow: 'Sección 01 · Ficha del club',
    title: (
      <>
        Identidad <em className="italic">del club.</em>
      </>
    ),
    lead: 'Los datos públicos que aparecen en el perfil de Bandeja y en los eventos que organizas. Cambian solo cuando los actualizas aquí.',
  },
  {
    id: 'contacto',
    n: '02',
    label: 'Contacto y ubicación',
    eyebrow: 'Sección 02 · Contacto y ubicación',
    title: (
      <>
        Dónde te <em className="italic">encuentran.</em>
      </>
    ),
    lead: 'Email, teléfono, redes y dirección del club. Es lo que ven los jugadores para localizarte y llegar a las pistas.',
  },
  {
    id: 'horario',
    n: '03',
    label: 'Horario del club',
    eyebrow: 'Sección 03 · Horario del club',
    title: (
      <>
        Cuándo se <em className="italic">juega.</em>
      </>
    ),
    lead: 'La franja de apertura de cada día. Es el rango horario que usa la programación de pistas.',
  },
  {
    id: 'pistas',
    n: '04',
    label: 'Pistas',
    eyebrow: 'Sección 04 · Pistas',
    title: (
      <>
        Las pistas <em className="italic">del club.</em>
      </>
    ),
    lead: 'Tus pistas y su disponibilidad se gestionan en su propia sección. Aquí solo ves el resumen.',
  },
  {
    id: 'estado',
    n: '05',
    label: 'Estado del club',
    eyebrow: 'Sección 05 · Estado del club',
    title: (
      <>
        Visibilidad y <em className="italic">cierre.</em>
      </>
    ),
    lead: 'Controla si el club está activo y visible. Archivarlo lo oculta junto a sus eventos; es reversible.',
  },
]

/* -------------------------------------------------------------------------- */
/*  Primitivas de formulario                                                  */
/* -------------------------------------------------------------------------- */

const inputCls =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

const areaCls =
  'min-h-[88px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

function Field({
  label,
  hint,
  full,
  error,
  children,
}: {
  label: string
  hint?: string
  full?: boolean
  error?: string[]
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', full && 'sm:col-span-2')}>
      <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
      {error?.length ? (
        <p className="text-xs text-destructive">{error[0]}</p>
      ) : hint ? (
        <p className="font-mono text-[10px] tracking-wide text-muted-foreground/70">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function TextField({
  label,
  name,
  defaultValue,
  placeholder,
  hint,
  prefix,
  type = 'text',
  full,
  required,
  error,
}: {
  label: string
  name: string
  defaultValue?: string | number | null
  placeholder?: string
  hint?: string
  prefix?: string
  type?: string
  full?: boolean
  required?: boolean
  error?: string[]
}) {
  const value = defaultValue == null ? '' : String(defaultValue)
  return (
    <Field label={label} hint={hint} full={full} error={error}>
      {prefix ? (
        <div
          className={cn(
            'flex h-10 items-center rounded-md border bg-background pl-3 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30',
            error?.length ? 'border-destructive/60' : 'border-input',
          )}
        >
          <span className="font-mono text-xs text-muted-foreground">
            {prefix}
          </span>
          <input
            name={name}
            type={type}
            defaultValue={value}
            placeholder={placeholder}
            aria-invalid={error?.length ? true : undefined}
            className="h-full flex-1 bg-transparent px-1 text-sm text-foreground outline-none"
          />
        </div>
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          className={cn(inputCls, error?.length && 'border-destructive/60')}
          defaultValue={value}
          placeholder={placeholder}
          aria-invalid={error?.length ? true : undefined}
        />
      )}
    </Field>
  )
}

function AreaField({
  label,
  name,
  defaultValue,
  placeholder,
  hint,
  error,
}: {
  label: string
  name: string
  defaultValue?: string | null
  placeholder?: string
  hint?: string
  error?: string[]
}) {
  return (
    <Field label={label} hint={hint} full error={error}>
      <textarea
        name={name}
        className={cn(areaCls, error?.length && 'border-destructive/60')}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        aria-invalid={error?.length ? true : undefined}
      />
    </Field>
  )
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  error,
}: {
  label: string
  name: string
  defaultValue?: string
  options: { value: string; label: string }[]
  error?: string[]
}) {
  return (
    <Field label={label} error={error}>
      <select
        name={name}
        defaultValue={defaultValue}
        className={cn(inputCls, error?.length && 'border-destructive/60')}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Completitud de la ficha                                                   */
/* -------------------------------------------------------------------------- */

// Campos recomendados que cuentan para el porcentaje de la ficha. Nombre y URL
// son obligatorios, así que no entran en el cálculo.
function completionFor(club: ClubData): {
  pct: number
  todos: string[]
} {
  const checks: [string, unknown][] = [
    ['Descripción', club.description],
    ['Email', club.email],
    ['Teléfono', club.phone],
    ['Dirección', club.address],
    ['Ciudad', club.city],
    ['Estado', club.state],
    ['Razón social', club.legalName],
    ['RFC', club.taxId],
    ['Web o Instagram', club.website || club.instagram],
  ]
  const filled = checks.filter(([, v]) => v != null && v !== '').length
  const pct = Math.round((filled / checks.length) * 100)
  const todos = checks.filter(([, v]) => v == null || v === '').map(([k]) => k)
  return { pct, todos }
}

/* -------------------------------------------------------------------------- */
/*  Sección: estado del club (toggle isActive + zona de riesgo)               */
/* -------------------------------------------------------------------------- */

function EstadoSection({ isActive }: { isActive: boolean }) {
  const [active, setActive] = useState(isActive)
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    const next = !active
    setActive(next)
    startTransition(async () => {
      await setClubActive(next)
    })
  }

  return (
    <div className="space-y-5">
      <Panel title="Visibilidad del club">
        <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-background px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm text-foreground">
              {active ? 'Club activo' : 'Club archivado'}
            </p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {active
                ? 'Visible en el directorio y operativo'
                : 'Oculto junto a sus eventos'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label="Club activo"
            disabled={pending}
            onClick={toggle}
            className={cn(
              'relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50',
              active ? 'bg-forest' : 'bg-muted-foreground/30',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 size-4 rounded-full bg-cream shadow-sm transition-transform',
                active ? 'translate-x-4' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>
      </Panel>

      <section className="rounded-xl border border-terracotta/40 bg-terracotta/5 p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
          Zona de riesgo
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-foreground">
              {active ? 'Archivar el club' : 'Reactivar el club'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {active
                ? 'Oculta el club y sus eventos. Reversible en cualquier momento.'
                : 'Vuelve a hacer visible el club y sus eventos.'}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-9 px-4 text-sm"
            disabled={pending}
            onClick={toggle}
          >
            {pending ? 'Guardando…' : active ? 'Archivar' : 'Reactivar'}
          </Button>
        </div>
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Página                                                                    */
/* -------------------------------------------------------------------------- */

const initialState: ClubSettingsState = {}
const FORM_ID = 'club-settings-form'

export function ClubSettings({
  club,
  hours,
  courtCount,
}: {
  club: ClubData
  hours: DayHours[]
  courtCount: number
}) {
  const [activeId, setActiveId] = useState<SectionId>('ficha')
  const [state, formAction, pending] = useActionState(
    updateClubSettings,
    initialState,
  )
  const active = sections.find((s) => s.id === activeId)!
  const errors: ClubFieldErrors = state.fieldErrors ?? {}
  const { pct, todos } = completionFor(club)

  const publicUrl = `https://bandeja.es/c/${club.slug}`

  return (
    <>
      <DashboardTopbar>
        <Button
          type="submit"
          form={FORM_ID}
          className="h-9 rounded-md px-4 text-sm"
          disabled={pending}
        >
          {pending ? 'Guardando…' : 'Guardar'}
        </Button>
      </DashboardTopbar>

      <div className="mx-auto max-w-[1500px] px-8 py-10">
        {/* ---- Encabezado ---- */}
        <section>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {club.name} · Ajustes
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Ajustes <em className="italic">del club.</em>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            La ficha, el contacto y el horario del club. Lo que guardes aquí se
            aplica a todos los eventos que organizas.
          </p>
        </section>

        {/* ---- Navegación + contenido ---- */}
        <div className="mt-10 grid grid-cols-1 gap-8 border-t border-border pt-8 lg:grid-cols-[268px_1fr]">
          {/* Lateral de secciones */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Ajustes · {sections.length} secciones
            </p>
            <nav>
              <ul className="space-y-0.5">
                {sections.map((s) => {
                  const isActive = s.id === activeId
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(s.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                          isActive
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <span
                          className={cn(
                            'font-mono text-[10px]',
                            isActive
                              ? 'text-background/55'
                              : 'text-muted-foreground/55',
                          )}
                        >
                          {s.n}
                        </span>
                        <span className="flex-1">{s.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Estado de la ficha */}
            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Estado de la ficha
              </p>
              <p className="mt-1.5 font-serif text-3xl leading-none text-foreground">
                {pct}%
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-forest"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {todos.length > 0 ? (
                <ul className="mt-3 space-y-1">
                  {todos.map((todo) => (
                    <li
                      key={todo}
                      className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                    >
                      <span className="size-1 rounded-full bg-terracotta" />
                      {todo}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-forest">
                  Ficha completa
                </p>
              )}
            </div>
          </aside>

          {/* Panel activo */}
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {active.eyebrow}
                </p>
                <h2 className="mt-2 font-serif text-4xl leading-tight tracking-tight text-foreground">
                  {active.title}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {active.lead}
                </p>
              </div>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
              >
                Ver página pública
                <ExternalLink className="size-3" strokeWidth={1.5} />
              </a>
            </div>

            {/* Aviso de guardado */}
            {state.error && (
              <div
                role="alert"
                className="mt-6 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {state.error}
              </div>
            )}
            {state.success && !pending && (
              <div className="mt-6 rounded-md border border-forest/40 bg-forest/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-forest">
                Cambios guardados
              </div>
            )}

            <div className="mt-7">
              {/* Formulario único de la ficha: las secciones que no están
                  visibles se ocultan con CSS para no perder lo que el usuario
                  haya escrito al cambiar de sección. */}
              <form id={FORM_ID} action={formAction} noValidate>
                {/* --- 01 · Ficha del club --- */}
                <div
                  className={cn('space-y-5', activeId !== 'ficha' && 'hidden')}
                >
                  <Panel title="Datos generales">
                    <Grid>
                      <TextField
                        label="Nombre del club"
                        name="name"
                        defaultValue={club.name}
                        required
                        error={errors.name}
                      />
                      <TextField
                        label="Dirección pública"
                        name="slug"
                        prefix="bandeja.es/c/"
                        defaultValue={club.slug}
                        error={errors.slug}
                      />
                      <TextField
                        label="Razón social"
                        name="legalName"
                        defaultValue={club.legalName}
                        placeholder="Nombre fiscal del club"
                        error={errors.legalName}
                      />
                      <TextField
                        label="RFC"
                        name="taxId"
                        defaultValue={club.taxId}
                        placeholder="Ej. ABC123456XYZ"
                        error={errors.taxId}
                      />
                      <TextField
                        label="Año de fundación"
                        name="foundedYear"
                        type="number"
                        defaultValue={club.foundedYear}
                        placeholder="Ej. 2015"
                        error={errors.foundedYear}
                      />
                    </Grid>
                  </Panel>

                  <Panel title="Descripción pública">
                    <Grid>
                      <AreaField
                        label="Descripción / eslogan"
                        name="description"
                        defaultValue={club.description}
                        placeholder="Una o dos líneas que definen al club. Aparece en la página pública."
                        hint="Máx. 280 caracteres"
                        error={errors.description}
                      />
                    </Grid>
                  </Panel>
                </div>

                {/* --- 02 · Contacto y ubicación --- */}
                <div
                  className={cn('space-y-5', activeId !== 'contacto' && 'hidden')}
                >
                  <Panel title="Contacto">
                    <Grid>
                      <TextField
                        label="Email"
                        name="email"
                        type="email"
                        defaultValue={club.email}
                        placeholder="contacto@miclub.mx"
                        error={errors.email}
                      />
                      <TextField
                        label="Teléfono"
                        name="phone"
                        type="tel"
                        defaultValue={club.phone}
                        placeholder="55 1234 5678"
                        error={errors.phone}
                      />
                      <TextField
                        label="Sitio web"
                        name="website"
                        type="url"
                        defaultValue={club.website}
                        placeholder="https://miclub.mx"
                        error={errors.website}
                      />
                      <TextField
                        label="Instagram"
                        name="instagram"
                        prefix="@"
                        defaultValue={club.instagram}
                        placeholder="miclubpadel"
                        error={errors.instagram}
                      />
                    </Grid>
                  </Panel>

                  <Panel title="Ubicación">
                    <Grid>
                      <TextField
                        label="Dirección"
                        name="address"
                        full
                        defaultValue={club.address}
                        placeholder="Calle y número"
                        error={errors.address}
                      />
                      <TextField
                        label="Ciudad"
                        name="city"
                        defaultValue={club.city}
                        placeholder="Ej. Guadalajara"
                        error={errors.city}
                      />
                      <TextField
                        label="Estado"
                        name="state"
                        defaultValue={club.state}
                        placeholder="Ej. Jalisco"
                        error={errors.state}
                      />
                      <TextField
                        label="Código postal"
                        name="postalCode"
                        defaultValue={club.postalCode}
                        placeholder="Ej. 44100"
                        error={errors.postalCode}
                      />
                      <TextField
                        label="País"
                        name="country"
                        defaultValue={club.country ?? 'México'}
                        error={errors.country}
                      />
                      <SelectField
                        label="Zona horaria"
                        name="timezone"
                        defaultValue={club.timezone}
                        options={TIMEZONES.map((tz) => ({
                          value: tz,
                          label: timezoneLabels[tz],
                        }))}
                        error={errors.timezone}
                      />
                    </Grid>
                  </Panel>
                </div>
              </form>

              {/* --- 03 · Horario del club (formulario propio) --- */}
              <div className={cn(activeId !== 'horario' && 'hidden')}>
                <ClubHoursForm hours={hours} />
              </div>

              {/* --- 04 · Pistas (solo lectura) --- */}
              <div className={cn(activeId !== 'pistas' && 'hidden')}>
                <Panel
                  title="Resumen de pistas"
                  action={
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 px-3 text-xs"
                    >
                      <Link href="/dashboard/pistas">
                        <LayoutGrid className="size-3.5" strokeWidth={2} />
                        Gestionar pistas
                      </Link>
                    </Button>
                  }
                >
                  <div className="flex items-end gap-3">
                    <p className="font-serif text-5xl leading-none text-foreground tabular-nums">
                      {courtCount}
                    </p>
                    <p className="pb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {courtCount === 1 ? 'pista registrada' : 'pistas registradas'}
                    </p>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    Las pistas, su superficie, si son cubiertas y su
                    disponibilidad se gestionan en la sección de pistas.
                  </p>
                </Panel>
              </div>

              {/* --- 05 · Estado del club --- */}
              <div className={cn(activeId !== 'estado' && 'hidden')}>
                <EstadoSection isActive={club.isActive} />
              </div>
            </div>

            {/* Pie de guardado: solo en las secciones con el formulario de ficha */}
            {(activeId === 'ficha' || activeId === 'contacto') && (
              <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
                <Button
                  type="submit"
                  form={FORM_ID}
                  className="h-9 rounded-md px-4 text-sm"
                  disabled={pending}
                >
                  {pending ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
