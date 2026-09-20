import { z } from 'zod'

import { getClient } from '@/data/clients'
import { listCategories, listDocumentData } from '@/data/document-data'
import { listDocuments } from '@/data/documents'
import { getDossier } from '@/data/dossiers'
import { requireRole } from '@/lib/auth-guards'
import { buildCsv, type CsvRow } from '@/lib/csv'
import { formatDay } from '@/lib/dates'

/**
 * X1-X6 · El CSV de un expediente, con sus documentos aprobados.
 *
 * Quién puede descargarlo lo deciden las políticas: la consulta solo devuelve el expediente si es de un
 * cliente de quien lo pide. Si no hay ningún documento aprobado, no se descarga un archivo vacío: se
 * vuelve al expediente con un aviso (X6).
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  await requireRole('admin', 'advisor')

  const { id } = await params
  if (!z.uuid().safeParse(id).success) return new Response('No encontrado', { status: 404 })

  const dossier = await getDossier(id)
  if (!dossier) return new Response('No encontrado', { status: 404 })

  const [client, documents, categories] = await Promise.all([
    getClient(dossier.clientId),
    listDocuments(dossier.id),
    listCategories(),
  ])

  // X3 · Los que no están aprobados no salen.
  const aprobados = documents.filter((document) => document.status === 'approved')

  if (aprobados.length === 0) {
    return Response.redirect(new URL(`/asesor/expedientes/${dossier.id}?sincsv=1`, request.url), 303)
  }

  const datos = await listDocumentData(aprobados.map((document) => document.id))
  const etiquetas = new Map(categories.map((categoria) => [categoria.code, categoria.label]))

  const filas: CsvRow[] = aprobados.map((document) => {
    const data = datos.get(document.id)

    return {
      cliente: client?.legalName ?? '',
      nif_cliente: client?.taxId ?? '',
      ejercicio: String(dossier.year),
      trimestre: String(dossier.quarter),
      fecha: data?.issueDate ? formatDay(data.issueDate) : '',
      proveedor: data?.supplier ?? '',
      nif_proveedor: data?.supplierTaxId ?? '',
      base_imponible: data?.taxBase ?? null,
      tipo_iva: data?.vatRate ?? null,
      cuota_iva: data?.vatAmount ?? null,
      total: data?.total ?? null,
      categoria: data?.categoryCode ? (etiquetas.get(data.categoryCode) ?? '') : '',
      archivo: document.originalName,
      aprobado_por: data?.approvedByName ?? '',
      fecha_aprobacion: data?.approvedAt ? formatDay(data.approvedAt.slice(0, 10)) : '',
    }
  })

  const nombre = `carpeta-fiscal-${client?.taxId ?? 'expediente'}-${dossier.year}T${dossier.quarter}.csv`

  return new Response(buildCsv(filas), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nombre}"`,
    },
  })
}
