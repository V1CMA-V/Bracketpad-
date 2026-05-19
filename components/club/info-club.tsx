const SCHEDULE = [
  { day: 'Lun — Vie', hours: '07:00 — 23:30', highlight: false },
  { day: 'Sábado', hours: '08:00 — 22:00', highlight: false },
  { day: 'Domingo', hours: '08:00 — 21:00', highlight: false },
  { day: 'Festivos', hours: '09:00 — 14:00', highlight: true },
]

const RATES = [
  { label: 'Cubierta', value: "€24 / 90'", highlight: false },
  { label: 'Aire libre', value: "€18 / 90'", highlight: false },
  { label: 'Socios', value: '-40%', highlight: false },
  { label: 'Nocturna', value: '+€4', highlight: true },
]

export function InfoClub() {
  return (
    <section className="bg-cream px-6 py-16 md:px-12">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Map card */}
        <article
          className="relative flex aspect-[5/3] flex-col justify-between overflow-hidden rounded-md border border-border bg-card p-8"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent 0 39px, rgba(0,0,0,0.04) 39px 40px),' +
              'repeating-linear-gradient(90deg, transparent 0 39px, rgba(0,0,0,0.04) 39px 40px)',
          }}
        >
          <header>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Cómo llegar
            </p>
            <h3 className="mt-3 font-heading text-4xl leading-tight text-ink">
              Av. del Puerto, <em className="italic">238.</em>
            </h3>
            <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              46011 Valencia · España
            </p>
          </header>

          {/* Coast line + pin */}
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2">
            <span
              className="absolute left-1/2 top-2 z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-terracotta text-cream"
              aria-hidden
            >
              <span className="h-2 w-2 rounded-full bg-cream" />
            </span>
            <svg
              viewBox="0 0 600 120"
              className="block h-24 w-full text-muted/60"
              preserveAspectRatio="none"
            >
              <path
                d="M0,70 C100,30 180,90 280,60 C380,30 460,90 600,55 L600,120 L0,120 Z"
                fill="currentColor"
                opacity="0.5"
              />
              <path
                d="M0,70 C100,30 180,90 280,60 C380,30 460,90 600,55"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.7"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
            </svg>
          </div>

          <footer className="relative grid grid-cols-3 gap-6 font-mono text-xs">
            {[
              { label: 'Metro', value: 'Marítim — 4 min' },
              { label: 'Aparcamiento', value: '120 plazas' },
              { label: 'Tranvía', value: 'Línea 6 · Grau' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-ink">{item.value}</span>
              </div>
            ))}
          </footer>
        </article>

        {/* Hours + contact card */}
        <article className="flex flex-col gap-6 rounded-md border border-border bg-card p-8">
          <header>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Horario · Contacto
            </p>
            <h3 className="mt-3 font-heading text-4xl leading-tight text-ink">
              <em className="italic">Abierto</em> de 07:00 a 23:30
            </h3>
          </header>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Horarios
              </p>
              <dl className="mt-3 flex flex-col gap-2 font-mono text-sm">
                {SCHEDULE.map((s) => (
                  <div
                    key={s.day}
                    className={
                      'flex items-center justify-between ' +
                      (s.highlight ? 'text-terracotta' : 'text-ink')
                    }
                  >
                    <dt>{s.day}</dt>
                    <dd>{s.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Tarifas pista
              </p>
              <dl className="mt-3 flex flex-col gap-2 font-mono text-sm">
                {RATES.map((r) => (
                  <div
                    key={r.label}
                    className={
                      'flex items-center justify-between ' +
                      (r.highlight ? 'text-terracotta' : 'text-ink')
                    }
                  >
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <hr className="border-border" />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Teléfono
              </p>
              <p className="mt-2 font-mono text-sm text-ink">96 365 18 24</p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Email
              </p>
              <p className="mt-2 font-mono text-sm text-ink">hola@maritimoolivar.es</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
