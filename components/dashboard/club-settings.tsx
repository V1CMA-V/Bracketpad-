'use client'

import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Check,
  Download,
  ExternalLink,
  MoreHorizontal,
  Plus,
  ShieldAlert,
  Upload,
} from 'lucide-react'
import { useState } from 'react'

/* -------------------------------------------------------------------------- */
/*  Modelo                                                                    */
/* -------------------------------------------------------------------------- */

type SectionId =
  | 'ficha'
  | 'equipo'
  | 'plantillas'
  | 'pagos'
  | 'comunicaciones'
  | 'integraciones'
  | 'reglamento'
  | 'marca'
  | 'datos'

type Section = {
  id: SectionId
  n: string
  label: string
  /** Eyebrow + título grande del panel derecho. */
  eyebrow: string
  title: React.ReactNode
  lead: string
  /** Avisos pendientes — se pintan como badge en la navegación. */
  pending?: number
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
    lead: 'Los datos públicos que aparecen en el perfil de Bandeja y en los torneos que organizas. Cambian solo cuando los actualizas aquí.',
  },
  {
    id: 'equipo',
    n: '02',
    label: 'Equipo y permisos',
    eyebrow: 'Sección 02 · Equipo y permisos',
    title: (
      <>
        Quién puede <em className="italic">gestionar.</em>
      </>
    ),
    lead: 'Invita a tu equipo y decide hasta dónde llega cada persona. Los permisos se aplican a todos los torneos del club.',
  },
  {
    id: 'plantillas',
    n: '03',
    label: 'Plantillas torneo',
    eyebrow: 'Sección 03 · Plantillas de torneo',
    title: (
      <>
        Tu torneo <em className="italic">por defecto.</em>
      </>
    ),
    lead: 'Los valores con los que arranca el asistente de creación. Ahorra clics cuando montas un torneo nuevo.',
  },
  {
    id: 'pagos',
    n: '04',
    label: 'Pagos y facturación',
    eyebrow: 'Sección 04 · Pagos y facturación',
    title: (
      <>
        Cobros e <em className="italic">impuestos.</em>
      </>
    ),
    lead: 'Cuenta de cobro, datos fiscales y cuotas por defecto. Bandeja emite las facturas con esta información.',
    pending: 3,
  },
  {
    id: 'comunicaciones',
    n: '05',
    label: 'Comunicaciones',
    eyebrow: 'Sección 05 · Comunicaciones',
    title: (
      <>
        Lo que <em className="italic">enviamos.</em>
      </>
    ),
    lead: 'Remitente, canales y recordatorios automáticos para jugadores e inscritos.',
  },
  {
    id: 'integraciones',
    n: '06',
    label: 'Integraciones',
    eyebrow: 'Sección 06 · Integraciones',
    title: (
      <>
        Conecta tus <em className="italic">herramientas.</em>
      </>
    ),
    lead: 'Servicios externos sincronizados con Bandeja. Tienes 5 de 8 disponibles activas.',
  },
  {
    id: 'reglamento',
    n: '07',
    label: 'Reglamento por defecto',
    eyebrow: 'Sección 07 · Reglamento por defecto',
    title: (
      <>
        Las reglas <em className="italic">de la casa.</em>
      </>
    ),
    lead: 'El reglamento que se aplica a cada torneo nuevo. Cada torneo puede sobreescribirlo después.',
  },
  {
    id: 'marca',
    n: '08',
    label: 'Marca y portada',
    eyebrow: 'Sección 08 · Marca y portada',
    title: (
      <>
        Tu cara <em className="italic">pública.</em>
      </>
    ),
    lead: 'Logotipo, colores y portada de la página pública del club en bandeja.es.',
    pending: 3,
  },
  {
    id: 'datos',
    n: '09',
    label: 'Datos y exportación',
    eyebrow: 'Sección 09 · Datos y exportación',
    title: (
      <>
        Exporta y <em className="italic">conserva.</em>
      </>
    ),
    lead: 'Descarga la información del club, configura las copias de seguridad y gestiona el cierre de la cuenta.',
  },
]

const members = [
  {
    initials: 'CG',
    name: 'Carla Giménez',
    role: 'Directora deportiva',
    scope: 'Todo',
    status: 'Activo',
    owner: true,
    tone: 'bg-terracotta',
  },
  {
    initials: 'TR',
    name: 'Toni Roig',
    role: 'Director técnico',
    scope: 'Torneos · Pistas · Resultados',
    status: 'Activo',
    tone: 'bg-forest',
  },
  {
    initials: 'MC',
    name: 'Marta Cervera',
    role: 'Recepción',
    scope: 'Pistas · Jugadores',
    status: 'Activo',
    tone: 'bg-ochre',
  },
  {
    initials: 'PB',
    name: 'Pep Bonaire',
    role: 'Tesorería',
    scope: 'Pagos · Facturación',
    status: 'Invitado',
    tone: 'bg-ink',
  },
]

