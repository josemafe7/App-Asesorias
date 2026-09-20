'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { insertClient, listAdvisors, setClientActive, setClientAdvisor, updateClient } from '@/data/clients'
import { requireRole } from '@/lib/auth-guards'
import { fieldErrorsFrom, type FormState } from '@/lib/form'
import { assignAdvisorSchema, clientSchema } from '@/lib/validation/clients'

/**
 * Lo que el administrador hace con los clientes: darlos de alta, editarlos, asignarlos a un asesor y
 * desactivarlos (C1, C2, C3, C5, C6).
 *
 * Todas empiezan igual: comprobando en el servidor que quien llama es administrador. Una Server Action
 * se puede llamar desde fuera aunque su botón no esté en la pantalla (docs/security.md).
 */

const idSchema = z.uuid()

function clientInputFrom(formData: FormData) {
  return {
    legalName: String(formData.get('legalName') ?? ''),
    taxId: String(formData.get('taxId') ?? ''),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? ''),
  }
}

export async function createClientAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole('admin')

  const parsed = clientSchema.safeParse(clientInputFrom(formData))
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

  const result = await insertClient(parsed.data)
  if (!result.ok) return { error: result.message }

  revalidatePath('/admin/clientes')
  redirect(`/admin/clientes/${result.id}`)
}

export async function updateClientAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole('admin')

  const id = idSchema.safeParse(formData.get('clientId'))
  if (!id.success) return { error: 'No se sabe de qué cliente se trata.' }

  const parsed = clientSchema.safeParse(clientInputFrom(formData))
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

  const result = await updateClient(id.data, parsed.data)
  if (!result.ok) return { error: result.message }

  revalidatePath('/admin/clientes')
  // Se vuelve a cargar la ficha en vez de quedarse donde estaba: así lo que se ve es lo que hay
  // guardado, y no lo que se acaba de escribir en el formulario.
  redirect(`/admin/clientes/${id.data}?guardado=1`)
}

/** C3 y C5 · Asignar o reasignar. El asesor elegido tiene que ser uno de la lista, y estar activo. */
export async function changeAdvisorAction(formData: FormData): Promise<void> {
  await requireRole('admin')

  const id = idSchema.safeParse(formData.get('clientId'))
  const parsed = assignAdvisorSchema.safeParse({ advisorId: formData.get('advisorId') })
  if (!id.success || !parsed.success) return

  const { advisorId } = parsed.data
  if (advisorId) {
    const advisors = await listAdvisors()
    if (!advisors.some((advisor) => advisor.id === advisorId)) return
  }

  await setClientAdvisor(id.data, advisorId)

  revalidatePath(`/admin/clientes/${id.data}`)
  revalidatePath('/admin/clientes')
  revalidatePath('/asesor')
}

/** C6 · Desactivar y volver a activar. No borra nada. */
export async function toggleClientActiveAction(formData: FormData): Promise<void> {
  await requireRole('admin')

  const id = idSchema.safeParse(formData.get('clientId'))
  if (!id.success) return

  await setClientActive(id.data, formData.get('isActive') === 'true')

  revalidatePath(`/admin/clientes/${id.data}`)
  revalidatePath('/admin/clientes')
  revalidatePath('/asesor')
}
