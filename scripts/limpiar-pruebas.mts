/**
 * Borra los datos que crean las pruebas de Playwright: las empresas con NIF marcado y las cuentas del
 * dominio reservado de pruebas.
 *
 * Lo usan dos sitios: las propias pruebas (antes de empezar y al terminar) y el seed, para que una
 * prueba cortada por la mitad no deje nada por medio.
 *
 * Usa la clave secreta porque borrar una cuenta solo se puede hacer con ella. Solo se ejecuta contra el
 * Supabase local, y aun ahí solo toca lo que lleva la marca de prueba.
 */

import { createClient } from '@supabase/supabase-js'

import {
  E2E_EMAIL_DOMAIN,
  E2E_FILE_PREFIX,
  E2E_TAX_ID_PREFIX,
  isLocalSupabase,
} from './seed-data.mts'

export async function borrarDatosDePruebas(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!url || !secretKey) {
    throw new Error(
      'Faltan la dirección o la clave del Supabase local: lanza las pruebas con `pnpm test:e2e`.',
    )
  }

  if (!isLocalSupabase(url)) {
    throw new Error(
      'ALTO. El seed y las pruebas solo se ejecutan contra el Supabase local, y la dirección que han ' +
        'recibido no lo es. Lánzalos con `pnpm seed` o `pnpm test:e2e`, que levantan el local y le ' +
        'pasan sus claves. No se ha tocado nada.',
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

  // Los documentos que las pruebas suben a las empresas de ejemplo: primero sus archivos del almacén
  // privado y después sus fichas. Los de las empresas de prueba se van solos con la empresa.
  const { data: documentos, error: documentosError } = await admin
    .from('documents')
    .select('id, storage_path')
    .like('original_name', `${E2E_FILE_PREFIX}%`)

  if (documentosError) {
    throw new Error(`No se han podido leer los documentos de prueba: ${documentosError.message}`)
  }

  if (documentos && documentos.length > 0) {
    await admin.storage.from('documents').remove(documentos.map((row) => row.storage_path))

    const { error } = await admin
      .from('documents')
      .delete()
      .in(
        'id',
        documentos.map((row) => row.id),
      )
    if (error) throw new Error(`No se han podido borrar los documentos de prueba: ${error.message}`)
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
