import { expect, test } from '@playwright/test'

import { rutaSesion } from './sesiones'

/**
 * Lo que ve el usuario de una empresa cliente: la ficha de su empresa, sin poder tocarla, y a quién
 * escribir.
 *
 * Reglas de docs/spec.md: A10, C7, y «Cliente» de «Quién puede hacer qué».
 *
 * Se prueba también a 375 px, porque el cliente usa el portal sobre todo en el móvil.
 */

test.describe('Pablo, de la panadería', () => {
  test.use({ storageState: rutaSesion('espiga-pablo') })

  test('ve la ficha de su empresa y no puede editarla', async ({ page }) => {
    await page.goto('/cliente')

    await expect(page.getByText('Panadería La Espiga SL')).toBeVisible()
    await expect(page.getByText('B12345678')).toBeVisible()
    await expect(page.getByRole('button', { name: /guardar/i })).toBeHidden()
  })

  test('A10 · tiene a mano el correo de su asesora', async ({ page }) => {
    await page.goto('/cliente')

    const enlace = page.getByRole('link', { name: 'Escribir a mi asesor' })

    await expect(enlace).toBeVisible()
    await expect(enlace).toHaveAttribute('href', /^mailto:marta@rierabono\.es/)
    await expect(page.getByText('Marta Solís')).toBeVisible()
  })

  test('no entra en las pantallas del asesor ni del administrador', async ({ page }) => {
    await page.goto('/asesor')
    await expect(page).toHaveURL(/\/sin-permiso$/)

    await page.goto('/admin/usuarios')
    await expect(page).toHaveURL(/\/sin-permiso$/)
  })
})

test.describe('Rosa, de la misma panadería', () => {
  test.use({ storageState: rutaSesion('espiga-rosa') })

  test('C7 · los dos usuarios de la misma empresa ven lo mismo', async ({ page }) => {
    await page.goto('/cliente')

    await expect(page.getByText('Panadería La Espiga SL')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Escribir a mi asesor' })).toHaveAttribute(
      'href',
      /^mailto:marta@rierabono\.es/,
    )
  })
})
