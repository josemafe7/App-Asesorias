# Carpeta Fiscal

El sitio donde los clientes de una asesoría suben sus facturas y tickets del trimestre, y los asesores
los revisan, los aprueban y los exportan ya validados.

## Cómo arrancarlo

Hace falta tener instalado **Node.js 24 o superior**, **pnpm**, **Git** y **Docker Desktop**. No hace falta
ninguna cuenta ni ninguna clave.

1. Abre Docker Desktop y espera a que termine de arrancar.
2. Descarga el proyecto, entra en su carpeta e instala las dependencias:
   ```
   pnpm install
   ```
3. Arranca la app:
   ```
   pnpm dev
   ```

En `http://localhost:3000`, con los usuarios de «Cómo probarla».

Ese último comando levanta en tu equipo un Supabase propio dentro de Docker (la base de datos, las
cuentas y los archivos), crea las tablas, carga los datos de ejemplo la primera vez y arranca la app. La
primera vez descarga unos 6 GB y tarda unos minutos; después, unos segundos. En marcha ocupa unos
750 MB de memoria, porque solo se encienden las piezas que la app usa y el panel de Supabase
(`supabase/config.toml`).

Todo lo que hagas en local se queda en tu equipo: nada toca el Supabase de la app publicada. Usa el
Supabase local solo con datos de ejemplo: sus claves son las mismas en todos los equipos.

- **Para ver las tablas, los usuarios y los archivos:** `http://127.0.0.1:54323`, el panel de Supabase.
  Si vas justo de memoria, se apaga en `supabase/config.toml` y te ahorras unos 350 MB.
- **Para parar el Supabase local:** `pnpm db:stop`. Los datos se conservan para la próxima vez.
- **Para empezar de cero:** `pnpm exec supabase db reset` borra la base de datos local y la vuelve a
  crear; el siguiente `pnpm dev` carga otra vez los datos de ejemplo.
- **Para ver los correos que manda Supabase** (el de «he olvidado mi contraseña»):
  `http://127.0.0.1:54324`, un buzón de pruebas. No salen de tu equipo.

Lo que es opcional va en un archivo `.env.local`, copiando de `.env.example` solo lo que necesites:

- IA (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`): sin ellos, los documentos se suben igual y se quedan
  pendientes de revisión con los campos vacíos, para rellenarlos a mano;
- correo (`RESEND_API_KEY`, `EMAIL_FROM`): sin ellos, los correos de la app (invitaciones y
  recordatorios) se escriben en la consola del servidor en vez de enviarse, con su enlace;
- recordatorios (`CRON_SECRET`): solo hace falta para probar el trabajo diario.

> El seed se niega a ejecutarse si encuentra clientes que no son de ejemplo.

## Cómo probarla

Con los datos de ejemplo cargados, la contraseña de todos los usuarios de prueba es
`Carpeta-Fiscal-2026!`. Son cuentas de mentira y solo existen en desarrollo y en la demo.

| Para entrar como | Correo | Qué verás |
|---|---|---|
| Administrador | `admin@rierabono.es` | El panel, los clientes y los usuarios de toda la asesoría |
| Asesora | `marta@rierabono.es` | Sus clientes: La Espiga y Talleres Moreno |
| Asesor | `javier@rierabono.es` | Sus clientes: Azahar y Ana Belmonte |
| Cliente | `pablo@laespiga.es` | Sus trimestres, lo que le piden, sus documentos y el correo de su asesora |
| Otro usuario del mismo cliente | `rosa@laespiga.es` | Lo mismo que Pablo: una empresa puede tener varios usuarios |
| Cuenta desactivada | `baja@laespiga.es` | No entra, aunque la contraseña sea correcta |

Para comprobar que nadie ve lo que no debe: entra como `pablo@laespiga.es` y escribe a mano la dirección
`/admin`. Tiene que salir «Esta página no es para ti».

Para probar el trabajo diario de los recordatorios, pon un `CRON_SECRET` en `.env.local`, arranca la app
y llama a su dirección con ese secreto:

```
curl -X POST http://localhost:3000/api/recordatorios -H "Authorization: Bearer EL-SECRETO"
```

Responde cuántos ha mandado. Sin la cabecera, responde que no está permitido. Los correos, como todo en
local, se escriben en la consola del servidor.

Las pruebas dan de alta empresas y usuarios de verdad, marcados como de prueba (el NIF empieza por `E2E` y
el correo acaba en `@e2e.carpetafiscal.test`). Se borran solos al empezar y al terminar, y `pnpm seed`
también los limpia.

### Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Levanta el Supabase local y arranca la app |
| `pnpm check` | Revisa el código y los tipos y pasa las pruebas de lógica (Vitest), de una vez |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | Cada una de esas tres por separado |
| `pnpm test:e2e` | Pruebas que recorren la app como un usuario (Playwright), contra el Supabase local |
| `pnpm build` | Compila como en producción |
| `pnpm seed` | Vuelve a cargar los datos de ejemplo en el Supabase local |
| `pnpm db:stop` | Para el Supabase local |

La primera vez que uses Playwright: `pnpm exec playwright install chromium`.

## Cómo se trabaja en este proyecto

Se construye por fases con un agente de código. Lo que el agente cumple sin que se lo pidan está en
`AGENTS.md` y en `docs/`. Esto es lo que se le pide en cada momento:

| Cuándo | Qué se le pide |
|---|---|
| Para decidir el aspecto, antes de la primera fase con pantallas | «Vamos con el diseño. Sigue docs/design.md.» |
| Al volver con el diseño hecho fuera | «Ya he dejado el diseño en docs/design/. Léelo y dime qué has entendido.» |
| Al empezar cada fase, en una conversación nueva | «Vamos con la fase 1 de docs/spec.md. Propón un plan.» |
| Si algo no funciona | Lo que se ve y lo que se esperaba: «Al pulsar Guardar no pasa nada; esperaba ver el contacto en la lista.» |
| Al acabar una fase | «Cierra la fase 1.» |
| Para un retoque: un texto, un color, un botón que se mueve | Se pide tal cual, sin más: «Cambia el título de la portada por…» |
| Para añadir o cambiar algo | «Quiero que la app también…» o «Quiero que esto funcione de otra forma»: primero cambia la especificación y después se construye |
| Para que el agente cumpla algo siempre | «Añade a las reglas de AGENTS.md: …» |
| Para que otro revise una fase, en una conversación nueva | «Revisa la fase 1 siguiendo docs/review.md. No cambies nada.» |
| Antes de publicar, en una conversación nueva | «Revisa el proyecto contra docs/security.md.» |
| Para publicar la app o una versión nueva | «Quiero publicar la app.» |
| Cada mes o dos, con la app publicada | «Haz el mantenimiento.» |

## Documentación

Todo lo demás está en `docs/`. Empieza por `docs/spec.md`, que dice qué hace la app y con qué reglas.
