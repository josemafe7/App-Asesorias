import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Los que trae eslint-config-next por defecto.
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Lo que exportó la herramienta de diseño. Es material de referencia, no código del proyecto:
    // ni se mantiene ni se publica (docs/design.md).
    'docs/design/**',
  ]),
])

export default eslintConfig
