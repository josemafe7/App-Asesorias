/**
 * Los datos de ejemplo, en un archivo sin efectos: lo importan el seed y las pruebas de Playwright.
 * Separado de `seed.ts` a propósito, para que una prueba pueda leer los usuarios sin abrir ninguna
 * conexión ni necesitar claves.
 */

/**
 * La misma para todos los usuarios de prueba. Solo existe en desarrollo y en la demo.
 * Cumple la política del proyecto de Supabase: minúscula, mayúscula, número y símbolo.
 */
export const DEMO_PASSWORD = 'Carpeta-Fiscal-2026!'

export type SeedClient = {
  key: string
  legalName: string
  taxId: string
  email: string
  phone: string
  advisorKey: string
}

export type SeedUser = {
  key: string
  email: string
  fullName: string
  role: 'admin' | 'advisor' | 'client'
  clientKey?: string
  isActive?: boolean
}

export const SEED_CLIENTS: SeedClient[] = [
  {
    key: 'espiga',
    legalName: 'Panadería La Espiga SL',
    taxId: 'B12345678',
    email: 'pan@laespiga.es',
    phone: '963 112 233',
    advisorKey: 'marta',
  },
  {
    key: 'moreno',
    legalName: 'Talleres Moreno SL',
    taxId: 'B87654321',
    email: 'taller@talleresmoreno.es',
    phone: '963 445 566',
    advisorKey: 'marta',
  },
  {
    key: 'azahar',
    legalName: 'Floristería Azahar SL',
    taxId: 'B11223344',
    email: 'flores@azahar.es',
    phone: '963 778 899',
    advisorKey: 'javier',
  },
  {
    key: 'belmonte',
    legalName: 'Ana Belmonte García',
    taxId: '12345678Z',
    email: 'ana@belmonte.es',
    phone: '963 990 011',
    advisorKey: 'javier',
  },
]

export const SEED_USERS: SeedUser[] = [
  { key: 'admin', email: 'admin@rierabono.es', fullName: 'Lucía Riera', role: 'admin' },
  { key: 'marta', email: 'marta@rierabono.es', fullName: 'Marta Solís', role: 'advisor' },
  { key: 'javier', email: 'javier@rierabono.es', fullName: 'Javier Peña', role: 'advisor' },
  {
    key: 'espiga-pablo',
    email: 'pablo@laespiga.es',
    fullName: 'Pablo Espiga',
    role: 'client',
    clientKey: 'espiga',
  },
  // C7 · Una empresa puede tener varios usuarios, y todos ven lo mismo.
  {
    key: 'espiga-rosa',
    email: 'rosa@laespiga.es',
    fullName: 'Rosa Duarte',
    role: 'client',
    clientKey: 'espiga',
  },
  {
    key: 'moreno-user',
    email: 'taller@talleresmoreno.es',
    fullName: 'Andrés Moreno',
    role: 'client',
    clientKey: 'moreno',
  },
  {
    key: 'azahar-user',
    email: 'flores@azahar.es',
    fullName: 'Nuria Gil',
    role: 'client',
    clientKey: 'azahar',
  },
  {
    key: 'belmonte-user',
    email: 'ana@belmonte.es',
    fullName: 'Ana Belmonte',
    role: 'client',
    clientKey: 'belmonte',
  },
  // A4 · Para comprobar que una cuenta desactivada no entra aunque acierte la contraseña.
  {
    key: 'espiga-baja',
    email: 'baja@laespiga.es',
    fullName: 'Tomás Vega',
    role: 'client',
    clientKey: 'espiga',
    isActive: false,
  },
]
export type SeedDossier = {
  clientKey: string
  year: number
  quarter: number
  status: 'open' | 'closed'
  requests: { title: string; description?: string; dueInDays: number }[]
}

/**
 * Expedientes de ejemplo. Las fechas límite se calculan al cargar el seed a partir de los días que
 * faltan, para que en la demo haya siempre una solicitud vencida y otras por vencer.
 */
export const SEED_DOSSIERS: SeedDossier[] = [
  {
    clientKey: 'espiga',
    year: 2026,
    quarter: 1,
    status: 'open',
    requests: [
      { title: 'Facturas de compras de enero', dueInDays: -5 },
      {
        title: 'Tickets de gasolina del trimestre',
        description: 'Los del reparto, sueltos o en una carpeta',
        dueInDays: 10,
      },
      { title: 'Factura del seguro del local', dueInDays: 20 },
    ],
  },
  {
    clientKey: 'moreno',
    year: 2026,
    quarter: 1,
    status: 'open',
    requests: [{ title: 'Facturas de recambios de febrero', dueInDays: 7 }],
  },
  // E4 · Un trimestre ya cerrado, para ver que el cliente no puede subir nada en él.
  { clientKey: 'espiga', year: 2025, quarter: 4, status: 'closed', requests: [] },
  { clientKey: 'azahar', year: 2025, quarter: 4, status: 'closed', requests: [] },
]

/**
 * La marca de los datos que crean las pruebas de Playwright.
 *
 * Las pruebas dan de alta empresas y usuarios de verdad. Para que no se queden por medio ni se confundan
 * con datos reales, todo lo suyo lleva esta marca: el NIF empieza por `E2E` y el correo acaba en un
 * dominio reservado que no existe ni puede existir. El seed los borra y las pruebas, también.
 */
export const E2E_TAX_ID_PREFIX = 'E2E'
/** Los documentos que suben las pruebas llevan esta marca en el nombre del archivo. */
export const E2E_FILE_PREFIX = 'E2E'
export const E2E_EMAIL_DOMAIN = 'e2e.carpetafiscal.test'

/**
 * Si esa dirección es la del Supabase local, el que corre en Docker.
 *
 * El seed y la limpieza de las pruebas borran datos con la clave secreta, así que solo se ejecutan ahí:
 * nunca en el Supabase de la nube, que es el de la app publicada
 * (docs/decisions/0007-supabase-local-para-desarrollo.md).
 */
export function isLocalSupabase(url: string | undefined): boolean {
  if (!url) return false

  try {
    const { hostname } = new URL(url)
    return hostname === '127.0.0.1' || hostname === 'localhost'
  } catch {
    return false
  }
}
