'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import type { FormState } from '@/lib/form'

import { openDossierAction } from '../../../expedientes/actions'

/** E1 · Abrir el expediente de un cliente para un año y un trimestre. */

const TRIMESTRES = [1, 2, 3, 4]

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="h-[42px] px-5" disabled={pending}>
      {pending ? 'Abriendo…' : 'Abrir expediente'}
    </Button>
  )
}

export function OpenDossierForm({
  clientId,
  years,
  defaultYear,
  defaultQuarter,
}: {
  clientId: string
  years: number[]
  defaultYear: number
  defaultQuarter: number
}) {
  const [state, formAction] = useActionState<FormState, FormData>(openDossierAction, {})

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="clientId" value={clientId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="year">Año</Label>
        <NativeSelect id="year" name="year" defaultValue={String(defaultYear)} className="w-[140px]">
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="quarter">Trimestre</Label>
        <NativeSelect
          id="quarter"
          name="quarter"
          defaultValue={String(defaultQuarter)}
          className="w-[140px]"
        >
          {TRIMESTRES.map((quarter) => (
            <option key={quarter} value={quarter}>
              T{quarter}
            </option>
          ))}
        </NativeSelect>
      </div>

      <SubmitButton />

      {state.error ? (
        <p role="alert" className="w-full text-[13px] text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
