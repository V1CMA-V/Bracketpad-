type Skill = {
  label: string
  value: number
}

const SKILLS: Skill[] = [
  { label: 'Defensa', value: 94 },
  { label: 'Bandeja', value: 88 },
  { label: 'Víbora', value: 71 },
  { label: 'Remate', value: 66 },
  { label: 'Saque', value: 79 },
  { label: 'Volea', value: 83 },
]

const TRAITS = [
  { label: 'Mano dominante', value: 'Diestro' },
  { label: 'Posición', value: 'Revés' },
  { label: 'Golpe favorito', value: 'Bandeja' },
  { label: 'Perfil', value: 'Defensivo' },
]

export function PlayingStyle() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-6 md:px-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Perfil de juego · Valoración media
        </p>
        <h2 className="mt-2 font-heading text-4xl leading-none tracking-tight text-ink md:text-5xl">
          Cómo <em className="italic">juega.</em>
        </h2>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Rasgos */}
        <div className="rounded-lg bg-ink p-7 text-cream">
          <p className="font-mono text-xs uppercase tracking-widest text-cream/55">
            Ficha técnica
          </p>
          <dl className="mt-5 flex flex-col divide-y divide-cream/10">
            {TRAITS.map((t) => (
              <div
                key={t.label}
                className="flex items-center justify-between py-3.5"
              >
                <dt className="font-mono text-[11px] uppercase tracking-widest text-cream/55">
                  {t.label}
                </dt>
                <dd className="font-heading text-lg text-cream">{t.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Barras de habilidad */}
        <div className="rounded-lg border border-border bg-card px-6 py-2 md:px-8">
          {SKILLS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-2 border-b border-border py-5 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </span>
                <span className="font-mono text-lg text-ink tabular-nums">
                  {s.value}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-forest"
                  style={{ width: `${s.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
