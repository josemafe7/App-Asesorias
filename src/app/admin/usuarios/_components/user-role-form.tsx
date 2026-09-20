'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import type { FormState } from '@/lib/form'
import { ROLE_LABELS, ROLES } from '@/lib/roles'

import { changeUserRoleAction } from '../actions'

import type { EmpresaOption } from './invite-user-form'

/**
 * Cambiar el rol de una persona y, si pasa a ser cliente, su empresa (C7).
 *
 * A9 · El cambio queda registrado en el servidor.
 */

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="h-[42px] px-5" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar cambios'}
    </Button>
  )
}

export function UserRoleForm({
  userId,
  role: roleGuardado,
  clientId: clientIdGuardado,
  empresas,
}: {
  userId: string
  role: string
  clientId: string | null
  empresas: EmpresaOption[]
}) {
  const [state, formAction] = useActionState<FormState, FormData>(changeUserRoleAction, {})

  // Los desplegables los lleva React, y no el navegador por su cuenta: así lo elegido no se deshace
  // mientras la pantalla termina de cargarse, ni cuando el formulario vuelve con un error.
  const [role, setRole] = useState(roleGuardado)
  const [clientId, setClientId] = useState(clientIdGuardado ?? '')

  const fieldErrors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="flex max-w-[520px] flex-col gap-4">
      <input type="hidden" name="userId" value={userId} />

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
          Solo hace falta cuando el rol es Cliente. Al dejar de serlo, deja de pertenecer a una empresa.
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
