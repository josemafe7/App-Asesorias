import { describe, expect, it } from 'vitest'

import { BOM, buildCsv, CSV_COLUMNS, type CsvRow } from './csv'

/**
 * El CSV que se descarga de un expediente (X2, X4, X5).
 *
 * Se prueba el texto que sale, carácter a carácter: es lo que después abre Excel.
 */

const FILA: CsvRow = {
  cliente: 'Panadería La Espiga SL',
  nif_cliente: 'B12345678',
  ejercicio: '2026',
  trimestre: '1',
  fecha: '15/03/2026',
  proveedor: 'Iberdrola Clientes SAU',
  nif_proveedor: 'A95758389',
  base_imponible: 1234.56,
  tipo_iva: 21,
  cuota_iva: 259.26,
  total: 1493.82,
  categoria: 'Suministros (luz, agua, gas)',
  archivo: 'factura-marzo.pdf',
  aprobado_por: 'Marta Solís',
  fecha_aprobacion: '20/03/2026',
}

function lineas(csv: string): string[] {
  return csv.replace(BOM, '').trimEnd().split('\r\n')
}

describe('buildCsv', () => {
  it('X2 · lleva las columnas acordadas, en su orden', () => {
    const csv = buildCsv([])

    expect(lineas(csv)[0]).toBe(CSV_COLUMNS.join(';'))
    expect(CSV_COLUMNS).toEqual([
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
    ])
  })

  it('X4 · separa con punto y coma, escribe los decimales con coma y empieza por la marca de Excel', () => {
    const csv = buildCsv([FILA])

    expect(csv.startsWith(BOM)).toBe(true)
    expect(lineas(csv)[1]).toContain('1234,56;21;259,26;1493,82')
  })

  it('X4 · un importe vacío se queda vacío, no se escribe un cero', () => {
    const csv = buildCsv([{ ...FILA, cuota_iva: null }])

    expect(lineas(csv)[1]).toContain('1234,56;21;;1493,82')
  })

  it('entrecomilla lo que lleva punto y coma, comillas o saltos de línea', () => {
    const csv = buildCsv([{ ...FILA, proveedor: 'Bar "El Puente"; SL' }])

    expect(lineas(csv)[1]).toContain('"Bar ""El Puente""; SL"')
  })

  it('X5 · un texto que empieza por =, +, - o @ no se ejecuta como fórmula', () => {
    for (const peligroso of ['=1+1', '+34 600', '-CMD', '@SUM']) {
      const csv = buildCsv([{ ...FILA, proveedor: peligroso }])

      expect(lineas(csv)[1], peligroso).toContain(`'${peligroso}`)
    }
  })

  it('X5 · el apóstrofo va dentro de las comillas cuando además hace falta entrecomillar', () => {
    const csv = buildCsv([{ ...FILA, proveedor: '=UNO;DOS' }])

    expect(lineas(csv)[1]).toContain(`"'=UNO;DOS"`)
  })

  it('cada documento es una fila', () => {
    const csv = buildCsv([FILA, { ...FILA, archivo: 'otra.pdf' }])

    expect(lineas(csv)).toHaveLength(3)
  })
})
