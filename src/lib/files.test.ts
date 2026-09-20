import { describe, expect, it } from 'vitest'

import { checkUpload, extensionFor, MAX_FILE_BYTES } from './files'

/**
 * D2 · Se admiten JPG, PNG, WebP y PDF, hasta 10 MB, y se comprueba en el servidor.
 * D3 · Lo que no encaja se rechaza diciendo qué se admite.
 *
 * Lo que dice el navegador sobre el tipo de un archivo no vale: se mira el contenido. Las primeras
 * letras de cada formato son fijas, así que un `.exe` renombrado a `.pdf` se cae aquí.
 */

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46])
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])
const PDF = new TextEncoder().encode('%PDF-1.7\n%âãÏÓ')
const EXE = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00])

function webp(): Uint8Array {
  const bytes = new Uint8Array(16)
  bytes.set(new TextEncoder().encode('RIFF'), 0)
  bytes.set(new TextEncoder().encode('WEBP'), 8)
  return bytes
}

describe('checkUpload', () => {
  it('acepta una foto y un PDF', () => {
    expect(checkUpload({ size: 1024, bytes: JPEG })).toEqual({ ok: true, type: 'image/jpeg' })
    expect(checkUpload({ size: 1024, bytes: PNG })).toEqual({ ok: true, type: 'image/png' })
    expect(checkUpload({ size: 1024, bytes: webp() })).toEqual({ ok: true, type: 'image/webp' })
    expect(checkUpload({ size: 1024, bytes: PDF })).toEqual({ ok: true, type: 'application/pdf' })
  })

  it('rechaza un archivo de otro tipo y dice qué se admite (D3)', () => {
    const result = checkUpload({ size: 1024, bytes: EXE })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toMatch(/JPG, PNG, WebP o PDF/)
  })

  it('rechaza un archivo demasiado grande (D2)', () => {
    const result = checkUpload({ size: MAX_FILE_BYTES + 1, bytes: PDF })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toMatch(/10 MB/)
  })

  it('acepta justo el tamaño máximo', () => {
    expect(checkUpload({ size: MAX_FILE_BYTES, bytes: PDF }).ok).toBe(true)
  })

  it('rechaza un archivo vacío', () => {
    expect(checkUpload({ size: 0, bytes: new Uint8Array() }).ok).toBe(false)
  })
})

describe('extensionFor', () => {
  it('da la extensión de cada tipo admitido', () => {
    expect(extensionFor('image/jpeg')).toBe('jpg')
    expect(extensionFor('image/png')).toBe('png')
    expect(extensionFor('image/webp')).toBe('webp')
    expect(extensionFor('application/pdf')).toBe('pdf')
  })
})
