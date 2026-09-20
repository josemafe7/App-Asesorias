import path from 'node:path'

/**
 * Dónde se guardan las sesiones con las que entran las pruebas.
 *
 * Entrar cuesta: Supabase limita cuántos inicios de sesión acepta seguidos, y una prueba por persona
 * agota ese margen enseguida. Por eso se entra una sola vez con cada usuario de ejemplo, al principio
 * (`e2e/sesiones.setup.ts`), y las demás pruebas reutilizan esa sesión. Es lo que recomienda Playwright.
 *
 * Los archivos no se suben a Git: llevan credenciales de sesión, aunque sean de usuarios de mentira.
 */
export const CARPETA_SESIONES = 'e2e/.sesiones'

export function rutaSesion(clave: string): string {
  return path.join(CARPETA_SESIONES, `${clave}.json`)
}

/** Las credenciales para hablar con la base de datos de frente, en `e2e/permisos.spec.ts`. */
export const RUTA_CREDENCIALES = path.join(CARPETA_SESIONES, 'credenciales.json')
