# Publicar

Los pasos exactos para poner Carpeta Fiscal en internet y para volver atrás si algo sale mal. La primera
vez hay que preparar las cuentas; a partir de ahí, publicar es un botón.

Antes de la primera publicación se repasa «Antes de publicar» de `docs/security.md`.

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
5. **Domains** → añade el dominio, puerto 3000, y activa **HTTPS** con Let's Encrypt.
6. **Deploy**.

## 4. El trabajo diario de los recordatorios

Dokploy → **Schedules** → nueva tarea, una vez al día (por ejemplo a las 8:00):

```
curl -fsS -X POST https://TU-DOMINIO/api/recordatorios -H "Authorization: Bearer EL-CRON-SECRET"
```

Sin esa cabecera, la dirección responde que no está permitido (M5).

## 5. La base de datos

- Las tablas y sus reglas se crean con las migraciones de `supabase/migrations/`, en orden. Un cambio de
  base de datos se aplica **antes** de publicar la versión que lo necesita.
- Con datos reales, el proyecto de Supabase de producción es uno nuevo y limpio, distinto del de
  desarrollo (`docs/security.md` · «Datos»), con copias de seguridad activadas.
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
