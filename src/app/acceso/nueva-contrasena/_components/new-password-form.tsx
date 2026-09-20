'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { MIN_PASSWORD_LENGTH } from '@/lib/validation/auth'

import { setPassword, type NewPasswordState } from '../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="h-[42px] w-full" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar y entrar'}
    </Button>
  )
}

export function NewPasswordForm() {
  const [state, formAction] = useActionState<NewPasswordState, FormData>(setPassword, {})

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña nueva</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          className="h-[42px]"
          aria-describedby="password-help"
        />
        <p id="password-help" className="text-[13px] text-muted-foreground">
          Al menos {MIN_PASSWORD_LENGTH} caracteres.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="repeat">Repite la contraseña</Label>
        <Input
          id="repeat"
          name="repeat"
          type="password"
          autoComplete="new-password"
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
