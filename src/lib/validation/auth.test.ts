import { describe, expect, it } from 'vitest'

import { MIN_PASSWORD_LENGTH, newPasswordSchema, safeNextPathSchema, signInSchema } from './auth'

describe('acceso · validación del formulario', () => {
  it('acepta un correo y una contraseña normales', () => {
    const result = signInSchema.safeParse({ email: 'marta@rierabono.es', password: 'loquesea' })
    expect(result.success).toBe(true)
  })

  it.each(['', 'marta', 'marta@', '@rierabono.es', 'marta rierabono.es'])(
    'rechaza el correo mal escrito %j',
    (email) => {
      expect(signInSchema.safeParse({ email, password: 'loquesea' }).success).toBe(false)
    },
  )

  it('rechaza la contraseña vacía', () => {
    expect(signInSchema.safeParse({ email: 'marta@rierabono.es', password: '' }).success).toBe(false)
  })
})

describe('contraseña nueva', () => {
  const valid = 'panaderia2026'

  it('acepta dos contraseñas iguales y lo bastante largas', () => {
    expect(newPasswordSchema.safeParse({ password: valid, repeat: valid }).success).toBe(true)
  })

  it('rechaza una contraseña más corta del mínimo', () => {
    const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1)
    const result = newPasswordSchema.safeParse({ password: short, repeat: short })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(String(MIN_PASSWORD_LENGTH))
    }
  })

  it('rechaza dos contraseñas que no coinciden', () => {
    const result = newPasswordSchema.safeParse({ password: valid, repeat: valid + 'x' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Las dos contraseñas no coinciden.')
    }
  })
})

describe('a dónde se puede redirigir después de un enlace del correo', () => {
  it.each([
    '/acceso/nueva-contrasena',
    '/cliente',
    '/admin',
    '/',
  ])('acepta la ruta propia %j', (ruta) => {
    expect(safeNextPathSchema.safeParse(ruta).success).toBe(true)
  })

  it.each([
    // La que se coló: un navegador lee «//algo» como «vete a ese otro servidor».
    '//2130706433',
    '//ejemplo-falso.es/acceso',
    '//ejemplo-falso.es',
    // Direcciones completas a otro sitio.
    'https://ejemplo-falso.es',
    'http://ejemplo-falso.es',
    '//ejemplo-falso.es:8080',
    // Barra invertida: algunos navegadores la tratan como una barra normal.
    '/\ejemplo-falso.es',
    '\\ejemplo-falso.es',
    // Sin barra inicial no es una ruta.
    'cliente',
    '',
  ])('rechaza %j, que saca al usuario fuera de la app', (ruta) => {
    expect(safeNextPathSchema.safeParse(ruta).success).toBe(false)
  })
})
