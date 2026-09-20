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
