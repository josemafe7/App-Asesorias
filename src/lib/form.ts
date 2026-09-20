import type { z } from 'zod'

/**
 * Lo que un formulario recibe de vuelta de su Server Action.
 *
 * `error` es lo que va mal en conjunto («ya hay un cliente con ese NIF») y `fieldErrors` lo que va mal
 * en un campo concreto. Nunca llevan detalles de la base de datos: eso se queda en el registro del
 * servidor (docs/security.md · «Límites y errores»).
 */
export type FormState = {
  error?: string
  fieldErrors?: Record<string, string>
}

/** Traduce lo que dice Zod a un mensaje por campo. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && !errors[field]) errors[field] = issue.message
  }

  return errors
}
