import { timingSafeEqual } from 'node:crypto'

import { listRequestsForDailyReminder, markReminderSentByJob } from '@/data/reminders'
import { todayInSpain } from '@/lib/dates'
import { buildReminderEmail } from '@/lib/email/reminder'
import { sendEmail } from '@/lib/email/send'
import { env } from '@/lib/env'
import { canSendReminder, deliverReminder } from '@/lib/reminders'

/**
 * M1-M5 · El trabajo diario que recuerda lo que falta.
 *
 * Lo llama una vez al día el programador de tareas de Dokploy (docs/security.md · «Se publica en un
 * VPS»). Aquí no hay ninguna persona identificada: lo único que autoriza es el secreto compartido, sin
 * el cual esta dirección responde que no está permitido (M5).
 */

/** Se comparan en tiempo constante: así la respuesta no dice si se ha acertado media clave. */
function secretoCorrecto(recibido: string, esperado: string): boolean {
  const a = Buffer.from(recibido)
  const b = Buffer.from(esperado)

  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request): Promise<Response> {
  const secreto = process.env.CRON_SECRET

  if (!secreto) {
    console.error('[recordatorios] falta CRON_SECRET: el trabajo diario no se ejecuta')
    return Response.json({ error: 'No disponible' }, { status: 503 })
  }

  const cabecera = request.headers.get('authorization') ?? ''
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice('Bearer '.length) : ''

  // M5 · Sin el secreto acordado, no se hace nada.
  if (!secretoCorrecto(token, secreto)) {
    return Response.json({ error: 'No permitido' }, { status: 401 })
  }

  const hoy = todayInSpain()
  const ahora = new Date()
  const solicitudes = await listRequestsForDailyReminder(hoy)

  let enviados = 0
  let fallidos = 0

  for (const solicitud of solicitudes) {
    // M3 y M4 · Una sola vez por solicitud, y nunca de una cumplida o cancelada (que ya no salen en la
    // consulta, pero la regla se comprueba igual aquí).
    const puede = canSendReminder(
      { status: 'pending', dueDate: solicitud.dueDate, reminderSentAt: solicitud.reminderSentAt },
      { now: ahora, today: hoy, automatic: true },
    )
    if (!puede.ok || solicitud.emails.length === 0) continue

    const email = buildReminderEmail({
      title: solicitud.title,
      dueDate: solicitud.dueDate,
      link: `${env.NEXT_PUBLIC_SITE_URL}/cliente`,
    })

    // M8 · Si un correo no sale, se sigue con los demás: con el resto de usuarios de esta empresa y con
    // las solicitudes que quedan por recorrer.
    const entrega = await deliverReminder(solicitud.emails, (destinatario) =>
      sendEmail(destinatario, email),
    )

    // M3 y M8 · Solo se da por recordada si ha salido para alguien. Si no, mañana se vuelve a intentar.
    if (entrega.sent > 0) {
      await markReminderSentByJob(solicitud.requestId)
      enviados += 1
    } else {
      fallidos += 1
      console.error('[recordatorios] no ha salido el recordatorio de una solicitud', {
        solicitud: solicitud.requestId,
      })
    }
  }

  // Sin datos de nadie: solo cuántos han salido y cuántos no.
  console.info(`[recordatorios] enviados ${enviados}, fallidos ${fallidos}`)

  return Response.json({ enviados, fallidos })
}
