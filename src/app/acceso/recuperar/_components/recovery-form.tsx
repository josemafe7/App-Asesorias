'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { requestPasswordReset, type RecoveryState } from '../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="h-[42px] w-full" disabled={pending}>
      {pending ? 'Enviando…' : 'Enviarme el enlace'}
    </Button>
  )
}

export function RecoveryForm() {
  const [state, formAction] = useActionState<RecoveryState, FormData>(requestPasswordReset, {})

  if (state.sent) {
    return (
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        Si esa dirección tiene cuenta en el portal, te acabamos de enviar un correo con un enlace para
        poner una contraseña nueva. Revisa también la carpeta de correo no deseado.
      </p>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-[42px]"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  )
}
