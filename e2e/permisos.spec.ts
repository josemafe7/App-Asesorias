import { expect, test, type APIRequestContext } from '@playwright/test'

import { DEMO_PASSWORD, seedUser } from './utils'

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

/** Entra como una persona y devuelve su credencial, igual que haría el navegador. */
async function sessionToken(request: APIRequestContext, email: string): Promise<string> {
  const response = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: PUBLISHABLE_KEY!, 'Content-Type': 'application/json' },
    data: { email, password: DEMO_PASSWORD },
  })
  expect(response.ok(), `no se ha podido entrar como ${email}`).toBe(true)
  const body = await response.json()
  return body.access_token as string
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

test('sin haber entrado no se ve ni una fila de ninguna tabla', async ({ request }) => {
  expect(await readTable(request, 'profiles')).toEqual([])
  expect(await readTable(request, 'clients')).toEqual([])
})

test('un cliente solo ve su propia empresa, no las demás', async ({ request }) => {
  const token = await sessionToken(request, seedUser('espiga-pablo').email)

  const clients = (await readTable(request, 'clients', token)) as { legal_name: string }[]

  expect(clients).toHaveLength(1)
  expect(clients[0].legal_name).toBe('Panadería La Espiga SL')
})

test('un cliente no ve el perfil de nadie más, ni de su propia empresa', async ({ request }) => {
  const token = await sessionToken(request, seedUser('espiga-pablo').email)

  const profiles = (await readTable(request, 'profiles', token)) as { email: string }[]

  expect(profiles).toHaveLength(1)
  expect(profiles[0].email).toBe(seedUser('espiga-pablo').email)
})

test('un asesor solo ve los clientes que tiene asignados', async ({ request }) => {
  const token = await sessionToken(request, seedUser('marta').email)

  const clients = (await readTable(request, 'clients', token)) as { legal_name: string }[]
  const nombres = clients.map((client) => client.legal_name).sort()

  expect(nombres).toEqual(['Panadería La Espiga SL', 'Talleres Moreno SL'])
  expect(nombres).not.toContain('Floristería Azahar SL')
  expect(nombres).not.toContain('Ana Belmonte García')
})

test('el administrador sí ve todas las empresas', async ({ request }) => {
  const token = await sessionToken(request, seedUser('admin').email)

  const clients = await readTable(request, 'clients', token)

  expect(clients).toHaveLength(4)
})

test('un cliente no puede ascenderse a administrador', async ({ request }) => {
  const pablo = seedUser('espiga-pablo')
  const token = await sessionToken(request, pablo.email)

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
  const profiles = (await readTable(request, 'profiles', token)) as { role: string }[]
  expect(profiles[0].role).toBe('client')
})

test('un asesor no puede robarle un cliente a otro asesor', async ({ request }) => {
  const token = await sessionToken(request, seedUser('marta').email)

  const response = await request.patch(`${SUPABASE_URL}/rest/v1/clients?tax_id=eq.B11223344`, {
    headers: {
      apikey: PUBLISHABLE_KEY!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    data: { advisor_id: null },
  })

  expect(await response.json()).toEqual([])
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
