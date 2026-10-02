/**
 * Lo que se ejecuta en local va siempre contra el Supabase local, el que corre en Docker
 * (docs/decisions/0007-supabase-local-para-desarrollo.md).
 *
 * `pnpm dev`, `pnpm seed` y `pnpm test:e2e` pasan por aquí. Este programa:
 *
 *   1. comprueba que Docker está abierto;
 *   2. levanta el Supabase local, que la primera vez crea las tablas desde `supabase/migrations/`;
 *   3. le pide su dirección y sus claves y se las pasa al comando en memoria, por encima de lo que haya
 *      en `.env.local`: así nada de lo que se hace en local puede acabar en el Supabase de la nube;
 *   4. carga los datos de ejemplo si la base de datos está vacía;
 *   5. ejecuta el comando que se le ha pedido.
 *
 * Las claves del Supabase local son las mismas en todos los equipos: no son un secreto, y por eso ahí
 * solo van datos de ejemplo (docs/security.md · «Datos»). Las de producción viven únicamente en Dokploy.
 */

import { spawn, spawnSync } from 'node:child_process'

import { createClient } from '@supabase/supabase-js'

const [command, ...args] = process.argv.slice(2)

if (!command) {
  console.error('Uso: node scripts/local.mts <comando> [argumentos]')
  process.exit(1)
}

/** Ejecuta una orden y devuelve lo que escribe. En Windows los ejecutables de pnpm necesitan el shell. */
function run(order: string, { quiet }: { quiet: boolean }): { ok: boolean; output: string } {
  const result = spawnSync(order, {
    shell: true,
    encoding: 'utf8',
    stdio: quiet ? ['ignore', 'pipe', 'ignore'] : ['ignore', 'inherit', 'inherit'],
  })

  return { ok: result.status === 0, output: result.stdout ?? '' }
}

function stop(message: string): never {
  console.error(`\n${message}\n`)
  process.exit(1)
}

// 1. Docker.
if (!run('docker info', { quiet: true }).ok) {
  stop(
    'Docker no está abierto. Carpeta Fiscal guarda sus datos de desarrollo en un Supabase local que ' +
      'corre dentro de Docker.\nAbre Docker Desktop, espera a que termine de arrancar y vuelve a ' +
      'ejecutar el comando.',
  )
}

// 2. El Supabase local. Si ya está en marcha, esto tarda un segundo.
console.log('Supabase local: arrancando (la primera vez descarga sus imágenes y tarda unos minutos)...')
if (!run('pnpm exec supabase start', { quiet: true }).ok) {
  // Se repite a la vista para que se lea el motivo.
  run('pnpm exec supabase start', { quiet: false })
  stop('El Supabase local no ha arrancado. El motivo está justo encima.')
}

// 3. Su dirección y sus claves.
const status = run('pnpm exec supabase status -o json', { quiet: true })
let local: { API_URL?: string; PUBLISHABLE_KEY?: string; SECRET_KEY?: string; STUDIO_URL?: string } =
  {}
try {
  local = JSON.parse(status.output)
} catch {
  // Se trata abajo, junto con el caso de que falte algún valor.
}

if (!local.API_URL || !local.PUBLISHABLE_KEY || !local.SECRET_KEY) {
  stop('No se han podido leer la dirección y las claves del Supabase local (`supabase status`).')
}

const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: local.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: local.SECRET_KEY,
  NEXT_PUBLIC_SITE_URL: `http://localhost:${process.env.PORT ?? '3000'}`,
}
Object.assign(process.env, env)

// 4. Los datos de ejemplo, si no hay nada. Cuando el comando es el propio seed, ya los carga él.
const isSeed = args.some((arg) => arg.endsWith('seed.mts'))

if (!isSeed) {
  const admin = createClient(local.API_URL, local.SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { count, error } = await admin.from('profiles').select('id', { count: 'exact', head: true })
  if (error) stop(`No se ha podido leer la base de datos local: ${error.message}`)

  if (count === 0) {
    console.log('Supabase local: base de datos vacía, cargando los datos de ejemplo...')
    // Se importa aquí, y no arriba, porque el seed lee las variables al cargarse.
    const { cargarSeed } = await import('./seed.mts')
    await cargarSeed()
  }
}

console.log(`Supabase local: en marcha en ${local.API_URL}`)
if (local.STUDIO_URL) console.log(`Supabase local: el panel para ver los datos, en ${local.STUDIO_URL}`)
console.log('')

// 5. El comando pedido, con sus argumentos tal cual.
const quoted = [command, ...args].map((part) => (/\s/.test(part) ? `"${part}"` : part)).join(' ')
const child = spawn(quoted, { shell: true, stdio: 'inherit', env })

child.on('exit', (code) => process.exit(code ?? 1))
