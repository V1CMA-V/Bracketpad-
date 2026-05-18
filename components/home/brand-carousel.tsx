const brands = [
  'Club Pádel Madrid',
  'Bullpadel',
  'Head Padel',
  'Babolat',
  'Nox',
  'Wilson',
  'Adidas Padel',
  'Siux',
  'StarVie',
  'Royal Padel',
  'Akkeron',
  'Drop Shot',
]

export function BrandCarousel() {
  return (
    <section
      aria-label="Marcas y clubes asociados"
      className="border-y border-foreground/10 bg-background py-8 overflow-hidden"
    >
      <p className="mb-6 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
        — Confían en bandeja · 312 clubes · 18.420 jugadores —
      </p>

      <div
        className="group relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
      >
        <Track />
        <Track aria-hidden />
      </div>
    </section>
  )
}

function Track({ 'aria-hidden': ariaHidden }: { 'aria-hidden'?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden}
      className="flex shrink-0 items-center gap-14 pr-14 animate-marquee group-hover:[animation-play-state:paused]"
    >
      {brands.map((brand, i) => (
        <li
          key={`${brand}-${i}`}
          className="flex items-center gap-3 whitespace-nowrap font-serif text-2xl italic text-foreground/70"
        >
          <span className="size-1.5 rounded-full bg-terracotta/70" />
          {brand}
        </li>
      ))}
    </ul>
  )
}
