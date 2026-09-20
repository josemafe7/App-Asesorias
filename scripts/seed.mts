/**
 * Datos de ejemplo de Carpeta Fiscal.
 *
 * Los usa quien descargue el proyecto, la demo y las pruebas de Playwright. La app es la misma: no hay
 * un modo demostración aparte (docs/conventions.md).
 *
 * NUNCA se ejecuta donde hay datos reales. El guardián de más abajo lo comprueba solo: si encuentra un
 * cliente que no es de este archivo, se para sin tocar nada.
 *
 * Se ejecuta con `pnpm seed`, que le pasa las variables de .env.local.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '../src/lib/supabase/database.types.ts'
import { borrarDatosDePruebas } from './limpiar-pruebas.mts'
import {
  DEMO_PASSWORD,
  SEED_CLIENTS,
  SEED_DOSSIERS,
  SEED_USERS,
  type SeedUser,
} from './seed-data.mts'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local')
  process.exit(1)
}

const admin: SupabaseClient<Database> = createClient<Database>(SUPABASE_URL, SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/** Se para si la base de datos tiene clientes que no son de este archivo: ahí hay datos de verdad. */
async function refuseIfRealData(): Promise<void> {
  const { data, error } = await admin.from('clients').select('legal_name, tax_id')
  if (error) throw new Error(`No se ha podido leer la tabla de clientes: ${error.message}`)

  const seedTaxIds = new Set(SEED_CLIENTS.map((client) => client.taxId))
  const strangers = (data ?? []).filter((row) => !seedTaxIds.has(row.tax_id))

  if (strangers.length > 0) {
    console.error('ALTO. Esta base de datos tiene clientes que no son datos de ejemplo:')
    for (const row of strangers.slice(0, 5)) console.error(`  - ${row.legal_name} (${row.tax_id})`)
    console.error('El seed no se ejecuta donde hay datos reales. No se ha tocado nada.')
    process.exit(1)
  }
}

/** Una fecha límite a tantos días de hoy, como año-mes-día. */
function enDias(dias: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

async function upsertUser(user: SeedUser): Promise<string> {
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) throw new Error(`No se han podido listar los usuarios: ${listError.message}`)

  const existing = list.users.find((candidate) => candidate.email === user.email)
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password: DEMO_PASSWORD })
    return existing.id
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`No se ha podido crear ${user.email}: ${error?.message}`)
  return data.user.id
}

/**
 * Deja la base de datos con los datos de ejemplo, tal cual están en `seed-data.mts`.
 *
 * La usan `pnpm seed` y las pruebas de Playwright antes de empezar, para que cada vuelta arranque
 * siempre desde el mismo sitio (docs/testing.md).
 */
export async function cargarSeed(): Promise<void> {
  // Lo que dejaron las pruebas no es dato real: se borra antes de mirar si aquí hay datos de verdad.
  await borrarDatosDePruebas()
  await refuseIfRealData()

  // 1) Los usuarios de la asesoría, que son quienes pueden ser asesores de un cliente.
  const userIds = new Map<string, string>()
  for (const user of SEED_USERS) {
    userIds.set(user.key, await upsertUser(user))
  }

  // 2) Los perfiles del personal (sin empresa). Van antes que los clientes, porque un cliente
  //    apunta a su asesor.
  for (const user of SEED_USERS.filter((candidate) => candidate.role !== 'client')) {
    const { error } = await admin.from('profiles').upsert(
      {
        id: userIds.get(user.key)!,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        client_id: null,
        is_active: user.isActive ?? true,
      },
      { onConflict: 'id' },
    )
    if (error) throw new Error(`Perfil de ${user.email}: ${error.message}`)
  }

  // 3) Las empresas, cada una con su asesor asignado.
  const clientIds = new Map<string, string>()
  for (const client of SEED_CLIENTS) {
    const { data, error } = await admin
      .from('clients')
      .upsert(
        {
          legal_name: client.legalName,
          tax_id: client.taxId,
          email: client.email,
          phone: client.phone,
          advisor_id: userIds.get(client.advisorKey)!,
          is_active: true,
        },
        { onConflict: 'tax_id' },
      )
      .select('id')
      .single()
    if (error || !data) throw new Error(`Cliente ${client.legalName}: ${error?.message}`)
    clientIds.set(client.key, data.id)
  }

  // 4) Los perfiles de los usuarios cliente, ya con su empresa.
  for (const user of SEED_USERS.filter((candidate) => candidate.role === 'client')) {
    const { error } = await admin.from('profiles').upsert(
      {
        id: userIds.get(user.key)!,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        client_id: clientIds.get(user.clientKey!)!,
        is_active: user.isActive ?? true,
      },
      { onConflict: 'id' },
    )
    if (error) throw new Error(`Perfil de ${user.email}: ${error.message}`)
  }

  // 5) Los expedientes de ejemplo y lo que se le pide a cada cliente en ellos.
  for (const dossier of SEED_DOSSIERS) {
    const { data, error } = await admin
      .from('dossiers')
      .upsert(
        {
          client_id: clientIds.get(dossier.clientKey)!,
          year: dossier.year,
          quarter: dossier.quarter,
          status: dossier.status,
        },
        { onConflict: 'client_id,year,quarter' },
      )
      .select('id')
      .single()
    if (error || !data)
      throw new Error(`Expediente ${dossier.clientKey}: ${error?.message}`)

    // Se rehacen enteras para que dos seeds seguidos no dupliquen lo pedido.
    const { error: borrado } = await admin
      .from('document_requests')
      .delete()
      .eq('dossier_id', data.id)
    if (borrado) throw new Error(`Solicitudes de ${dossier.clientKey}: ${borrado.message}`)

    for (const request of dossier.requests) {
      const { error: fallo } = await admin.from('document_requests').insert({
        dossier_id: data.id,
        title: request.title,
        description: request.description ?? null,
        due_date: enDias(request.dueInDays),
      })
      if (fallo) throw new Error(`Solicitud «${request.title}»: ${fallo.message}`)
    }
  }

}

// Solo cuando se ejecuta a mano con `pnpm seed`, no cuando lo importa otro archivo.
if (process.argv[1]?.endsWith('seed.mts')) {
  cargarSeed()
    .then(() => {
      console.log(
        `Listo: ${SEED_USERS.length} usuarios y ${SEED_CLIENTS.length} clientes de ejemplo.`,
      )
      console.log(`Contraseña de todos: ${DEMO_PASSWORD}`)
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error)
      process.exit(1)
    })
}