const integrations = [
  { key: 'S', name: 'Stripe', desc: 'Cobros y devoluciones', connected: true },
  {
    key: 'W',
    name: 'WhatsApp Business',
    desc: 'Recordatorios automáticos',
    connected: true,
  },
  {
    key: 'G',
    name: 'Google Calendar',
    desc: 'Sincronía con calendarios',
    connected: true,
  },
  {
    key: 'P',
    name: 'Padel Stats',
    desc: 'Estadísticas de partido',
    connected: true,
  },
  { key: 'M', name: 'Mailchimp', desc: 'Boletín mensual', connected: true },
  {
    key: 'I',
    name: 'Instagram',
    desc: 'Publicación de resultados',
    connected: false,
  },
  { key: 'Z', name: 'Zapier', desc: 'Automatizaciones', connected: false },
  { key: 'H', name: 'Webhooks', desc: 'Eventos en tiempo real', connected: false },
]

const templates = [
  { name: 'Open de Verano', detail: 'Grupos + eliminatoria · 6 categorías', used: 'Jun 2026' },
  { name: 'Liga interna', detail: 'Round robin · 4 categorías', used: 'Abr 2026' },
  { name: 'Torneo express', detail: 'Eliminatoria directa · 2 categorías', used: 'Mar 2026' },
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
  full,
}: {
  label: string
  defaultValue?: string
  placeholder?: string
  hint?: string
  prefix?: string
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
            defaultValue={defaultValue}
            placeholder={placeholder}
            className="h-full flex-1 bg-transparent px-1 text-sm text-foreground outline-none"
          />
        </div>
      ) : (
        <input
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
}: {
  label: string
  defaultValue?: string
  placeholder?: string
}) {
  return (
    <Field label={label} full>
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

/** Rejilla de dos columnas para campos. */
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

function FichaSection() {
  return (
    <div className="space-y-5">
      <Panel title="Datos generales">
        <Grid>
          <TextField label="Nombre del club" defaultValue="Club Marítimo del Olivar" />
          <TextField
            label="URL pública"
            prefix="bandeja.es/c/"
            defaultValue="maritimo-olivar"
          />
          <TextField
            label="Razón social"
            defaultValue="Asoc. Deportiva Marítimo del Olivar"
          />
          <TextField label="CIF" defaultValue="G-46123456" />
          <TextField label="Año de fundación" defaultValue="1987" />
          <TextField label="Federación" defaultValue="FPCV · nº 1422" />
        </Grid>
      </Panel>

      <Panel title="Contacto y ubicación">
        <Grid>
          <TextField label="Dirección" defaultValue="Av. del Puerto, 238" />
          <TextField label="CP · Ciudad" defaultValue="46011 · Valencia" />
          <TextField label="Email" defaultValue="open@maritimoolivar.es" />
          <TextField label="Teléfono" defaultValue="+34 96 365 18 24" />
          <TextField
            label="Horario de apertura"
            full
            defaultValue="L–V · 09:00–23:00  ·  S–D · 09:00–21:00"
          />
        </Grid>
      </Panel>

      <Panel title="Pistas y capacidad">
        <Grid>
          <TextField label="Pistas totales" defaultValue="8" />
          <TextField label="Pistas cubiertas" defaultValue="3 · Central, Mistral, Garbí" />
          <TextField label="Pista central" defaultValue="P4 · streaming + grada" />
          <TextField label="Capacidad de grada" defaultValue="80 plazas" />
        </Grid>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle label="Permitir grada en P1" hint="Para finales con público" />
          <Toggle label="Streaming en pista central" defaultOn />
        </div>
      </Panel>
    </div>
  )
}

function EquipoSection() {
  return (
    <div className="space-y-5">
      <Panel
        title="Miembros · 4"
        action={
          <Button size="sm" variant="outline" className="h-8 gap-1.5 px-3 text-xs">
            <Plus className="size-3.5" strokeWidth={2} />
            Invitar
          </Button>
        }
      >
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li
              key={m.name}
              className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-[11px] text-cream',
                  m.tone,
                )}
              >
                {m.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm text-foreground">
                  {m.name}
                  {m.owner && (
                    <span className="rounded-full border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      Propietaria
                    </span>
                  )}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {m.role}
                </p>
              </div>
              <p className="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground sm:block">
                {m.scope}
              </p>
              <span
                className={cn(
                  'flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest',
                  m.status === 'Activo' ? 'text-forest' : 'text-ochre',
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    m.status === 'Activo' ? 'bg-forest' : 'bg-ochre',
                  )}
                />
                {m.status}
              </span>
              <button
                type="button"
                aria-label={`Opciones de ${m.name}`}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <MoreHorizontal className="size-4" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Acceso y seguridad">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle
            label="Verificación en dos pasos"
            hint="Obligatoria para todo el equipo"
            defaultOn
          />
          <Toggle
            label="Cerrar sesión a los 30 días"
            hint="Inactividad en el panel"
            defaultOn
          />
          <Toggle
            label="Registro de actividad"
            hint="Guarda quién cambia qué"
            defaultOn
          />
          <Toggle
            label="Permitir invitados externos"
            hint="Jueces y árbitros puntuales"
          />
        </div>
      </Panel>
    </div>
  )
}

function PlantillasSection() {
  return (
    <div className="space-y-5">
      <Panel title="Valores por defecto del torneo">
        <Grid>
          <Segmented
            label="Sistema de juego"
            options={['Grupos', 'Eliminación', 'Round robin']}
            defaultValue="Grupos"
          />
          <Segmented label="Sets para ganar" options={['3', '5']} />
          <Segmented label="Juegos por set" options={['6', '4']} />
          <Segmented
            label="Tiempo entre rondas"
            options={['60′', '90′', '120′']}
            defaultValue="90′"
          />
          <TextField
            label="Categorías por defecto"
            full
            defaultValue="1ª M, 2ª M, 3ª M, 1ª F, 2ª F, Mixto"
          />
        </Grid>
      </Panel>

      <Panel
        title="Plantillas guardadas · 3"
        action={
          <Button size="sm" variant="outline" className="h-8 gap-1.5 px-3 text-xs">
            <Plus className="size-3.5" strokeWidth={2} />
            Nueva
          </Button>
        }
      >
        <ul className="divide-y divide-border">
          {templates.map((t) => (
            <li
              key={t.name}
              className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="font-serif text-base text-foreground">{t.name}</p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t.detail}
                </p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                Usada · {t.used}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

function PagosSection() {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-ochre/40 bg-ochre/10 p-4">
        <ShieldAlert
          className="mt-0.5 size-4 shrink-0 text-ochre"
          strokeWidth={2}
        />
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ochre">
            3 pasos pendientes
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Verifica la identidad en Stripe, añade la dirección fiscal y elige la
            serie de factura para empezar a cobrar inscripciones.
          </p>
        </div>
      </div>

      <Panel
        title="Cuenta de cobro · Stripe"
        action={
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-forest">
            <span className="size-1.5 rounded-full bg-forest" />
            Conectada
          </span>
        }
      >
        <Grid>
          <TextField
            label="Cuenta destino (IBAN)"
            defaultValue="ES•• •••• •••• •••• 4471"
          />
          <Segmented
            label="Periodicidad de pago"
            options={['Diaria', 'Semanal', 'Manual']}
            defaultValue="Semanal"
          />
        </Grid>
      </Panel>

      <Panel title="Datos fiscales">
        <Grid>
          <TextField
            label="Razón social fiscal"
            defaultValue="Asoc. Deportiva Marítimo del Olivar"
          />
          <TextField label="NIF" defaultValue="G-46123456" />
          <TextField
            label="Dirección fiscal"
            full
            placeholder="Calle, número, CP, ciudad"
          />
          <Segmented
            label="IVA aplicado"
            options={['Exento', '10 %', '21 %']}
            defaultValue="Exento"
          />
          <TextField label="Serie de factura" placeholder="Ej. 2026-OPEN-" />
        </Grid>
      </Panel>

      <Panel title="Cuotas por defecto">
        <Grid>
          <TextField label="Cuota de inscripción" defaultValue="35 €" />
          <TextField label="Recargo por pago en pista" defaultValue="5 €" />
          <Segmented
            label="Política de devolución"
            options={['Total', 'Parcial', 'Sin devolución']}
            defaultValue="Parcial"
          />
          <Segmented
            label="Plazo de devolución"
            options={['48 h', '7 días', '14 días']}
            defaultValue="7 días"
          />
        </Grid>
      </Panel>
    </div>
  )
}

function ComunicacionesSection() {
  return (
    <div className="space-y-5">
      <Panel title="Remitente">
        <Grid>
          <TextField
            label="Nombre del remitente"
            defaultValue="Club Marítimo del Olivar"
          />
          <TextField
            label="Email de respuesta"
            defaultValue="open@maritimoolivar.es"
          />
          <AreaField
            label="Firma de los correos"
            defaultValue="Club Marítimo del Olivar · Av. del Puerto 238, Valencia · +34 96 365 18 24"
          />
        </Grid>
      </Panel>

      <Panel title="Recordatorios automáticos">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle label="Confirmación de inscripción" defaultOn />
          <Toggle label="Recordatorio 24 h antes" defaultOn />
          <Toggle label="Cambios de pista u hora" defaultOn />
          <Toggle label="Resultado publicado" defaultOn />
          <Toggle label="Encuesta post-torneo" />
          <Toggle label="Aviso de lista de espera" defaultOn />
        </div>
      </Panel>

      <Panel title="Canales de envío">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Toggle label="Email" hint="Incluido" defaultOn />
          <Toggle label="WhatsApp" hint="Vía integración" defaultOn />
          <Toggle label="SMS" hint="0,06 € / mensaje" />
        </div>
      </Panel>
    </div>
  )
}

function IntegracionesSection() {
  return (
    <Panel title="Disponibles · 5 / 8 conectadas">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {integrations.map((it) => (
          <li
            key={it.name}
            className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
          >
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-md font-serif text-base',
                it.connected
                  ? 'bg-forest text-cream'
                  : 'border border-border text-muted-foreground',
              )}
            >
              {it.key}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{it.name}</p>
              <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {it.desc}
              </p>
            </div>
            {it.connected ? (
              <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-forest">
                <Check className="size-3.5" strokeWidth={2.5} />
                OK
              </span>
            ) : (
              <Button
                size="xs"
                variant="outline"
                className="h-7 px-2.5 text-[11px]"
              >
                Conectar
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function ReglamentoSection() {
  return (
    <div className="space-y-5">
      <Panel title="Reglas de juego por defecto">
        <Grid>
          <Segmented
            label="Punto de oro"
            options={['Sí', 'Ventaja']}
            defaultValue="Sí"
          />
          <Segmented
            label="Saque"
            options={['FEP', 'Libre']}
            defaultValue="FEP"
          />
          <Segmented
            label="Tie-break"
            options={['A 7', 'A 9', 'No']}
            defaultValue="A 7"
          />
          <Segmented
            label="Set decisivo"
            options={['Super tie-break', 'Set normal']}
            defaultValue="Super tie-break"
          />
          <Segmented
            label="Bolas por partido"
            options={['3', '4']}
            defaultValue="3"
          />
          <Segmented
            label="Cambio de bolas"
            options={['No', 'Cada set', 'Semis+']}
            defaultValue="Semis+"
          />
        </Grid>
      </Panel>

      <Panel title="Normativa del club">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle
            label="W.O. a los 10 minutos"
            hint="Tras la hora citada"
            defaultOn
          />
          <Toggle label="Calentamiento de 5 minutos" defaultOn />
          <Toggle
            label="Vestimenta deportiva obligatoria"
            hint="Camiseta y calzado de pádel"
            defaultOn
          />
          <Toggle label="Permitir cambio de pareja" hint="Antes del sorteo" />
        </div>
      </Panel>

      <Panel title="Texto del reglamento">
        <AreaField
          label="Cláusulas adicionales"
          placeholder="Aparece en la ficha de cada torneo que herede este reglamento."
        />
      </Panel>
    </div>
  )
}

function MarcaSection() {
  return (
    <div className="space-y-5">
      <Panel title="Logotipo e identidad">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background py-8 sm:w-48">
            <Upload className="size-5 text-muted-foreground" strokeWidth={1.5} />
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Subir logotipo
            </p>
            <p className="font-mono text-[9px] text-muted-foreground/60">
              SVG o PNG · 512 px
            </p>
          </div>
          <div className="flex-1">
            <Grid>
              <ColorField label="Color principal" color="#1f3a2e" hex="#1F3A2E" />
              <ColorField label="Color de acento" color="#b85a3c" hex="#B85A3C" />
            </Grid>
          </div>
        </div>
      </Panel>

      <Panel title="Portada pública">
        <div className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background py-10">
          <Upload className="size-5 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Subir imagen de portada
          </p>
          <p className="font-mono text-[9px] text-muted-foreground/60">
            JPG · 1600 × 600 px · máx 3 MB
          </p>
        </div>
        <div className="mt-5">
          <Grid>
            <TextField
              label="Eslogan"
              full
              placeholder="Una línea que define al club"
            />
          </Grid>
        </div>
      </Panel>

      <Panel title="Página pública">
        <Grid>
          <TextField
            label="Dirección"
            prefix="bandeja.es/c/"
            defaultValue="maritimo-olivar"
          />
          <div />
        </Grid>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle label="Club visible en el directorio" defaultOn />
          <Toggle label="Mostrar próximos torneos" defaultOn />
        </div>
      </Panel>
    </div>
  )
}

function ColorField({
  label,
  color,
  hex,
}: {
  label: string
  color: string
  hex: string
}) {
  return (
    <Field label={label}>
      <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-2">
        <span
          className="size-6 shrink-0 rounded border border-border"
          style={{ background: color }}
        />
        <input
          defaultValue={hex}
          className="h-full flex-1 bg-transparent font-mono text-sm uppercase text-foreground outline-none"
        />
      </div>
    </Field>
  )
}

function DatosSection() {
  const exports = [
    'Jugadores e inscripciones',
    'Torneos y resultados',
    'Movimientos contables',
    'Histórico de comunicaciones',
  ]
  return (
    <div className="space-y-5">
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

      <Panel title="Copias de seguridad">
        <Grid>
          <Segmented
            label="Frecuencia"
            options={['Diaria', 'Semanal', 'Mensual']}
            defaultValue="Diaria"
          />
          <Field label="Última copia">
            <div className="flex h-10 items-center rounded-md border border-border bg-background px-3 font-mono text-xs text-muted-foreground">
              Hoy · 04:00 · 18,4 MB
            </div>
          </Field>
        </Grid>
        <div className="mt-5">
          <Toggle
            label="Enviar copia al email del propietario"
            defaultOn
          />
        </div>
      </Panel>

      <section className="rounded-xl border border-terracotta/40 bg-terracotta/5 p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
          Zona de riesgo
        </p>
        <div className="mt-4 divide-y divide-terracotta/15">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div>
              <p className="text-sm text-foreground">Archivar el club</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Oculta el club y sus torneos. Reversible en cualquier momento.
              </p>
            </div>
            <Button variant="outline" className="h-9 px-4 text-sm">
              Archivar
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <div>
              <p className="text-sm text-foreground">Eliminar el club</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Borra todos los datos de forma permanente. No se puede deshacer.
              </p>
            </div>
            <Button variant="destructive" className="h-9 px-4 text-sm">
              Eliminar club
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

const SECTION_CONTENT: Record<SectionId, () => React.ReactNode> = {
  ficha: FichaSection,
  equipo: EquipoSection,
  plantillas: PlantillasSection,
  pagos: PagosSection,
  comunicaciones: ComunicacionesSection,
  integraciones: IntegracionesSection,
  reglamento: ReglamentoSection,
  marca: MarcaSection,
  datos: DatosSection,
}

/* -------------------------------------------------------------------------- */
/*  Página                                                                    */
/* -------------------------------------------------------------------------- */

const COMPLETION = 86
const completionTodos = ['Subir logotipo', 'Configurar Stripe', 'Dirección fiscal']

export function ClubSettings() {
  const [activeId, setActiveId] = useState<SectionId>('ficha')
  const active = sections.find((s) => s.id === activeId)!
  const Content = SECTION_CONTENT[activeId]

  return (
    <>
      <DashboardTopbar>
        <Button variant="outline" className="h-9 rounded-md px-4 text-sm">
          Descartar cambios
        </Button>
        <Button className="h-9 rounded-md px-4 text-sm">Guardar</Button>
      </DashboardTopbar>

      <div className="mx-auto max-w-[1500px] px-8 py-10">
        {/* ---- Encabezado ---- */}
        <section>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Club · Ajustes
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Ajustes <em className="italic">del club.</em>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Nueve secciones para dejar el club a punto: identidad, equipo,
            cobros, comunicaciones y reglamento. Lo que guardes aquí se aplica a
            todos los torneos.
          </p>
        </section>

        {/* ---- Navegación + contenido ---- */}
        <div className="mt-10 grid grid-cols-1 gap-8 border-t border-border pt-8 lg:grid-cols-[268px_1fr]">
          {/* Lateral de secciones */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Ajustes · 9 secciones
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

            {/* Estado de la ficha */}
            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Estado de la ficha
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
              <a
                href="https://bandeja.es/c/maritimo-olivar"
                className="hidden shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
              >
                Ver página pública
                <ExternalLink className="size-3" strokeWidth={1.5} />
              </a>
            </div>

            <div className="mt-7">
              <Content />
            </div>

            {/* Pie de guardado */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Último cambio guardado · hace 4 min
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="h-9 rounded-md px-4 text-sm"
                >
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
    </>
  )
}
