import { z } from 'zod'

import type { DayString } from '@/lib/dates'

/**
 * S1 · El título y la fecha límite son obligatorios; la descripción, no.
 * S2 · La fecha límite no puede ser anterior a hoy en el momento de crear la solicitud.
 *
 * El día de hoy entra como parámetro en vez de mirarlo el esquema: así lo decide el servidor (el día
 * que es en España) y la prueba no depende de cuándo se ejecute.
 */

export const MAX_TITLE = 120
export const MAX_DESCRIPTION = 500

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/

/** `2026-02-31` tiene la forma de una fecha, pero no existe. */
function esUnDiaDeVerdad(day: string): boolean {
  const fecha = new Date(`${day}T00:00:00Z`)

  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === day
}

export function buildRequestSchema(today: DayString) {
  return z.object({
    dossierId: z.uuid(),
    title: z
      .string()
      .trim()
      .min(1, { error: 'Escribe qué documentación hace falta.' })
      .max(MAX_TITLE, { error: `El título no puede pasar de ${MAX_TITLE} caracteres.` }),
    description: z
      .string()
      .trim()
      .max(MAX_DESCRIPTION, { error: `La descripción no puede pasar de ${MAX_DESCRIPTION} caracteres.` })
      .transform((value) => value || null),
    dueDate: z
      .string()
      .refine((value) => FORMATO_FECHA.test(value) && esUnDiaDeVerdad(value), {
        error: 'Elige una fecha límite.',
      })
      .refine((value) => value >= today, {
        error: 'La fecha límite no puede ser anterior a hoy.',
      }),
  })
}

export type RequestInput = z.infer<ReturnType<typeof buildRequestSchema>>
