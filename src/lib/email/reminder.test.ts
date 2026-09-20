import { describe, expect, it } from 'vitest'

import { buildReminderEmail } from './reminder'

/**
 * M2 · El correo del recordatorio lleva el título de la solicitud, su fecha límite y un enlace al
 * portal. Se prueba sin llamar a ningún servicio: esto solo monta el texto.
 */

const RECORDATORIO = {
  title: 'Facturas de compras de enero',
  dueDate: '2026-03-31',
  link: 'https://carpeta.example/cliente',
}

describe('buildReminderEmail', () => {
  it('M2 · dice qué falta, para cuándo y dónde subirlo', () => {
    const email = buildReminderEmail(RECORDATORIO)

    expect(email.subject).toContain('Facturas de compras de enero')
    expect(email.text).toContain('31/03/2026')
    expect(email.text).toContain('https://carpeta.example/cliente')
    expect(email.html).toContain('https://carpeta.example/cliente')
  })

  it('escapa lo que escribió una persona, que puede llevar cualquier cosa', () => {
    const email = buildReminderEmail({
      ...RECORDATORIO,
      title: 'Facturas <script>alert(1)</script>',
    })

    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;')
  })
})
