import { describe, expect, it } from 'vitest'

import { buildInvitationEmail } from './invitation'

/**
 * A5 · Cuando el administrador crea un usuario, le llega un correo de invitación con un enlace para
 * poner su contraseña. El enlace caduca.
 *
 * Aquí se comprueba lo que el correo dice y lleva. Que salga de verdad, no: en las pruebas no se llama al
 * servicio de correo (docs/testing.md y docs/decisions/0004-correo-resend.md).
 */

const LINK = 'https://carpeta.example/auth/confirm?token_hash=abc123&type=invite'

describe('correo de invitación', () => {
  it('lleva el enlace para poner la contraseña, en la versión con formato y en la de texto', () => {
    const email = buildInvitationEmail({ fullName: 'Pablo Espiga', link: LINK })

    // En el HTML el enlace va escapado (el & se escribe &amp;), que es como se escribe un enlace en HTML.
    expect(email.html).toContain('token_hash=abc123')
    expect(email.text).toContain(LINK)
  })

  it('saluda a la persona por su nombre y dice de parte de quién va', () => {
    const email = buildInvitationEmail({ fullName: 'Pablo Espiga', link: LINK })

    expect(email.text).toContain('Pablo Espiga')
    expect(email.subject).toContain('Carpeta Fiscal')
  })

  it('avisa de que el enlace caduca', () => {
    const email = buildInvitationEmail({ fullName: 'Pablo Espiga', link: LINK })

    expect(email.text.toLowerCase()).toContain('caduca')
    expect(email.html.toLowerCase()).toContain('caduca')
  })

  it('un nombre con HTML dentro no se cuela en el correo', () => {
    // El nombre lo escribe una persona en un formulario: si no se escapara, podría meter etiquetas en el
    // correo que reciben los demás.
    const email = buildInvitationEmail({ fullName: '<script>alert(1)</script>', link: LINK })

    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;')
  })
})
