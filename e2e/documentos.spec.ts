import { expect, test, type Page } from '@playwright/test'

import { rutaSesion } from './sesiones'
import { comoSesion, elegirOpcion } from './utils'

/**
 * Los documentos que sube el cliente en su trimestre.
 *
 * Reglas de docs/spec.md: D1, D3, D5, D6, D7, D8, E4 y S4. Lo que se demuestra sin navegador (qué
 * tipos y qué tamaños se admiten, D2) tiene su prueba en Vitest, como dice docs/testing.md.
 *
 * Los archivos van en la memoria de la prueba, no en archivos del repositorio: así se sabe byte a byte
 * lo que se sube. Todos empiezan por «E2E», que es la marca por la que se borran al terminar.
 */

// Un JPEG de mentira: lo que importa es cómo empieza, que es lo que mira el servidor.
const JPEG = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]),
  Buffer.alloc(200, 0x20),
])
const PDF = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF\n')
// Un ejecutable de Windows empieza por «MZ». Renombrarlo a .pdf no lo convierte en un PDF.
const EXE = Buffer.concat([Buffer.from([0x4d, 0x5a, 0x90, 0x00]), Buffer.alloc(100, 0x00)])

test.use({ storageState: rutaSesion('espiga-pablo') })

/** Abre desde el panel el trimestre que dice la etiqueta y devuelve su dirección. */
async function abrirTrimestre(page: Page, etiqueta: string): Promise<string> {
  await page.goto('/cliente')
  await page.getByRole('link', { name: new RegExp(etiqueta) }).click()
  await expect(page.getByRole('heading', { name: etiqueta })).toBeVisible()

  return page.url()
}

/** La fila de la lista que habla de eso: cada prueba mira lo suyo y no lo de las demás. */
function fila(page: Page, texto: string) {
  return page.getByRole('listitem').filter({ hasText: texto })
}

async function subir(
  page: Page,
  archivo: { name: string; mimeType: string; buffer: Buffer },
): Promise<void> {
  await page.getByLabel('Archivo').setInputFiles(archivo)
  await page.getByRole('button', { name: 'Subir documento' }).click()
}

/**
 * La lectura de la IA ocurre después de contestar a la subida, así que la pantalla se recarga hasta
 * que el estado cambia. En las pruebas la IA está simulada (docs/testing.md).
 */
async function esperarEstado(page: Page, nombre: string, estado: string): Promise<void> {
  await expect(async () => {
    await page.reload()
    await expect(fila(page, nombre).getByText(estado, { exact: true })).toBeVisible({
      timeout: 1000,
    })
  }).toPass({ timeout: 20_000 })
}

test('I1 y D8 · lo subido se manda a leer y queda pendiente de revisión', async ({ page }) => {
  await abrirTrimestre(page, '2026 · T1')

  await subir(page, { name: 'E2E-factura-legible.pdf', mimeType: 'application/pdf', buffer: PDF })

  await esperarEstado(page, 'E2E-factura-legible.pdf', 'Pendiente de revisión')
})

test('D1, D6 y D8 · sube una foto, la ve en su expediente y puede abrirla', async ({ page }) => {
  await abrirTrimestre(page, '2026 · T1')

  await subir(page, { name: 'E2E-ticket-gasolina.jpg', mimeType: 'image/jpeg', buffer: JPEG })

  await expect(page.getByText('Documento subido.')).toBeVisible()
  const enlace = page.getByRole('link', { name: 'E2E-ticket-gasolina.jpg' })
  await expect(enlace).toBeVisible()
  // Las pruebas corren a la vez sobre el mismo trimestre: se mira el estado de ESTE documento.
  await expect(fila(page, 'E2E-ticket-gasolina.jpg').getByText('Subido', { exact: true })).toBeVisible()

  // D6 · El enlace no lleva al archivo: lleva a la app, que comprueba y luego redirige.
  await expect(enlace).toHaveAttribute('href', /^\/documentos\//)
})

test('S4 · al subir respondiendo a una solicitud, esa solicitud queda cumplida', async ({
  page,
}) => {
  await abrirTrimestre(page, '2026 · T1')

  await page.getByLabel('Archivo').setInputFiles({
    name: 'E2E-seguro-local.pdf',
    mimeType: 'application/pdf',
    buffer: PDF,
  })
  await elegirOpcion(page.getByLabel('¿Responde a algo que te piden?'), {
    label: 'Factura del seguro del local',
  })
  await page.getByRole('button', { name: 'Subir documento' }).click()

  await expect(page.getByRole('link', { name: 'E2E-seguro-local.pdf' })).toBeVisible()
  await expect(
    fila(page, 'Factura del seguro del local').getByText('Cumplida', { exact: true }),
  ).toBeVisible()
})

test('D2 · un archivo de 20 MB se rechaza', async ({ page }) => {
  await abrirTrimestre(page, '2026 · T1')

  // Veinte megas de PDF: pasa de los diez que se admiten.
  const enorme = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(20 * 1024 * 1024, 0x20)])
  await page.getByLabel('Archivo').setInputFiles({
    name: 'E2E-enorme.pdf',
    mimeType: 'application/pdf',
    buffer: enorme,
  })

  await expect(page.getByText(/Solo se admiten archivos JPG, PNG, WebP o PDF/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'E2E-enorme.pdf' })).toBeHidden()
})

test('D3 · un archivo que no es lo que dice ser se rechaza', async ({ page }) => {
  await abrirTrimestre(page, '2026 · T1')

  // Se manda con nombre y tipo de PDF, pero por dentro es un ejecutable.
  await subir(page, { name: 'E2E-virus.pdf', mimeType: 'application/pdf', buffer: EXE })

  await expect(page.getByText(/Solo se admiten archivos JPG, PNG, WebP o PDF/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'E2E-virus.pdf' })).toBeHidden()
})

test('D7 · puede borrar un documento suyo mientras no esté aprobado', async ({ page }) => {
  await abrirTrimestre(page, '2026 · T1')

  await subir(page, { name: 'E2E-para-borrar.pdf', mimeType: 'application/pdf', buffer: PDF })
  const documento = page.getByRole('link', { name: 'E2E-para-borrar.pdf' })
  await expect(documento).toBeVisible()

  await fila(page, 'E2E-para-borrar.pdf').getByRole('button', { name: 'Borrar' }).click()

  await expect(documento).toBeHidden()
})

test('E4 · con el trimestre cerrado no puede subir nada', async ({ page }) => {
  await abrirTrimestre(page, '2025 · T4')

  await expect(page.getByText('Este trimestre está cerrado')).toBeVisible()
  await expect(page.getByLabel('Archivo')).toBeHidden()
})

test('D5 y D6 · el documento de una empresa no lo abre nadie de fuera', async ({ page, browser }) => {
  await abrirTrimestre(page, '2026 · T1')
  await subir(page, { name: 'E2E-solo-mio.pdf', mimeType: 'application/pdf', buffer: PDF })

  const enlace = page.getByRole('link', { name: 'E2E-solo-mio.pdf' })
  const direccion = await enlace.getAttribute('href')

  // Javier es asesor, pero de otros clientes: para él ese documento no existe.
  const javier = await comoSesion(browser, 'javier')
  const respuesta = await javier.goto(direccion!)
  expect(respuesta?.status()).toBe(404)

  await javier.context().close()
})
