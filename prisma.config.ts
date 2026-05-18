import 'dotenv/config'
import path from 'node:path'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    // CLI (db pull, migrate, generate) usa la conexión directa porque el pooler
    // en modo transaction (puerto 6543) no soporta introspección — devuelve P1017.
    // El runtime usa DATABASE_URL (pooled) vía lib/prisma.ts con datasourceUrl.
    url: env('DIRECT_URL'),
  },
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
})
