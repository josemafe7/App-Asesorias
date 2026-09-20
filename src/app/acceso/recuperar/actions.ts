'use server'

import { env } from '@/lib/env'
import { checkRateLimit } from '@/lib/rate-limit'
import { requestIp } from '@/lib/request-ip'
import { createClient } from '@/lib/supabase/server'
import { emailSchema } from '@/lib/validation/auth'

// Enviar correos cuesta dinero y se puede usar para molestar: tres peticiones por hora y dirección.
const RECOVERY_MAX = 3
const RECOVERY_WINDOW_MS = 60 * 60 * 1000

export type RecoveryState = { sent?: boolean; error?: string }

export async function requestPasswordReset(
  _previous: RecoveryState,
  formData: FormData,
): Promise<RecoveryState> {
  const ip = await requestIp()
  const limit = checkRateLimit('recuperar:' + ip, RECOVERY_MAX, RECOVERY_WINDOW_MS)
  if (!limit.allowed) {
    return { error: 'Has pedido el enlace varias veces. Espera un rato antes de volver a intentarlo.' }
  }

  const parsed = emailSchema.safeParse({ email: formData.get('email') })

  // A6 · La respuesta es siempre la misma, exista la cuenta o no. Si dijéramos «ese correo no está
  // registrado», cualquiera podría averiguar quiénes son clientes de la asesoría.
  if (parsed.success) {
    const supabase = await createClient()
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: env.NEXT_PUBLIC_SITE_URL + '/auth/confirm?next=/acceso/nueva-contrasena',
    })
  }

  return { sent: true }
}
