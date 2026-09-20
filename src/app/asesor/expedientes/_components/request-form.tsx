'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FormState } from '@/lib/form'

import { createRequestAction } from '../actions'

/** S1 · Pedirle documentación al cliente: título, descripción y fecha límite. */

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="h-[42px] px-5" disabled={pending}>
      {pending ? 'Creando…' : 'Crear solicitud'}
    </Button>
  )
}

export function RequestForm({ dossierId, today }: { dossierId: string; today: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(createRequestAction, {})
  const fieldErrors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="dossierId" value={dossierId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Qué hace falta</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="Facturas de compras de marzo"
            aria-invalid={fieldErrors.title ? true : undefined}
            className="h-[42px]"
          />
          {fieldErrors.title ? (
            <p className="text-[13px] text-destructive">{fieldErrors.title}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dueDate">Fecha límite</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            required
            min={today}
            aria-invalid={fieldErrors.dueDate ? true : undefined}
            className="h-[42px]"
          />
          {fieldErrors.dueDate ? (
            <p className="text-[13px] text-destructive">{fieldErrors.dueDate}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Detalles (opcional)</Label>
        <Input
          id="description"
          name="description"
          placeholder="Las del proveedor nuevo, en PDF"
          aria-invalid={fieldErrors.description ? true : undefined}
          className="h-[42px]"
        />
        {fieldErrors.description ? (
          <p className="text-[13px] text-destructive">{fieldErrors.description}</p>
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
