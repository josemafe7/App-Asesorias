# Pruebas

Qué se prueba y cómo, para demostrar que el código funciona sin que las pruebas frenen el proyecto.

## Qué se prueba

- Cada fase añade pruebas de lo que construye. Las reglas de «Qué hace» y los permisos de «Quién puede
  hacer qué» de `docs/spec.md` son la lista de lo que hay que probar: cada una tiene su prueba siempre que
  se pueda, la más sencilla y rápida que la demuestre.
- Casi todo se prueba sin navegador, con Vitest, que tarda segundos: la lógica (cálculos, reglas del
  negocio, validaciones), también con datos incorrectos, y los permisos, llamando al acceso a datos o a la
  base de datos con usuarios distintos. Cada dato protegido tiene una prueba de que otro usuario no puede
  verlo ni cambiarlo.
- Con Playwright, que es lento, solo se recorren pantallas: el «se comprueba» de cada fase, haciendo lo
  mismo que haría la persona, y poco más. Una regla que se puede demostrar sin navegador no lleva prueba
  de Playwright.
- Las pruebas de Vitest se escriben antes que el código que las cumple, leyendo la especificación y no el
  código: primero fallan y después se construye hasta que pasan. La de Playwright se escribe cuando la
  pantalla ya existe, siguiendo también la especificación.
- Cuando se corrige un fallo de funcionamiento, primero se escribe una prueba que lo reproduce. Los
  textos, los colores y los detalles visuales no se prueban.

## Cómo

- Mientras se construye se pasa `pnpm check` y solo las pruebas de lo que se está tocando, con la salida
  corta: los fallos y el resumen. `pnpm test:e2e` entero se pasa una vez, al cerrar la fase, sin ningún
  servidor arrancado para que compile de verdad: así no hace falta otro `pnpm build`.
- Vitest, con la prueba junto al código que prueba (`invoice.test.ts`). No admite componentes de servidor
  asíncronos: esos se prueban con Playwright.
- Playwright, en `e2e/` y con Chromium (`pnpm exec playwright install chromium` la primera vez). Arranca la
  app él solo (`webServer`) y, como recomienda Next.js, prueba la versión compilada (`pnpm build` y
  `pnpm start`).
- Vitest excluye `e2e/` en su configuración, porque por defecto recogería también los `.spec.ts` de
  Playwright.
- Las pruebas no dependen unas de otras ni del orden en que se ejecutan.
- Datos inventados y usuarios de prueba: los del seed (ver `docs/conventions.md`). Las pruebas corren
  siempre contra el Supabase local de Docker: `pnpm test:e2e` lo levanta y le pasa sus claves. Hace
  falta Docker abierto. Hay dos seguros para que no acaben en el proyecto de la nube: Playwright no
  carga `.env.local`, y el seed y la limpieza se paran si la dirección no es la local. Antes de lanzarlas
  no debe haber otra app en el puerto 3000, porque Playwright la reutilizaría.
- Los servicios de pago (IA, emails, pagos) se simulan: las pruebas no los llaman de verdad.
- Cuando el proyecto esté en GitHub, se propone ejecutar las pruebas automáticamente en cada subida.
