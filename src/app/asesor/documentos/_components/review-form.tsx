'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import type { ExpenseCategory } from '@/data/document-data'
import type { FormState } from '@/lib/form'

import { saveDocumentAction } from '../actions'

/**
 * R2 y R3 · El asesor corrige cualquier campo y aprueba, si no falta ninguno de los obligatorios.
 *
 * Los campos que la IA dejó pendientes se marcan, para que se vea de un vistazo lo que hay que mirar.
 */

export type ReviewDefaults = {
  issueDate: string
  supplier: string
  supplierTaxId: string
  taxBase: string
  vatRate: string
  vatAmount: string
  total: string
  categoryCode: string
}

function Botones({ aprobado }: { aprobado: boolean }) {
  const { pending } = useFormStatus()

  // DESIGN.md · «Layout»: los botones de aprobar y rechazar quedan fijos abajo.
  return (
    <div className="sticky bottom-0 -mx-6 flex flex-wrap gap-3 border-t bg-card px-6 py-4">
      <Button
        type="submit"
        name="intent"
        value="save"
        variant="outline"
        className="h-[42px] px-5"
        disabled={pending}
      >
        Guardar cambios
      </Button>
      {aprobado ? null : (
        <>
          <Button
            type="submit"
            name="intent"
            value="approve"
            className="h-[42px] px-5"
            disabled={pending}
          >
            {pending ? 'Guardando…' : 'Aprobar documento'}
          </Button>
          {/* Manda el formulario del motivo, que está justo encima. */}
          <Button type="submit" form="rechazo" variant="destructive" className="h-[42px] px-5">
            Rechazar documento
          </Button>
        </>
      )}
    </div>
  )
}

function Campo({
  id,
  label,
  defaultValue,
  error,
  pendiente,
  type = 'text',
  hint,
}: {
  id: string
  label: string
  defaultValue: string
  error?: string
  pendiente: boolean
  type?: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* La marca va fuera de la etiqueta: si estuviera dentro, el campo pasaría a llamarse
          «Proveedor pendiente» para quien usa un lector de pantalla. */}
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>{label}</Label>
        {pendiente ? <span className="text-[13px] text-urgent">pendiente</span> : null}
      </div>
      <Input
        id={id}
        name={id}
        type={type}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        className="h-[42px]"
      />
      {hint ? <p className="text-[13px] text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-[13px] text-destructive">{error}</p> : null}
    </div>
  )
}

export function ReviewForm({
  documentId,
  defaults,
  pendingFields,
  categories,
  aprobado,
}: {
  documentId: string
  defaults: ReviewDefaults
  pendingFields: string[]
  categories: ExpenseCategory[]
  aprobado: boolean
}) {
  const [state, formAction] = useActionState<FormState, FormData>(saveDocumentAction, {})
  const fieldErrors = state.fieldErrors ?? {}
  const pendiente = (campo: string) => pendingFields.includes(campo)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="documentId" value={documentId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="issueDate"
          label="Fecha"
          type="date"
          defaultValue={defaults.issueDate}
          error={fieldErrors.issueDate}
          pendiente={pendiente('issueDate')}
        />
        <Campo
          id="supplier"
          label="Proveedor"
          defaultValue={defaults.supplier}
          error={fieldErrors.supplier}
          pendiente={pendiente('supplier')}
        />
        <Campo
          id="supplierTaxId"
          label="NIF del proveedor"
          defaultValue={defaults.supplierTaxId}
          error={fieldErrors.supplierTaxId}
          pendiente={pendiente('supplierTaxId')}
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="categoryCode">Categoría</Label>
            {pendiente('categoryCode') ? (
              <span className="text-[13px] text-urgent">pendiente</span>
            ) : null}
          </div>
          <NativeSelect
            id="categoryCode"
            name="categoryCode"
            defaultValue={defaults.categoryCode}
            className="h-[42px]"
          >
            <option value="">Sin categoría</option>
            {categories.map((categoria) => (
              <option key={categoria.code} value={categoria.code}>
                {categoria.label}
              </option>
            ))}
          </NativeSelect>
          {fieldErrors.categoryCode ? (
            <p className="text-[13px] text-destructive">{fieldErrors.categoryCode}</p>
          ) : null}
        </div>
        <Campo
          id="taxBase"
          label="Base imponible"
          defaultValue={defaults.taxBase}
          error={fieldErrors.taxBase}
          pendiente={pendiente('taxBase')}
          hint="En euros, por ejemplo 1.234,56"
        />
        <Campo
          id="vatRate"
          label="Tipo de IVA (%)"
          defaultValue={defaults.vatRate}
          error={fieldErrors.vatRate}
          pendiente={pendiente('vatRate')}
        />
        <Campo
          id="vatAmount"
          label="Cuota de IVA"
          defaultValue={defaults.vatAmount}
          error={fieldErrors.vatAmount}
          pendiente={pendiente('vatAmount')}
        />
        <Campo
          id="total"
          label="Total"
          defaultValue={defaults.total}
          error={fieldErrors.total}
          pendiente={pendiente('total')}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {state.error}
        </p>
      ) : null}

      <Botones aprobado={aprobado} />
    </form>
  )
}
