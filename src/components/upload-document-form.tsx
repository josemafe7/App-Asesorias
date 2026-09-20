'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { uploadDocumentAction } from '@/app/_actions/documents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { MAX_FILE_BYTES } from '@/lib/files'
import type { FormState } from '@/lib/form'

/**
 * D1 y D4 · Un archivo por documento, respondiendo a una solicitud o sin ninguna.
 *
 * Lo mismo sirve para el cliente y para la asesoría.
 */

export type RequestOption = { id: string; title: string }

const GRANDE = 'Solo se admiten archivos JPG, PNG, WebP o PDF de hasta 10 MB.'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="h-[42px] px-5" disabled={pending}>
      {pending ? 'Subiendo…' : 'Subir documento'}
    </Button>
  )
}

export function UploadDocumentForm({
  dossierId,
  requests,
}: {
  dossierId: string
  requests: RequestOption[]
}) {
  const [state, formAction] = useActionState<FormState, FormData>(uploadDocumentAction, {})
  const [demasiadoGrande, setDemasiadoGrande] = useState(false)
  const fieldErrors = state.fieldErrors ?? {}

  // El servidor también lo comprueba (D2). Aquí se avisa antes de mandar diez megas por la red.
  const error = demasiadoGrande ? GRANDE : fieldErrors.file

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="dossierId" value={dossierId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="file">Archivo</Label>
          <Input
            id="file"
            name="file"
            type="file"
            required
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            aria-invalid={error ? true : undefined}
            className="h-[42px] py-2"
            onChange={(event) => {
              const elegido = event.target.files?.[0]
              setDemasiadoGrande(Boolean(elegido && elegido.size > MAX_FILE_BYTES))
            }}
          />
          <p className="text-[13px] text-muted-foreground">
            Un documento por archivo: JPG, PNG, WebP o PDF, hasta 10 MB.
          </p>
          {error ? <p className="text-[13px] text-destructive">{error}</p> : null}
        </div>

        {requests.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="requestId">¿Responde a algo que te piden?</Label>
            <NativeSelect id="requestId" name="requestId" defaultValue="" className="h-[42px]">
              <option value="">No, lo subo por mi cuenta</option>
              {requests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.title}
                </option>
              ))}
            </NativeSelect>
            {fieldErrors.requestId ? (
              <p className="text-[13px] text-destructive">{fieldErrors.requestId}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {state.error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {state.error}
        </p>
      ) : null}

      <div>
        <SubmitButton />
      </div>
    </form>
  )
}
