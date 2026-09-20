'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getClient } from '@/data/clients'
import { findUserByEmail, insertProfile, setUserActive, setUserRole } from '@/data/users'
import {
  logAccountStatusChange,
  logInvitation,
  logRoleChange,
} from '@/lib/audit'
import { requireRole } from '@/lib/auth-guards'
import { buildInvitationEmail } from '@/lib/email/invitation'
import { sendEmail } from '@/lib/email/send'
import { env } from '@/lib/env'
import { fieldErrorsFrom, type FormState } from '@/lib/form'
import { checkRateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { changeRoleSchema, inviteUserSchema } from '@/lib/validation/users'

/**
 * Lo que el administrador hace con las personas: invitarlas (A5), cambiarles el rol y desactivarlas.
 *
 * A11 · Consigo mismo no puede: ni cambiarse el rol ni desactivarse, para que la asesoría no se quede
 * sin administrador.
 */

// Cada correo enviado cuesta dinero y se puede repetir a lo tonto (docs/security.md · «Límites»).
const MAX_INVITATIONS = 20
const INVITATION_WINDOW_MS = 60 * 60 * 1000

const idSchema = z.uuid()

/** Un aviso genérico: lo que ha fallado de verdad se queda en el registro del servidor. */
const GENERIC_INVITE_ERROR = 'No se ha podido invitar a esta persona. Inténtalo otra vez.'

export async function inviteUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole('admin')

  const parsed = inviteUserSchema.safeParse({
    fullName: String(formData.get('fullName') ?? ''),
    email: String(formData.get('email') ?? ''),
    role: String(formData.get('role') ?? ''),
    clientId: String(formData.get('clientId') ?? ''),
  })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

  const { fullName, email, role, clientId } = parsed.data

  if (await findUserByEmail(email)) {
    return { error: 'Ya hay un usuario con ese correo.' }
  }

  // C7 · La empresa tiene que existir de verdad, no solo parecer un identificador.
  if (clientId && !(await getClient(clientId))) {
    return { fieldErrors: { clientId: 'Elige una empresa de la lista.' } }
  }

  // El cupo se gasta aquí, justo antes de mandar el correo, y no al entrar en la acción: un formulario
  // mal rellenado no llega a enviar nada, así que tampoco debe contar.
  const limit = checkRateLimit(`invitacion:${admin.id}`, MAX_INVITATIONS, INVITATION_WINDOW_MS)
  if (!limit.allowed) {
    return { error: 'Has enviado muchas invitaciones seguidas. Prueba dentro de un rato.' }
  }

  // Crear la cuenta y sacar el enlace de invitación es lo único que necesita la clave secreta. Supabase
  // lo genera SIN enviar nada: el correo lo manda la app, con su propio texto.
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm` },
  })

  if (error || !data.user || !data.properties) {
    console.error('[usuarios] no se ha podido crear la cuenta', { status: error?.status })
    return { error: GENERIC_INVITE_ERROR }
  }

  const profile = await insertProfile({ id: data.user.id, email, fullName, role, clientId })
  if (!profile.ok) {
    // Si el perfil no se puede crear, la cuenta recién hecha no se queda suelta.
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)
    console.error('[usuarios] perfil no creado, se deshace la cuenta', { actor: admin.id })
    return { error: GENERIC_INVITE_ERROR }
  }

  const link = `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm?${new URLSearchParams({
    token_hash: data.properties.hashed_token,
    type: 'invite',
    next: '/acceso/nueva-contrasena',
  })}`

  try {
    await sendEmail(email, buildInvitationEmail({ fullName, link }))
  } catch {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)
    console.error('[usuarios] invitación no enviada, se deshace la cuenta', { actor: admin.id })
    return {
      error: 'La invitación no ha salido. Revisa la configuración del correo e inténtalo otra vez.',
    }
  }

  // A9 · Queda registro de quién ha creado a quién. Con identificadores, sin datos personales.
  logInvitation({ actor: admin.id, user: data.user.id, role })

  revalidatePath('/admin/usuarios')
  redirect('/admin/usuarios?invitado=1')
}

export async function changeUserRoleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole('admin')

  const parsed = changeRoleSchema.safeParse({
    userId: String(formData.get('userId') ?? ''),
    role: String(formData.get('role') ?? ''),
    clientId: String(formData.get('clientId') ?? ''),
  })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

  const { userId, role, clientId } = parsed.data

  // A11 · Nadie se cambia el rol a sí mismo.
  if (userId === admin.id) {
    return { error: 'No puedes cambiar tu propio rol.' }
  }

  if (clientId && !(await getClient(clientId))) {
    return { fieldErrors: { clientId: 'Elige una empresa de la lista.' } }
  }

  const result = await setUserRole(userId, role, clientId)
  if (!result.ok) return { error: result.message }

  // A9 · Los cambios de rol quedan registrados.
  logRoleChange({ actor: admin.id, user: userId, role })

  revalidatePath('/admin/usuarios')
  // Se vuelve a cargar la ficha en vez de quedarse donde estaba: así lo que se ve es lo que hay
  // guardado, y no lo que se acaba de elegir en el formulario.
  redirect(`/admin/usuarios/${userId}?guardado=1`)
}

export async function toggleUserActiveAction(formData: FormData): Promise<void> {
  const admin = await requireRole('admin')

  const id = idSchema.safeParse(formData.get('userId'))
  if (!id.success) return

  // A11 · Nadie se desactiva a sí mismo. El botón no está en la pantalla; esto es por si alguien llama
  // a la acción por su cuenta.
  if (id.data === admin.id) {
    console.warn('[usuarios] intento de desactivarse a sí mismo', { actor: admin.id })
    return
  }

  const isActive = formData.get('isActive') === 'true'
  await setUserActive(id.data, isActive)

  logAccountStatusChange({ actor: admin.id, user: id.data, isActive })

  revalidatePath(`/admin/usuarios/${id.data}`)
  revalidatePath('/admin/usuarios')
}
