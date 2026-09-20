# Pruebas

Qué se prueba y cómo, para demostrar que el código funciona.

## Qué se prueba

- Cada fase añade pruebas de lo que construye.
- El «se comprueba» de cada fase de `docs/spec.md` se convierte, siempre que se pueda, en una prueba de
  Playwright que hace lo mismo que haría la persona.
- Las reglas de «Qué hace» y los permisos de «Quién puede hacer qué» de `docs/spec.md` son la lista de lo
  que hay que probar: cada una tiene su prueba siempre que se pueda, la más sencilla que la demuestre.
- Las pruebas de esas reglas y permisos se escriben antes que el código que las cumple, leyendo la
  especificación y no el código: primero fallan y después se construye hasta que pasan. Es la forma de
  trabajar, no algo que haya que enseñarme ni preguntarme.
- La lógica (cálculos, reglas del negocio, validaciones, permisos) se prueba con Vitest, también con datos
  incorrectos.
- Cada dato protegido tiene una prueba de que otro usuario no puede verlo ni cambiarlo.
- Cuando se corrige un fallo de funcionamiento, primero se escribe una prueba que lo reproduce. Los textos,
  los colores y los detalles visuales no se prueban.

## Cómo

- Vitest, con la prueba junto al código que prueba (`invoice.test.ts`). No admite componentes de servidor
  asíncronos: esos se prueban con Playwright.
- Playwright, en `e2e/` y con Chromium (`pnpm exec playwright install chromium` la primera vez). Arranca la
  app él solo (`webServer`) y, como recomienda Next.js, prueba la versión compilada (`pnpm build` y
  `pnpm start`).
- Vitest excluye `e2e/` en su configuración, porque por defecto recogería también los `.spec.ts` de
  Playwright.
- Las pruebas no dependen unas de otras ni del orden en que se ejecutan.
- Datos inventados y usuarios de prueba: los del seed (ver `docs/conventions.md`). Las pruebas nunca se
  ejecutan contra una base de datos con datos reales: si la del proyecto ya los tiene, antes se separan
  desarrollo y producción, como dice `docs/security.md`.
- Los servicios de pago (IA, emails, pagos) se simulan: las pruebas no los llaman de verdad.
- Cuando el proyecto esté en GitHub, se propone ejecutar las pruebas automáticamente en cada subida.
