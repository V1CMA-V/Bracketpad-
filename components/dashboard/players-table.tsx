'use client'

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PlayerFields } from '@/components/dashboard/player-fields'
import {
  genderLabels,
  skillLevelLabels,
  type Gender,
  type SkillLevel,
} from '@/lib/players'
import {
  deletePlayer,
  updatePlayer,
  type PlayerFormState,
} from '@/app/dashboard/jugadores/actions'

const initialState: PlayerFormState = {}

const tableRow = 'grid items-center gap-4'
const tableGrid: React.CSSProperties = {
  gridTemplateColumns: '32px minmax(0, 1.8fr) 116px 116px 92px 84px',
}

export type PlayerItem = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  gender: string | null
  skillLevel: string
  dominantHand: string | null
  birthDate: string | null
  participations: number
  deletable: boolean
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function PlayerRow({ player, index }: { player: PlayerItem; index: number }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  const boundAction = useMemo(
    () => updatePlayer.bind(null, player.id),
    [player.id],
  )
  const [state, formAction, saving] = useActionState(boundAction, initialState)

  useEffect(() => {
    if (state.success) setEditing(false)
  }, [state.success])

  const remove = () =>
    startTransition(() => {
      void deletePlayer(player.id)
    })

  /* ---- Modo edición ---- */
  if (editing) {
    return (
      <li className="px-3 py-4">
        <form
          action={formAction}
          noValidate
          className="rounded-xl border border-foreground/30 bg-card p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Editando · {player.fullName}
            </span>
            <button
              type="button"
              onClick={() => setEditing(false)}
              title="Cancelar"
              className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>

          {state.error && (
            <p className="mb-4 text-xs text-destructive">{state.error}</p>
          )}

          <PlayerFields
            defaults={player}
            errors={state.fieldErrors}
            idPrefix={`edit-${player.id}`}
          />

          <div className="mt-6 flex items-center gap-2 border-t border-border pt-4">
            <Button
              type="submit"
              className="h-8 rounded-md px-3 text-sm"
              disabled={saving}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 rounded-md px-3 text-sm text-muted-foreground"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </li>
    )
  }

  /* ---- Modo vista ---- */
  const skill = (player.skillLevel as SkillLevel) ?? 'unranked'
  const ranked = skill !== 'unranked'
  const contact = player.email ?? player.phone

  return (
    <li className={cn(pending && 'opacity-50')}>
      <div style={tableGrid} className={cn(tableRow, 'px-3 py-3.5')}>
        <span className="font-serif text-lg text-muted-foreground/70 tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 font-mono text-[11px] text-muted-foreground">
            {initials(player.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-foreground">
              {player.fullName}
            </p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {contact ?? 'Sin contacto'}
            </p>
          </div>
        </div>

        <span
          className={cn(
            'font-mono text-[11px] uppercase tracking-wider',
            ranked ? 'text-foreground' : 'text-muted-foreground/70',
          )}
        >
          {ranked ? skillLevelLabels[skill] : 'Sin categoría'}
        </span>

        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {player.gender
            ? genderLabels[player.gender as Gender]
            : '—'}
        </span>

        <span className="text-center font-mono text-sm text-foreground tabular-nums">
          {player.participations}
        </span>

        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Editar jugador"
            className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-4" strokeWidth={2} />
          </button>
          {player.deletable ? (
            <ConfirmDialog
              title={`¿Eliminar a ${player.fullName}?`}
              description="Se quitará del club. Esta acción no se puede deshacer."
              confirmLabel="Eliminar"
              destructive
              onConfirm={remove}
              trigger={
                <button
                  type="button"
                  disabled={pending}
                  title="Eliminar jugador"
                  className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-terracotta/40 hover:bg-terracotta/10 hover:text-terracotta disabled:opacity-50"
                >
                  <Trash2 className="size-4" strokeWidth={2} />
                </button>
              }
            />
          ) : (
            <button
              type="button"
              disabled
              title="No se puede eliminar: tiene inscripciones o partidos"
              className="flex size-8 cursor-not-allowed items-center justify-center rounded-md border border-border text-muted-foreground/40"
            >
              <Trash2 className="size-4" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

export function PlayersTable({ players }: { players: PlayerItem[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return players
    return players.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        (p.email?.toLowerCase().includes(q) ?? false) ||
        (p.phone?.toLowerCase().includes(q) ?? false),
    )
  }, [players, query])

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Listado · {filtered.length}{' '}
          {filtered.length === 1 ? 'jugador' : 'jugadores'}
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o contacto…"
          className="h-9 w-64 max-w-full rounded-md border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[720px]">
          <div
            style={tableGrid}
            className={cn(
              tableRow,
              'border-b border-border px-3 pb-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground',
            )}
          >
            <span>Nº</span>
            <span>Jugador</span>
            <span>Categoría</span>
            <span>Género</span>
            <span className="text-center">Part.</span>
            <span className="sr-only">Acciones</span>
          </div>

          {filtered.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              No hay jugadores que coincidan con la búsqueda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((player, i) => (
                <PlayerRow key={player.id} player={player} index={i} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
