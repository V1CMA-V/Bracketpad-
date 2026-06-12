import { SectionHeader } from '../ui/section-header'
import {
  type Tournament,
  TournamentCard,
} from './tournament-card'
import { TournamentTabs } from './tournament-tabs'

const tournaments: Tournament[] = [
  {
    index: 1,
    total: 3,
    tag: 'destacado',
    watermark: 'nº 01',
    status: 'En juego · Cuartos',
    meta: 'Master 1000 · 15 — 28 jun 2026',
    title: 'Open de Verano',
    subtitle: '1ª — 4ª · masculina, femenina, mixta',
    location: 'Club Marítimo del Olivar · Valencia',
    inscritos: '128/192',
    premio: '€3.500',
    plazas: '64',
    cta: 'Ver en vivo',
  },
  {
    index: 2,
    total: 3,
    tag: 'abierta',
    status: 'Cierra 04 jul',
    meta: 'Open · 10 — 14 jul 2026',
    title: 'Trofeo del Olivar XII',
    subtitle: '8 categorías · cuadro a 32',
    location: 'Club Marítimo · Valencia',
    inscritos: '142/256',
    premio: '€6.000',
    plazas: '114',
    cta: 'Inscribirme',
  },
  {
    index: 3,
    total: 3,
    tag: 'nuevo',
    status: 'Cierra 15 jun',
    meta: 'Nocturno · 22 jun — 5 jul',
    title: 'Mixto Solsticio',
    subtitle: 'Categoría única · parejas mixtas',
    location: 'Pádel La Albufera · Catarroja',
    inscritos: '38/64',
    premio: '€1.200',
    plazas: '26',
    cta: 'Inscribirme',
  },
]

export function Features() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          eyebrow="Cartelera · Jun — Jul 2026"
          title="Torneos"
          italic="destacados"
          description="Tres citas de la temporada — del lunes 15 al domingo 28. Hay plazas en las tres, también en cuadros femeninos y mixtos."
        />
        <TournamentTabs />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {tournaments.map((t) => (
          <TournamentCard
            key={t.index}
            tournament={t}
            className={t.tag === 'destacado' ? 'md:col-span-2' : 'md:col-span-1'}
          />
        ))}
      </div>
    </section>
  )
}
