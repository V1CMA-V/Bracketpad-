import { Search } from 'lucide-react'
import Link from 'next/link'
import { headers } from 'next/headers'
import { auth } from '@/auth'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { UserMenu } from './user-menu'

const links = [
  { label: 'Torneos', href: '/torneos', active: true },
  { label: 'Clubes', href: '/clubs' },
  { label: 'Ranking', href: '/ranking' },
  { label: 'Calendario', href: '/calendario' },
  { label: 'Cómo funciona', href: '/como-funciona' },
]

export async function Header() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user
  return (
    <header className="w-full border-b border-foreground/10 bg-background">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-8 px-6">
        <nav className="flex items-center gap-10">
          <Link
            href="/"
            className="flex items-baseline gap-2 font-serif text-2xl leading-none tracking-tight"
          >
            <span className="flex items-baseline">
              bandeja
              <span className="ml-0.5 inline-block size-1.5 translate-y-[-2px] rounded-full bg-terracotta" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Est. 2026
            </span>
          </Link>

          <ul className="hidden items-center gap-7 md:flex">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={
                    link.active
                      ? 'text-sm font-medium text-foreground'
                      : 'text-sm text-muted-foreground transition-colors hover:text-foreground'
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar torneo o club..."
              className="h-9 w-72 rounded-md border-foreground/15 bg-background pl-9 pr-12 text-sm placeholder:text-muted-foreground"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-foreground/15 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button
                asChild
                variant="outline"
                className="h-9 rounded-md border-foreground/15 px-4 text-sm"
              >
                <Link href="/login">Entrar</Link>
              </Button>
              <Button
                asChild
                className="h-9 rounded-md bg-ink px-4 text-sm text-cream hover:bg-ink/90"
              >
                <Link href="/registro/club">Crear cuenta</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
