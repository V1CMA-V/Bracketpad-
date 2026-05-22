'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Camera,
  Check,
  Download,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

/* -------------------------------------------------------------------------- */
/*  Modelo                                                                    */
/* -------------------------------------------------------------------------- */

type SectionId =
  | 'perfil'
  | 'juego'
  | 'cuenta'
  | 'notificaciones'
  | 'privacidad'
  | 'datos'

type Section = {
  id: SectionId
  n: string
  label: string
  eyebrow: string
  title: React.ReactNode
  lead: string
  pending?: number
}

const sections: Section[] = [
  {
    id: 'perfil',
    n: '01',
    label: 'Perfil público',
    eyebrow: 'Sección 01 · Perfil público',
    title: (
      <>
        Tu ficha <em className="italic">de jugador.</em>
      </>
    ),
    lead: 'Los datos que ven los demás cuando entran en tu perfil de Bandeja. Cámbialos cuando quieras: se actualizan al instante.',
  },
  {
    id: 'juego',
    n: '02',
    label: 'Datos de juego',
    eyebrow: 'Sección 02 · Datos de juego',
    title: (
      <>
        Cómo <em className="italic">juegas.</em>
      </>
    ),
    lead: 'Mano, posición y categoría. Bandeja los usa para emparejarte en torneos y calcular tu ranking.',
  },
  {
    id: 'cuenta',
    n: '03',
    label: 'Cuenta y acceso',
    eyebrow: 'Sección 03 · Cuenta y acceso',
    title: (
      <>
        Acceso y <em className="italic">seguridad.</em>
      </>
    ),
    lead: 'Correo, teléfono y contraseña. Mantén estos datos al día para no perder el acceso a tu cuenta.',
  },
  {
    id: 'notificaciones',
    n: '04',
    label: 'Notificaciones',
    eyebrow: 'Sección 04 · Notificaciones',
    title: (
      <>
        Lo que te <em className="italic">avisamos.</em>
      </>
    ),
    lead: 'Elige qué quieres recibir y por dónde. Puedes silenciar todo lo que no te interese.',
  },
  {
    id: 'privacidad',
    n: '05',
    label: 'Privacidad',
    eyebrow: 'Sección 05 · Privacidad',
    title: (
      <>
        Quién ve <em className="italic">tu ficha.</em>
      </>
    ),
    lead: 'Decide qué partes de tu perfil son públicas y quién puede seguirte o contactarte.',
  },
  {
    id: 'datos',
    n: '06',
    label: 'Datos y cuenta',
    eyebrow: 'Sección 06 · Datos y cuenta',
    title: (
      <>
        Exporta y <em className="italic">cierra.</em>
      </>
    ),
    lead: 'Descarga tu historial deportivo o cierra la cuenta. Tus datos son tuyos.',
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
  children,
}: {
  label: string
  hint?: string
  full?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', full && 'sm:col-span-2')}>
      <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && (
        <p className="font-mono text-[10px] tracking-wide text-muted-foreground/70">
          {hint}
        </p>
      )}
    </div>
  )
}

function TextField({
  label,
  defaultValue,
  placeholder,
  hint,
  prefix,
  type = 'text',
  full,
}: {
  label: string
  defaultValue?: string
  placeholder?: string
  hint?: string
  prefix?: string
  type?: string
  full?: boolean
}) {
  return (
    <Field label={label} hint={hint} full={full}>
      {prefix ? (
        <div className="flex h-10 items-center rounded-md border border-input bg-background pl-3 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30">
          <span className="font-mono text-xs text-muted-foreground">
            {prefix}
          </span>
          <input
            type={type}
            defaultValue={defaultValue}
            placeholder={placeholder}
            className="h-full flex-1 bg-transparent px-1 text-sm text-foreground outline-none"
          />
        </div>
      ) : (
        <input
          type={type}
          className={inputCls}
          defaultValue={defaultValue}
          placeholder={placeholder}
        />
      )}
    </Field>
  )
}

function AreaField({
  label,
  defaultValue,
  placeholder,
  hint,
}: {
  label: string
  defaultValue?: string
  placeholder?: string
  hint?: string
}) {
  return (
    <Field label={label} hint={hint} full>
      <textarea
        className={areaCls}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </Field>
  )
}

