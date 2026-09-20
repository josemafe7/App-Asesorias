import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { safeNextPathSchema } from '@/lib/validation/auth'

// Los tipos de enlace que aceptamos. Cualquier otro se rechaza.
const VALID_TYPES = ['invite', 'recovery', 'email_change', 'signup'] as const

const paramsSchema = z.object({
  token_hash: z.string().min(1),
  type: z.enum(VALID_TYPES),
  // Solo se admite volver a una ruta de la propia app, nunca a otro dominio (docs/security.md).
  next: safeNextPathSchema.default('/acceso/nueva-contrasena'),
})

/**
 * A5, A6 · Donde aterrizan los enlaces de invitación y de recuperación que llegan por correo.
 *
 * Canjea el testigo del enlace por una sesión y manda a poner la contraseña. Si el enlace ha caducado o
 * está manipulado, se va a la pantalla de acceso con un aviso, sin decir por qué exactamente.
 */
export async function GET(request: NextRequest) {
  const raw = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = paramsSchema.safeParse(raw)

  if (!parsed.success) redirect('/acceso?enlace=caducado')

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    type: parsed.data.type as EmailOtpType,
    token_hash: parsed.data.token_hash,
  })

  if (error) redirect('/acceso?enlace=caducado')

  redirect(parsed.data.next)
}
