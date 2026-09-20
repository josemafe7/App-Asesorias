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
reglas, se usa en cuatro sitios contados: el seed, la limpieza de las pruebas, las acciones del
administrador que **crean o borran una cuenta** (invitar a alguien) y lo que escribe la propia app sin que
haya una persona detrás: lo que propone la IA de un documento
(`docs/decisions/0006-la-ia-escribe-con-la-clave-secreta.md`) y el trabajo diario de los recordatorios,
que lo lanza un programador de tareas y no un usuario. Todo lo demás pasa por la clave publicable y sus
políticas.

Otro servicio: Resend envía los correos (las invitaciones desde la fase 2 y los recordatorios en el
tramo 3e). Y en el tramo 3c entra OpenRouter, que lee los documentos subidos y propone sus datos.

## Piezas

| Pieza | Qué hace | Con qué está hecha |
|---|---|---|
| Aplicación web | Todas las pantallas y toda la lógica | Next.js 16 (App Router) y TypeScript |
| Aspecto | Un único tema, aplicado en los estilos globales | Tailwind CSS 4 y shadcn/ui sobre Base UI |
| Base de datos | Perfiles, clientes, expedientes, solicitudes y documentos | PostgreSQL en Supabase, con Row Level Security |
| Usuarios | Entrar, invitar y recuperar la contraseña | Supabase Auth |
| Archivos | Las facturas y los tickets subidos | Supabase Storage, en un bucket privado |
| Lectura de documentos | Propone fecha, proveedor, importes y categoría | OpenRouter (tramo 3c) |
| Correo | Invitaciones y recordatorios | Resend (fase 2 y tramo 3e) |
| Publicación | Imagen de Docker detrás de Traefik, con HTTPS | VPS de Hostinger con Dokploy (tramo 3f) |

## Cómo se organiza el código

- `src/app/` · rutas y pantallas. Las direcciones que ve la gente están en español (`/acceso`, `/cliente`);
  el código, en inglés. Lo que solo usa una ruta vive junto a ella, en `_components/`.
- `src/data/` · el acceso a datos, con `import 'server-only'`. Comprueba permisos y devuelve solo los
  campos que necesita cada pantalla.
- `src/lib/` · utilidades y clientes de servicios: Supabase, variables de entorno, límite de peticiones,
  validaciones, los roles y los porteros de permisos.
- `src/lib/email/` · el texto de cada correo, aparte de su envío: así el texto se prueba sin llamar a
  ningún servicio. `send.ts` es el único sitio que habla con Resend.
- `src/lib/ai/` · la lectura de documentos. `read-document.ts` es el único sitio que habla con
  OpenRouter; `proposal.ts` decide qué se guarda de lo que responda, y se prueba sin llamar a nadie.
- `src/app/_actions/` · las acciones que usan dos pantallas distintas (subir y borrar documentos, que
  hacen el cliente y la asesoría).
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

Cuando lo guardado se ve en la misma pantalla (la ficha de un cliente o la de un usuario), la acción
termina volviendo a cargar esa ficha con un aviso en la dirección (`?guardado=1`). Así lo que se ve sale
siempre de la base de datos y no de lo que quedó escrito en el formulario.

## Cómo se invita a alguien (A5)

1. El administrador rellena el formulario y la Server Action comprueba que es administrador, valida los
   datos y mira que ese correo no tenga ya una cuenta.
2. Le pide a Supabase que **cree la cuenta y genere el enlace de invitación, sin enviar nada**. Esta es la
   parte que necesita la clave secreta.
3. Guarda el perfil (nombre, rol y empresa) con la clave publicable, así que la política de escritura
   vuelve a comprobar que quien lo hace es administrador.
4. Envía el correo con Resend, con el texto de la propia app. Si algo falla en los pasos 3 o 4, la cuenta
   recién creada se borra: o queda invitada del todo, o no queda nada a medias.
5. El enlace lleva a `/auth/confirm`, que canjea el testigo y manda a poner la contraseña.

## El camino de un documento

1. El cliente sube un archivo desde su trimestre. La app mira **los primeros bytes** para saber qué es
   de verdad (no se fía de lo que diga el navegador), lo guarda en el almacén privado con un nombre
   inventado y crea su ficha.
2. Si responde a una solicitud, un disparador de la base de datos deja esa solicitud como cumplida. Lo
   hace la base de datos porque el usuario cliente no puede escribir en las solicitudes.
3. Ya contestada la subida, la app manda el documento a leer a la IA. Mientras, el documento está
   «leyéndose». Lo que la IA devuelve se filtra: lo que no se lee con seguridad se queda vacío y
   marcado, y lo que venga se guarda también tal cual, para poder comparar. El documento queda
   «pendiente de revisión», pase lo que pase con la IA.
4. El asesor abre el documento, ve el archivo a un lado y los datos al otro, corrige lo que haga falta y
   lo aprueba (con todos los campos obligatorios) o lo rechaza con un motivo.
5. Desde que está aprobado, y solo desde entonces, el cliente ve sus datos. Y sale en el CSV del
   trimestre.

## El trabajo diario

Una vez al día, el programador de tareas del servidor llama a `/api/recordatorios` con un secreto
compartido. Esa dirección busca las solicitudes pendientes cuya fecha límite ya ha llegado, manda un
correo por cada una a los usuarios de esa empresa y apunta la fecha del envío para no repetirlo. Sin el
secreto no hace nada. El asesor puede mandar el mismo recordatorio a mano, pero no dos veces en menos de
24 horas.

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

**Un usuario cliente puede leer el perfil de su asesor, y solo el suyo.** Lo pide la regla A10: para
escribirle hace falta su dirección de correo. Es la única fila ajena que alcanza un cliente, y lo garantiza
una política, no el código de la pantalla.

**Un administrador no puede tocar su propia fila de `profiles`.** Es la regla A11, y también está en la
base de datos: la política de cambiar perfiles excluye la fila de quien la hace. Si solo estuviera en la
app, un administrador podría degradarse o desactivarse llamando a la base de datos desde su navegador y
dejar a la asesoría sin administrador. Su cuenta la cambia otro administrador.

## Servicios externos

| Servicio | Para qué | Qué pasa si falla |
|---|---|---|
| Supabase | Base de datos, usuarios y archivos | La app no funciona: es su almacén |
| OpenRouter | Leer los documentos subidos | El documento queda pendiente de revisión con los campos vacíos y el asesor los rellena a mano. La subida nunca se pierde |
| Resend | Invitaciones y recordatorios | No salen los correos; el portal sigue funcionando |
