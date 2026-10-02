import { expect, test } from '@playwright/test'

import { correoDePrueba, comoSesion, elegirOpcion } from './utils'

/**
 * A6 · «He olvidado mi contraseña», de principio a fin.
 *
 * El correo de recuperación lo manda Supabase, no la app. En local no sale a ningún sitio: se queda en
 * el buzón de pruebas del Supabase local, y de ahí se lee el enlace, como haría la persona al abrir su
 * correo.
 */

// El buzón de pruebas del Supabase local (supabase/config.toml · [local_smtp]).
const BUZON = 'http://127.0.0.1:54324'
const CONTRASENA_NUEVA = 'Otra-Clave-2026!'

/** Espera a que llegue el correo de esa persona y devuelve la dirección del enlace que trae. */
async function enlaceDelCorreo(correo: string): Promise<URL> {
  let enlace: string | undefined

  await expect(async () => {
    const busqueda = await fetch(`${BUZON}/api/v1/search?query=${encodeURIComponent(`to:${correo}`)}`)
    const { messages } = (await busqueda.json()) as { messages: { ID: string }[] }
    expect(messages.length, 'el correo todavía no ha llegado al buzón').toBeGreaterThan(0)

    const mensaje = await fetch(`${BUZON}/api/v1/message/${messages[0].ID}`)
    const { HTML } = (await mensaje.json()) as { HTML: string }
    enlace = /href="([^"]+)"/.exec(HTML)?.[1]?.replaceAll('&amp;', '&')
    expect(enlace, 'el correo no trae ningún enlace').toBeTruthy()
  }).toPass({ timeout: 15_000 })

  return new URL(enlace!)
}

test('A6 · el enlace del correo lleva a poner una contraseña nueva, y con ella se entra', async ({
  page,
  browser,
}) => {
  // Una persona nueva, para no cambiarle la contraseña a nadie de los datos de ejemplo.
  const correo = correoDePrueba('recupera')
  const admin = await comoSesion(browser, 'admin')
  await admin.goto('/admin/usuarios/nuevo')
  await admin.getByLabel('Nombre y apellidos').fill('E2E Recupera Contraseña')
  await admin.getByLabel('Correo electrónico').fill(correo)
  await elegirOpcion(admin.getByLabel('Rol'), { label: 'Asesor' })
  await admin.getByRole('button', { name: 'Enviar invitación' }).click()
  await expect(admin.getByText('Invitación enviada')).toBeVisible()
  await admin.context().close()

  // Pide el correo desde la pantalla de acceso, sin haber entrado.
  await page.goto('/acceso/recuperar')
  await page.getByLabel('Correo electrónico').fill(correo)
  await page.getByRole('button', { name: 'Enviarme el enlace' }).click()
  await expect(page.getByText(/te acabamos de enviar un correo/)).toBeVisible()

  // Abre el enlace del correo. Se conserva su ruta y se usa la dirección de esta app, que en las
  // pruebas puede estar en otro puerto.
  const enlace = await enlaceDelCorreo(correo)
  await page.goto(enlace.pathname + enlace.search)

  await expect(page.getByRole('heading', { name: 'Pon tu contraseña' })).toBeVisible()
  await page.getByLabel('Contraseña nueva').fill(CONTRASENA_NUEVA)
  await page.getByLabel('Repite la contraseña').fill(CONTRASENA_NUEVA)
  await page.getByRole('button', { name: 'Guardar y entrar' }).click()

  await expect(page).toHaveURL(/\/asesor$/)
  await expect(page.getByRole('heading', { name: 'Panel del asesor' })).toBeVisible()
})
