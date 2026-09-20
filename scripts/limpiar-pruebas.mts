/**
 * Borra los datos que crean las pruebas de Playwright: las empresas con NIF marcado y las cuentas del
 * dominio reservado de pruebas.
 *
 * Lo usan dos sitios: las propias pruebas (antes de empezar y al terminar) y el seed, para que una
 * prueba cortada por la mitad no deje nada por medio.
 *
 * Usa la clave secreta porque borrar una cuenta solo se puede hacer con ella. Nunca se ejecuta contra
 * datos reales: solo toca lo que lleva la marca de prueba.
 */

import { createClient } from '@supabase/supabase-js'

import { E2E_EMAIL_DOMAIN, E2E_TAX_ID_PREFIX } from './seed-data.mts'

export async function borrarDatosDePruebas(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!url || !secretKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY: no se pueden borrar los datos de prueba.',
    )
  }

  const admin = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Primero las cuentas: al borrar una cuenta, su perfil se va con ella.
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw new Error(`No se han podido listar las cuentas: ${error.message}`)

  for (const user of data.users) {
    if (user.email?.endsWith(`@${E2E_EMAIL_DOMAIN}`)) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
      if (deleteError) throw new Error(`No se ha podido borrar una cuenta: ${deleteError.message}`)
    }
  }

  // Y después las empresas, que ya no tienen usuarios colgando.
  const { error: clientsError } = await admin
    .from('clients')
    .delete()
    .like('tax_id', `${E2E_TAX_ID_PREFIX}%`)

  if (clientsError) {
    throw new Error(`No se han podido borrar las empresas de prueba: ${clientsError.message}`)
  }
}
