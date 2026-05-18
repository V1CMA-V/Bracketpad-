import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Plataforma',
    links: [
      { label: 'Torneos', href: '/torneos' },
      { label: 'Clubes', href: '/clubes' },
      { label: 'Ranking', href: '/ranking' },
      { label: 'Calendario', href: '/calendario' },
      { label: 'Cómo funciona', href: '/como-funciona' },
    ],
  },
  {
    title: 'Para clubes',
    links: [
      { label: 'Crear torneo', href: '/clubes/crear' },
      { label: 'Gestión de cuadros', href: '/clubes/cuadros' },
      { label: 'Cobros y reembolsos', href: '/clubes/pagos' },
      { label: 'API y datos', href: '/clubes/api' },
      { label: 'Precios', href: '/precios' },
    ],
  },
  {
    title: 'Para jugadores',
    links: [
      { label: 'Crear ficha', href: '/jugadores/crear' },
      { label: 'Buscar pareja', href: '/jugadores/parejas' },
      { label: 'Mi ranking', href: '/jugadores/ranking' },
      { label: 'Notificaciones', href: '/jugadores/avisos' },
      { label: 'Reglas y scoring', href: '/jugadores/scoring' },
    ],
  },
  {
    title: 'Redacción',
    links: [
      { label: 'Manual de uso', href: '/manual' },
      { label: 'Diario del cuadro', href: '/diario' },
      { label: 'Prensa y kit', href: '/prensa' },
      { label: 'Contacto', href: '/contacto' },
      { label: 'Trabaja con nosotros', href: '/equipo' },
    ],
  },
]

const legal = [
  { label: 'Aviso legal', href: '/legal/aviso' },
  { label: 'Privacidad', href: '/legal/privacidad' },
  { label: 'Cookies', href: '/legal/cookies' },
  { label: 'Términos', href: '/legal/terminos' },
]

export function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto w-full max-w-7xl px-6 py-16">
        {/* Top: brand + newsletter */}
        <div className="grid gap-10 border-b border-cream/10 pb-12 md:grid-cols-12">
          <div className="md:col-span-5 flex flex-col gap-5">
            <Link
              href="/"
              className="flex items-baseline gap-2 font-serif text-4xl leading-none tracking-tight"
            >
              <span className="flex items-baseline">
                bandeja
                <span className="ml-0.5 inline-block size-2 translate-y-[-2px] rounded-full bg-terracotta" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-cream/60">
                Est. 2026
              </span>
            </Link>
            <p className="font-serif italic text-lg leading-snug text-cream/75 max-w-md">
              Plataforma editorial para clubes que organizan torneos de pádel.
              Inscripciones, cuadros, programación y resultados — en un solo gesto.
            </p>
          </div>

          <div className="md:col-span-6 md:col-start-7 flex flex-col gap-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-lime">
              ● Boletín · cada lunes
            </p>
            <p className="font-serif text-2xl leading-tight text-cream max-w-md">
              Recibe el cuadro de la semana, fichajes de parejas y crónicas desde pista.
            </p>
            <form className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <Input
                type="email"
                required
                placeholder="tu@correo.com"
                aria-label="Email"
                className="h-11 flex-1 rounded-md border-cream/15 bg-cream/5 px-4 text-cream placeholder:text-cream/40 focus-visible:border-cream/40"
              />
              <Button
                type="submit"
                className="h-11 rounded-md bg-cream px-5 text-ink hover:bg-cream/90 font-medium"
              >
                Suscribirme
              </Button>
            </form>
            <p className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
              Sin spam. Cancela cuando quieras.
            </p>
          </div>
        </div>

        {/* Link columns */}
        <nav className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-cream/50">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-cream/80 transition-colors hover:text-lime"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-6 border-y border-cream/10 py-8 md:grid-cols-4">
          <Stat value="312" label="Clubes inscritos" />
          <Stat value="18.420" label="Jugadores activos" />
          <Stat value="4.820" label="Torneos organizados" />
          <Stat value="98%" label="Cuadros sin retraso" accent />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col-reverse gap-6 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-cream/50">
            © 2026 Bandeja Editorial S.L. · Hecho en Valencia con café y buena pista.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legal.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="font-mono text-[10px] uppercase tracking-widest text-cream/60 transition-colors hover:text-cream"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cream/60 transition-colors hover:text-cream"
              >
                Github <ArrowUpRight className="size-3" />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}

function Stat({
  value,
  label,
  accent,
}: {
  value: string
  label: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={`font-serif text-3xl leading-none ${accent ? 'text-lime' : 'text-cream'}`}
      >
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-cream/50">
        {label}
      </span>
    </div>
  )
}
