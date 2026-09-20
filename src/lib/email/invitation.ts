import { APP_NAME, FIRM_NAME } from '@/lib/app-config'

/**
 * A5 · El correo de invitación: el enlace con el que una persona entra por primera vez y pone su
 * contraseña.
 *
 * Solo monta el texto. De enviarlo se encarga `sendEmail`, y así esto se puede probar sin llamar a
 * ningún servicio.
 */

/**
 * Lo que dura el enlace. Lo decide Supabase, en Authentication › Emails › Email OTP Expiration: si ahí
 * se cambia, se cambia aquí, porque el correo y la pantalla se lo dicen a la persona.
 */
export const INVITATION_EXPIRY_HOURS = 24

/** El nombre lo escribe una persona en un formulario: en el HTML del correo va escapado. */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export type Email = { subject: string; text: string; html: string }

export function buildInvitationEmail({
  fullName,
  link,
}: {
  fullName: string
  link: string
}): Email {
  const subject = `Tu acceso a ${APP_NAME}`

  const text = [
    `Hola, ${fullName}:`,
    '',
    `${FIRM_NAME} te ha dado acceso a ${APP_NAME}, el sitio donde subes tus facturas y tus tickets de`,
    'cada trimestre.',
    '',
    'Para entrar por primera vez, pon tu contraseña aquí:',
    link,
    '',
    `El enlace caduca a las ${INVITATION_EXPIRY_HOURS} horas. Si se te pasa, pide uno nuevo desde «He`,
    'olvidado mi contraseña», en la pantalla de acceso.',
    '',
    'Si no esperabas este correo, puedes ignorarlo.',
  ].join('\n')

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#fafaf9;font-family:Inter,system-ui,sans-serif;color:#1f1d1b;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:14px;padding:28px;">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hola, ${escapeHtml(fullName)}:</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        ${escapeHtml(FIRM_NAME)} te ha dado acceso a ${escapeHtml(APP_NAME)}, el sitio donde subes tus
        facturas y tus tickets de cada trimestre.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
        Para entrar por primera vez, pon tu contraseña:
      </p>
      <p style="margin:0 0 24px;">
        <a href="${escapeHtml(link)}" style="display:inline-block;background:#1f1d1b;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:8px;">Poner mi contraseña</a>
      </p>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#57534e;">
        El enlace caduca a las ${INVITATION_EXPIRY_HOURS} horas. Si se te pasa, pide uno nuevo desde «He
        olvidado mi contraseña», en la pantalla de acceso.
      </p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#57534e;">
        Si no esperabas este correo, puedes ignorarlo.
      </p>
    </div>
  </body>
</html>`

  return { subject, text, html }
}
