import { z } from 'zod'

/**
 * E1 · El expediente de un cliente para un año y un trimestre concretos.
 *
 * Lo que llega de un formulario siempre es texto: el esquema lo convierte a número y, de paso, deja
 * fuera lo que no lo es.
 */

export const MIN_YEAR = 2000
export const MAX_YEAR = 2100

export const dossierSchema = z.object({
  clientId: z.uuid(),
  year: z.coerce
    .number({ error: 'Elige un año.' })
    .int({ error: 'Elige un año.' })
    .min(MIN_YEAR, { error: 'Elige un año.' })
    .max(MAX_YEAR, { error: 'Elige un año.' }),
  quarter: z.coerce
    .number({ error: 'Elige un trimestre.' })
    .int({ error: 'Elige un trimestre.' })
    .min(1, { error: 'Elige un trimestre.' })
    .max(4, { error: 'Elige un trimestre.' }),
})

export type DossierInput = z.infer<typeof dossierSchema>
