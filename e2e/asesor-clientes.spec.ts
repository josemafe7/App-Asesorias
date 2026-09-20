import { expect, test } from '@playwright/test'

import { rutaSesion } from './sesiones'
import { asignarAsesor, comoSesion, crearEmpresa } from './utils'

/**
 * Cada asesor ve solo los clientes que tiene asignados.
 *
 * Reglas de docs/spec.md: C4, C5, C6 y A7 (quien abre una dirección que no le corresponde ve «no tienes
 * permiso»). Aquí está también el recorrido que da por buena la fase 2.
 *
 * Las sesiones vienen guardadas de `e2e/sesiones.setup.ts`: las pruebas no vuelven a entrar.
 */

test.describe('lo que hace el administrador y ven los asesores', () => {
  test.use({ storageState: rutaSesion('admin') })

  test('fase 2 · crea un cliente y lo asigna: lo ve su asesora y nadie más', async ({
    page,
    browser,
  }) => {
    const empresa = await crearEmpresa(page)
    await asignarAsesor(page, empresa.id, 'Marta Solís')

    const marta = await comoSesion(browser, 'marta')
    await marta.goto('/asesor')
    await expect(marta.getByRole('cell', { name: empresa.legalName })).toBeVisible()
    await marta.goto(`/asesor/clientes/${empresa.id}`)
    await expect(marta.getByRole('heading', { name: empresa.legalName })).toBeVisible()

    const javier = await comoSesion(browser, 'javier')
    await javier.goto('/asesor')
    await expect(javier.getByRole('cell', { name: empresa.legalName })).toBeHidden()

    // Ni escribiendo la dirección a mano.
    await javier.goto(`/asesor/clientes/${empresa.id}`)
    await expect(javier).toHaveURL(/\/sin-permiso$/)
    await expect(javier.getByText(empresa.legalName)).toBeHidden()

    await marta.context().close()
    await javier.context().close()
  })

  test('C5 · al reasignar, el asesor anterior deja de verlo y el nuevo pasa a verlo', async ({
    page,
    browser,
  }) => {
    const empresa = await crearEmpresa(page)
    await asignarAsesor(page, empresa.id, 'Marta Solís')
    await asignarAsesor(page, empresa.id, 'Javier Peña')

    const marta = await comoSesion(browser, 'marta')
    await marta.goto('/asesor')
    await expect(marta.getByRole('cell', { name: empresa.legalName })).toBeHidden()

    const javier = await comoSesion(browser, 'javier')
    await javier.goto('/asesor')
    await expect(javier.getByRole('cell', { name: empresa.legalName })).toBeVisible()

    await marta.context().close()
    await javier.context().close()
  })

  test('C6 · un cliente desactivado desaparece de la lista de trabajo del asesor', async ({
    page,
    browser,
  }) => {
    const empresa = await crearEmpresa(page)
    await asignarAsesor(page, empresa.id, 'Marta Solís')

    await page.goto(`/admin/clientes/${empresa.id}`)
    await page.getByRole('button', { name: 'Desactivar cliente' }).click()
    await expect(page.getByText('Desactivado', { exact: true })).toBeVisible()

    const marta = await comoSesion(browser, 'marta')
    await marta.goto('/asesor')
    await expect(marta.getByRole('cell', { name: empresa.legalName })).toBeHidden()

    await marta.context().close()
  })
})

test.describe('lo que ve la asesora', () => {
  test.use({ storageState: rutaSesion('marta') })

  test('C4 · el asesor ve en su panel solo sus clientes', async ({ page }) => {
    await page.goto('/asesor')

    await expect(page.getByRole('cell', { name: 'Panadería La Espiga SL' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Talleres Moreno SL' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Floristería Azahar SL' })).toBeHidden()
  })

  test('un asesor no entra en las pantallas del administrador', async ({ page }) => {
    await page.goto('/admin/clientes')
    await expect(page).toHaveURL(/\/sin-permiso$/)

    await page.goto('/admin/usuarios/nuevo')
    await expect(page).toHaveURL(/\/sin-permiso$/)
  })
})
