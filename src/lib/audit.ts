/**
 * A9 · Lo que queda registrado: los intentos fallidos de inicio de sesión y los cambios de permisos.
 *
 * Está aquí, y no suelto por las acciones, para que se pueda probar y para que todos los registros digan
 * lo mismo y de la misma forma.
 *
 * En el registro NO aparecen nombres ni correos: solo identificadores, la hora y qué ha pasado
 * (docs/security.md · «Límites y errores»). La única excepción, acordada, es la dirección IP de un
 * intento fallido, sin la cual no hay forma de ver que alguien está probando contraseñas en bucle.
 */

function ahora(): string {
  return new Date().toISOString()
}

export function logFailedSignIn(ip: string): void {
  console.warn('[acceso] intento fallido', { ip, at: ahora() })
}

export function logInvitation(event: { actor: string; user: string; role: string }): void {
  console.info('[usuarios] invitación enviada', { ...event, at: ahora() })
}

export function logRoleChange(event: { actor: string; user: string; role: string }): void {
  console.info('[usuarios] cambio de rol', { ...event, at: ahora() })
}

export function logAccountStatusChange(event: {
  actor: string
  user: string
  isActive: boolean
}): void {
  console.info('[usuarios] cambio de estado', { ...event, at: ahora() })
}
