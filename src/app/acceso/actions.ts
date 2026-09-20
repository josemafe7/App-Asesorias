'use server'

import { redirect } from 'next/navigation'
import { getCurrentProfile, ROLE_HOME } from '@/data/profile'
import { checkRateLimit, peekRateLimit, resetRateLimit } from '@/lib/rate-limit'
import { requestIp } from '@/lib/request-ip'
import { createClient } from '@/lib/supabase/server'
import { signInSchema } from '@/lib/validation/auth'

// A8 · Cinco intentos fallidos por dirección cada quince minutos.
const LOGIN_MAX_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000

export type SignInState = { error?: string }

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const ip = await requestIp()
  const limitKey = `acceso:${ip}`

  // Solo se miran los intentos fallidos ya apuntados: acertar no gasta cupo (A8).
  const limit = peekRateLimit(limitKey, LOGIN_MAX_ATTEMPTS)
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60)
    return {
      error: `Demasiados intentos. Vuelve a probar dentro de ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`,
    }
  }

  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  // El mensaje es siempre el mismo, acierte el correo o no: así nadie puede averiguar qué direcciones
  // tienen cuenta probando una a una.
  const genericError = 'El correo o la contraseña no son correctos.'
  if (!parsed.success) return { error: genericError }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    // A8 · El intento fallido se apunta ahora, que es cuando cuenta.
    checkRateLimit(limitKey, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)
    // A9 · Queda registro del intento fallido. Sin contraseña y sin datos personales de más.
    console.warn('[acceso] intento fallido', { ip, at: new Date().toISOString() })
    return { error: genericError }
  }

  // A4 · La contraseña era correcta, pero la cuenta puede estar desactivada o sin perfil.
  const profile = await getCurrentProfile()
  if (!profile) {
    await supabase.auth.signOut()
    return { error: 'Tu cuenta no está activa. Ponte en contacto con tu asesoría.' }
  }

  resetRateLimit(limitKey)

  // A3 · Cada uno a su panel.
  redirect(ROLE_HOME[profile.role])
}

export async function signOut(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/acceso')
}
