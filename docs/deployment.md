# Publicar

Los pasos exactos para poner Carpeta Fiscal en internet y para volver atrás si algo sale mal. La primera
vez hay que preparar las cuentas; a partir de ahí, publicar es un botón.

Antes de la primera publicación se repasa «Antes de publicar» de `docs/security.md`.

## Cómo está publicada hoy

Publicada por primera vez el 2026-10-02, como **demo con los datos de ejemplo**. Usa el proyecto de
Supabase de la nube, que desde la fase 4 es solo suyo: en local se trabaja contra el Supabase de Docker.
El día que entren datos reales, producción pasa a un proyecto nuevo y limpio, como dice el apartado 5.

| Qué | Dónde |
|---|---|
| Dirección | `https://asesorias.dominia.site` (registro A hacia la IP del VPS) |
| Panel | Dokploy → «Proyecto Asesorías» → entorno `production` → aplicación `carpeta-fiscal` |
| Código | GitHub `josemafe7/App-Asesorias`, rama `main`, con el `Dockerfile` del repositorio |
| Publicación | **Automática**: cada subida a `main` construye y publica sola. Subir a GitHub es publicar |
| Tarea diaria | Schedule «Recordatorios diarios», a las 8:00 de `Europe/Madrid`. **Creada pero apagada**: ver abajo |

Dos cosas pendientes antes de encender los correos:

- Faltan `RESEND_API_KEY` y `EMAIL_FROM` en las variables de la aplicación. Sin ellas no sale ningún
  correo.
- Los usuarios de ejemplo tienen correos de dominios que existen de verdad (`laespiga.es`,
  `talleresmoreno.es`...). Con Resend configurado, los recordatorios y las invitaciones llegarían a
  desconocidos. Por eso la tarea diaria está apagada: se enciende cuando esos correos sean de un dominio
  reservado para ejemplos o propios.

## Lo que hace falta tener

| Qué | Para qué | Dónde se consigue |
|---|---|---|
| Un dominio | La dirección por la que entra la asesoría | Donde se compre (Hostinger u otro registrador) |
| Un VPS con Dokploy | Donde corre la app | Hostinger → VPS → plantilla Dokploy |
| Proyecto de Supabase | Datos, usuarios y archivos | Ya existe; para producción, uno aparte |
| Clave de Resend | Los correos que salen de verdad | resend.com |
| Clave de OpenRouter | La lectura de los documentos | openrouter.ai |
| Un secreto para el trabajo diario | Que nadie más pueda lanzar los recordatorios | Se inventa: una cadena larga y aleatoria |

## 1. El servidor

1. En Hostinger, contrata un VPS (KVM 2 va sobrado) y, al crearlo, elige la plantilla **Dokploy**.
2. Guarda la contraseña de root en tu gestor de contraseñas.
3. Entra en `http://LA-IP:3000` y crea el usuario administrador de Dokploy, con una contraseña larga y
   única.
4. Activa la verificación en dos pasos en Hostinger y en Dokploy.

## 2. El dominio

1. En el panel donde tengas el dominio, crea un registro **A** que apunte a la IP del VPS. Si quieres
   usarlo con `www`, crea también el `CNAME`.
2. Los cambios de DNS tardan un rato en verse en todas partes (de minutos a un par de horas).

## 3. La aplicación en Dokploy

1. Dokploy → **Create Application**, y conecta el repositorio de GitHub (rama `main`).
2. Build type: **Dockerfile** (el del repositorio).
3. **Build args** (Next.js las mete dentro del código al compilar, así que van aquí y no en las
   variables de entorno):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (la dirección del dominio, con https)
4. **Environment variables** (las secretas, que se leen al ejecutar):
   - `SUPABASE_SECRET_KEY`
   - `RESEND_API_KEY` y `EMAIL_FROM`
   - `OPENROUTER_API_KEY` y `OPENROUTER_MODEL`
   - `CRON_SECRET`
   Nunca dentro de la imagen ni en el repositorio (`docs/security.md` · «Claves»).
   Sin `RESEND_API_KEY` la app publicada no envía correos: las invitaciones y los recordatorios fallan.
5. **Domains** → añade el dominio, puerto 3000, y activa **HTTPS** con Let's Encrypt. El registro DNS
   tiene que existir antes, o el certificado no se puede emitir.
