import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateObject } from 'ai'
import { describe, expect, it } from 'vitest'

import { proposalSchema } from './read-document'

/**
 * Comprobación de mantenimiento: el modelo configurado sigue existiendo y sigue respondiendo con la
 * forma que espera la app.
 *
 * Es la mitigación aprobada en `docs/security.md` («Excepciones aprobadas») para usar un modelo en
 * preview. **No se ejecuta con `pnpm test`**: la IA cuesta dinero y las pruebas no llaman a servicios de
 * pago (docs/testing.md). Solo corre cuando se le pasan las claves a propósito:
 *
 *     OPENROUTER_API_KEY=sk-or-... OPENROUTER_MODEL=... pnpm exec vitest run src/lib/ai/modelo.test.ts
 *
 * Si algún día falla, el modelo ha cambiado o ha desaparecido: hay que cambiar OPENROUTER_MODEL.
 */

const apiKey = process.env.OPENROUTER_API_KEY
const model = process.env.OPENROUTER_MODEL

const FACTURA = [
  'FACTURA 2026/0123',
  'Fecha: 15/03/2026',
  'Iberdrola Clientes SAU, NIF A95758389',
  'Base imponible: 100,00 EUR',
  'IVA 21%: 21,00 EUR',
  'Total: 121,00 EUR',
].join('\n')

describe.skipIf(!apiKey || !model)('el modelo configurado', () => {
  it(
    'sigue respondiendo con los campos del esquema',
    async () => {
      const openrouter = createOpenRouter({
        apiKey: apiKey!,
        extraBody: { provider: { data_collection: 'deny' } },
      })

      const { object } = await generateObject({
        model: openrouter.chat(model!),
        schema: proposalSchema,
        system: 'Devuelves solo lo que leas con seguridad. Lo que no aparezca, null.',
        prompt: `Lee este texto de una factura y rellena los campos:\n\n${FACTURA}`,
        abortSignal: AbortSignal.timeout(60_000),
      })

      expect(object.total).toBe(121)
      expect(object.supplier).toMatch(/Iberdrola/i)
    },
    90_000,
  )
})
