import { expect, test } from '@playwright/test'

import { rutaSesion } from './sesiones'
import { asignarAsesor, crearEmpresa, empresaDePrueba } from './utils'

/**
 * El administrador da de alta empresas y las reparte entre los asesores.
 *
 * Reglas de docs/spec.md: C1, C2, C3, C6.
 */

// Entra con la sesión que guardó `e2e/sesiones.setup.ts`, sin volver a pasar por el acceso.
test.use({ storageState: rutaSesion('admin') })

test('C1 · da de alta un cliente con sus datos y aparece en la lista', async ({ page }) => {
  const empresa = empresaDePrueba()

  await page.goto('/admin/clientes')
  await page.getByRole('link', { name: 'Nuevo cliente' }).click()

  await page.getByLabel('Razón social').fill(empresa.legalName)
  await page.getByLabel('NIF').fill(empresa.taxId)
  await page.getByLabel('Correo de contacto').fill('contacto@e2e.carpetafiscal.test')
  await page.getByLabel('Teléfono').fill('960 000 000')
  await page.getByRole('button', { name: 'Dar de alta' }).click()

  // Acaba en su ficha, con lo que se acaba de escribir.
  await expect(page.getByRole('heading', { name: empresa.legalName })).toBeVisible()
  await expect(page.getByText(empresa.taxId)).toBeVisible()

  await page.goto('/admin/clientes')
  await expect(page.getByRole('cell', { name: empresa.legalName })).toBeVisible()
})

test('C1 · sin razón social y sin NIF no se puede dar de alta', async ({ page }) => {
  await page.goto('/admin/clientes/nuevo')
  await page.getByLabel('Correo de contacto').fill('contacto@e2e.carpetafiscal.test')
  await page.getByRole('button', { name: 'Dar de alta' }).click()

  // Sigue en el formulario: no se ha creado nada.
  await expect(page.getByRole('heading', { name: 'Nuevo cliente' })).toBeVisible()
})

test('C2 · no deja dar de alta dos clientes con el mismo NIF', async ({ page }) => {
  const repetido = empresaDePrueba()
  await crearEmpresa(page, repetido)

  await page.goto('/admin/clientes/nuevo')
  await page.getByLabel('Razón social').fill('E2E La misma empresa otra vez')
  await page.getByLabel('NIF').fill(repetido.taxId)
  await page.getByRole('button', { name: 'Dar de alta' }).click()

  await expect(page.locator('form').getByRole('alert')).toContainText(/ya hay un cliente/i)
})

test('C2 · el NIF en minúsculas cuenta como el mismo NIF', async ({ page }) => {
  const empresa = empresaDePrueba()
  await crearEmpresa(page, empresa)

  await page.goto('/admin/clientes/nuevo')
  await page.getByLabel('Razón social').fill('E2E Con el NIF en minúsculas')
  await page.getByLabel('NIF').fill(empresa.taxId.toLowerCase())
  await page.getByRole('button', { name: 'Dar de alta' }).click()

  await expect(page.locator('form').getByRole('alert')).toContainText(/ya hay un cliente/i)
})

test('C3 · asigna el cliente a un asesor y lo deja escrito en su ficha', async ({ page }) => {
  const empresa = await crearEmpresa(page)

  await asignarAsesor(page, empresa.id, 'Marta Solís')

  await page.goto(`/admin/clientes/${empresa.id}`)
  await expect(page.getByText('Lo lleva Marta Solís')).toBeVisible()
})

test('C6 · al desactivar un cliente, su ficha y sus datos se conservan', async ({ page }) => {
  const empresa = await crearEmpresa(page)

  await page.goto(`/admin/clientes/${empresa.id}`)
  await page.getByRole('button', { name: 'Desactivar cliente' }).click()

  await expect(page.getByText('Desactivado', { exact: true })).toBeVisible()
  await expect(page.getByText(empresa.taxId)).toBeVisible()

  // Y se puede volver a activar.
  await page.getByRole('button', { name: 'Activar cliente' }).click()
  await expect(page.getByText('Activo', { exact: true })).toBeVisible()
})

test('C6 · un cliente desactivado se puede seguir encontrando en la lista del administrador', async ({
  page,
}) => {
  const empresa = await crearEmpresa(page)

  await page.goto(`/admin/clientes/${empresa.id}`)
  await page.getByRole('button', { name: 'Desactivar cliente' }).click()
  // Se espera a ver el cambio antes de irse, como haría cualquiera: al cambiar de pantalla en el mismo
  // instante del clic, el navegador corta la petición que lo estaba guardando.
  await expect(page.getByText('Desactivado', { exact: true })).toBeVisible()

  await page.goto('/admin/clientes?estado=inactivos')
  await expect(page.getByRole('cell', { name: empresa.legalName })).toBeVisible()
})
