import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

/**
 * Redirección optimista en el edge: si no hay cookie de sesión, manda a /login
 * antes de renderizar el dashboard. NO es la comprobación de seguridad real —
 * solo lee la presencia de la cookie, no la valida ni comprueba el rol.
 *
 * La verificación autoritativa (sesión válida + rol `club_staff`) vive en el
 * layout del dashboard mediante `requireClubAccess()`.
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Protege todo lo que cuelga de /dashboard.
  matcher: ['/dashboard/:path*'],
}
