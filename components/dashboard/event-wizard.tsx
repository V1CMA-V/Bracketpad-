'use client'

import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createEvent } from '@/app/dashboard/nuevo-evento/actions'
import type { EventType } from '@/lib/validations/event'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ListOrdered,
  Trophy,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'

/* -------------------------------------------------------------------------- */
/*  Modelo del asistente                                                      */
/* -------------------------------------------------------------------------- */

type EventData = {
  type: EventType | null
  name: string
  startDate: string
  endDate: string
  // Torneo
  location: string
  description: string
  // Liga
  format: 'round_robin' | 'divisions' | 'ladder'
  playKind: 'individual' | 'pairs'
  bestOfSets: number
}

const initialData: EventData = {
  type: null,
  name: '',
  startDate: '',
  endDate: '',
  location: '',
  description: '',
  format: 'round_robin',
  playKind: 'individual',
  bestOfSets: 3,
}

type StepDef = {
  key: string
  title: string
  subtitle: string
  eyebrow: string
  heading: string
  italic: string
  desc: string
}

const typeStep: StepDef = {
  key: 'tipo',
  title: 'Tipo',
  subtitle: 'Torneo o liga',
  eyebrow: 'Paso 01 · Tipo de evento',
  heading: '¿Qué',
  italic: 'vas a crear?',
  desc: 'Elige el tipo de evento. El asistente se adapta para pedirte solo lo necesario.',
}

const torneoSteps: StepDef[] = [
  typeStep,
  {
    key: 'identidad',
    title: 'Identidad',
    subtitle: 'Nombre y fechas',
    eyebrow: 'Paso 02 · Datos del torneo',
    heading: 'La',
    italic: 'identidad.',
    desc: 'Ponle nombre, fechas y ubicación. Es lo que verán los jugadores en la ficha del torneo.',
  },
  {
    key: 'revisar',
    title: 'Revisar',
    subtitle: 'Crear torneo',
    eyebrow: 'Paso 03 · Revisión final',
    heading: 'Todo',
    italic: 'listo.',
    desc: 'Revisa los datos antes de crear el torneo. Podrás editar y añadir categorías después.',
  },
]

const ligaSteps: StepDef[] = [
  typeStep,
  {
    key: 'identidad',
    title: 'Identidad',
    subtitle: 'Nombre y fechas',
    eyebrow: 'Paso 02 · Datos de la liga',
    heading: 'La',
    italic: 'identidad.',
    desc: 'Ponle nombre y fechas a la temporada. Podrás afinar los detalles más adelante.',
  },
  {
    key: 'formato',
    title: 'Formato',
    subtitle: 'Sistema y puntos',
    eyebrow: 'Paso 03 · Formato de competición',
    heading: '¿Cómo',
    italic: 'se compite?',
    desc: 'Define el sistema de la liga y las reglas básicas de puntuación. Se aplican a toda la liga.',
  },
  {
    key: 'revisar',
    title: 'Revisar',
    subtitle: 'Crear liga',
    eyebrow: 'Paso 04 · Revisión final',
    heading: 'Todo',
    italic: 'listo.',
    desc: 'Revisa los datos antes de crear la liga. Podrás editar la configuración después.',
  },
]

/* -------------------------------------------------------------------------- */
/*  Controles reutilizables                                                   */
/* -------------------------------------------------------------------------- */

const inputCls =
  'h-10 w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-md border border-border bg-input/20 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded px-3 py-1.5 text-xs font-medium transition-colors',
            value === o.value
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  hint,
  min = 0,
  max = 999,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  hint?: string
  min?: number
  max?: number
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-serif text-4xl leading-none text-foreground tabular-nums">
          {value}
        </span>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onChange(Math.min(max, value + 1))}
            className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Aumentar ${label}`}
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Reducir ${label}`}
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      </div>
      {hint && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {hint}
        </p>
      )}
    </div>
  )
}

