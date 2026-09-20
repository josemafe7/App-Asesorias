import 'server-only'

import { APP_NAME } from '@/lib/app-config'

import type { Email } from './email'

/**
 * Envía un correo con Resend (docs/decisions/0004-correo-resend.md).
 *
 * Se llama a su API con una petición normal, sin añadir ninguna librería: es un POST con la clave en la
 * cabecera. La clave vive solo aquí, en el servidor, y nunca sale en los registros.
 *
 * Hay un modo consola, en el que el correo se escribe en la consola del servidor en vez de enviarse. Se
 * entra en él de dos formas:
 *
 * - a propósito, con EMAIL_TRANSPORT=console. Es lo que hacen las pruebas, que arrancan la app compilada
 *   y no deben llamar a un servicio de pago (docs/testing.md);
 * - sin querer, cuando no hay clave de Resend. Eso solo se admite mientras se construye: en producción,
 *   quedarse sin clave hace fallar el envío en vez de fingir que ha salido.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/** Escribe el correo en la consola del servidor, con su enlace, en vez de enviarlo. */
function writeToConsole(to: string, email: Email): void {
  console.info(`[correo] sin enviar, modo consola. Para: ${to}\n${email.subject}\n${email.text}`)
}

export async function sendEmail(to: string, email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? `${APP_NAME} <onboarding@resend.dev>`

  if (process.env.EMAIL_TRANSPORT === 'console') {
    writeToConsole(to, email)
    return
  }

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('No hay forma de enviar correos: falta RESEND_API_KEY.')
    }

    writeToConsole(to, email)
    return
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  })

  if (!response.ok) {
    // Lo que responde el servicio puede traer detalles suyos: se queda en el registro, no llega a la
    // pantalla de nadie (docs/security.md · «Límites y errores»).
    console.error('[correo] Resend no ha aceptado el envío', { status: response.status })
    throw new Error('No se ha podido enviar el correo.')
  }
}
