import fs from 'node:fs'

import { expect, request, test as setup } from '@playwright/test'

import { DEMO_PASSWORD } from '../scripts/seed-data.mts'

import { CARPETA_SESIONES, RUTA_CREDENCIALES, rutaSesion } from './sesiones'
import { seedUser, signIn } from './utils'

/**
 * Entra una vez con cada usuario de ejemplo y guarda su sesión, para que las demás pruebas no tengan
 * que volver a entrar (ver `e2e/sesiones.ts`).
 */

/** Las personas con las que recorren la app las pruebas. */
const CLAVES = ['admin', 'marta', 'javier', 'espiga-pablo', 'espiga-rosa']

/** Las que además hablan con la base de datos de frente, sin pasar por la app. */
const CON_CREDENCIAL = ['admin', 'marta', 'espiga-pablo']

setup('guarda una sesión por cada usuario de prueba', async ({ browser }) => {
  fs.mkdirSync(CARPETA_SESIONES, { recursive: true })

  for (const clave of CLAVES) {
    const context = await browser.newContext()
    const page = await context.newPage()

    await signIn(page, seedUser(clave).email)
    await expect(page).toHaveURL(/\/(admin|asesor|cliente)$/)

    await context.storageState({ path: rutaSesion(clave) })
    await context.close()
  }

  const api = await request.newContext()
  const credenciales: Record<string, string> = {}

  for (const clave of CON_CREDENCIAL) {
    const email = seedUser(clave).email
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          'Content-Type': 'application/json',
        },
        data: { email, password: DEMO_PASSWORD },
      },
    )
    expect(response.ok(), `no se ha podido entrar como ${email}`).toBe(true)

    const body = await response.json()
    credenciales[email] = body.access_token as string
  }

  await api.dispose()
  fs.writeFileSync(RUTA_CREDENCIALES, JSON.stringify(credenciales), 'utf8')
})
