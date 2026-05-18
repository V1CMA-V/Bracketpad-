# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **pnpm** (see `pnpm-workspace.yaml` for allowed native builds).

- `pnpm dev` — Next.js dev server (http://localhost:3000)
- `pnpm build` — production build
- `pnpm start` — run production build
- `pnpm lint` — ESLint (config in `eslint.config.mjs`, extends `next/core-web-vitals` + `next/typescript`)

### Database (Prisma + Supabase Postgres)

Prisma 7 uses `prisma.config.ts` (not `schema.prisma` `env(...)` blocks) to resolve connection URLs from `.env`:
- `DATABASE_URL` — pooled (Supavisor, port 6543, `pgbouncer=true`) for runtime
- `DIRECT_URL` — direct (port 5432) for migrations / `prisma migrate`

Commands:
- `pnpm dlx prisma migrate dev --name <name>` — create + apply a migration (uses `DIRECT_URL`)
- `pnpm dlx prisma db pull` — introspect remote schema
- `pnpm dlx prisma generate` — regenerate client after schema edits

### Supabase MCP

`.mcp.json` registers the Supabase MCP server scoped to project ref `uxmpjmwcmtzcrvebspeh`. Prefer `list_tables` / `get_logs` / `get_advisors` before mutating schema.

## Architecture

- **Next.js 16** App Router (`app/`), React 19, RSC enabled. Path alias `@/*` resolves to project root (`tsconfig.json`).
- **Prisma client singleton** lives in `lib/prisma.ts` and stashes the instance on `globalThis` outside production to survive Next.js dev hot-reload. Import `prisma` from `@/lib/prisma` — do not instantiate `PrismaClient` elsewhere.
- **Schema** at `prisma/schema.prisma` declares only the `prisma-client-js` generator and a `postgresql` datasource; the actual URLs are injected from `prisma.config.ts`. Adding `url`/`directUrl` to the schema's `datasource` block will conflict with the config file.
- **UI**: shadcn/ui (`components.json`) with the `radix-maia` style, `olive` base color, CSS variables, Lucide icons. Components live under `components/ui/` and are aliased via `@/components/ui`. Utility `cn` is in `@/lib/utils`. Tailwind v4 with `@tailwindcss/postcss`; tokens are defined in `app/globals.css` (no `tailwind.config.*`).

## Environment

`.env` (gitignored) holds the Supabase credentials and both Prisma URLs. The Supabase project ref is `uxmpjmwcmtzcrvebspeh` (region `us-east-1`). The pooled URL must keep `pgbouncer=true&connection_limit=1` for serverless/runtime usage.
