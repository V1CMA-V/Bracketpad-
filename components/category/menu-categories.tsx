'use client'

import { useState } from 'react'

const tabs = [
  'Estadísticas',
  'Favoritas',
  'Cuadro completo',
  'Por rondas',
  'Parejas',
  'Análisis',
  'Reglamento',
]

export function MenuCategories() {
  const [active, setActive] = useState('Cuadro completo')

  return (
    <section className="mx-auto w-full px-6 max-w-[1600px]">
      <nav className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-y border-border py-3">
        {/* Pestañas */}
        <ul className="flex flex-wrap items-center gap-x-7 gap-y-2">
          {tabs.map((tab) => {
            const isActive = tab === active
            return (
              <li key={tab}>
                <button
                  onClick={() => setActive(tab)}
                  className={`relative py-1.5 font-mono text-xs tracking-widest uppercase transition-colors ${
                    isActive
                      ? 'text-ink'
                      : 'text-muted-foreground hover:text-ink'
                  }`}
                >
                  {tab}
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-terracotta" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Estado / acción */}
        <div className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase">
          <span className="text-muted-foreground">Actualizado hace 4 min</span>
          <span className="text-muted-foreground">·</span>
          <button className="text-ink transition-colors hover:text-terracotta">
            Compartir
          </button>
        </div>
      </nav>
    </section>
  )
}
