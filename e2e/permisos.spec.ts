import fs from 'node:fs'

import { expect, test, type APIRequestContext } from '@playwright/test'

import { E2E_TAX_ID_PREFIX } from '../scripts/seed-data.mts'

import { RUTA_CREDENCIALES } from './sesiones'
import { seedUser } from './utils'

/**
 * Permisos en la base de datos, atacándola de frente.
 *
 * Estas pruebas no pasan por la app: hablan directamente con Supabase con la misma clave publicable que
 * lleva cualquier navegador. Es justo lo que haría alguien que abre las herramientas de desarrollo, copia
 * la clave y prueba a pedir datos por su cuenta. Si las reglas por filas fallaran, la app podría seguir
 * pintando bien las pantallas y los datos estarían expuestos igualmente.
 *
 * Cubren el «se comprueba» de la fase 1 («las reglas por filas están activas en todas las tablas») y la
 * norma de docs/testing.md: cada dato protegido tiene una prueba de que otro usuario no puede verlo ni
 * cambiarlo.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

test.beforeAll(() => {
  // Si faltan, es mejor que la prueba falle a que se salte en silencio y parezca que todo está bien.
  expect(SUPABASE_URL, 'falta NEXT_PUBLIC_SUPABASE_URL en .env.local').toBeTruthy()
  expect(PUBLISHABLE_KEY, 'falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local').toBeTruthy()
})

/**
 * La credencial de una persona, igual que la que lleva su navegador.
 *
 * No se pide aquí: la guardó `e2e/sesiones.setup.ts` al empezar. Supabase limita cuántos inicios de
 * sesión acepta seguidos, y una prueba por persona agotaba ese margen.
 */
function sessionToken(email: string): string {
  const credenciales = JSON.parse(fs.readFileSync(RUTA_CREDENCIALES, 'utf8')) as Record<
    string,
    string
  >
  const token = credenciales[email]

  if (!token) throw new Error(`No hay ninguna credencial guardada para ${email}`)

  return token
}

