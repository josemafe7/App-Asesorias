import path from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Vitest recogería también los .spec.ts de Playwright si no se le excluye e2e (docs/testing.md).
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
