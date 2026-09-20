'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FormState } from '@/lib/form'

import { rejectDocumentAction } from '../actions'

/** R5 · Rechazar un documento indicando un motivo, que es obligatorio y lo lee el cliente. */

export function RejectForm({ documentId }: { documentId: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(rejectDocumentAction, {})

  return (
    // El botón de rechazar no está aquí: vive en la barra fija de abajo, junto al de aprobar, y
    // manda este formulario por su identificador (DESIGN.md · «Layout»).
    <form id="rechazo" action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="documentId" value={documentId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reason">Motivo</Label>
        <Input
          id="reason"
          name="reason"
          required
          placeholder="Se ve borroso: no se lee el importe"
          aria-invalid={state.fieldErrors?.reason ? true : undefined}
          className="h-[42px]"
        />
        <p className="text-[13px] text-muted-foreground">
          Lo va a leer tu cliente, para que pueda subir otro en su lugar.
        </p>
        {state.fieldErrors?.reason ? (
          <p className="text-[13px] text-destructive">{state.fieldErrors.reason}</p>
        ) : null}
      </div>

      {state.error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
