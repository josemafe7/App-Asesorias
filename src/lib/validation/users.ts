import { z } from 'zod'

import { ROLES } from '@/lib/roles'

/**
 * Las reglas de los datos de un usuario, separadas de las Server Actions para poder probarlas solas.
 *
 * A5 · El administrador crea un usuario y le llega una invitación.
 * C7 · Cada usuario de tipo cliente pertenece a una empresa; un administrador o un asesor, a ninguna.
 */

const MAX_NAME = 120

const empresa = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value === '' ? null : value))

type RoleAndCompany = { role: string; clientId: string | null }

/** C7 · Un usuario cliente necesita empresa, y tiene que ser una de la lista. */
function checkCompany(value: RoleAndCompany, ctx: z.RefinementCtx): void {
  if (value.role !== 'client') return

  if (!value.clientId) {
    ctx.addIssue({
      code: 'custom',
      path: ['clientId'],
      message: 'Elige la empresa a la que pertenece.',
    })
    return
  }

  if (!z.uuid().safeParse(value.clientId).success) {
    ctx.addIssue({ code: 'custom', path: ['clientId'], message: 'Elige una empresa de la lista.' })
  }
}

/**
 * C7 · Un administrador o un asesor no pertenecen a ninguna empresa.
 *
 * El formulario manda siempre el desplegable de empresa, también cuando el rol elegido es asesor o
 * administrador. En ese caso la empresa no se rechaza: se ignora, que es lo que esperaría quien lo está
 * rellenando.
 */
function clearCompanyIfNotClient<T extends RoleAndCompany>(value: T): T {
  return value.role === 'client' ? value : { ...value, clientId: null }
}

export const inviteUserSchema = z
  .object({
    fullName: z
      .string()
      .transform((value) => value.trim())
      .refine((value) => value.length > 0, 'El nombre es obligatorio.')
      .refine((value) => value.length <= MAX_NAME, 'El nombre es demasiado largo.'),

    email: z
      .string()
      .transform((value) => value.trim().toLowerCase())
      .refine((value) => z.email().safeParse(value).success, 'El correo no es válido.'),

    role: z.enum(ROLES),

    clientId: empresa,
  })
  .superRefine(checkCompany)
  .transform(clearCompanyIfNotClient)

export const changeRoleSchema = z
  .object({
    userId: z.uuid('No se sabe a qué usuario se refiere.'),
    role: z.enum(ROLES),
    clientId: empresa,
  })
  .superRefine(checkCompany)
  .transform(clearCompanyIfNotClient)

export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>
