# 0003 · Leer los documentos con OpenRouter

- **Estado:** aceptada
- **Fecha:** 2026-09-20

## Contexto y problema

La app tiene que proponer fecha, proveedor, base, IVA, total y categoría a partir de una foto o un PDF. Hace
falta un modelo que vea imágenes y PDF y que devuelva datos con una estructura fija.

## Opciones consideradas

- OpenRouter con un modelo de Google Gemini Flash: un único proveedor por delante de muchos modelos, se
  cambia de modelo sin tocar código.
- Claude directamente (Opus 5, Sonnet 5 o Haiku 4.5).
- Un servicio especializado en leer facturas.

## Decisión

OpenRouter, con el modelo indicado en la variable de entorno `OPENROUTER_MODEL`. Se arranca con
`google/gemini-3-flash-preview` por decisión expresa del responsable del proyecto.

`google/gemini-3-flash-preview` es un modelo en preview, y la regla de `AGENTS.md` dice no usar betas ni
preview. Se usa igualmente porque así se decidió, y queda anotado en «Excepciones aprobadas» de
`docs/security.md` con las medidas que reducen el riesgo. La alternativa estable equivalente es
`google/gemini-3.8-flash`, publicada el 2 de septiembre de 2026, algo más cara.

## Consecuencias

- Cambiar de modelo, o volver al estable, es cambiar una variable de entorno.
- Gemini lee PDF de forma nativa a través de OpenRouter, así que no hay coste extra de reconocimiento de
  texto.
- Coste aproximado: 0,15 céntimos por documento con el modelo de arranque.
- La respuesta se valida siempre contra un esquema: si el modelo cambia de comportamiento, los campos
  quedan pendientes en lugar de guardarse datos falsos.
- En la cuenta de OpenRouter hay que desactivar el registro de prompts y rechazar los proveedores que
  entrenan con los datos, porque son documentos fiscales de terceros.
- La IA no tiene herramientas: recibe un archivo y devuelve campos de un esquema cerrado.
