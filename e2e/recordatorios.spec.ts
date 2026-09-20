import { expect, test, type Page } from '@playwright/test'

import { rutaSesion } from './sesiones'
import { asignarAsesor, comoSesion, crearEmpresa, elegirOpcion } from './utils'

/**
 * Los recordatorios por correo y la exportación a CSV.
 *
 * Reglas de docs/spec.md: M1, M3, M5, M6, M7, X1, X2, X3, X6. En las pruebas el correo no sale de
 * verdad: se escribe en la consola del servidor (docs/testing.md), así que lo que se comprueba es a
 * cuántas solicitudes les tocaba y que no se repiten.
 */

const SECRETO = 'secreto-de-pruebas'

test.describe('el trabajo diario', () => {
  test.use({ storageState: rutaSesion('admin') })

  test('M5 · sin el secreto acordado, la dirección no hace nada', async ({ request }) => {
    const respuesta = await request.post('/api/recordatorios')

    expect(respuesta.status()).toBe(401)
  })

  test('M1 y M3 · manda lo vencido, y a la segunda vuelta no manda nada', async ({ request }) => {
    const primera = await request.post('/api/recordatorios', {
      headers: { Authorization: `Bearer ${SECRETO}` },
    })
    expect(primera.ok()).toBe(true)
    // En los datos de ejemplo hay una solicitud con la fecha límite ya pasada.
    expect((await primera.json()).enviados).toBeGreaterThanOrEqual(1)

    const segunda = await request.post('/api/recordatorios', {
      headers: { Authorization: `Bearer ${SECRETO}` },
    })
    expect((await segunda.json()).enviados).toBe(0)
  })
})

test.describe('lo que hace la asesora', () => {
  test.use({ storageState: rutaSesion('marta') })

  test('M6 y M7 · manda un recordatorio a mano y hasta mañana no puede repetirlo', async ({
    page,
  }) => {
    // Talleres Moreno tiene una solicitud que aún no ha vencido: el trabajo diario no la toca.
    await page.goto('/asesor')
    await page.getByRole('row', { name: /Talleres Moreno/ }).getByRole('link').click()
    await page.getByRole('link', { name: /2026 · T1/ }).click()

    const fila = page
      .getByRole('listitem')
      .filter({ hasText: 'Facturas de recambios de febrero' })

    await fila.getByRole('button', { name: 'Recordar' }).click()

    await expect(fila).toContainText('Último recordatorio:')
    // M7 · El botón se apaga y dice cuándo se podrá volver a enviar.
    await expect(fila).toContainText(/Se podrá recordar el \d{2}\/\d{2}\/\d{4} a las \d{1,2}:\d{2}/)
    await expect(fila.getByRole('button', { name: 'Recordar' })).toBeHidden()
  })

  test('X1, X2 y X3 · el CSV lleva las columnas acordadas y solo lo aprobado', async ({
    page,
    browser,
  }) => {
    const admin = await comoSesion(browser, 'admin')
    const empresa = await crearEmpresa(admin)
    await asignarAsesor(admin, empresa.id, 'Marta Solís')
    await admin.context().close()

    const expediente = await abrirTrimestre(page, empresa.id)

    // X6 · Sin nada aprobado no se descarga un archivo vacío.
    const vacio = await page.request.get(`/asesor/expedientes/${expediente}/csv`)
    expect(vacio.url()).toContain('sincsv=1')

    // La asesora sube un documento a su cliente, lo revisa y lo aprueba.
    await page.getByLabel('Archivo').setInputFiles({
      name: 'E2E-factura-para-csv.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7\nfactura normal\n%%EOF\n'),
    })
    await page.getByRole('button', { name: 'Subir documento' }).click()

    const fila = page.getByRole('listitem').filter({ hasText: 'E2E-factura-para-csv.pdf' })
    await expect(async () => {
      await page.reload()
      await expect(fila.getByText('Pendiente de revisión', { exact: true })).toBeVisible({
        timeout: 1000,
      })
    }).toPass({ timeout: 20_000 })

    await fila.getByRole('link', { name: 'Revisar' }).click()
    await page.getByRole('button', { name: 'Aprobar documento' }).click()
    await expect(page.getByText('Aprobado', { exact: true })).toBeVisible()

    const csv = await page.request.get(`/asesor/expedientes/${expediente}/csv`)
    const texto = await csv.text()

    expect(texto).toContain(
      'cliente;nif_cliente;ejercicio;trimestre;fecha;proveedor;nif_proveedor;base_imponible;tipo_iva;cuota_iva;total;categoria;archivo;aprobado_por;fecha_aprobacion',
    )
    expect(texto).toContain(empresa.legalName)
    expect(texto).toContain('E2E-factura-para-csv.pdf')
    expect(texto).toContain('Marta Solís')
    // X4 · Los decimales, con coma.
    expect(texto).toContain('121')
  })
})

/** Abre un trimestre de esa empresa y devuelve su identificador. */
async function abrirTrimestre(page: Page, clienteId: string): Promise<string> {
  await page.goto(`/asesor/clientes/${clienteId}`)
  await elegirOpcion(page.getByLabel('Trimestre'), { label: 'T2' })
  await page.getByRole('button', { name: 'Abrir expediente' }).click()
  await expect(page.getByRole('heading', { name: '2026 · T2' })).toBeVisible()

  return new URL(page.url()).pathname.split('/').pop()!
}