6. **Deploy**. Con la publicación automática activada, los siguientes los lanza cada subida a `main`.
7. El correo de «he olvidado mi contraseña» (A6) no lo manda la app, lo manda Supabase. Para que
   funcione en la app publicada hacen falta tres cosas en el panel de Supabase, en *Authentication*:
   - **URL Configuration**: la dirección del dominio, con https, como **Site URL**. Es la que se pone
     delante del enlace del correo.
   - **Email Templates → Reset password**: pegar el contenido de `supabase/templates/recovery.html` y
     poner el asunto que lleva `supabase/config.toml`. Con el correo que trae Supabase por defecto, el
     enlace acaba en «ya no vale», porque no llega con el testigo que la app sabe canjear.
   - **SMTP Settings**: activar un servidor de correo propio, con los datos de Resend (servidor
     `smtp.resend.com`, puerto `465`, usuario `resend` y, como contraseña, la clave de Resend), y un
     remitente del dominio verificado en Resend. Sin esto, Supabase solo entrega correos a las
     direcciones del equipo del proyecto, y a dos por hora: a un usuario normal no le llega nada.

8. **Límite de peticiones en el proxy** (`docs/security.md` · «Límites y errores»). En la aplicación →
   **Advanced** → **Traefik**, se define un límite por dirección IP y se le pone a la entrada segura:

   ```yaml
   http:
     middlewares:
       carpeta-fiscal-limite:
         rateLimit:
           average: 50
           burst: 100
           period: 1s
   ```

   y, en el router `...-websecure-1`, `middlewares: [carpeta-fiscal-limite]`. Deja pasar el uso normal
   y corta las ráfagas con un «demasiadas peticiones». Ojo: si se cambia el dominio desde Dokploy, este
   archivo se vuelve a generar y hay que comprobar que el límite sigue ahí.

Las variables `EMAIL_TRANSPORT` y `AI_TRANSPORT` son solo de las pruebas: en producción no se ponen.

## 4. El trabajo diario de los recordatorios

Dokploy → la aplicación → **Schedules** → nueva tarea, una vez al día (a las 8:00, zona `Europe/Madrid`),
que se ejecuta **dentro del contenedor de la app**, con `sh`:

```
node -e "fetch('http://127.0.0.1:3000/api/recordatorios',{method:'POST',redirect:'manual',headers:{authorization:'Bearer '+process.env.CRON_SECRET}}).then(async r=>{console.log(r.status,await r.text());process.exit(r.ok?0:1)}).catch(e=>{console.error(e.message);process.exit(1)})"
```

Se hace así, y no con `curl` desde fuera, por dos motivos: la imagen no trae `curl`, y de esta forma el
secreto se lee de la variable del propio contenedor y no queda escrito en la tarea. Si la tarea acaba con
error, es que la app no ha respondido bien.

Sin esa cabecera, la dirección responde que no está permitido (M5). El proxy de la app la deja pasar sin
sesión, como al acceso y a `/auth`: quien la llama es el servidor, no una persona.

## 5. La base de datos

- Las tablas y sus reglas se crean con las migraciones de `supabase/migrations/`, en orden. Un cambio de
  base de datos se prueba primero en local (el Supabase de Docker lo aplica al arrancar o con
  `pnpm exec supabase db reset`) y se aplica al proyecto de la nube **antes** de publicar la versión que
  lo necesita.
- Los ajustes de acceso del proyecto de la nube (registro cerrado, contraseñas de 10 caracteres con
  minúscula, mayúscula, número y símbolo, confirmación por correo y enlaces de 24 horas) se ponen en su
  panel, en *Authentication*, y tienen que coincidir con los de `supabase/config.toml`.
- Con datos reales, el proyecto de Supabase de producción es uno nuevo y limpio, sin los usuarios de
  ejemplo (`docs/security.md` · «Datos»), con copias de seguridad activadas.
- Los usuarios de ejemplo (`pnpm seed`) no existen en producción: el primer administrador se crea a mano
  desde el panel de Supabase y se le pone su perfil con rol `admin`.

## 6. Comprobar que ha salido bien

1. Entra por el dominio: tiene que aparecer el candado de HTTPS.
2. Entra con el administrador, crea un cliente de prueba e invita a un usuario: el correo tiene que
   llegar de verdad.
3. Sube un documento y comprueba que la IA lo lee y que se ve el archivo.
4. Mira que las pantallas se ven bien, no solo que responden: si faltan los estilos, es que la imagen se
   ha montado sin los archivos estáticos (ver el `Dockerfile`).

## Volver a la versión anterior

En Dokploy, **Deployments** → el despliegue anterior → **Redeploy**. Si el problema viene de un cambio de
base de datos, primero se deshace ese cambio con una migración nueva: las migraciones no se borran ni se
editan una vez aplicadas.
