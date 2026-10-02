import { z } from 'zod'

// Las variables de entorno se validan al arrancar. Si falta una o está mal, la app no arranca: es mejor
// que enterarse a medias, con media pantalla rota y sin saber por qué.
//
// Las que empiezan por NEXT_PUBLIC_ llegan al navegador, así que solo llevan ese prefijo las que están
// hechas para ser públicas. Las secretas se leen en `serverEnv`, que solo se importa desde el servidor.

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url('NEXT_PUBLIC_SUPABASE_URL tiene que ser una dirección válida'),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
  // La dirección pública de la app. Se usa para los enlaces de los correos, que tienen que ser
  // absolutos. En local es http://localhost:3000.
  NEXT_PUBLIC_SITE_URL: z.url('NEXT_PUBLIC_SITE_URL tiene que ser una dirección válida'),
})

// Next.js sustituye las NEXT_PUBLIC_ en tiempo de compilación solo si se nombran enteras, no con
// `process.env[nombre]`. Por eso se escriben así, una a una.
const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
})

if (!parsed.success) {
  // Un volcado de Zod no le dice nada a quien está montando el proyecto por primera vez.
  const faltan = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')

  throw new Error(
    `Falta configuración para arrancar Carpeta Fiscal:\n${faltan}\n\n` +
      'En local, arranca con `pnpm dev`, que levanta el Supabase local y pone estos valores. En ' +
      'producción, ponlos en las variables de entorno de la aplicación en el panel de Dokploy.',
  )
}

export const env = parsed.data
