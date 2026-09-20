import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { env } from '@/lib/env'

import type { Database } from './database.types'

/**
 * Cliente de Supabase con la clave secreta. **Se salta las reglas por filas de la base de datos.**
 *
 * Existe por una sola razón: crear la cuenta de un usuario nuevo y generar su enlace de invitación
 * (A5) no se puede hacer de otra forma, porque esa parte de Supabase solo responde a la clave secreta.
 *
 * Reglas de uso, que se comprueban en la revisión:
 * - solo desde Server Actions de administrador, y siempre después de `requireRole('admin')`;
 * - solo para crear, invitar o borrar cuentas; los datos de la app se leen y se escriben con el cliente
 *   normal, para que las políticas sigan mandando;
 * - nunca se importa desde un componente de navegador: el `import 'server-only'` de arriba lo impide.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!secretKey) {
    throw new Error('Falta SUPABASE_SECRET_KEY: no se pueden crear ni invitar usuarios.')
  }

  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
