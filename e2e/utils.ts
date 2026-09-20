import { expect, type Browser, type Locator, type Page } from '@playwright/test'

import { rutaSesion } from './sesiones'

import {
  DEMO_PASSWORD,
  E2E_EMAIL_DOMAIN,
  E2E_TAX_ID_PREFIX,
  SEED_USERS,
} from '../scripts/seed-data.mts'

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

// ---------------------------------------------------------------------------
// Datos que crean las pruebas
//
// Llevan siempre la marca de prueba (NIF que empieza por E2E, correo del dominio reservado) para que la
// limpieza de `e2e/limpieza.ts` los encuentre y los borre.
// ---------------------------------------------------------------------------

/** Una marca distinta en cada llamada, también entre pruebas que corren a la vez. */
function marca(): string {
  return `${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 900 + 100)}`
}

export function empresaDePrueba(): { legalName: string; taxId: string } {
  const id = marca()
  return { legalName: `E2E Empresa ${id}`, taxId: `${E2E_TAX_ID_PREFIX}${id}` }
}

export function correoDePrueba(prefijo: string): string {
  return `${prefijo}-${marca()}@${E2E_EMAIL_DOMAIN}`
}

/** Da de alta una empresa como lo haría el administrador, y devuelve su dirección en la app. */
export async function crearEmpresa(
  page: Page,
  empresa = empresaDePrueba(),
): Promise<{ id: string; legalName: string; taxId: string }> {
  await page.goto('/admin/clientes/nuevo')
  await page.getByLabel('Razón social').fill(empresa.legalName)
  await page.getByLabel('NIF').fill(empresa.taxId)
  await page.getByRole('button', { name: 'Dar de alta' }).click()

  await expect(page.getByRole('heading', { name: empresa.legalName })).toBeVisible()

  const id = new URL(page.url()).pathname.split('/').pop()
  if (!id) throw new Error('No se ha podido saber la dirección de la empresa recién creada')

  return { ...empresa, id }
}

/** C3 · Asigna la empresa a un asesor, por su nombre. */
export async function asignarAsesor(page: Page, clienteId: string, asesor: string): Promise<void> {
  await page.goto(`/admin/clientes/${clienteId}`)
  await elegirOpcion(page.getByLabel('Asesor', { exact: true }), { label: asesor })
  await page.getByRole('button', { name: 'Cambiar de asesor' }).click()
  await expect(page.getByText(`Lo lleva ${asesor}`)).toBeVisible()
}

/**
 * Abre una ventana nueva con la sesión ya guardada de otra persona, sin volver a entrar.
 *
 * Quien la llama tiene que cerrar su contexto al terminar: `await page.context().close()`.
 */
export async function comoSesion(browser: Browser, clave: string): Promise<Page> {
  const context = await browser.newContext({ storageState: rutaSesion(clave) })
  return context.newPage()
}

/**
 * Espera a que la pantalla esté lista para que la usen.
 *
 * Una página de Next.js llega primero como HTML y, un instante después, el navegador termina de
 * prepararla. Lo que se escriba o se elija en ese instante se puede perder. A una persona le da tiempo
 * de sobra; a una prueba, que va en milésimas, no.
 *
 * Se sabe que está lista porque React deja sus propias marcas en los elementos al terminar.
 */
async function esperarAQueEstePreparada(elemento: Locator): Promise<void> {
  await expect(async () => {
    const preparada = await elemento.evaluate((nodo) =>
      Object.keys(nodo).some((clave) => clave.startsWith('__reactFiber')),
    )
    expect(preparada, 'la pantalla todavía se está preparando').toBe(true)
  }).toPass({ timeout: 10_000 })
}

/** Elige una opción de un desplegable, cuando la pantalla ya está lista, y comprueba que se queda. */
export async function elegirOpcion(
  select: Locator,
  opcion: { label: string } | { value: string },
): Promise<void> {
  await esperarAQueEstePreparada(select)

  const [valor] = await select.selectOption(opcion)
  await expect(select).toHaveValue(valor)
}
