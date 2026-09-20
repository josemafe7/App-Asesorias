import { afterEach, describe, expect, it, vi } from 'vitest'

import { logAccountStatusChange, logFailedSignIn, logRoleChange } from './audit'

/**
 * A9 · Los intentos fallidos de inicio de sesión y los cambios de rol quedan registrados.
 *
 * Aquí se comprueba que el registro se escribe de verdad y que dice lo que tiene que decir, sin datos
 * personales de más.
 */

afterEach(() => {
  vi.restoreAllMocks()
})

describe('registro de seguridad', () => {
  it('A9 · un intento fallido de acceso queda registrado, con su hora', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    logFailedSignIn('203.0.113.7')

    expect(warn).toHaveBeenCalledTimes(1)
    const [mensaje, datos] = warn.mock.calls[0]
    expect(mensaje).toContain('intento fallido')
    expect(datos).toMatchObject({ ip: '203.0.113.7' })
    expect(typeof (datos as { at: string }).at).toBe('string')
  })

  it('A9 · un cambio de rol queda registrado: quién, a quién y a qué rol', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})

    logRoleChange({ actor: 'admin-1', user: 'usuario-2', role: 'advisor' })

    expect(info).toHaveBeenCalledTimes(1)
    const [mensaje, datos] = info.mock.calls[0]
    expect(mensaje).toContain('cambio de rol')
    expect(datos).toMatchObject({ actor: 'admin-1', user: 'usuario-2', role: 'advisor' })
  })

  it('una baja o un alta de cuenta también queda registrada', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})

    logAccountStatusChange({ actor: 'admin-1', user: 'usuario-2', isActive: false })

    expect(info).toHaveBeenCalledTimes(1)
    expect(info.mock.calls[0][1]).toMatchObject({ isActive: false })
  })

  it('en el registro no aparecen correos ni nombres', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})

    logRoleChange({ actor: 'admin-1', user: 'usuario-2', role: 'client' })

    const escrito = JSON.stringify(info.mock.calls[0])
    expect(escrito).not.toContain('@')
  })
})
