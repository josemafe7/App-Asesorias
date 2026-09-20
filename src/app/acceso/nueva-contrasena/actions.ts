'use server'

import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/data/profile'
import { ROLE_HOME } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'
import { newPasswordSchema } from '@/lib/validation/auth'

export type NewPasswordState = { error?: string }

export async function setPassword(
  _previous: NewPasswordState,
  formData: FormData,
): Promise<NewPasswordState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get('password'),
    repeat: formData.get('repeat'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa la contraseña.' }
  }

  const supabase = await createClient()

  // Solo puede llegar aquí quien tiene sesión, y la sesión solo la da el enlace del correo.
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims) return { error: 'El enlace ya no vale. Pide otro desde la pantalla de acceso.' }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: 'No se ha podido guardar la contraseña. Inténtalo otra vez.' }

  const profile = await getCurrentProfile()
  if (!profile) {
    await supabase.auth.signOut()
    return { error: 'Tu cuenta no está activa. Ponte en contacto con tu asesoría.' }
  }

  redirect(ROLE_HOME[profile.role])
}
