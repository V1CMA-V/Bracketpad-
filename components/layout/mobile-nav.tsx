'use client'

import { Menu, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet'

type NavLink = { label: string; href: string; active?: boolean }

export function MobileNav({
  links,
  isLoggedIn,
}: {
  links: NavLink[]
  isLoggedIn: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-md border-foreground/15 md:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[88%] max-w-sm gap-0 bg-background p-0"
      >
        <SheetTitle className="sr-only">Menú de navegación</SheetTitle>

        {/* Brand */}
        <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-5">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-baseline gap-2 font-serif text-2xl leading-none tracking-tight"
          >
            <span className="flex items-baseline">
              bandeja
              <span className="ml-0.5 inline-block size-1.5 translate-y-[-2px] rounded-full bg-terracotta" />
            </span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Est. 2026
          </span>
        </div>

        {/* Search */}
        <div className="border-b border-foreground/10 px-6 py-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar torneo o club..."
              className="h-11 w-full rounded-md border-foreground/15 bg-card pl-9 text-sm placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Links */}
        <nav className="flex flex-col px-6 py-2">
          {links.map((link, i) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="flex items-baseline gap-4 border-b border-foreground/5 py-4 font-serif text-3xl leading-none tracking-tight text-foreground transition-colors last:border-b-0 hover:text-terracotta"
              >
                <span className="font-mono text-[11px] tracking-widest text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>

        {/* Auth */}
        {!isLoggedIn && (
          <div className="mt-auto flex flex-col gap-3 border-t border-foreground/10 px-6 py-6">
            <SheetClose asChild>
              <Button
                asChild
                className="h-11 w-full rounded-md bg-ink text-sm text-cream hover:bg-ink/90"
              >
                <Link href="/registro/club">Crear cuenta</Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button
                asChild
                variant="outline"
                className="h-11 w-full rounded-md border-foreground/15 text-sm"
              >
                <Link href="/login">Entrar</Link>
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
