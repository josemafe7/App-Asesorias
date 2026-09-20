import { APP_NAME, FIRM_NAME } from '@/lib/app-config'
import { formatDay, type DayString } from '@/lib/dates'

import { escapeHtml, type Email } from './email'

/**
 * M2 · El recordatorio de una solicitud pendiente: qué falta, para cuándo y dónde subirlo.
 *
 * Lo manda el trabajo diario (M1) y también el asesor a mano (M6): es el mismo correo.
 */

export function buildReminderEmail({
  title,
  dueDate,
  link,
}: {
  title: string
  dueDate: DayString
  link: string
}): Email {
  const fecha = formatDay(dueDate)
  const subject = `Te falta por subir: ${title}`

  const text = [
    'Hola:',
    '',
    `${FIRM_NAME} te recuerda que falta esta documentación del trimestre:`,
    '',
    `  ${title}`,
    `  Fecha límite: ${fecha}`,
    '',
    `Puedes subirla desde ${APP_NAME}:`,
    link,
    '',
    'Si ya la has subido, no hace falta que hagas nada.',
  ].join('\n')

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#fafaf9;font-family:Inter,system-ui,sans-serif;color:#1f1d1b;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:14px;padding:28px;">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hola:</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        ${escapeHtml(FIRM_NAME)} te recuerda que falta esta documentación del trimestre:
      </p>
      <p style="margin:0 0 8px;font-size:17px;font-weight:600;line-height:1.5;">
        ${escapeHtml(title)}
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#57534e;">
        Fecha límite: ${escapeHtml(fecha)}
      </p>
      <p style="margin:0 0 24px;">
        <a href="${escapeHtml(link)}" style="display:inline-block;background:#1f1d1b;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:8px;">Subir la documentación</a>
      </p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#57534e;">
        Si ya la has subido, no hace falta que hagas nada.
      </p>
    </div>
  </body>
</html>`

  return { subject, text, html }
}
