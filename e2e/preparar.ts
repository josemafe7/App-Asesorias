import { cargarSeed } from '../scripts/seed.mts'

/**
 * Antes de empezar las pruebas, la base de datos queda como recién sembrada.
 *
 * No basta con borrar lo que dejaron las pruebas anteriores: algunas cambian datos de ejemplo (una
 * solicitud que pasa a cumplida al subir un documento), y la vuelta siguiente tiene que encontrarlo
 * todo como al principio. El seed borra primero los datos de prueba y se niega a tocar una base de
 * datos con datos de verdad.
 */
export default async function preparar(): Promise<void> {
  await cargarSeed()
}
