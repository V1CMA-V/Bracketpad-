import { siteConfig } from '@/lib/site'
import { ImageResponse } from 'next/og'

// Imagen Open Graph por defecto del sitio (se hereda en todas las rutas que no
// definan la suya). Se genera con next/og en el edge.
export const runtime = 'edge'

export const alt = `${siteConfig.name} · ${siteConfig.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          backgroundColor: '#1a1612',
          color: '#f1ebde',
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            fontSize: 36,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 9999,
              backgroundColor: '#b85a3c',
            }}
          />
          {siteConfig.name}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ fontSize: 84, lineHeight: 1.05, maxWidth: 900 }}>
            {siteConfig.tagline}
          </div>
          <div style={{ fontSize: 32, color: '#b85a3c' }}>
            Torneos · Ligas · Pistas · Reservas
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
