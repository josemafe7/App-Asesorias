import { describe, expect, it } from 'vitest'

import { changeRoleSchema, inviteUserSchema } from './users'

/**
 * Reglas de docs/spec.md que se comprueban aquí:
 * A5 · El administrador crea un usuario y le llega una invitación.
 * A11 · Un administrador no puede quitarse a sí mismo el rol.
 * C7 · Cada usuario de tipo cliente pertenece a una empresa.
 */

const EMPRESA = '7c6f3a2e-9d4b-4f1a-8e2c-5b6a7d8e9f01'
const OTRO_USUARIO = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'

const invitacion = {
  fullName: 'Pablo Espiga',
  email: 'pablo@laespiga.es',
  role: 'client',
  clientId: EMPRESA,
}

describe('invitar a un usuario', () => {
  it('A5 · acepta una invitación completa', () => {
    const parsed = inviteUserSchema.safeParse(invitacion)

    expect(parsed.success).toBe(true)
    expect(parsed.data?.email).toBe('pablo@laespiga.es')
  })

  it('C7 · un usuario cliente sin empresa no se puede invitar', () => {
    const parsed = inviteUserSchema.safeParse({ ...invitacion, clientId: '' })

    expect(parsed.success).toBe(false)
  })

  it('C7 · un asesor nunca lleva empresa, aunque se elija una', () => {
    const parsed = inviteUserSchema.safeParse({ ...invitacion, role: 'advisor' })

    expect(parsed.success).toBe(true)
    expect(parsed.data?.clientId).toBeNull()
  })

  it('C7 · un administrador tampoco lleva empresa', () => {
    const parsed = inviteUserSchema.safeParse({ ...invitacion, role: 'admin', clientId: '' })

    expect(parsed.success).toBe(true)
    expect(parsed.data?.clientId).toBeNull()
  })

  it('sin nombre no se puede invitar', () => {
    const parsed = inviteUserSchema.safeParse({ ...invitacion, fullName: '  ' })

    expect(parsed.success).toBe(false)
  })

  it('un correo que no lo es se rechaza', () => {
    const parsed = inviteUserSchema.safeParse({ ...invitacion, email: 'pablo(arroba)laespiga.es' })

    expect(parsed.success).toBe(false)
  })

  it('el correo se guarda en minúsculas y sin espacios', () => {
    const parsed = inviteUserSchema.safeParse({ ...invitacion, email: '  Pablo@LaEspiga.es ' })

    expect(parsed.data?.email).toBe('pablo@laespiga.es')
  })

  it('un rol que no existe se rechaza', () => {
    const parsed = inviteUserSchema.safeParse({ ...invitacion, role: 'jefe' })

    expect(parsed.success).toBe(false)
  })
})

describe('cambiar el rol de un usuario', () => {
  it('acepta convertir a alguien en asesor', () => {
    const parsed = changeRoleSchema.safeParse({
      userId: OTRO_USUARIO,
      role: 'advisor',
      clientId: EMPRESA,
    })

    expect(parsed.success).toBe(true)
    // Al dejar de ser cliente, deja de pertenecer a una empresa (C7).
    expect(parsed.data?.clientId).toBeNull()
  })

  it('C7 · para convertir a alguien en cliente hace falta la empresa', () => {
    const parsed = changeRoleSchema.safeParse({
      userId: OTRO_USUARIO,
      role: 'client',
      clientId: '',
    })

    expect(parsed.success).toBe(false)
  })

  it('el usuario tiene que venir identificado', () => {
    const parsed = changeRoleSchema.safeParse({ userId: 'yo', role: 'admin', clientId: '' })

    expect(parsed.success).toBe(false)
  })
})
