import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar'
import {
  TournamentTeams,
  type TeamItem,
} from '@/components/dashboard/tournament-teams'
import {
  TournamentGroupGenerator,
  type GroupData,
} from '@/components/dashboard/tournament-group-generator'
import { Button } from '@/components/ui/button'
import { getManagedClub } from '@/lib/club'
import { prisma } from '@/lib/prisma'
import { formatMoney } from '@/lib/money'
import {
  categoryLabel,
  drawTypeLabels,
} from '@/lib/tournaments'
import { clubDateKey, clubTimeLabel, formatInClubTz } from '@/lib/timezone'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; catId: string }>
}): Promise<Metadata> {
  const { catId } = await params
  const category = await prisma.tournamentCategory.findUnique({
    where: { id: catId },
    select: { name: true },
  })
  return { title: `${category?.name ?? 'Categoría'} · Bandeja` }
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right text-sm text-foreground">{value}</dd>
    </div>
  )
}

export default async function TorneoCategoriaPage({
  params,
}: {
  params: Promise<{ id: string; catId: string }>
}) {
  const { id, catId } = await params
  const club = await getManagedClub()
  if (!club) notFound()

  const category = await prisma.tournamentCategory.findFirst({
    where: { id: catId, tournamentId: id, clubId: club.id },
    include: {
      tournament: { select: { id: true, name: true } },
      teams: {
        orderBy: [{ seed: 'asc' }, { createdAt: 'asc' }],
        include: {
          members: {
            include: { player: { select: { fullName: true } } },
          },
        },
      },
    },
  })

  if (!category) notFound()

  const teams: TeamItem[] = category.teams.map((t) => ({
    id: t.id,
    label:
      t.members.map((m) => m.player.fullName).join(' / ') || 'Pareja sin nombre',
    teamName: t.name,
    seed: t.seed,
    status: t.status,
  }))

  const clubPlayers = await prisma.player.findMany({
    where: { clubId: club.id },
    orderBy: { fullName: 'asc' },
    select: { id: true, fullName: true },
  })

  const isGroups = category.drawType === 'groups_playoff'
  const activeCount = teams.filter((t) => t.status !== 'withdrawn').length

  // Grupos ya generados: agrupa las parejas activas por su `groupNumber`.
  const groupMap = new Map<number, GroupData['teams']>()
  for (const t of category.teams) {
    if (t.groupNumber == null || t.status === 'withdrawn') continue
    const label =
      t.members.map((m) => m.player.fullName).join(' / ') || 'Pareja sin nombre'
    const bucket = groupMap.get(t.groupNumber) ?? []
    bucket.push({ id: t.id, label, seed: t.seed })
    groupMap.set(t.groupNumber, bucket)
  }
  const groupsBase = [...groupMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([groupNumber, groupTeams]) => ({
      groupNumber,
      teams: groupTeams.sort((a, b) => (a.seed ?? 9999) - (b.seed ?? 9999)),
    }))

  // Posición (1-based) de cada pareja dentro de su grupo, para nombrar los
  // enfrentamientos del round-robin de forma compacta (p. ej. «1 vs 2»).
  const posByGroup = new Map<number, Map<string, number>>()
  for (const g of groupsBase) {
    const m = new Map<string, number>()
    g.teams.forEach((t, i) => m.set(t.id, i + 1))
    posByGroup.set(g.groupNumber, m)
  }

  // Partidos de la fase de grupos (creados al generar). Se mapean a posiciones.
  const groupMatches = await prisma.match.findMany({
    where: { categoryId: category.id, groupNumber: { not: null } },
    orderBy: [{ groupNumber: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      groupNumber: true,
      status: true,
      winnerSide: true,
      scheduledAt: true,
      courtId: true,
      court: { select: { name: true } },
      sides: { select: { side: true, teamId: true } },
      sets: {
        orderBy: { setNumber: 'asc' },
        select: {
          gamesA: true,
          gamesB: true,
          tiebreakA: true,
          tiebreakB: true,
        },
      },
    },
  })

  const courts = await prisma.court.findMany({
    where: { clubId: club.id, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  // Etiqueta de cada pareja por su id (para nombrar las parejas en la captura).
  const labelByTeamId = new Map<string, string>()
  for (const t of category.teams) {
    labelByTeamId.set(
      t.id,
      t.members.map((m) => m.player.fullName).join(' / ') || 'Pareja sin nombre',
    )
  }

  const fixturesByGroup = new Map<number, GroupData['matches']>()
  for (const match of groupMatches) {
    if (match.groupNumber == null) continue
    const posMap = posByGroup.get(match.groupNumber)
    if (!posMap) continue
    const a = match.sides.find((s) => s.side === 'A')?.teamId
    const b = match.sides.find((s) => s.side === 'B')?.teamId
    const aPos = a ? posMap.get(a) : undefined
    const bPos = b ? posMap.get(b) : undefined
    if (aPos == null || bPos == null) continue
    const arr = fixturesByGroup.get(match.groupNumber) ?? []
    const scheduleLabel = match.scheduledAt
      ? `${formatInClubTz(match.scheduledAt, 'd MMM HH:mm')}${
          match.court ? ` · ${match.court.name}` : ''
        }`
      : null
    arr.push({
      id: match.id,
      aPos,
      bPos,
      aLabel: (a && labelByTeamId.get(a)) || '—',
      bLabel: (b && labelByTeamId.get(b)) || '—',
      status: match.status,
      winner: match.winnerSide ?? null,
      sets: match.sets.map((s) => ({
        gamesA: s.gamesA,
        gamesB: s.gamesB,
        tiebreakA: s.tiebreakA,
        tiebreakB: s.tiebreakB,
      })),
      date: match.scheduledAt ? clubDateKey(match.scheduledAt) : '',
      time: match.scheduledAt ? clubTimeLabel(match.scheduledAt) : '',
      courtId: match.courtId,
      scheduleLabel,
    })
    fixturesByGroup.set(match.groupNumber, arr)
  }

  const groups: GroupData[] = groupsBase.map((g) => ({
    ...g,
    matches: (fixturesByGroup.get(g.groupNumber) ?? []).sort(
      (x, y) => x.aPos - y.aPos || x.bPos - y.bPos,
    ),
  }))

  // Parejas activas que aún no están en ningún grupo (nuevas o quitadas).
  const unassignedTeams = category.teams
    .filter((t) => t.status !== 'withdrawn' && t.groupNumber == null)
    .map((t) => ({
      id: t.id,
      label:
        t.members.map((m) => m.player.fullName).join(' / ') ||
        'Pareja sin nombre',
      seed: t.seed,
    }))

  return (
    <>
      <DashboardTopbar>
        <Button
          asChild
          variant="outline"
          className="h-9 gap-1.5 rounded-md px-4 text-sm"
        >
          <Link href={`/dashboard/torneos/${category.tournament.id}`}>
            <ArrowLeft className="size-4" strokeWidth={2} />
            {category.tournament.name}
          </Link>
        </Button>
      </DashboardTopbar>

      <div className="mx-auto max-w-[1600px] px-8 py-10">
        {/* ---- Encabezado ---- */}
        <section className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {categoryLabel(category.gender, category.skillLevel)}
              <span className="text-foreground/25">·</span>
              {drawTypeLabels[category.drawType] ?? category.drawType}
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {category.name}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {activeCount} pareja{activeCount === 1 ? '' : 's'} activa
              {activeCount === 1 ? '' : 's'}
              {category.maxTeams != null ? ` de ${category.maxTeams} de cupo` : ''}.
            </p>
          </div>
        </section>

        {/* ---- Módulos ---- */}
        <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-12 border-t border-border pt-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Columna principal */}
          <div className="space-y-12">
            <TournamentTeams
              categoryId={category.id}
              teams={teams}
              players={clubPlayers.map((p) => ({ id: p.id, name: p.fullName }))}
              maxTeams={category.maxTeams}
            />

            {isGroups && (
              <TournamentGroupGenerator
                categoryId={category.id}
                activeTeamCount={activeCount}
                groups={groups}
                unassignedTeams={unassignedTeams}
                advancePerGroup={category.advancePerGroup}
                bestOfSets={category.bestOfSets}
                tiebreakAt={category.tiebreakAt}
                courts={courts}
              />
            )}
          </div>

          {/* Columna lateral */}
          <aside className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Configuración · categoría
              </p>
              <dl className="mt-3 divide-y divide-border">
                <DataRow
                  label="Sistema"
                  value={drawTypeLabels[category.drawType] ?? category.drawType}
                />
                <DataRow label="Sets" value={`Al mejor de ${category.bestOfSets}`} />
                <DataRow
                  label="Punto de oro"
                  value={category.goldenPoint ? 'Sí' : 'No'}
                />
                <DataRow label="Tie-break en" value={`${category.tiebreakAt} juegos`} />
                {isGroups && category.teamsPerGroup != null && (
                  <DataRow
                    label="Parejas por grupo"
                    value={String(category.teamsPerGroup)}
                  />
                )}
                {isGroups && category.advancePerGroup != null && (
                  <DataRow
                    label="Avanzan por grupo"
                    value={String(category.advancePerGroup)}
                  />
                )}
                <DataRow
                  label="Cupo"
                  value={
                    category.maxTeams != null
                      ? `${category.maxTeams} parejas`
                      : 'Sin límite'
                  }
                />
                <DataRow
                  label="Inscripción"
                  value={
                    category.entryFee != null
                      ? formatMoney(Number(category.entryFee), category.currency)
                      : 'Gratuita'
                  }
                />
              </dl>
            </div>

            {/* Premio */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Premio
              </p>
              {category.prize ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {category.prize}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Sin premio definido. Añádelo desde la categoría en la ficha del
                  torneo.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
