import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { env } from '@/lib/env'

// Rutas que se pueden abrir sin haber iniciado sesión.
// `/api/recordatorios` la llama el programador de tareas del servidor, que no tiene sesión: lo que la
// protege es el secreto compartido que comprueba la propia ruta (M5).
const PUBLIC_PATHS = ['/acceso', '/auth', '/api/recordatorios']

/**
 * En Next.js 16 este archivo se llama `proxy` (antes era `middleware`) y siempre se ejecuta en Node.js.
 *
 * Hace una sola cosa: refrescar la sesión en cada petición y mandar a la pantalla de acceso a quien no
 * tenga ninguna. **No decide permisos.** Cada página, Server Action y Route Handler comprueba por su
 * cuenta quién es el usuario y si puede tocar ese dato concreto (docs/security.md · «Usuarios y
 * permisos»). Un proxy se puede esquivar; una comprobación en la página, no.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // No metas nada entre createServerClient y getClaims(): cualquier error aquí se manifiesta como
  // usuarios a los que se les cierra la sesión sin motivo aparente, y es dificilísimo de depurar.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // A1 · Quien no ha iniciado sesión acaba en la pantalla de acceso.
  if (!claims && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/acceso'
    url.search = ''
    const redirect = NextResponse.redirect(url)
    // Las cookies que acaba de refrescar Supabase tienen que viajar también en esta respuesta, o el
    // navegador y el servidor se desincronizan.
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie)
    }
    return redirect
  }

  return response
}

export const config = {
  matcher: [
    // Todo menos los archivos estáticos y las imágenes, que no necesitan sesión.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
