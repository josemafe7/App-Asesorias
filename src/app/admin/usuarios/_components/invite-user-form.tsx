'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import type { FormState } from '@/lib/form'
import { ROLE_LABELS, ROLES } from '@/lib/roles'

import { inviteUserAction } from '../actions'

/**
 * A5 · Invitar a una persona: se le crea la cuenta y le llega un correo para poner su contraseña.
 *
 * C7 · La empresa solo hace falta cuando el rol es Cliente. El desplegable se queda en la pantalla y
 * solo cambia el texto de ayuda, para que no baile nada al elegir el rol.
 */

export type EmpresaOption = { id: string; legalName: string }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="h-[42px] px-5" disabled={pending}>
      {pending ? 'Enviando…' : 'Enviar invitación'}
    </Button>
  )
}

export function InviteUserForm({
  empresas,
  empresaPorDefecto,
}: {
  empresas: EmpresaOption[]
  empresaPorDefecto?: string
}) {
  const [state, formAction] = useActionState<FormState, FormData>(inviteUserAction, {})

  // Los desplegables los lleva React, y no el navegador por su cuenta: así lo elegido no se deshace
  // mientras la pantalla termina de cargarse, ni cuando el formulario vuelve con un error.
  const [role, setRole] = useState('client')
  const [clientId, setClientId] = useState(empresaPorDefecto ?? '')

  const fieldErrors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="flex max-w-[520px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Nombre y apellidos</Label>
        <Input id="fullName" name="fullName" required className="h-[42px]" />
        {fieldErrors.fullName ? (
          <p className="text-[13px] text-destructive">{fieldErrors.fullName}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" name="email" type="email" required className="h-[42px]" />
        {fieldErrors.email ? (
          <p className="text-[13px] text-destructive">{fieldErrors.email}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role">Rol</Label>
        <NativeSelect
          id="role"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          {ROLES.map((value) => (
            <option key={value} value={value}>
              {ROLE_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clientId">Empresa</Label>
        <NativeSelect
          id="clientId"
          name="clientId"
          value={clientId}
          onChange={(event) => setClientId(event.target.value)}
        >
          <option value="">Sin empresa</option>
          {empresas.map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.legalName}
            </option>
          ))}
        </NativeSelect>
        <p className="text-[13px] text-muted-foreground">
          {role === 'client'
            ? 'Verá los expedientes y los documentos de esta empresa, y de ninguna otra.'
            : 'Solo hace falta elegir empresa cuando el rol es Cliente.'}
        </p>
        {fieldErrors.clientId ? (
          <p className="text-[13px] text-destructive">{fieldErrors.clientId}</p>
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