function StepSection({
  num,
  title,
  children,
}: {
  num: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-border pt-8">
      <h3 className="flex items-baseline gap-2">
        <span className="font-mono text-xs text-muted-foreground">{num}</span>
        <span className="font-serif text-xl tracking-tight text-foreground">
          {title}
        </span>
      </h3>
      <div className="mt-5">{children}</div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Pasos                                                                     */
/* -------------------------------------------------------------------------- */

type StepProps = {
  data: EventData
  update: (patch: Partial<EventData>) => void
}

const eventTypes = [
  {
    value: 'torneo' as const,
    icon: Trophy,
    title: 'Torneo',
    desc: 'Cuadro por eliminación o grupos, con categorías y parejas. Ideal para un fin de semana.',
  },
  {
    value: 'liga' as const,
    icon: ListOrdered,
    title: 'Liga',
    desc: 'Temporada con jornadas y clasificación acumulada. Round robin, divisiones o escalera.',
  },
]

function StepTipo({ data, update }: StepProps) {
  return (
    <div className="space-y-8">
      <StepSection num="1.1" title="Tipo de evento">
        <div className="grid gap-4 sm:grid-cols-2">
          {eventTypes.map((t) => {
            const active = data.type === t.value
            const Icon = t.icon
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => update({ type: t.value })}
                className={cn(
                  'relative flex flex-col gap-4 rounded-xl border p-5 text-left transition-colors',
                  active
                    ? 'border-foreground bg-card'
                    : 'border-border hover:border-foreground/30',
                )}
              >
                {active && (
                  <CheckCircle2 className="absolute right-4 top-4 size-4 text-forest" />
                )}
                <span
                  className={cn(
                    'flex size-11 items-center justify-center rounded-lg',
                    active
                      ? 'bg-forest text-cream'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.5} />
                </span>
                <span>
                  <span className="block text-sm text-foreground">
                    {t.title}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {t.desc}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </StepSection>
    </div>
  )
}

function StepIdentidad({ data, update }: StepProps) {
  const isTorneo = data.type === 'torneo'
  return (
    <div className="space-y-8">
      <StepSection num="2.1" title="Nombre">
        <Field
          label={isTorneo ? 'Nombre del torneo' : 'Nombre de la liga'}
          hint="Lo verán los jugadores. Genera el enlace público del evento."
        >
          <input
            className={inputCls}
            placeholder={
              isTorneo ? 'Ej. Open de Verano 2026' : 'Ej. Liga Primavera 2026'
            }
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </Field>
      </StepSection>

      <StepSection num="2.2" title="Fechas">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Inicio">
            <input
              type="date"
              className={inputCls}
              value={data.startDate}
              onChange={(e) => update({ startDate: e.target.value })}
            />
          </Field>
          <Field label="Fin">
            <input
              type="date"
              className={inputCls}
              value={data.endDate}
              onChange={(e) => update({ endDate: e.target.value })}
            />
          </Field>
        </div>
      </StepSection>

      {isTorneo && (
        <StepSection num="2.3" title="Ubicación y descripción">
          <div className="space-y-6">
            <Field label="Ubicación" hint="Opcional. Sede o dirección.">
              <input
                className={inputCls}
                placeholder="Ej. Club Marítimo, Pista Central"
                value={data.location}
                onChange={(e) => update({ location: e.target.value })}
              />
            </Field>
            <Field label="Descripción" hint="Opcional. Aparecerá en la ficha.">
              <textarea
                className={cn(inputCls, 'h-auto min-h-24 py-2.5')}
                placeholder="Cuéntales a las parejas qué hace especial a este torneo..."
                value={data.description}
                onChange={(e) => update({ description: e.target.value })}
              />
            </Field>
          </div>
        </StepSection>
      )}
    </div>
  )
}

const ligaFormats = [
  {
    value: 'round_robin' as const,
    title: 'Round robin',
    desc: 'Todos contra todos · una clasificación.',
  },
  {
    value: 'divisions' as const,
    title: 'Divisiones',
    desc: 'Grupos por nivel con ascensos y descensos.',
  },
  {
    value: 'ladder' as const,
    title: 'Escalera',
    desc: 'Retos entre jugadores · ranking dinámico.',
  },
]

const ligaPlayKinds = [
  {
    value: 'individual' as const,
    title: 'Individual',
    desc: 'Jugadores sueltos. Cada jornada se forman grupos de 4 con parejas rotativas.',
  },
  {
    value: 'pairs' as const,
    title: 'Parejas',
    desc: 'Parejas fijas inscritas que compiten juntas toda la temporada.',
  },
]

function StepFormato({ data, update }: StepProps) {
  return (
    <div className="space-y-8">
      <StepSection num="3.1" title="Modalidad">
        <div className="grid gap-4 sm:grid-cols-2">
          {ligaPlayKinds.map((k) => {
            const active = data.playKind === k.value
            return (
              <button
                key={k.value}
                type="button"
                onClick={() => update({ playKind: k.value })}
                className={cn(
                  'relative flex flex-col gap-2 rounded-xl border p-5 text-left transition-colors',
                  active
                    ? 'border-foreground bg-card'
                    : 'border-border hover:border-foreground/30',
                )}
              >
                {active && (
                  <CheckCircle2 className="absolute right-4 top-4 size-4 text-forest" />
                )}
                <span className="text-sm text-foreground">{k.title}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {k.desc}
                </span>
              </button>
            )
          })}
        </div>
      </StepSection>

      <StepSection num="3.2" title="Sistema de competición">
        <div className="grid gap-4 sm:grid-cols-3">
          {ligaFormats.map((f) => {
            const active = data.format === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => update({ format: f.value })}
                className={cn(
                  'relative flex flex-col gap-2 rounded-xl border p-5 text-left transition-colors',
                  active
                    ? 'border-foreground bg-card'
                    : 'border-border hover:border-foreground/30',
                )}
              >
                {active && (
                  <CheckCircle2 className="absolute right-4 top-4 size-4 text-forest" />
                )}
                <span className="text-sm text-foreground">{f.title}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {f.desc}
                </span>
              </button>
            )
          })}
        </div>
      </StepSection>

      <StepSection num="3.3" title="Sets y clasificación">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Sets a ganar (mejor de)"
            value={data.bestOfSets}
            onChange={(v) => update({ bestOfSets: v })}
            min={1}
            max={5}
            hint="Sets por partido"
          />
          <div className="rounded-xl border-l-2 border-ochre bg-card p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ochre">
              Cómo se sube y baja de cancha
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              La clasificación se decide por{' '}
              <em className="italic text-foreground">sets ganados</em>. En cada
              cancha de 4, quien gana más sets{' '}
              <span className="text-foreground">sube</span> (en la cancha más
              alta se mantiene) y quien gana menos{' '}
              <span className="text-foreground">baja</span>; los otros dos se
              mantienen para la siguiente jornada.
            </p>
          </div>
        </div>
      </StepSection>
    </div>
  )
}

function StepRevisar({ data }: StepProps) {
  const dateRange =
    data.startDate && data.endDate
      ? `${data.startDate} → ${data.endDate}`
      : data.startDate || 'Sin fechas'

  const rows =
    data.type === 'liga'
      ? [
          { label: 'Tipo', value: 'Liga' },
          { label: 'Nombre', value: data.name || 'Sin definir' },
          { label: 'Fechas', value: dateRange },
          {
            label: 'Modalidad',
            value:
              ligaPlayKinds.find((k) => k.value === data.playKind)?.title ?? '—',
          },
          {
            label: 'Formato',
            value:
              ligaFormats.find((f) => f.value === data.format)?.title ?? '—',
          },
          { label: 'Sets por partido', value: `Al mejor de ${data.bestOfSets}` },
          { label: 'Clasificación', value: 'Por sets ganados' },
        ]
      : [
          { label: 'Tipo', value: 'Torneo' },
          { label: 'Nombre', value: data.name || 'Sin definir' },
          { label: 'Fechas', value: dateRange },
          { label: 'Ubicación', value: data.location || 'Sin definir' },
        ]

  return (
    <div className="space-y-8">
      <StepSection num={data.type === 'liga' ? '4.1' : '3.1'} title="Resumen">
        <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {row.label}
              </dt>
              <dd className="text-sm text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      </StepSection>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Stepper lateral                                                           */
/* -------------------------------------------------------------------------- */

function Stepper({
  steps,
  current,
  completed,
  onSelect,
}: {
  steps: StepDef[]
  current: number
  completed: number[]
  onSelect: (i: number) => void
}) {
  return (
    <ol>
      {steps.map((step, i) => {
        const isCompleted = completed.includes(i)
        const isCurrent = i === current
        const isLast = i === steps.length - 1
        return (
          <li key={step.key}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              className="flex w-full items-stretch gap-3 text-left"
            >
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] transition-colors',
                    isCompleted && 'bg-forest text-cream',
                    isCurrent && 'bg-ink text-cream',
                    !isCompleted &&
                      !isCurrent &&
                      'border border-border text-muted-foreground',
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : (
                    String(i + 1).padStart(2, '0')
                  )}
                </span>
                {!isLast && (
                  <span
                    className={cn(
                      'my-1 w-px flex-1',
                      isCompleted ? 'bg-forest/40' : 'bg-border',
                    )}
                  />
                )}
              </div>
              <div className={cn('pb-7', isLast && 'pb-0')}>
                <p
                  className={cn(
                    'text-sm transition-colors',
                    isCurrent || isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {step.title}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {step.subtitle}
                </p>
              </div>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/* -------------------------------------------------------------------------- */
/*  Asistente                                                                 */
/* -------------------------------------------------------------------------- */

export function EventWizard() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [completed, setCompleted] = useState<number[]>([])
  const [data, setData] = useState<EventData>(initialData)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const steps = useMemo(
    () => (data.type === 'liga' ? ligaSteps : torneoSteps),
    [data.type],
  )

  const update = (patch: Partial<EventData>) =>
    setData((d) => ({ ...d, ...patch }))

  const isLast = current === steps.length - 1
  const step = steps[current]

  const goTo = (i: number) => {
    setCurrent(i)
    window.scrollTo({ top: 0 })
  }

  // Validación ligera por paso para no avanzar con datos vacíos.
  const canContinue = (() => {
    if (step.key === 'tipo') return data.type !== null
    if (step.key === 'identidad') return data.name.trim().length >= 2
    return true
  })()

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const payload =
        data.type === 'liga'
          ? {
              type: 'liga' as const,
              name: data.name,
              startDate: data.startDate || undefined,
              endDate: data.endDate || undefined,
              format: data.format,
              playKind: data.playKind,
              bestOfSets: data.bestOfSets,
            }
          : {
              type: 'torneo' as const,
              name: data.name,
              startDate: data.startDate || undefined,
              endDate: data.endDate || undefined,
              location: data.location || undefined,
              description: data.description || undefined,
            }

      const result = await createEvent(payload)
      // Si todo va bien la acción redirige; aquí solo llegamos con error.
      if (result?.error) {
        setError(result.error)
      } else if (result?.fieldErrors) {
        const first = Object.values(result.fieldErrors)[0]?.[0]
        setError(first ?? 'Revisa los datos del formulario.')
      }
    })
  }

  const handleContinue = () => {
    if (!canContinue) return
    setCompleted((c) => (c.includes(current) ? c : [...c, current]))
    if (isLast) {
      submit()
      return
    }
    goTo(current + 1)
  }

  const createLabel = data.type === 'liga' ? 'Crear liga' : 'Crear torneo'
  const stepProps: StepProps = { data, update }

  return (
    <>
      <DashboardTopbar>
        <Button
          variant="outline"
          className="h-9 rounded-md px-4 text-sm"
          onClick={() => router.push('/dashboard/torneos')}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button
          className="h-9 gap-1.5 rounded-md px-4 text-sm"
          onClick={handleContinue}
          disabled={!canContinue || pending}
        >
          {isLast ? (pending ? 'Creando…' : createLabel) : 'Continuar'}
          <ArrowRight className="size-4" strokeWidth={2} />
        </Button>
      </DashboardTopbar>

      <div className="mx-auto max-w-[1600px] px-8 py-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[248px_minmax(0,1fr)]">
          {/* ---- Navegación de pasos ---- */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Nuevo evento · {steps.length} pasos
            </p>
            <Stepper
              steps={steps}
              current={current}
              completed={completed}
              onSelect={goTo}
            />
          </aside>

          {/* ---- Contenido del paso ---- */}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {step.eyebrow}
            </p>
            <h1 className="mt-3 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {step.heading} <em className="italic">{step.italic}</em>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {step.desc}
            </p>

            <div className="mt-10">
              {step.key === 'tipo' && <StepTipo {...stepProps} />}
              {step.key === 'identidad' && <StepIdentidad {...stepProps} />}
              {step.key === 'formato' && <StepFormato {...stepProps} />}
              {step.key === 'revisar' && <StepRevisar {...stepProps} />}
            </div>

            {error && (
              <div
                role="alert"
                className="mt-8 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* Acciones inferiores */}
            <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
              <Button
                variant="ghost"
                className="h-9 rounded-md px-3 text-sm text-muted-foreground"
                disabled={current === 0 || pending}
                onClick={() => goTo(current - 1)}
              >
                ← Atrás
              </Button>
              <Button
                className="h-9 gap-1.5 rounded-md px-4 text-sm"
                onClick={handleContinue}
                disabled={!canContinue || pending}
              >
                {isLast
                  ? pending
                    ? 'Creando…'
                    : createLabel
                  : `Continuar a ${steps[current + 1].title}`}
                <ArrowRight className="size-4" strokeWidth={2} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
