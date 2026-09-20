import { expect, test, type Page } from '@playwright/test'

import { rutaSesion } from './sesiones'
import { correoDePrueba, crearEmpresa, elegirOpcion, seedUser } from './utils'

/**
 * El administrador invita a las personas, les cambia el rol y las desactiva.
 *
 * Reglas de docs/spec.md: A5, A9, A11, C7.
 *
 * El correo no se envía de verdad en las pruebas (docs/testing.md): lo que se comprueba aquí es que la
 * app dice que lo ha mandado y que la persona queda creada con su rol y su empresa.
 */

// Entra con la sesión que guardó `e2e/sesiones.setup.ts`, sin volver a pasar por el acceso.
test.use({ storageState: rutaSesion('admin') })

/** Invita a alguien y devuelve su correo. */
async function invitar(
  page: Page,
  opciones: { nombre: string; rol: string; empresa?: string },
): Promise<string> {
  const correo = correoDePrueba('persona')

  await page.goto('/admin/usuarios/nuevo')
  await page.getByLabel('Nombre y apellidos').fill(opciones.nombre)
  await page.getByLabel('Correo electrónico').fill(correo)
  await elegirOpcion(page.getByLabel('Rol'), { label: opciones.rol })
  if (opciones.empresa) {
    await elegirOpcion(page.getByLabel('Empresa'), { label: opciones.empresa })
  }
  await page.getByRole('button', { name: 'Enviar invitación' }).click()

  return correo
}

test('A5 · invita a un usuario cliente y la app confirma que le ha mandado el correo', async ({
  page,
}) => {
  const empresa = await crearEmpresa(page)

  const correo = await invitar(page, {
    nombre: 'E2E Pablo Invitado',
    rol: 'Cliente',
    empresa: empresa.legalName,
  })

  await expect(page.getByText('Invitación enviada')).toBeVisible()
  await expect(page.getByRole('cell', { name: correo })).toBeVisible()
})

test('C7 · el usuario invitado queda con su rol y con su empresa', async ({ page }) => {
  const empresa = await crearEmpresa(page)

  const correo = await invitar(page, {
    nombre: 'E2E Rosa Invitada',
    rol: 'Cliente',
    empresa: empresa.legalName,
  })

  await page.getByRole('row', { name: new RegExp(correo) }).getByRole('link').click()

  await expect(page.getByRole('heading', { name: 'E2E Rosa Invitada' })).toBeVisible()
  await expect(page.getByLabel('Rol')).toHaveValue('client')
  await expect(page.getByLabel('Empresa')).toHaveValue(empresa.id)
})

test('C7 · un usuario cliente sin empresa no se puede invitar', async ({ page }) => {
  await page.goto('/admin/usuarios/nuevo')
  await page.getByLabel('Nombre y apellidos').fill('E2E Sin empresa')
  await page.getByLabel('Correo electrónico').fill(correoDePrueba('sin-empresa'))
  await elegirOpcion(page.getByLabel('Rol'), { label: 'Cliente' })
  await page.getByRole('button', { name: 'Enviar invitación' }).click()

  await expect(page.getByText('Elige la empresa a la que pertenece.')).toBeVisible()
})

test('no se puede invitar dos veces al mismo correo', async ({ page }) => {
  const empresa = await crearEmpresa(page)
  const correo = await invitar(page, {
    nombre: 'E2E Repetido',
    rol: 'Cliente',
    empresa: empresa.legalName,
  })
  await expect(page.getByText('Invitación enviada')).toBeVisible()

  await page.goto('/admin/usuarios/nuevo')
  await page.getByLabel('Nombre y apellidos').fill('E2E Repetido otra vez')
  await page.getByLabel('Correo electrónico').fill(correo)
  await elegirOpcion(page.getByLabel('Rol'), { label: 'Asesor' })
  await page.getByRole('button', { name: 'Enviar invitación' }).click()

  await expect(page.locator('form').getByRole('alert')).toContainText(/ya hay un usuario/i)
})

test('A9 · el administrador cambia el rol de un usuario', async ({ page }) => {
  const empresa = await crearEmpresa(page)
  const correo = await invitar(page, {
    nombre: 'E2E Asciende a asesor',
    rol: 'Cliente',
    empresa: empresa.legalName,
  })

  await page.getByRole('row', { name: new RegExp(correo) }).getByRole('link').click()
  // La ficha tiene que estar abierta antes de tocar nada: la lista también tiene un desplegable «Rol»,
  // el de filtrar, y si no se espera se acaba cambiando ese.
  await expect(page.getByRole('heading', { name: 'E2E Asciende a asesor' })).toBeVisible()

  await elegirOpcion(page.getByLabel('Rol'), { label: 'Asesor' })
  await page.getByRole('button', { name: 'Guardar cambios' }).click()

  await expect(page.getByText('Datos guardados.')).toBeVisible()
  // Lo que se ve viene de la base de datos: la ficha se vuelve a cargar al guardar.
  await expect(page.getByLabel('Rol')).toHaveValue('advisor')
  // C7 · Al dejar de ser cliente, deja de pertenecer a una empresa.
  await expect(page.getByLabel('Empresa')).toHaveValue('')
})

test('el administrador desactiva y vuelve a activar a un usuario', async ({ page }) => {
  const empresa = await crearEmpresa(page)
  const correo = await invitar(page, {
    nombre: 'E2E Va y viene',
    rol: 'Cliente',
    empresa: empresa.legalName,
  })

  await page.getByRole('row', { name: new RegExp(correo) }).getByRole('link').click()
  await page.getByRole('button', { name: 'Desactivar usuario' }).click()
  await expect(page.getByText('Desactivado', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Activar usuario' }).click()
  await expect(page.getByText('Activo', { exact: true })).toBeVisible()
})

test('A11 · el administrador no puede cambiarse el rol ni desactivarse', async ({ page }) => {
  const admin = seedUser('admin')

  await page.goto('/admin/usuarios')
  await page.getByRole('row', { name: new RegExp(admin.email) }).getByRole('link').click()

  await expect(page.getByText(/no puedes cambiar tu propio rol/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Desactivar usuario' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeHidden()
})
