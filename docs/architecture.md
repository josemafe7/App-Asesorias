# Arquitectura

Cómo está hecho el sistema. Se actualiza cuando cambia cómo está hecho, no cuando se añade una pantalla
más de lo mismo.

## Visión general

Carpeta Fiscal es una sola aplicación de Next.js que se publica en un VPS dentro de una imagen de Docker.
No hay servidor de API aparte: las páginas se pintan en el servidor y los cambios de datos van por Server
Actions.

Los datos, los usuarios y los archivos están en Supabase. La app habla con Supabase con la clave
publicable, así que **todo lo que pide pasa por las reglas por filas de la base de datos**: si una política
no deja ver un registro, no lo ve ni aunque el código se lo pida. La clave secreta, que se salta esas
reglas, solo la usa el seed.

Dos servicios más, que entran en fases posteriores: OpenRouter lee los documentos subidos y propone sus
datos, y Resend envía las invitaciones y los recordatorios.

## Piezas

| Pieza | Qué hace | Con qué está hecha |
|---|---|---|
| Aplicación web | Todas las pantallas y toda la lógica | Next.js 16 (App Router) y TypeScript |
| Aspecto | Un único tema, aplicado en los estilos globales | Tailwind CSS 4 y shadcn/ui sobre Base UI |
| Base de datos | Perfiles, clientes, expedientes, solicitudes y documentos | PostgreSQL en Supabase, con Row Level Security |
| Usuarios | Entrar, invitar y recuperar la contraseña | Supabase Auth |
| Archivos | Las facturas y los tickets subidos | Supabase Storage, en un bucket privado |
| Lectura de documentos | Propone fecha, proveedor, importes y categoría | OpenRouter (fase 5) |
| Correo | Invitaciones y recordatorios | Resend (fase 2 y fase 7) |
| Publicación | Imagen de Docker detrás de Traefik, con HTTPS | VPS de Hostinger con Dokploy (fase 8) |

## Cómo se organiza el código

- `src/app/` · rutas y pantallas. Las direcciones que ve la gente están en español (`/acceso`, `/cliente`);
  el código, en inglés. Lo que solo usa una ruta vive junto a ella, en `_components/`.
- `src/data/` · el acceso a datos, con `import 'server-only'`. Comprueba permisos y devuelve solo los
  campos que necesita cada pantalla.
- `src/lib/` · utilidades y clientes de servicios: Supabase, variables de entorno, límite de peticiones,
  validaciones y los porteros de permisos.
- `src/components/` · lo compartido entre pantallas. Los de shadcn/ui, en `src/components/ui/`.
- `src/proxy.ts` · el proxy de Next.js. En la versión 16 se llama así, antes era `middleware`.
- `supabase/migrations/` · cada cambio de la base de datos, en un archivo. La base se puede recrear entera
  desde aquí.
- `scripts/seed.mts` y `scripts/seed-data.mts` · los datos de ejemplo. Los datos van aparte para que las
  pruebas puedan leerlos sin abrir ninguna conexión.

## Cómo viajan los datos

Al entrar en una página privada, por ejemplo el panel del asesor:

1. El navegador pide `/asesor`.
2. **El proxy** (`src/proxy.ts`) refresca la sesión con `getClaims()`, que verifica la firma del token, y
   deja las cookies al día. Si no hay sesión, manda al acceso. No decide permisos: solo eso.
3. **La página** llama a `requireRole('advisor')`. Ese portero lee el perfil del usuario y, si el rol no
   encaja, lleva a «sin permiso». Esta comprobación es la que manda: el proxy se puede esquivar, la página
   no.
4. **La capa de datos** (`src/data/`) pide a Supabase lo que hace falta. Supabase aplica sus políticas por
   filas y devuelve únicamente lo que ese usuario puede ver.
5. La página se pinta en el servidor y llega al navegador ya hecha.

Al guardar algo, una Server Action valida lo que llega con Zod, vuelve a comprobar quién es el usuario y
llama a la capa de datos. Nunca se cambian datos con un GET.

## Tres decisiones que explican el resto

**Los permisos se comprueban tres veces, a propósito.** En la base de datos (reglas por filas), en el
servidor (el portero de cada página) y en las políticas del almacén de archivos. Es redundante queriendo:
si un día alguien se deja una comprobación en una pantalla nueva, la base de datos sigue sin devolver los
datos de otro cliente.

**El rol vive en la tabla `profiles`, no en los metadatos del usuario.** Supabase deja que el propio
usuario edite sus `user_metadata` desde el navegador. Si el rol estuviera ahí, cualquiera podría ascenderse
a administrador.

**Las funciones de las políticas son `security definer` y viven en un esquema `private`.** Una política
sobre `profiles` que consultara `profiles` entraría en un bucle infinito; por eso `current_user_role()` y
compañía leen la tabla saltándose las reglas, aunque solo devuelven datos del usuario que pregunta. Y están
en `private` y no en `public` porque Supabase publica automáticamente como API todo lo que hay en `public`:
ahí quedaban expuestas en internet como `/rest/v1/rpc/<nombre>`. Quitarles el permiso de ejecución no vale,
porque las políticas se evalúan con los permisos de quien consulta y entonces nadie podría leer ni lo suyo.
Moverlas de esquema resuelve las dos cosas: las políticas las siguen llamando y la API ya no las ve.

## Servicios externos

| Servicio | Para qué | Qué pasa si falla |
|---|---|---|
| Supabase | Base de datos, usuarios y archivos | La app no funciona: es su almacén |
| OpenRouter | Leer los documentos subidos | El documento queda pendiente de revisión con los campos vacíos y el asesor los rellena a mano. La subida nunca se pierde |
| Resend | Invitaciones y recordatorios | No salen los correos; el portal sigue funcionando |
