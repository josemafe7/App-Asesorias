/**
 * Lo común a todos los correos de la app: qué es un correo y cómo se escapa lo que escribe una persona.
 *
 * El texto de cada correo vive en su archivo (`invitation.ts`, `reminder.ts`) y el envío, en `send.ts`.
 */

export type Email = { subject: string; text: string; html: string }

/** Lo que escribe una persona en un formulario acaba en el HTML del correo: va escapado. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
