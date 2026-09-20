'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getClient } from '@/data/clients'
import { getDossier, insertDossier, setDossierStatus } from '@/data/dossiers'
import { cancelRequest, getRequest, insertRequest } from '@/data/requests'
import { requireRole } from '@/lib/auth-guards'
import { todayInSpain } from '@/lib/dates'
import { fieldErrorsFrom, type FormState } from '@/lib/form'
import { dossierSchema } from '@/lib/validation/dossiers'
import { buildRequestSchema } from '@/lib/validation/requests'

/**
 * Lo que el asesor hace con los expedientes y las solicitudes (E1, E3, S1, S2, S5).
 *
 * Cada acción vuelve a comprobar quién es y si ese expediente está a su alcance: una Server Action se
 * puede llamar desde fuera aunque el botón no esté en la pantalla (docs/security.md).
 */

const idSchema = z.uuid()

export async function openDossierAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole('admin', 'advisor')

  const parsed = dossierSchema.safeParse({
    clientId: String(formData.get('clientId') ?? ''),
    year: String(formData.get('year') ?? ''),
    quarter: String(formData.get('quarter') ?? ''),
  })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

  // C4 · Si el cliente no es suyo, las políticas no lo devuelven y aquí se para.
  if (!(await getClient(parsed.data.clientId))) {
    return { error: 'Ese cliente no está entre los tuyos.' }
  }

  const result = await insertDossier(parsed.data)
  if (!result.ok) return { error: result.message }

  revalidatePath(`/asesor/clientes/${parsed.data.clientId}`)
  redirect(`/asesor/expedientes/${result.id}`)
}

export async function createRequestAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole('admin', 'advisor')

  // S2 · «Hoy» es el día que es en España, no el del reloj del servidor.
  const parsed = buildRequestSchema(todayInSpain()).safeParse({
    dossierId: String(formData.get('dossierId') ?? ''),
    title: String(formData.get('title') ?? ''),
    description: String(formData.get('description') ?? ''),
    dueDate: String(formData.get('dueDate') ?? ''),
  })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

  if (!(await getDossier(parsed.data.dossierId))) {
    return { error: 'Ese expediente no está entre los tuyos.' }
  }

  const result = await insertRequest(parsed.data)
  if (!result.ok) return { error: result.message }

  revalidatePath(`/asesor/expedientes/${parsed.data.dossierId}`)
  // Se vuelve a cargar el expediente para que lo que se ve salga de la base de datos.
  redirect(`/asesor/expedientes/${parsed.data.dossierId}?creada=1`)
}

/** S5 · Cancelar una solicitud: deja de reclamarse. */
export async function cancelRequestAction(formData: FormData): Promise<void> {
  await requireRole('admin', 'advisor')

  const id = idSchema.safeParse(formData.get('requestId'))
  if (!id.success) return

  const request = await getRequest(id.data)
  if (!request) return

  await cancelRequest(id.data)

  revalidatePath(`/asesor/expedientes/${request.dossierId}`)
}

/** E3 · Cerrar el expediente al terminar, o volver a abrirlo. */
export async function toggleDossierStatusAction(formData: FormData): Promise<void> {
  await requireRole('admin', 'advisor')

  const id = idSchema.safeParse(formData.get('dossierId'))
  if (!id.success) return

  const status = formData.get('status') === 'closed' ? 'closed' : 'open'
  await setDossierStatus(id.data, status)

  revalidatePath(`/asesor/expedientes/${id.data}`)
}
