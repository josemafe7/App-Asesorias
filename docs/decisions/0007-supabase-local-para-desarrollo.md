# 0007 · En local, Supabase dentro de Docker; el de la nube, solo para producción

- **Estado:** aceptada
- **Fecha:** 2026-10-02

## Contexto y problema

Al publicar la app como demo, desarrollo y producción compartían el mismo proyecto de Supabase: lo que se
hacía en local se veía en la app publicada, y `pnpm seed` y `pnpm test:e2e` tocaban sus datos. Además,
quien se descargaba el proyecto tenía que crearse un proyecto en la nube, copiar claves, aplicar las
migraciones a mano y ajustar seis cosas en el panel antes de ver nada.

Se quería que el proyecto, recién descargado, funcionara en local con datos de ejemplo y sin ningún
servicio externo, y que local y producción dejaran de mezclarse.

## Opciones consideradas

- Un segundo proyecto de Supabase en la nube para desarrollo: nada que instalar, pero sigue pidiendo una
  cuenta y configurar claves, y los proyectos gratuitos se pausan si no se usan.
- Una base de datos incrustada (SQLite, o PGlite, que es un PostgreSQL dentro de la propia app): no pide
  nada, pero solo sustituye a la base de datos. El inicio de sesión, el almacén de archivos y las reglas
  por filas habría que construirlos aparte para ese modo: serían dos apps, y lo que se prueba en local
  dejaría de ser lo que se publica.
- El mismo Supabase, en local, dentro de Docker, con su herramienta oficial (la CLI).

## Decisión

Supabase en local dentro de Docker para desarrollar y para las pruebas, y el proyecto de la nube solo
para la app publicada.

Es la única opción en la que la app es exactamente la misma en los dos sitios: mismas migraciones, mismas
reglas por filas, mismo inicio de sesión y mismo almacén. Sigue valiendo la norma de
`docs/conventions.md`: no hay un modo de demostración aparte.

La pega que se temía era la memoria. Con todo encendido, Supabase recomienda dar 7 GB a Docker; con solo
las piezas que usa esta app (base de datos, acceso, API de datos, archivos, su puerta de entrada y el
buzón de pruebas) se queda entre 420 y 500 MB, medido el día de la decisión. Las piezas apagadas están en
`supabase/config.toml`.

## Consecuencias

- Hace falta Docker abierto para trabajar en local. La primera vez se descargan unos 3,5 GB.
- `pnpm dev`, `pnpm seed` y `pnpm test:e2e` pasan por `scripts/local.mts`, que levanta el Supabase local y
  le pasa su dirección y sus claves al comando, por encima de lo que haya en `.env.local`. Así nada de lo
  que se ejecuta en local puede acabar en el Supabase de la nube. `pnpm build` no pasa por ahí: es el que
  usa el servidor al publicar.
- Las claves del Supabase local son las mismas en todos los equipos: no son un secreto. Por eso en local
  solo van datos de ejemplo, y lo que impide entrar desde otro equipo de la misma red es el cortafuegos
  del sistema, no las claves (`docs/security.md` · «Datos»). Las de producción viven únicamente en las
  variables de la aplicación en Dokploy.
- El seed y la limpieza de las pruebas se niegan a ejecutarse contra un Supabase que no sea el local, así
  que los datos de ejemplo de la demo publicada ya no se recargan con `pnpm seed`.
- Los ajustes de acceso que antes se ponían a mano en el panel (registro cerrado, contraseñas, duración
  de los enlaces) están en `supabase/config.toml`. En el proyecto de la nube se siguen poniendo en su
  panel, y tienen que coincidir.
- Una dependencia de desarrollo más: `supabase`, la CLI oficial.
- Los cambios de la base de datos se prueban primero en local y después se aplican al proyecto de la
  nube, como dice `docs/deployment.md`.
