'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FormState } from '@/lib/form'

/**
 * Los datos de contacto de un cliente (C1). El mismo formulario sirve para dar de alta y para editar:
 * cambia el botón y, al editar, viaja el identificador.
 */

export type ClientDefaults = {
  legalName: string
  taxId: string
  email: string
  phone: string
}

const VACIO: ClientDefaults = { legalName: '', taxId: '', email: '', phone: '' }

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="h-[42px] px-5" disabled={pending}>
      {pending ? 'Guardando…' : label}
    </Button>
  )
}

function Field({
  id,
  label,
  defaultValue,
  error,
  type = 'text',
  required = false,
}: {
  id: string
  label: string
  defaultValue: string
  error?: string
  type?: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        defaultValue={defaultValue}
        required={required}
        aria-invalid={error ? true : undefined}
        className="h-[42px]"
      />
      {error ? <p className="text-[13px] text-destructive">{error}</p> : null}
    </div>
  )
}

export function ClientForm({
  action,
  submitLabel,
  clientId,
  defaults = VACIO,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>
  submitLabel: string
  clientId?: string
  defaults?: ClientDefaults
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {})
  const fieldErrors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="legalName"
          label="Razón social"
          defaultValue={defaults.legalName}
          error={fieldErrors.legalName}
          required
        />
        <Field
          id="taxId"
          label="NIF"
          defaultValue={defaults.taxId}
          error={fieldErrors.taxId}
          required
        />
        <Field
          id="email"
          label="Correo de contacto"
          type="email"
          defaultValue={defaults.email}
          error={fieldErrors.email}
        />
        <Field
          id="phone"
          label="Teléfono"
          defaultValue={defaults.phone}
          error={fieldErrors.phone}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {state.error}
        </p>
      ) : null}

      <div>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  )
}
