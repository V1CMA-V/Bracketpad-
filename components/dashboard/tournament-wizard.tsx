'use client'

import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GitFork,
  LayoutGrid,
  Share2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

/* -------------------------------------------------------------------------- */
/*  Modelo del asistente                                                      */
/* -------------------------------------------------------------------------- */

type WizardData = {
  // Paso 1 — Identidad
  name: string
  edition: 'open' | 'liga' | 'insignia' | 'express'
  startDate: string
  endDate: string
  description: string
  // Paso 2 — Categorías
  categories: string[]
  // Paso 3 — Formato
  system: 'grupos' | 'eliminacion' | 'roundrobin'
  setsToWin: '3' | '5'
  gamesPerSet: '6' | '4'
  tiebreak: 'tb7' | 'none'
  decidingSet: 'super10' | 'normal'
  goldenPoint: 'on' | 'adv'
  serve: 'fep' | 'libre'
  pairsPerGroup: number
  advancePerGroup: number
  timeBetweenRounds: number
  // Paso 4 — Inscripción
  fee: number
  capacity: number
  wildcards: number
  openDate: string
  closeDate: string
  payments: string[]
  // Paso 5 — Publicar
  visibility: 'publico' | 'privado'
  fepOfficial: boolean
}

const initialData: WizardData = {
  name: '',
  edition: 'open',
  startDate: '',
  endDate: '',
  description: '',
  categories: ['M-1ª', 'M-2ª', 'F-1ª'],
  system: 'grupos',
  setsToWin: '3',
  gamesPerSet: '6',
  tiebreak: 'tb7',
  decidingSet: 'super10',
  goldenPoint: 'on',
  serve: 'fep',
  pairsPerGroup: 4,
  advancePerGroup: 2,
  timeBetweenRounds: 48,
  fee: 40,
  capacity: 64,
  wildcards: 4,
  openDate: '',
  closeDate: '',
  payments: ['tarjeta', 'transferencia'],
  visibility: 'publico',
  fepOfficial: true,
}

const steps = [
  { title: 'Identidad', subtitle: 'Nombre y fechas' },
  { title: 'Categorías', subtitle: 'Niveles y géneros' },
  { title: 'Formato', subtitle: 'Cuadro y reglas' },
  { title: 'Inscripción', subtitle: 'Precio y cupo' },
  { title: 'Publicar', subtitle: 'Revisar y enviar' },
]

const stepHeader = [
  {
    eyebrow: 'Paso 01 · Datos del torneo',
    title: 'La',
    italic: 'identidad.',
    desc: 'Ponle nombre, formato y fechas. Es lo que verán los jugadores cuando se abra la inscripción.',
  },
  {
    eyebrow: 'Paso 02 · Cuadro de categorías',
    title: 'Las',
    italic: 'categorías.',
    desc: 'Elige qué niveles y géneros tendrán cuadro propio. Cada categoría genera su propio bracket.',
  },
  {
    eyebrow: 'Paso 03 · Formato del cuadro',
    title: '¿Cómo',
    italic: 'se juega?',
    desc: 'Define el sistema de competición, las reglas de scoring y los criterios de desempate. Estos ajustes se aplican a todas las categorías; podrás afinarlos por categoría más adelante.',
  },
  {
    eyebrow: 'Paso 04 · Inscripción y cupo',
    title: 'Precio',
    italic: 'y plazas.',
    desc: 'Fija la cuota, el cupo de parejas y cómo quieres cobrar las inscripciones.',
  },
  {
    eyebrow: 'Paso 05 · Revisión final',
    title: 'Todo',
    italic: 'listo.',
    desc: 'Revisa la configuración antes de publicar. Podrás editar cualquier apartado después.',
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

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value]
}

/* -------------------------------------------------------------------------- */
/*  Pasos                                                                     */
/* -------------------------------------------------------------------------- */

type StepProps = {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}

function StepIdentidad({ data, update }: StepProps) {
  return (
    <div className="space-y-8">
      <StepSection num="1.1" title="Nombre y formato">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Field label="Nombre del torneo">
            <input
              className={inputCls}
              placeholder="Ej. Open de Verano 2026"
              value={data.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </Field>
          <Field label="Formato">
            <Segmented
              value={data.edition}
              onChange={(v) => update({ edition: v })}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'liga', label: 'Liga' },
                { value: 'insignia', label: 'Insignia' },
                { value: 'express', label: 'Express' },
              ]}
            />
          </Field>
        </div>
      </StepSection>

      <StepSection num="1.2" title="Fechas de disputa">
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

      <StepSection num="1.3" title="Descripción">
        <Field
          label="Texto público"
          hint="Aparecerá en la ficha del torneo. Opcional."
        >
          <textarea
            className={cn(inputCls, 'h-auto min-h-24 py-2.5')}
            placeholder="Cuéntales a las parejas qué hace especial a este torneo..."
            value={data.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </Field>
      </StepSection>
    </div>
  )
}

