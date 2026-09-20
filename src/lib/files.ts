/**
 * Qué archivos se admiten y cómo se comprueba (D2, D3).
 *
 * El tipo que declara el navegador no se usa para decidir: se miran los primeros bytes del archivo,
 * que en estos formatos son siempre los mismos. Así un `.exe` renombrado a `.pdf` no entra
 * (docs/security.md · «Entradas y peticiones»).
 */

export const MAX_FILE_BYTES = 10 * 1024 * 1024

export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const

export type AllowedType = (typeof ALLOWED_TYPES)[number]

/** Lo que se le dice a la persona cuando su archivo no encaja. */
const QUE_SE_ADMITE = 'Solo se admiten archivos JPG, PNG, WebP o PDF de hasta 10 MB.'

export const EXTENSIONS: Record<AllowedType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export function extensionFor(type: AllowedType): string {
  return EXTENSIONS[type]
}

function empiezaPor(bytes: Uint8Array, firma: number[]): boolean {
  return firma.every((byte, indice) => bytes[indice] === byte)
}

function texto(bytes: Uint8Array, desde: number, largo: number): string {
  return new TextDecoder('ascii').decode(bytes.slice(desde, desde + largo))
}

/** El tipo de verdad de un archivo, mirando cómo empieza. `null` si no es ninguno de los admitidos. */
export function sniffType(bytes: Uint8Array): AllowedType | null {
  if (empiezaPor(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (empiezaPor(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (texto(bytes, 0, 4) === 'RIFF' && texto(bytes, 8, 4) === 'WEBP') return 'image/webp'
  if (texto(bytes, 0, 5) === '%PDF-') return 'application/pdf'

  return null
}

export type UploadCheck = { ok: true; type: AllowedType } | { ok: false; message: string }

export function checkUpload({ size, bytes }: { size: number; bytes: Uint8Array }): UploadCheck {
  if (size <= 0) return { ok: false, message: 'Ese archivo está vacío.' }
  if (size > MAX_FILE_BYTES) return { ok: false, message: QUE_SE_ADMITE }

  const type = sniffType(bytes)
  if (!type) return { ok: false, message: QUE_SE_ADMITE }

  return { ok: true, type }
}
