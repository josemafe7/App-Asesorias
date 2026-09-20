import { borrarDatosDePruebas } from '../scripts/limpiar-pruebas.mts'

/**
 * Playwright llama a esto antes de empezar y al terminar (ver `globalSetup` y `globalTeardown` en
 * `playwright.config.ts`), para que las pruebas no dejen empresas ni cuentas por medio.
 */
export default async function limpieza(): Promise<void> {
  await borrarDatosDePruebas()
}
