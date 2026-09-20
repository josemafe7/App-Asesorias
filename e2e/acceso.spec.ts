import { expect, test } from '@playwright/test'

import { accessError, seedUser, signIn, signInAndLand } from './utils'

// Fase 1 · Reglas A1, A2, A3, A4 y A7 de docs/spec.md.
// Cada prueba hace lo mismo que haría una persona y comprueba lo que dice la regla, no lo que hace el
// código.

test.describe('A1 · sin sesión, a la pantalla de acceso', () => {
  for (const ruta of ['/', '/admin', '/asesor', '/cliente', '/sin-permiso']) {
    test(`abrir ${ruta} sin haber entrado lleva al acceso`, async ({ page }) => {
      await page.goto(ruta)
      await expect(page).toHaveURL(/\/acceso$/)
      await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
    })
  }
})

test('A2 · no hay forma de crearse una cuenta', async ({ page }) => {
  await page.goto('/acceso')

  await expect(page.getByRole('button', { name: /crear cuenta|registrar/i })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /crear cuenta|registrar/i })).toHaveCount(0)
  await expect(page.getByText(/Las cuentas las crea tu asesoría/i)).toBeVisible()
})

test.describe('A3 · cada rol aterriza en su panel', () => {
  const casos = [
    { clave: 'admin', ruta: '/admin', titulo: 'Panel del administrador' },
    { clave: 'marta', ruta: '/asesor', titulo: 'Panel del asesor' },
    { clave: 'espiga-pablo', ruta: '/cliente', titulo: 'Hola, Pablo Espiga' },
  ]

  for (const caso of casos) {
    test(`${caso.clave} entra y ve ${caso.ruta}`, async ({ page }) => {
      const usuario = seedUser(caso.clave)
      await signInAndLand(page, usuario.email, caso.ruta)
      await expect(page.getByRole('heading', { name: caso.titulo })).toBeVisible()
    })
  }
})

test('A4 · una cuenta desactivada no entra, aunque la contraseña sea correcta', async ({ page }) => {
  const baja = seedUser('espiga-baja')

  await signIn(page, baja.email)

  await expect(accessError(page)).toContainText(/no está activa/i)
  await expect(page).toHaveURL(/\/acceso$/)
})

test('acceso · una contraseña equivocada no dice si el correo existe', async ({ page }) => {
  const marta = seedUser('marta')

  await signIn(page, marta.email, 'contraseña-que-no-es')
  const mensajeConCuenta = await accessError(page).textContent()

  await page.goto('/acceso')
  await signIn(page, 'nadie@ejemplo.es', 'contraseña-que-no-es')
  const mensajeSinCuenta = await accessError(page).textContent()

  expect(mensajeConCuenta).toBe(mensajeSinCuenta)
})

test.describe('A7 · cada uno solo entra en lo suyo', () => {
  const casos = [
    { clave: 'espiga-pablo', prohibidas: ['/admin', '/asesor'] },
    { clave: 'marta', prohibidas: ['/admin', '/cliente'] },
    // El administrador SÍ puede entrar en /asesor: trabaja en las mismas pantallas que el asesor.
    { clave: 'admin', prohibidas: ['/cliente'] },
  ]

  for (const caso of casos) {
    test(`${caso.clave} no puede abrir ${caso.prohibidas.join(' ni ')}`, async ({ page }) => {
      const usuario = seedUser(caso.clave)
      await signIn(page, usuario.email)
      await expect(page).not.toHaveURL(/\/acceso$/)

      for (const ruta of caso.prohibidas) {
        await page.goto(ruta)
        await expect(page).toHaveURL(/\/sin-permiso$/)
        await expect(page.getByRole('heading', { name: 'Esta página no es para ti' })).toBeVisible()
        // No se filtra nada de la pantalla que no le corresponde.
        await expect(page.getByRole('heading', { name: /^Panel del/ })).toHaveCount(0)
      }
    })
  }
})

test('salir cierra la sesión de verdad', async ({ page }) => {
  const marta = seedUser('marta')
  await signInAndLand(page, marta.email, '/asesor')

  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page).toHaveURL(/\/acceso$/)

  // Volver atrás no devuelve el acceso.
  await page.goto('/asesor')
  await expect(page).toHaveURL(/\/acceso$/)
})

test('el administrador también trabaja en las pantallas del asesor', async ({ page }) => {
  const admin = seedUser('admin')
  // signInAndLand espera a que el acceso termine; ir a /asesor antes de eso llegaría sin sesión.
  await signInAndLand(page, admin.email, '/admin')

  await page.goto('/asesor')

  await expect(page).toHaveURL(/\/asesor$/)
  await expect(page.getByRole('heading', { name: 'Panel del asesor' })).toBeVisible()
})