const generos = [
  { key: 'M', label: 'Masculina' },
  { key: 'F', label: 'Femenina' },
  { key: 'X', label: 'Mixta' },
]
const niveles = ['1ª', '2ª', '3ª', '4ª']

function StepCategorias({ data, update }: StepProps) {
  return (
    <div className="space-y-8">
      <StepSection num="2.1" title="Categorías del cuadro">
        <p className="-mt-2 mb-5 text-sm text-muted-foreground">
          {data.categories.length} categorías seleccionadas — cada una tendrá su
          propio cuadro.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {generos.map((g) => (
            <div key={g.key} className="rounded-xl border border-border bg-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {g.label}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {niveles.map((n) => {
                  const id = `${g.key}-${n}`
                  const active = data.categories.includes(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        update({ categories: toggle(data.categories, id) })
                      }
                      className={cn(
                        'rounded-md border px-3 py-1.5 font-mono text-xs transition-colors',
                        active
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border text-muted-foreground hover:border-foreground/30',
                      )}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </StepSection>
    </div>
  )
}

const systems = [
  {
    value: 'grupos' as const,
    icon: LayoutGrid,
    title: 'Grupos + eliminación',
    desc: 'Fase de grupos (round robin) y cuadro final.',
  },
  {
    value: 'eliminacion' as const,
    icon: GitFork,
    title: 'Eliminación directa',
    desc: 'Cuadro clásico con consolación opcional.',
  },
  {
    value: 'roundrobin' as const,
    icon: Share2,
    title: 'Round robin',
    desc: 'Todos contra todos · liguilla.',
  },
]

const scoringRows: {
  label: string
  field: keyof WizardData
  options: { value: string; label: string }[]
  note?: string
}[][] = [
  [
    {
      label: 'Sets a ganar',
      field: 'setsToWin',
      options: [
        { value: '3', label: 'Al mejor de 3' },
        { value: '5', label: 'Al mejor de 5' },
      ],
    },
    {
      label: 'Juegos por set',
      field: 'gamesPerSet',
      options: [
        { value: '6', label: '6 juegos' },
        { value: '4', label: '4 juegos (pro-set)' },
      ],
    },
  ],
  [
    {
      label: 'Tie-break',
      field: 'tiebreak',
      options: [
        { value: 'tb7', label: 'Tiebreak 7p · a 6-6' },
        { value: 'none', label: 'Sin tiebreak' },
      ],
    },
    {
      label: 'Tiebreak set decisivo',
      field: 'decidingSet',
      options: [
        { value: 'super10', label: 'Super tiebreak 10p' },
        { value: 'normal', label: 'Set normal' },
      ],
    },
  ],
  [
    {
      label: 'Punto de oro',
      field: 'goldenPoint',
      options: [
        { value: 'on', label: 'Activado · 40-40' },
        { value: 'adv', label: 'Ventajas' },
      ],
      note: 'Lo elige la pareja al resto.',
    },
    {
      label: 'Saque',
      field: 'serve',
      options: [
        { value: 'fep', label: 'Reglamento FEP' },
        { value: 'libre', label: 'Lateral libre' },
      ],
    },
  ],
]

function StepFormato({ data, update }: StepProps) {
  return (
    <div className="space-y-8">
      {/* 3.1 Sistema de competición */}
      <StepSection num="3.1" title="Sistema de competición">
        <div className="grid gap-4 sm:grid-cols-3">
          {systems.map((s) => {
            const active = data.system === s.value
            const Icon = s.icon
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => update({ system: s.value })}
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
                    {s.title}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {s.desc}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </StepSection>

      {/* 3.2 Sistema de puntuación */}
      <StepSection num="3.2" title="Sistema de puntuación">
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {scoringRows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0"
            >
              {row.map((cell) => (
                <div key={cell.label} className="p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {cell.label}
                  </p>
                  <div className="mt-2.5">
                    <Segmented
                      value={data[cell.field] as string}
                      onChange={(v) =>
                        update({ [cell.field]: v } as Partial<WizardData>)
                      }
                      options={cell.options}
                    />
                  </div>
                  {cell.note && (
                    <p className="mt-2 text-xs italic text-muted-foreground">
                      {cell.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </StepSection>

      {/* 3.3 Configuración de grupos */}
      <StepSection num="3.3" title="Configuración de grupos">
        {data.system === 'eliminacion' ? (
          <p className="-mt-2 text-sm text-muted-foreground">
            La eliminación directa no usa fase de grupos. Cambia el sistema en
            3.1 para configurar grupos.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField
              label="Parejas por grupo"
              value={data.pairsPerGroup}
              onChange={(v) => update({ pairsPerGroup: v })}
              min={3}
              max={8}
              hint="Round robin interno"
            />
            <NumberField
              label="Pasan a cuadro"
              value={data.advancePerGroup}
              onChange={(v) => update({ advancePerGroup: v })}
              min={1}
              max={data.pairsPerGroup}
              hint="Por grupo"
            />
            <NumberField
              label="Tiempo entre rondas"
              value={data.timeBetweenRounds}
              onChange={(v) => update({ timeBetweenRounds: v })}
              min={0}
              max={240}
              hint="Minutos"
            />
          </div>
        )}
      </StepSection>
    </div>
  )
}

const paymentMethods = [
  { value: 'tarjeta', label: 'Tarjeta', desc: 'Pago online al inscribirse.' },
  { value: 'transferencia', label: 'Transferencia', desc: 'Confirmación manual.' },
  { value: 'efectivo', label: 'Efectivo en club', desc: 'Se cobra en recepción.' },
]

function StepInscripcion({ data, update }: StepProps) {
  return (
    <div className="space-y-8">
      <StepSection num="4.1" title="Cuota y cupo">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Cuota por pareja"
            value={data.fee}
            onChange={(v) => update({ fee: v })}
            min={0}
            max={500}
            hint="Euros"
          />
          <NumberField
            label="Cupo máximo"
            value={data.capacity}
            onChange={(v) => update({ capacity: v })}
            min={4}
            max={512}
            hint="Parejas"
          />
          <NumberField
            label="Plazas wildcard"
            value={data.wildcards}
            onChange={(v) => update({ wildcards: v })}
            min={0}
            max={32}
            hint="Invitación directa"
          />
        </div>
      </StepSection>

      <StepSection num="4.2" title="Calendario de inscripción">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Apertura de inscripción">
            <input
              type="date"
              className={inputCls}
              value={data.openDate}
              onChange={(e) => update({ openDate: e.target.value })}
            />
          </Field>
          <Field label="Cierre de inscripción">
            <input
              type="date"
              className={inputCls}
              value={data.closeDate}
              onChange={(e) => update({ closeDate: e.target.value })}
            />
          </Field>
        </div>
      </StepSection>

      <StepSection num="4.3" title="Métodos de pago">
        <div className="grid gap-4 sm:grid-cols-3">
          {paymentMethods.map((m) => {
            const active = data.payments.includes(m.value)
            return (
              <button
                key={m.value}
                type="button"
                onClick={() =>
                  update({ payments: toggle(data.payments, m.value) })
                }
                className={cn(
                  'relative rounded-xl border p-4 text-left transition-colors',
                  active
                    ? 'border-foreground bg-card'
                    : 'border-border hover:border-foreground/30',
                )}
              >
                {active && (
                  <CheckCircle2 className="absolute right-4 top-4 size-4 text-forest" />
                )}
                <p className="text-sm text-foreground">{m.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
              </button>
            )
          })}
        </div>
      </StepSection>
    </div>
  )
}

function StepPublicar({ data, update }: StepProps) {
  const editionLabel = { open: 'Open', liga: 'Liga', insignia: 'Insignia', express: 'Express' }[data.edition]
  const systemLabel = systems.find((s) => s.value === data.system)?.title ?? ''
  const reviewRows = [
    { label: 'Nombre', value: data.name || 'Sin definir' },
    { label: 'Formato', value: editionLabel },
    {
      label: 'Fechas',
      value:
        data.startDate && data.endDate
          ? `${data.startDate} → ${data.endDate}`
          : 'Sin fechas',
    },
    { label: 'Categorías', value: `${data.categories.length} seleccionadas` },
    { label: 'Sistema de juego', value: systemLabel },
    {
      label: 'Puntuación',
      value: `Al mejor de ${data.setsToWin} · ${
        data.goldenPoint === 'on' ? 'punto de oro' : 'ventajas'
      }`,
    },
    { label: 'Cuota', value: `€${data.fee} por pareja` },
    { label: 'Cupo', value: `${data.capacity} parejas` },
  ]

  return (
    <div className="space-y-8">
      <StepSection num="5.1" title="Resumen de la configuración">
        <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {reviewRows.map((row) => (
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

      <StepSection num="5.2" title="Visibilidad y publicación">
        <Field label="Quién puede ver el torneo">
          <Segmented
            value={data.visibility}
            onChange={(v) => update({ visibility: v })}
            options={[
              { value: 'publico', label: 'Público' },
              { value: 'privado', label: 'Privado · solo enlace' },
            ]}
          />
        </Field>
        <button
          type="button"
          onClick={() => update({ fepOfficial: !data.fepOfficial })}
          className="mt-5 flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-foreground/30"
        >
          <span
            className={cn(
              'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
              data.fepOfficial
                ? 'border-forest bg-forest text-cream'
                : 'border-border',
            )}
          >
            {data.fepOfficial && <Check className="size-3.5" strokeWidth={3} />}
          </span>
          <span>
            <span className="block text-sm text-foreground">
              Activar resultado oficial FEP
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Los resultados se sincronizan con la federación al cerrar cada
              partido.
            </span>
          </span>
        </button>
      </StepSection>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Stepper lateral                                                           */
/* -------------------------------------------------------------------------- */

function Stepper({
  current,
  completed,
  onSelect,
}: {
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
          <li key={step.title}>
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

export function TournamentWizard() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [completed, setCompleted] = useState<number[]>([])
  const [data, setData] = useState<WizardData>(initialData)

  const update = (patch: Partial<WizardData>) =>
    setData((d) => ({ ...d, ...patch }))

  const isLast = current === steps.length - 1
  const header = stepHeader[current]

  const goTo = (i: number) => {
    setCurrent(i)
    window.scrollTo({ top: 0 })
  }

  const handleContinue = () => {
    setCompleted((c) => (c.includes(current) ? c : [...c, current]))
    if (isLast) {
      router.push('/dashboard/torneos')
      return
    }
    goTo(current + 1)
  }

  const stepProps: StepProps = { data, update }

  return (
    <>
      <DashboardTopbar>
        <Button
          variant="outline"
          className="h-9 rounded-md px-4 text-sm"
          onClick={() => router.push('/dashboard/torneos')}
        >
          Guardar borrador
        </Button>
        <Button
          className="h-9 gap-1.5 rounded-md px-4 text-sm"
          onClick={handleContinue}
        >
          {isLast ? 'Publicar torneo' : 'Continuar'}
          <ArrowRight className="size-4" strokeWidth={2} />
        </Button>
      </DashboardTopbar>

      <div className="mx-auto max-w-[1600px] px-8 py-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[248px_minmax(0,1fr)]">
          {/* ---- Navegación de pasos ---- */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Asistente · {steps.length} pasos
            </p>
            <Stepper current={current} completed={completed} onSelect={goTo} />

            <div className="mt-8 rounded-lg border-l-2 border-ochre bg-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ochre">
                Nota
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Para torneos federados, recuerda activar{' '}
                <em className="italic text-foreground">resultado oficial FEP</em>{' '}
                al final del asistente.
              </p>
            </div>
          </aside>

          {/* ---- Contenido del paso ---- */}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {header.eyebrow}
            </p>
            <h1 className="mt-3 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {header.title}{' '}
              <em className="italic">{header.italic}</em>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {header.desc}
            </p>

            <div className="mt-10">
              {current === 0 && <StepIdentidad {...stepProps} />}
              {current === 1 && <StepCategorias {...stepProps} />}
              {current === 2 && <StepFormato {...stepProps} />}
              {current === 3 && <StepInscripcion {...stepProps} />}
              {current === 4 && <StepPublicar {...stepProps} />}
            </div>

            {/* Acciones inferiores */}
            <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
              <Button
                variant="ghost"
                className="h-9 rounded-md px-3 text-sm text-muted-foreground"
                disabled={current === 0}
                onClick={() => goTo(current - 1)}
              >
                ← Atrás
              </Button>
              <Button
                className="h-9 gap-1.5 rounded-md px-4 text-sm"
                onClick={handleContinue}
              >
                {isLast ? 'Publicar torneo' : `Continuar a ${steps[current + 1].title}`}
                <ArrowRight className="size-4" strokeWidth={2} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
