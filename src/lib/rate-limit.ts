/**
 * Límite de peticiones, en memoria del propio proceso.
 *
 * Es lo que pide `docs/security.md` para lo que se puede atacar repitiendo: inicio de sesión,
 * formularios, subidas y llamadas a la IA. En Vercel esto lo haría su firewall; como publicamos en un VPS
 * con un solo contenedor, un contador en memoria es suficiente y no añade ninguna dependencia.
 *
 * Lo que hay que saber: al reiniciar la app los contadores se van a cero. Para frenar a quien prueba
 * contraseñas en bucle es de sobra. Si algún día la app corre en varios contenedores a la vez, esto deja
 * de valer y habría que llevar los contadores a la base de datos.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number }

/**
 * Mira si una clave ha agotado su cupo, SIN gastar nada.
 *
 * Se usa antes de intentar algo, para no castigar al que acierta: la regla A8 habla de intentos
 * *fallidos*, así que un acceso correcto no debe acercar a nadie al bloqueo.
 */
export function peekRateLimit(key: string, limit: number): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) return { allowed: true }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { allowed: true }
}

/**
 * Apunta un intento y dice si la clave ya ha agotado su cupo.
 *
 * Para lo que se cuenta al hacerlo (enviar un correo, llamar a la IA) se llama antes de actuar. Para lo
 * que solo se cuenta si sale mal (acertar una contraseña) se llama después, y solo si ha fallado.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()

  // Limpieza perezosa: si el mapa crece demasiado, se tiran las entradas ya caducadas. Así un atacante
  // no puede llenar la memoria inventando claves.
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(k)
    }
  }

  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count += 1
  return { allowed: true }
}

/** Borra el contador de una clave. Se usa cuando la acción sale bien (por ejemplo, al acertar la contraseña). */
export function resetRateLimit(key: string): void {
  buckets.delete(key)
}