function Segmented({
  label,
  options,
  defaultValue,
  hint,
}: {
  label: string
  options: string[]
  defaultValue?: string
  hint?: string
}) {
  const [val, setVal] = useState(defaultValue ?? options[0])
  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-1 rounded-md border border-border bg-muted/40 p-1">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setVal(o)}
            className={cn(
              'flex-1 rounded px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors',
              val === o
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </Field>
  )
}

function Toggle({
  label,
  hint,
  defaultOn,
}: {
  label: string
  hint?: string
  defaultOn?: boolean
}) {
  const [on, setOn] = useState(Boolean(defaultOn))
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-background px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {hint && (
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn((v) => !v)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          on ? 'bg-forest' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-4 rounded-full bg-cream shadow-sm transition-transform',
            on ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
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
/*  Contenido por sección                                                     */
/* -------------------------------------------------------------------------- */

function PerfilSection() {
  return (
    <div className="space-y-5">
      <Panel title="Foto de perfil">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <span className="flex size-20 items-center justify-center rounded-full bg-ink font-serif text-3xl text-cream">
              IP
            </span>
            <span className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-terracotta text-cream ring-2 ring-card">
              <Camera className="size-3.5" strokeWidth={1.5} />
            </span>
          </div>
          <div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                Subir foto
              </Button>
              <Button size="sm" variant="ghost" className="h-8 px-3 text-xs">
                Quitar
              </Button>
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              JPG o PNG · mínimo 256 px · máx 2 MB
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Identidad">
        <Grid>
          <TextField label="Nombre" defaultValue="Iván" />
          <TextField label="Apellidos" defaultValue="Puig Andreu" />
          <TextField
            label="Alias o apodo"
            defaultValue="El Muro"
            hint="Aparece junto a tu nombre en torneos y rankings"
          />
          <TextField
            label="URL pública"
            prefix="bandeja.es/j/"
            defaultValue="ivan-puig"
          />
          <TextField label="Ciudad" defaultValue="Valencia" />
          <TextField label="Fecha de nacimiento" type="date" defaultValue="1999-04-12" />
        </Grid>
      </Panel>

      <Panel title="Sobre ti">
        <AreaField
          label="Biografía"
          defaultValue="Defensa incansable y bandeja quirúrgica. Tres temporadas firmando los puntos largos en pista central del Olivar."
          hint="Máximo 240 caracteres · se muestra en tu ficha pública"
        />
      </Panel>
    </div>
  )
}

function JuegoSection() {
  return (
    <div className="space-y-5">
      <Panel title="Perfil de juego">
        <Grid>
          <Segmented
            label="Mano dominante"
            options={['Diestro', 'Zurdo']}
            defaultValue="Diestro"
          />
          <Segmented
            label="Posición preferida"
            options={['Drive', 'Revés', 'Indistinta']}
            defaultValue="Revés"
          />
          <Segmented
            label="Categoría"
            options={['1ª', '2ª', '3ª', '4ª']}
            defaultValue="1ª"
          />
          <TextField
            label="Años jugando"
            defaultValue="9"
            hint="Desde 2017"
          />
        </Grid>
      </Panel>

      <Panel title="Club y pareja">
        <Grid>
          <TextField label="Club actual" defaultValue="Club Marítimo del Olivar" />
          <TextField label="Compañero habitual" defaultValue="Diego Marín" />
        </Grid>
      </Panel>

      <Panel title="Disponibilidad">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle
            label="Disponible para torneos"
            hint="Los clubes pueden invitarte"
            defaultOn
          />
          <Toggle
            label="Busco pareja"
            hint="Apareces en el tablón de parejas"
          />
        </div>
      </Panel>
    </div>
  )
}

function CuentaSection() {
  return (
    <div className="space-y-5">
      <Panel
        title="Datos de acceso"
        action={
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-forest">
            <Check className="size-3.5" strokeWidth={2.5} />
            Email verificado
          </span>
        }
      >
        <Grid>
          <TextField
            label="Correo electrónico"
            type="email"
            defaultValue="ivan.puig@email.com"
          />
          <TextField
            label="Teléfono"
            type="tel"
            defaultValue="+34 612 84 19 03"
          />
          <Segmented
            label="Idioma"
            options={['Español', 'Català', 'English']}
            defaultValue="Español"
          />
          <TextField label="Zona horaria" defaultValue="Europe/Madrid" />
        </Grid>
      </Panel>

      <Panel title="Cambiar contraseña">
        <Grid>
          <TextField label="Contraseña actual" type="password" placeholder="••••••••" />
          <div className="hidden sm:block" />
          <TextField label="Nueva contraseña" type="password" placeholder="••••••••" />
          <TextField
            label="Repetir contraseña"
            type="password"
            placeholder="••••••••"
            hint="Mínimo 8 caracteres, una mayúscula y un número"
          />
        </Grid>
      </Panel>

      <Panel title="Seguridad">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle
            label="Verificación en dos pasos"
            hint="Código por SMS al iniciar sesión"
          />
          <Toggle
            label="Avisarme de inicios de sesión"
            hint="Si entran desde un dispositivo nuevo"
            defaultOn
          />
        </div>
      </Panel>
    </div>
  )
}

function NotificacionesSection() {
  return (
    <div className="space-y-5">
      <Panel title="Partidos y torneos">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle label="Confirmación de inscripción" defaultOn />
          <Toggle label="Recordatorio 24 h antes del partido" defaultOn />
          <Toggle label="Cambios de pista u horario" defaultOn />
          <Toggle label="Resultado publicado" defaultOn />
          <Toggle label="Cuando avanzas de ronda" defaultOn />
          <Toggle label="Apertura de inscripciones en tu club" />
        </div>
      </Panel>

      <Panel title="Comunidad">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle label="Nuevo seguidor" defaultOn />
          <Toggle label="Invitación de pareja" defaultOn />
          <Toggle label="Novedades y consejos de Bandeja" />
        </div>
      </Panel>

      <Panel title="Canales de envío">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Toggle label="Email" hint="Siempre activo" defaultOn />
          <Toggle label="WhatsApp" hint="Al número verificado" defaultOn />
          <Toggle label="Push" hint="App móvil" />
        </div>
      </Panel>
    </div>
  )
}

function PrivacidadSection() {
  return (
    <div className="space-y-5">
      <Panel title="Tu ficha pública">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle
            label="Perfil visible en el directorio"
            hint="Cualquiera puede encontrarte"
            defaultOn
          />
          <Toggle label="Mostrar estadísticas" defaultOn />
          <Toggle label="Mostrar palmarés" defaultOn />
          <Toggle label="Mostrar club actual" defaultOn />
          <Toggle label="Mostrar edad" />
          <Toggle label="Aparecer en el ranking" defaultOn />
        </div>
      </Panel>

      <Panel title="Contacto y seguimiento">
        <Grid>
          <Segmented
            label="Quién puede seguirte"
            options={['Todos', 'Solo de tu club']}
            defaultValue="Todos"
          />
          <Segmented
            label="Quién ve tu teléfono"
            options={['Nadie', 'Tu club', 'Organizadores']}
            defaultValue="Organizadores"
          />
        </Grid>
      </Panel>
    </div>
  )
}

function DatosSection() {
  const exports = [
    'Historial de partidos',
    'Inscripciones y pagos',
    'Estadísticas y ranking',
    'Datos de la cuenta',
  ]
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-ochre/40 bg-ochre/10 p-4">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-ochre" strokeWidth={2} />
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ochre">
            Tus datos te pertenecen
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Puedes descargar una copia completa de tu actividad en Bandeja en
            cualquier momento, en formato CSV.
          </p>
        </div>
      </div>

      <Panel title="Exportar datos">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {exports.map((e) => (
            <li
              key={e}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3"
            >
              <span className="text-sm text-foreground">{e}</span>
              <Button
                size="xs"
                variant="outline"
                className="h-7 gap-1 px-2.5 text-[11px]"
              >
                <Download className="size-3" strokeWidth={2} />
                CSV
              </Button>
            </li>
          ))}
        </ul>
      </Panel>

      <section className="rounded-xl border border-terracotta/40 bg-terracotta/5 p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
          Zona de riesgo
        </p>
        <div className="mt-4 divide-y divide-terracotta/15">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div>
              <p className="text-sm text-foreground">Desactivar la cuenta</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Oculta tu perfil y te saca de los rankings. Puedes reactivarla
                cuando quieras.
              </p>
            </div>
            <Button variant="outline" className="h-9 px-4 text-sm">
              Desactivar
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <div>
              <p className="text-sm text-foreground">Eliminar la cuenta</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Borra tu perfil y todo tu historial de forma permanente. No se
                puede deshacer.
              </p>
            </div>
            <Button variant="destructive" className="h-9 px-4 text-sm">
              Eliminar cuenta
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

const SECTION_CONTENT: Record<SectionId, () => React.ReactNode> = {
  perfil: PerfilSection,
  juego: JuegoSection,
  cuenta: CuentaSection,
  notificaciones: NotificacionesSection,
  privacidad: PrivacidadSection,
  datos: DatosSection,
}

/* -------------------------------------------------------------------------- */
/*  Página                                                                    */
/* -------------------------------------------------------------------------- */

const COMPLETION = 92
const completionTodos = ['Verificar el teléfono', 'Activar la verificación en dos pasos']

export function AccountSettings() {
  const [activeId, setActiveId] = useState<SectionId>('perfil')
  const active = sections.find((s) => s.id === activeId)!
  const Content = SECTION_CONTENT[activeId]

  return (
    <div className="min-h-screen bg-background">
      {/* ---- Barra superior ---- */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-6 border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-8">
        <Link
          href="/"
          className="flex items-baseline gap-2 font-serif text-2xl leading-none tracking-tight text-foreground"
        >
          <span className="flex items-baseline">
            bandeja
            <span className="ml-0.5 inline-block size-1.5 -translate-y-[2px] rounded-full bg-terracotta" />
          </span>
        </Link>
        <span className="hidden font-mono text-xs uppercase tracking-widest text-muted-foreground sm:inline">
          <span className="mx-1 text-foreground/25">/</span> Configuración
        </span>

        <div className="ml-auto flex items-center gap-3">
          <Button variant="outline" className="h-9 rounded-md px-4 text-sm">
            Descartar
          </Button>
          <Button className="h-9 rounded-md px-4 text-sm">Guardar</Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-10 md:px-8">
        {/* ---- Encabezado ---- */}
        <section>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Jugador · Configuración de la cuenta
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Tu <em className="italic">cuenta.</em>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Seis secciones para tener tu perfil a punto: ficha pública, datos de
            juego, acceso, avisos y privacidad. Lo que guardes aquí se aplica al
            instante.
          </p>
        </section>

        {/* ---- Navegación + contenido ---- */}
        <div className="mt-10 grid grid-cols-1 gap-8 border-t border-border pt-8 lg:grid-cols-[268px_1fr]">
          {/* Lateral de secciones */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Configuración · 6 secciones
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
                        {s.pending != null && (
                          <span
                            className={cn(
                              'flex size-4 items-center justify-center rounded-full font-mono text-[9px]',
                              isActive
                                ? 'bg-background/20 text-background'
                                : 'bg-terracotta/15 text-terracotta',
                            )}
                          >
                            {s.pending}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Estado del perfil */}
            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Perfil completo
              </p>
              <p className="mt-1.5 font-serif text-3xl leading-none text-foreground">
                {COMPLETION}%
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-forest"
                  style={{ width: `${COMPLETION}%` }}
                />
              </div>
              <ul className="mt-3 space-y-1">
                {completionTodos.map((todo) => (
                  <li
                    key={todo}
                    className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                  >
                    <span className="size-1 rounded-full bg-terracotta" />
                    {todo}
                  </li>
                ))}
              </ul>
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
              <Link
                href="/jugadores/ivan-puig"
                className="hidden shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
              >
                Ver perfil público
                <ExternalLink className="size-3" strokeWidth={1.5} />
              </Link>
            </div>

            <div className="mt-7">
              <Content />
            </div>

            {/* Pie de guardado */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Último cambio guardado · hace 2 min
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="h-9 rounded-md px-4 text-sm">
                  Descartar
                </Button>
                <Button className="h-9 rounded-md px-4 text-sm">
                  Guardar cambios
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
