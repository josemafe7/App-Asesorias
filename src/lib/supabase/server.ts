import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { env } from '@/lib/env'

import type { Database } from './database.types'

/**
 * Cliente de Supabase para código de servidor: páginas, Server Actions y Route Handlers.
 *
 * Usa la clave publicable, así que todo lo que haga pasa por las reglas por filas de la base de datos:
 * si una política no deja ver algo, este cliente no lo ve. Esa es la idea.
 *
 * En Next.js 16 `cookies()` es asíncrono, de ahí el `await`.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Un Server Component no puede escribir cookies. No pasa nada: el proxy (src/proxy.ts) ya
            // refresca la sesión en cada petición y deja las cookies al día.
          }
        },
      },
    },
  )
}
