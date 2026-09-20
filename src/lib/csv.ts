/**
 * El CSV que la asesoría se descarga de un expediente (X2, X4, X5).
 *
 * Se escribe para que Excel en español lo abra bien: punto y coma como separador, decimales con coma y
 * la marca de orden de bytes al principio. Y con el cuidado de que ninguna celda acabe ejecutándose
 * como una fórmula.
 */

/** La marca que le dice a Excel que el archivo está en UTF-8. */
export const BOM = '﻿'

export const CSV_COLUMNS = [
  'cliente',
  'nif_cliente',
  'ejercicio',
  'trimestre',
  'fecha',
  'proveedor',
  'nif_proveedor',
  'base_imponible',
  'tipo_iva',
  'cuota_iva',
  'total',
  'categoria',
  'archivo',
  'aprobado_por',
  'fecha_aprobacion',
] as const

export type CsvRow = {
  cliente: string
  nif_cliente: string
  ejercicio: string
  trimestre: string
  fecha: string
  proveedor: string
  nif_proveedor: string
  base_imponible: number | null
  tipo_iva: number | null
  cuota_iva: number | null
  total: number | null
  categoria: string
  archivo: string
  aprobado_por: string
  fecha_aprobacion: string
}

/** X4 · Los decimales van con coma. Un hueco vacío se queda vacío: no se escribe un cero. */
function numero(valor: number | null): string {
  return valor === null ? '' : String(valor).replace('.', ',')
}

/**
 * X5 · Una celda que empieza por `=`, `+`, `-` o `@` la ejecutaría la hoja de cálculo como fórmula.
 * Con un apóstrofo delante, la trata como texto.
 */
function neutralizar(texto: string): string {
  return /^[=+\-@]/.test(texto) ? `'${texto}` : texto
}

function celda(valor: string | number | null): string {
  if (valor === null) return ''
  if (typeof valor === 'number') return numero(valor)

  const seguro = neutralizar(valor)

  // El entrecomillado va por fuera, para que el apóstrofo siga siendo lo primero de la celda.
  return /[";\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro
}

export function buildCsv(rows: CsvRow[]): string {
  const lineas = [CSV_COLUMNS.join(';')]

  for (const row of rows) {
    lineas.push(CSV_COLUMNS.map((columna) => celda(row[columna])).join(';'))
  }

  // Excel espera los saltos de línea de Windows.
  return BOM + lineas.join('\r\n') + '\r\n'
}
