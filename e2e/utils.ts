import { expect, type Page } from '@playwright/test'

import { DEMO_PASSWORD, SEED_USERS } from '../scripts/seed-data.mts'

export { DEMO_PASSWORD, SEED_USERS }

/** Busca un usuario de ejemplo por su clave, para no repetir correos sueltos por las pruebas. */
export function seedUser(key: string) {
  const user = SEED_USERS.find((candidate) => candidate.key === key)
  if (!user) throw new Error(`No hay ningún usuario de ejemplo con la clave "${key}"`)
  return user
}

/** Entra en el portal como una persona cualquiera: escribiendo el correo y la contraseña. */
export async function signIn(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto('/acceso')
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

/**
 * El aviso de error del formulario de acceso.
 *
 * Se acota al formulario a propósito: Next.js mete en cada página un elemento invisible con el mismo
 * papel de «aviso» para anunciar los cambios de ruta a los lectores de pantalla, y buscar por el papel a
 * secas encuentra los dos.
 */
export function accessError(page: Page) {
  return page.locator('form').getByRole('alert')
}

/** Entra y comprueba que ha llegado a donde tenía que llegar. */
export async function signInAndLand(page: Page, email: string, path: string) {
  await signIn(page, email)
  await expect(page).toHaveURL(new RegExp(`${path}$`))
}
