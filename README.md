# BracketPad

Plataforma editorial para clubes que organizan torneos de pádel. Inscripciones, cuadros, programación y resultados — en un solo gesto.

## Stack

- **Next.js 16** (App Router, React 19, RSC)
- **Tailwind CSS v4** + **shadcn/ui** (estilo `radix-maia`, base `olive`)
- **Prisma 7** sobre **Supabase Postgres**
- **TypeScript 5**, **pnpm**

## Empezar

Requisitos: Node.js 20+, pnpm y un archivo `.env` con las credenciales de Supabase (`DATABASE_URL` pooled en 6543 con `pgbouncer=true`, `DIRECT_URL` directo en 5432).

```bash
pnpm install
pnpm dlx prisma generate
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

- `pnpm dev` — servidor de desarrollo
- `pnpm build` — build de producción
- `pnpm start` — sirve el build de producción
- `pnpm lint` — ESLint (`next/core-web-vitals` + `next/typescript`)

## Base de datos

Prisma 7 resuelve las URLs desde `prisma.config.ts` (no desde `schema.prisma`).

- `pnpm dlx prisma migrate dev --name <nombre>` — crear y aplicar migración
- `pnpm dlx prisma db pull` — introspectar el esquema remoto
- `pnpm dlx prisma generate` — regenerar el cliente

El cliente Prisma vive como singleton en `lib/prisma.ts`; impórtalo desde `@/lib/prisma` en lugar de instanciar `PrismaClient` en otros sitios.

## Estructura

- `app/` — rutas del App Router (incluye `club/[slug]`)
- `components/home/` — secciones de landing (Hero, Features, OnLive, TournamentTabs, FAQ, CTA…)
- `components/layout/` — header y footer
- `components/ui/` — primitivos de shadcn/ui
- `prisma/schema.prisma` — esquema de datos

## Convenciones

Consulta `CLAUDE.md` para detalles sobre arquitectura, alias (`@/*`), tokens de Tailwind en `app/globals.css` y configuración de Supabase/MCP.
