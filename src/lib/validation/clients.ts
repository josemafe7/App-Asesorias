import { z } from 'zod'

/**
 * Las reglas de los datos de un cliente, separadas de las Server Actions para poder probarlas solas.
 *
 * C1 · La razón social y el NIF son obligatorios; el correo y el teléfono, no.
 * C2 · No se pueden dar de alta dos clientes con el mismo NIF.
 */

const MAX_NAME = 120
const MAX_TAX_ID = 20
const MAX_PHONE = 30

/** Un campo que se puede dejar en blanco: sin texto, se guarda vacío y no como cadena vacía. */
const optionalText = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value === '' ? null : value))

export const clientSchema = z.object({
  legalName: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, 'La razón social es obligatoria.')
    .refine((value) => value.length <= MAX_NAME, 'La razón social es demasiado larga.'),

  // C2 · Se normaliza aquí y la base de datos obliga a lo mismo: así «b12345678 » y «B12345678» no
  // pueden colarse como dos empresas distintas.
  taxId: z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => value.length > 0, 'El NIF es obligatorio.')
    .refine((value) => value.length <= MAX_TAX_ID, 'El NIF es demasiado largo.'),

  email: optionalText.refine(
    (value) => value === null || z.email().safeParse(value).success,
    'El correo no es válido.',
  ),

  phone: optionalText.refine(
    (value) => value === null || value.length <= MAX_PHONE,
    'El teléfono es demasiado largo.',
  ),
})

export type ClientInput = z.infer<typeof clientSchema>

/** C3 · El asesor asignado. «Sin asignar» es una opción válida: un cliente puede quedarse sin asesor. */
export const assignAdvisorSchema = z.object({
  advisorId: z
    .string()
    .transform((value) => value.trim())
    .transform((value) => (value === '' ? null : value))
    .refine(
      (value) => value === null || z.uuid().safeParse(value).success,
      'Elige un asesor de la lista.',
    ),
})