/** Pide una tabla entera. Sin credencial, como alguien que no ha entrado. */
async function readTable(
  request: APIRequestContext,
  table: string,
  token?: string,
): Promise<unknown[]> {
  const response = await request.get(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: PUBLISHABLE_KEY!,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  expect(response.ok()).toBe(true)
  return (await response.json()) as unknown[]
}

/**
 * Los nombres de las empresas que alcanza una persona, dejando fuera las que crean otras pruebas.
 *
 * Las pruebas corren a la vez, y las que recorren la app dan de alta empresas marcadas como de prueba.
 * Contarlas aquí haría fallar estas comprobaciones por un motivo que no tiene nada que ver con los
 * permisos, que es lo único que miran.
 */
async function nombresDeEmpresas(request: APIRequestContext, token: string): Promise<string[]> {
  const clients = (await readTable(request, 'clients', token)) as {
    legal_name: string
    tax_id: string
  }[]

  return clients
    .filter((client) => !client.tax_id.startsWith(E2E_TAX_ID_PREFIX))
    .map((client) => client.legal_name)
    .sort()
}

test('sin haber entrado no se ve ni una fila de ninguna tabla', async ({ request }) => {
  expect(await readTable(request, 'profiles')).toEqual([])
  expect(await readTable(request, 'clients')).toEqual([])
})

test('un cliente solo ve su propia empresa, no las demás', async ({ request }) => {
  const token = sessionToken(seedUser('espiga-pablo').email)

  const clients = (await readTable(request, 'clients', token)) as { legal_name: string }[]

  expect(clients).toHaveLength(1)
  expect(clients[0].legal_name).toBe('Panadería La Espiga SL')
})

// A10 · Para escribir a su asesor, el cliente necesita su dirección, así que desde la fase 2 puede leer
// ese perfil. Solo ese: ni el de otro asesor, ni el del administrador, ni el de sus compañeros de
// empresa.
test('un cliente ve su perfil y el de su asesor, y ningún otro', async ({ request }) => {
  const token = sessionToken(seedUser('espiga-pablo').email)

  const profiles = (await readTable(request, 'profiles', token)) as { email: string }[]
  const correos = profiles.map((profile) => profile.email).sort()

  expect(correos).toEqual([seedUser('marta').email, seedUser('espiga-pablo').email].sort())
  expect(correos).not.toContain(seedUser('javier').email)
  expect(correos).not.toContain(seedUser('admin').email)
  expect(correos).not.toContain(seedUser('espiga-rosa').email)
})

test('un asesor solo ve los clientes que tiene asignados', async ({ request }) => {
  const token = sessionToken(seedUser('marta').email)

  const nombres = await nombresDeEmpresas(request, token)

  expect(nombres).toEqual(['Panadería La Espiga SL', 'Talleres Moreno SL'])
  expect(nombres).not.toContain('Floristería Azahar SL')
  expect(nombres).not.toContain('Ana Belmonte García')
})

test('el administrador sí ve todas las empresas', async ({ request }) => {
  const token = sessionToken(seedUser('admin').email)

  const nombres = await nombresDeEmpresas(request, token)

  expect(nombres).toEqual([
    'Ana Belmonte García',
    'Floristería Azahar SL',
    'Panadería La Espiga SL',
    'Talleres Moreno SL',
  ])
})

test('un cliente no puede ascenderse a administrador', async ({ request }) => {
  const pablo = seedUser('espiga-pablo')
  const token = sessionToken(pablo.email)

  const response = await request.patch(
    `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(pablo.email)}`,
    {
      headers: {
        apikey: PUBLISHABLE_KEY!,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      data: { role: 'admin' },
    },
  )

  // No cambia ninguna fila: la política de escritura es solo del administrador.
  expect(await response.json()).toEqual([])

  // Y sigue siendo cliente.
  const profiles = (await readTable(request, 'profiles', token)) as {
    email: string
    role: string
  }[]
  const suyo = profiles.find((profile) => profile.email === pablo.email)
  expect(suyo?.role).toBe('client')
})

// Se prueba sobre un cliente QUE SÍ ES SUYO a propósito. Con el de otro asesor, la respuesta vacía no
// demostraría nada: podría ser porque no puede verlo, no porque no pueda cambiarlo.
test('un asesor no puede cambiar la asignación de un cliente, ni de los suyos', async ({
  request,
}) => {
  const token = sessionToken(seedUser('marta').email)

  const response = await request.patch(`${SUPABASE_URL}/rest/v1/clients?tax_id=eq.B12345678`, {
    headers: {
      apikey: PUBLISHABLE_KEY!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    data: { advisor_id: null },
  })

  // No cambia ninguna fila: escribir en los clientes es solo del administrador.
  expect(await response.json()).toEqual([])

  // Y La Espiga, que es suya, sigue siendo suya.
  const nombres = await nombresDeEmpresas(request, token)
  expect(nombres).toContain('Panadería La Espiga SL')
})

// A11 · Un administrador no puede quitarse el rol ni desactivarse. La pantalla no se lo ofrece, pero eso
// no basta: aquí se comprueba atacando la base de datos con su propia credencial.
test('A11 · un administrador no consigue degradarse ni darse de baja a sí mismo', async ({
  request,
}) => {
  const admin = seedUser('admin')
  const token = sessionToken(admin.email)

  const intentar = async (cambio: Record<string, unknown>) =>
    request.patch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(admin.email)}`, {
      headers: {
        apikey: PUBLISHABLE_KEY!,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      data: cambio,
    })

  expect(await (await intentar({ role: 'advisor' })).json()).toEqual([])
  expect(await (await intentar({ is_active: false })).json()).toEqual([])

  // Sigue siendo administrador y sigue activo.
  const profiles = (await readTable(request, 'profiles', token)) as {
    email: string
    role: string
    is_active: boolean
  }[]
  const suyo = profiles.find((profile) => profile.email === admin.email)
  expect(suyo?.role).toBe('admin')
  expect(suyo?.is_active).toBe(true)
})

test('las funciones internas de los permisos no están publicadas en la API', async ({ request }) => {
  for (const funcion of ['current_user_role', 'current_user_client_id', 'is_admin']) {
    const response = await request.post(`${SUPABASE_URL}/rest/v1/rpc/${funcion}`, {
      headers: { apikey: PUBLISHABLE_KEY!, 'Content-Type': 'application/json' },
      data: {},
    })
    expect(response.status(), `${funcion} sigue alcanzable desde fuera`).toBe(404)
  }
})

// A2 · La protección de verdad está en el panel de Supabase, no en una pantalla. Ocultar el botón de
// registro no impide que alguien llame al servicio directamente, así que se comprueba ahí.
test('A2 · nadie puede crearse una cuenta llamando al servicio directamente', async ({ request }) => {
  const response = await request.post(`${SUPABASE_URL}/auth/v1/signup`, {
    headers: { apikey: PUBLISHABLE_KEY!, 'Content-Type': 'application/json' },
    data: { email: `intruso-${Date.now()}@ejemplo.es`, password: 'Intruso-2026!' },
  })

  expect(response.ok(), 'el registro público está abierto en Supabase').toBe(false)
})

// Desde la fase 2 el administrador da de alta clientes e invita usuarios. Que solo pueda él no se queda
// en esconder un botón: se comprueba atacando la base de datos de frente, como en las pruebas de arriba.
test('un asesor no puede dar de alta clientes, aunque llame a la base de datos directamente', async ({
  request,
}) => {
  const token = sessionToken(seedUser('marta').email)

  const response = await request.post(`${SUPABASE_URL}/rest/v1/clients`, {
    headers: {
      apikey: PUBLISHABLE_KEY!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    data: { legal_name: 'E2E Empresa colada por un asesor', tax_id: 'E2ECOLADA1' },
  })

  expect(response.ok(), 'un asesor ha conseguido dar de alta un cliente').toBe(false)
})

// Un usuario cliente ve la ficha de su empresa, pero no la edita («Quién puede hacer qué»). Que en la
// pantalla no haya botón de guardar no basta: se comprueba atacando la tabla de frente.
test('un cliente no puede cambiar los datos de su propia empresa', async ({ request }) => {
  const token = sessionToken(seedUser('espiga-pablo').email)

  const response = await request.patch(`${SUPABASE_URL}/rest/v1/clients?tax_id=eq.B12345678`, {
    headers: {
      apikey: PUBLISHABLE_KEY!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    data: { legal_name: 'E2E Panadería renombrada por su cliente' },
  })

  // No cambia ninguna fila: escribir en los clientes es solo del administrador.
  expect(await response.json()).toEqual([])

  // Y su empresa se sigue llamando igual.
  const clients = (await readTable(request, 'clients', token)) as { legal_name: string }[]
  expect(clients[0].legal_name).toBe('Panadería La Espiga SL')
})

// Un asesor alcanza los perfiles de los usuarios de SUS clientes, para saber con quién habla. Los de
// los clientes de otro asesor, no.
test('un asesor no ve los perfiles de los usuarios de otro asesor', async ({ request }) => {
  const token = sessionToken(seedUser('javier').email)

  const profiles = (await readTable(request, 'profiles', token)) as { email: string }[]
  const correos = profiles.map((profile) => profile.email)

  // La Espiga la lleva Marta: sus usuarios no son cosa de Javier.
  expect(correos).not.toContain(seedUser('espiga-pablo').email)
  expect(correos).not.toContain(seedUser('espiga-rosa').email)
  expect(correos).not.toContain(seedUser('marta').email)
  // El suyo sí.
  expect(correos).toContain(seedUser('javier').email)
})

test('un asesor no puede crear perfiles ni cambiar el rol de nadie', async ({ request }) => {
  const token = sessionToken(seedUser('marta').email)

  const response = await request.patch(
    `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(seedUser('espiga-pablo').email)}`,
    {
      headers: {
        apikey: PUBLISHABLE_KEY!,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      data: { role: 'advisor' },
    },
  )

  // No cambia ninguna fila: escribir en los perfiles es solo del administrador.
  expect(await response.json()).toEqual([])
})
