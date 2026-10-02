import { describe, expect, it } from 'vitest'

import { isLocalSupabase } from './seed-data.mts'

// El seed y la limpieza de las pruebas borran datos con la clave secreta. Solo pueden hacerlo en el
// Supabase local, el de Docker: nunca en el de la nube, que es el de la app publicada.
describe('isLocalSupabase', () => {
  it('da por local el Supabase de Docker', () => {
    expect(isLocalSupabase('http://127.0.0.1:54321')).toBe(true)
    expect(isLocalSupabase('http://localhost:54321')).toBe(true)
  })

  it('no da por local un proyecto de la nube', () => {
    expect(isLocalSupabase('https://abcdefghijklmnopqrst.supabase.co')).toBe(false)
  })

  it('no se deja engañar por una dirección que solo se parece a la local', () => {
    expect(isLocalSupabase('https://localhost.ejemplo.com')).toBe(false)
    expect(isLocalSupabase('https://ejemplo.com/127.0.0.1')).toBe(false)
  })

  it('sin dirección, o con una que no lo es, no es local', () => {
    expect(isLocalSupabase(undefined)).toBe(false)
    expect(isLocalSupabase('')).toBe(false)
    expect(isLocalSupabase('esto no es una dirección')).toBe(false)
  })
})
