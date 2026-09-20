import { z } from 'zod'

/**
 * Las reglas de validación del acceso, separadas de las Server Actions para poder probarlas solas.
 * Una Server Action no se puede importar desde una prueba de Vitest, pero un esquema sí.
 */

export const MIN_PASSWORD_LENGTH = 10

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `La contraseña tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      ),
    repeat: z.string(),
  })
  .refine((value) => value.password === value.repeat, {
    message: 'Las dos contraseñas no coinciden.',
    path: ['repeat'],
  })

export const emailSchema = z.object({ email: z.email() })

/**
 * Una ruta a la que es seguro redirigir: dentro de la propia app y de ningún otro sitio.
 *
 * El `(?!\/)` no es un adorno. Sin él, «//2130706433» pasaba el filtro, y un navegador lee eso como
 * «vete a ese otro servidor» (ese número es 127.0.0.1 escrito en decimal). Es la trampa clásica para
 * sacar a alguien de una app legítima a una copia falsa. La barra invertida tampoco entra, porque algunos
 * navegadores la tratan como si fuera una barra normal.
 *
 * docs/security.md · «Redirecciones, solo a rutas de la propia app».
 */
export const safeNextPathSchema = z
  .string()
  .regex(/^\/(?!\/)[A-Za-z0-9\-/_]*$/, 'ruta no permitida')
