"use client"

import Link from "next/link"
import { useActionState, useEffect, useState } from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { slugify } from "@/lib/slug"
import {
  createClub,
  registerClubOwner,
  type CreateClubState,
  type RegisterState,
} from "@/app/(auth)/registro/club/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const initialAccountState: RegisterState = {}
const initialClubState: CreateClubState = {}

function toErrors(messages?: string[]) {
  return messages?.map((message) => ({ message }))
}

const steps = [
  { title: "Tu cuenta", subtitle: "Datos de acceso" },
  { title: "Tu club", subtitle: "Información básica" },
] as const

function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </div>
  )
}

function Stepper({ current }: { current: 0 | 1 }) {
  return (
    <ol className="flex items-center gap-3">
      {steps.map((step, i) => {
        const isDone = i < current
        const isCurrent = i === current
        return (
          <li key={step.title} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] transition-colors",
                  isDone && "bg-primary text-primary-foreground",
                  isCurrent && "bg-foreground text-background",
                  !isDone &&
                    !isCurrent &&
                    "border border-border text-muted-foreground",
                )}
              >
                {isDone ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <div className="leading-tight">
                <p
                  className={cn(
                    "text-sm",
                    isCurrent || isDone
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {step.subtitle}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "h-px flex-1",
                  isDone ? "bg-primary/40" : "bg-border",
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* -------------------------------------------------------------------------- */
/*  Paso 1 — Cuenta                                                            */
/* -------------------------------------------------------------------------- */

function AccountStep({
  onCreated,
}: {
  onCreated: () => void
}) {
  const [state, formAction, pending] = useActionState(
    registerClubOwner,
    initialAccountState,
  )

  useEffect(() => {
    if (state.success) onCreated()
  }, [state.success, onCreated])

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Crea tu cuenta de propietario</CardTitle>
        <CardDescription>
          Tu cuenta para administrar el club, sus ligas y torneos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} noValidate>
          <FieldGroup>
            <ErrorBanner message={state.error} />

            <Field data-invalid={!!state.fieldErrors?.name}>
              <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Juan Pérez"
                defaultValue={state.values?.name}
                aria-invalid={!!state.fieldErrors?.name}
                required
              />
              <FieldError errors={toErrors(state.fieldErrors?.name)} />
            </Field>

            <Field data-invalid={!!state.fieldErrors?.email}>
              <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="m@ejemplo.com"
                defaultValue={state.values?.email}
                aria-invalid={!!state.fieldErrors?.email}
                required
              />
              <FieldError errors={toErrors(state.fieldErrors?.email)} />
            </Field>

            <Field data-invalid={!!state.fieldErrors?.password}>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!state.fieldErrors?.password}
                required
              />
              <FieldError errors={toErrors(state.fieldErrors?.password)} />
              <FieldDescription>
                Debe tener al menos 8 caracteres.
              </FieldDescription>
            </Field>

            <Field data-invalid={!!state.fieldErrors?.confirmPassword}>
              <FieldLabel htmlFor="confirmPassword">
                Confirmar contraseña
              </FieldLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!state.fieldErrors?.confirmPassword}
                required
              />
              <FieldError
                errors={toErrors(state.fieldErrors?.confirmPassword)}
              />
            </Field>

            <Field>
              <Button type="submit" disabled={pending}>
                {pending ? "Creando cuenta…" : "Continuar"}
              </Button>
              <FieldDescription className="text-center">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login">Inicia sesión</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Paso 2 — Club                                                             */
/* -------------------------------------------------------------------------- */

function ClubStep() {
  const [state, formAction, pending] = useActionState(
    createClub,
    initialClubState,
  )

  // Nombre controlado para previsualizar el slug en vivo. Al ser estado de
  // React, se conserva aunque la acción del formulario falle.
  const [name, setName] = useState(state.values?.name ?? "")
  const slug = slugify(name)

  // Host real para la previsualización; se calcula tras montar para evitar
  // diferencias de hidratación con el servidor.
  const [host, setHost] = useState("")
  useEffect(() => {
    setHost(window.location.host)
  }, [])

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Crea tu club</CardTitle>
        <CardDescription>
          Lo esencial para empezar. Podrás completar el resto desde el panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} noValidate>
          <FieldGroup>
            <ErrorBanner message={state.error} />

            <Field data-invalid={!!state.fieldErrors?.name}>
              <FieldLabel htmlFor="club-name">Nombre del club</FieldLabel>
              <Input
                id="club-name"
                name="name"
                type="text"
                placeholder="Club Pádel Central"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!state.fieldErrors?.name}
                required
              />
              <FieldError errors={toErrors(state.fieldErrors?.name)} />
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Enlace público
                </p>
                <p className="mt-1 truncate font-mono text-sm text-foreground">
                  {host || "bandeja.app"}/clubs/
                  <span className="text-primary">{slug || "tu-club"}</span>
                </p>
              </div>
            </Field>

            <Field data-invalid={!!state.fieldErrors?.city}>
              <FieldLabel htmlFor="club-city">
                Ciudad <span className="text-muted-foreground">(opcional)</span>
              </FieldLabel>
              <Input
                id="club-city"
                name="city"
                type="text"
                autoComplete="address-level2"
                placeholder="Ciudad de México"
                defaultValue={state.values?.city}
                aria-invalid={!!state.fieldErrors?.city}
              />
              <FieldError errors={toErrors(state.fieldErrors?.city)} />
            </Field>

            <Field data-invalid={!!state.fieldErrors?.email}>
              <FieldLabel htmlFor="club-email">
                Correo de contacto{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </FieldLabel>
              <Input
                id="club-email"
                name="email"
                type="email"
                placeholder="contacto@club.com"
                defaultValue={state.values?.email}
                aria-invalid={!!state.fieldErrors?.email}
              />
              <FieldError errors={toErrors(state.fieldErrors?.email)} />
            </Field>

            <Field data-invalid={!!state.fieldErrors?.phone}>
              <FieldLabel htmlFor="club-phone">
                Teléfono{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </FieldLabel>
              <Input
                id="club-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+52 55 1234 5678"
                defaultValue={state.values?.phone}
                aria-invalid={!!state.fieldErrors?.phone}
              />
              <FieldError errors={toErrors(state.fieldErrors?.phone)} />
            </Field>

            <Field>
              <Button type="submit" disabled={pending}>
                {pending ? "Creando club…" : "Crear club y entrar"}
              </Button>
              <FieldDescription className="text-center">
                Serás el <span className="text-foreground">owner</span> del club.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Asistente                                                                 */
/* -------------------------------------------------------------------------- */

export function ClubOnboardingWizard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [step, setStep] = useState<0 | 1>(0)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Stepper current={step} />

      {step === 0 ? (
        <AccountStep onCreated={() => setStep(1)} />
      ) : (
        <ClubStep />
      )}

      <FieldDescription className="px-6 text-center">
        Al continuar, aceptas nuestros <a href="#">Términos de servicio</a> y{" "}
        <a href="#">Política de privacidad</a>.
      </FieldDescription>
    </div>
  )
}
