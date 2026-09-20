import { expect, test, type Page } from '@playwright/test'

import { rutaSesion } from './sesiones'
import { asignarAsesor, comoSesion, crearEmpresa, elegirOpcion } from './utils'

/**
 * Los expedientes trimestrales y lo que la asesoría le pide al cliente en cada uno.
 *
 * Reglas de docs/spec.md: E1, E2, E3, E5, S1, S3, S5, S6. Lo que se puede demostrar sin navegador (que
 * una fecha límite de ayer se rechaza, S2) tiene su prueba en Vitest, como dice docs/testing.md.
 *
 * Las empresas que se crean aquí llevan la marca de prueba y se borran solas al terminar.
 */

const MARTA = 'Marta Solís'

/** Abre un trimestre de esa empresa como Marta y devuelve su página, ya en el expediente. */
async function abrirTrimestre(
  marta: Page,
  clienteId: string,
  quarter: number,
  year = '2026',
): Promise<void> {
  await marta.goto(`/asesor/clientes/${clienteId}`)
  await elegirOpcion(marta.getByLabel('Año'), { label: year })
  await elegirOpcion(marta.getByLabel('Trimestre'), { label: `T${quarter}` })
  await marta.getByRole('button', { name: 'Abrir expediente' }).click()
}

/** S1 · Pide documentación con su fecha límite. */
async function pedir(marta: Page, titulo: string, fecha: string): Promise<void> {
  await marta.getByLabel('Qué hace falta').fill(titulo)
  await marta.getByLabel('Fecha límite').fill(fecha)
  await marta.getByRole('button', { name: 'Crear solicitud' }).click()
  await expect(marta.getByText('Solicitud creada.')).toBeVisible()
}

test.describe('lo que hace la asesoría', () => {
  // Las empresas las da de alta el administrador; los expedientes, la asesora que las lleva.
  test.use({ storageState: rutaSesion('admin') })

  test('E1 y S1 · abre 2026-T1 de un cliente y le pide dos cosas', async ({ page, browser }) => {
    const empresa = await crearEmpresa(page)
    await asignarAsesor(page, empresa.id, MARTA)

    const marta = await comoSesion(browser, 'marta')
    await abrirTrimestre(marta, empresa.id, 1)

    await expect(marta.getByRole('heading', { name: '2026 · T1' })).toBeVisible()
    await expect(marta.getByText('Abierto', { exact: true })).toBeVisible()

    await pedir(marta, 'Facturas de compras de enero', '2026-12-31')
    await pedir(marta, 'Tickets de gasolina del trimestre', '2026-11-30')

    await expect(marta.getByText('Facturas de compras de enero')).toBeVisible()
    await expect(marta.getByText('Tickets de gasolina del trimestre')).toBeVisible()
    await expect(marta.getByText('31/12/2026')).toBeVisible()

    // Y el cliente las tiene en su expediente, contadas desde su ficha.
    await marta.goto(`/asesor/clientes/${empresa.id}`)
    await expect(marta.getByText('2 solicitudes pendientes')).toBeVisible()

    await marta.context().close()
  })

  test('E2 · el mismo trimestre no se puede abrir dos veces', async ({ page, browser }) => {
    const empresa = await crearEmpresa(page)
    await asignarAsesor(page, empresa.id, MARTA)

    const marta = await comoSesion(browser, 'marta')
    await abrirTrimestre(marta, empresa.id, 2)
    await expect(marta.getByRole('heading', { name: '2026 · T2' })).toBeVisible()

    await abrirTrimestre(marta, empresa.id, 2)
    await expect(marta.locator('form').getByRole('alert')).toContainText(/ya está abierto/i)

    await marta.context().close()
  })

  test('S5 · cancela una solicitud y deja de reclamarse', async ({ page, browser }) => {
    const empresa = await crearEmpresa(page)
    await asignarAsesor(page, empresa.id, MARTA)

    const marta = await comoSesion(browser, 'marta')
    await abrirTrimestre(marta, empresa.id, 3)
    await pedir(marta, 'Justificante de una subvención', '2026-12-15')

    await marta.getByRole('button', { name: 'Cancelar' }).click()

    await expect(marta.getByText('Cancelada', { exact: true })).toBeVisible()
    await expect(marta.getByText('Pendiente', { exact: true })).toBeHidden()

    await marta.context().close()
  })

  test('E3 · cierra el expediente y vuelve a abrirlo', async ({ page, browser }) => {
    const empresa = await crearEmpresa(page)
    await asignarAsesor(page, empresa.id, MARTA)

    const marta = await comoSesion(browser, 'marta')
    await abrirTrimestre(marta, empresa.id, 4)

    await marta.getByRole('button', { name: 'Cerrar expediente' }).click()
    await expect(marta.getByText('Cerrado', { exact: true })).toBeVisible()

    await marta.getByRole('button', { name: 'Volver a abrir' }).click()
    await expect(marta.getByText('Abierto', { exact: true })).toBeVisible()

    await marta.context().close()
  })

  test('E5, S6 y C4 · el cliente ve lo suyo, y lo de otra empresa no', async ({ page, browser }) => {
    // Un expediente de otra empresa, para intentar abrirlo después con la sesión de un cliente.
    const otra = await crearEmpresa(page)
    await asignarAsesor(page, otra.id, MARTA)

    const marta = await comoSesion(browser, 'marta')
    await abrirTrimestre(marta, otra.id, 1)
    await pedir(marta, 'Algo que no le toca ver a nadie más', '2026-12-31')
    const expedienteAjeno = new URL(marta.url()).pathname.split('/').pop()!

    // Pablo es de la panadería: en su panel están las solicitudes de ejemplo de su trimestre.
    const pablo = await comoSesion(browser, 'espiga-pablo')
    await pablo.goto('/cliente')

    await expect(pablo.getByText('Facturas de compras de enero')).toBeVisible()
    await expect(pablo.getByText('2026 · T1').first()).toBeVisible()
    await expect(pablo.getByText('Algo que no le toca ver a nadie más')).toBeHidden()

    // Y el expediente de la otra empresa no se abre ni escribiendo la dirección.
    await pablo.goto(`/cliente/expedientes/${expedienteAjeno}`)
    await expect(pablo).toHaveURL(/\/sin-permiso$/)

    await marta.context().close()
    await pablo.context().close()
  })
})
