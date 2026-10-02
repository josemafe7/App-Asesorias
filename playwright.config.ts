import { defineConfig, devices } from '@playwright/test'

// Las pruebas van siempre contra el Supabase local: `pnpm test:e2e` lo levanta y deja su dirección y sus
// claves en el entorno (scripts/local.mts). Aquí no se carga `.env.local` a propósito, para que unas
// pruebas lanzadas por otro camino se paren en vez de acabar en otro Supabase.

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  // Antes de empezar se recarga el seed, que borra lo que dejaran las pruebas anteriores; al
  // terminar se limpia lo de esta vuelta.
  globalSetup: './e2e/preparar.ts',
  globalTeardown: './e2e/limpieza.ts',
  // Las pruebas no dependen unas de otras ni del orden (docs/testing.md).
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    locale: 'es-ES',
  },
  projects: [
    // Entra una vez con cada usuario y guarda su sesión; las demás pruebas la reutilizan.
    { name: 'sesiones', testMatch: /sesiones\.setup\.ts/ },
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['sesiones'],
      testIgnore: /sesiones\.setup\.ts/,
    },
    // El cliente usa el portal sobre todo en el móvil: sus pantallas se prueban también a 375 px.
    {
      name: 'movil',
      // El tamaño y el modo táctil del iPhone, pero con Chromium: es el único navegador que instala el
      // proyecto (docs/testing.md).
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
      testMatch: /.*\.movil\.spec\.ts/,
      dependencies: ['sesiones'],
    },
  ],
  // Como recomienda Next.js, se prueba la versión compilada, no el modo desarrollo.
  webServer: {
    command: 'pnpm build && pnpm start',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    // Las pruebas no llaman al servicio de correo: se escribe en la consola del servidor
    // (docs/testing.md y docs/decisions/0004-correo-resend.md).
    env: {
      EMAIL_TRANSPORT: 'console',
      AI_TRANSPORT: 'fake',
      CRON_SECRET: 'secreto-de-pruebas',
    },
  },
})
