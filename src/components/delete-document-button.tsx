'use client'

import { useFormStatus } from 'react-dom'

import { deleteDocumentAction } from '@/app/_actions/documents'
import { Button } from '@/components/ui/button'

/** D7 · Borrar un documento mientras no esté aprobado. */

function Boton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="outline" className="h-[34px] px-3 text-[13px]" disabled={pending}>
      {pending ? 'Borrando…' : 'Borrar'}
    </Button>
  )
}

export function DeleteDocumentButton({ documentId }: { documentId: string }) {
  return (
    <form action={deleteDocumentAction}>
      <input type="hidden" name="documentId" value={documentId} />
      <Boton />
    </form>
  )
}
