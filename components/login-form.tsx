"use client"

import Link from "next/link"
import { useActionState } from "react"

import { cn } from "@/lib/utils"
import { login, type LoginState } from "@/app/(auth)/login/actions"
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

const initialState: LoginState = {}

function toErrors(messages?: string[]) {
  return messages?.map((message) => ({ message }))
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Bienvenido de nuevo</CardTitle>
          <CardDescription>
            Inicia sesión con tu correo y contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} noValidate>
            <FieldGroup>
              {state.error && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {state.error}
                </div>
              )}

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
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <Link
                    href="/recuperar"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!state.fieldErrors?.password}
                  required
                />
                <FieldError errors={toErrors(state.fieldErrors?.password)} />
              </Field>

              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "Entrando…" : "Iniciar sesión"}
                </Button>
                <FieldDescription className="text-center">
                  ¿No tienes una cuenta?{" "}
                  <Link href="/registro/club">Crea una</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Al continuar, aceptas nuestros <a href="#">Términos de servicio</a> y{" "}
        <a href="#">Política de privacidad</a>.
      </FieldDescription>
    </div>
  )
}
