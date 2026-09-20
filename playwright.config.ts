import { defineConfig, devices } from '@playwright/test'

// Las pruebas de permisos hablan directamente con Supabase, así que necesitan sus claves públicas.
// En un servidor de integración las variables ya vienen del entorno y no hay archivo que cargar.
try {
  process.loadEnvFile('.env.local')
} catch {
  // No hay .env.local: se usan las variables del entorno, si las hay.
}

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
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
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    // El cliente usa el portal sobre todo en el móvil: sus pantallas se prueban también a 375 px.
    { name: 'movil', use: { ...devices['iPhone 13'] }, testMatch: /.*\.movil\.spec\.ts/ },
  ],
  // Como recomienda Next.js, se prueba la versión compilada, no el modo desarrollo.
  webServer: {
    command: 'pnpm build && pnpm start',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
})
