'use client'

import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'

import { cancelRequestAction } from '../actions'

/** S5 · El asesor cancela una solicitud y deja de reclamarse. */

function Boton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="outline" className="h-[34px] px-3 text-[13px]" disabled={pending}>
      {pending ? 'Cancelando…' : 'Cancelar'}
    </Button>
  )
}

export function CancelRequestButton({ requestId }: { requestId: string }) {
  return (
    <form action={cancelRequestAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <Boton />
    </form>
  )
}
