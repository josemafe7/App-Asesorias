'use client'

import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'

import { sendReminderAction } from '../actions'

/** M6 · El asesor manda el recordatorio de una solicitud pendiente cuando quiere. */

function Boton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="outline" className="h-[34px] px-3 text-[13px]" disabled={pending}>
      {pending ? 'Enviando…' : 'Recordar'}
    </Button>
  )
}

export function ReminderButton({ requestId }: { requestId: string }) {
  return (
    <form action={sendReminderAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <Boton />
    </form>
  )
}
