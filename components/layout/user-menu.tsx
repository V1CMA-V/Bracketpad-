'use client'

import { LayoutDashboard, LogOut, User } from 'lucide-react'
import Link from 'next/link'

import { signOutAction } from '@/lib/actions/auth'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type UserMenuProps = {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    accountType?: string | null
  }
}

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || ''
  if (!source) return '?'
  const parts = source.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function UserMenu({ user }: UserMenuProps) {
  const isClubStaff = user.accountType === 'club_staff'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Abrir menú de usuario"
      >
        <Avatar>
          {user.image ? (
            <AvatarImage src={user.image} alt={user.name ?? 'Avatar'} />
          ) : null}
          <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-1.5">
          <span className="text-sm font-medium text-foreground">
            {user.name ?? 'Mi cuenta'}
          </span>
          {user.email ? (
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isClubStaff ? (
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <LayoutDashboard />
              Ir al dashboard
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/cuenta">
              <User />
              Ver perfil
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem variant="destructive" asChild>
            <button type="submit" className="w-full">
              <LogOut />
              Salir
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
