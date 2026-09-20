import 'server-only'

import { headers } from 'next/headers'

/**
 * De dónde viene la petición. Detrás del proxy Traefik de Dokploy llega en `x-forwarded-for`.
 * Si no hay manera de saberlo, se devuelve una clave común: es preferible limitar de más que de menos.
 */
export async function requestIp(): Promise<string> {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headerList.get('x-real-ip') ?? 'desconocida'
}
