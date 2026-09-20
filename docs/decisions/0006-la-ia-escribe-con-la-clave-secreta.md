# 0006 · Lo que propone la IA lo escribe el servidor, no quien sube el documento

- **Estado:** aceptada
- **Fecha:** 2026-09-20

## Contexto y problema

Cuando un cliente sube un documento, la app lo manda a leer y guarda lo que propone la IA (I1) junto a la
propuesta original, tal cual, para poder comparar después (I7). Esa escritura ocurre justo después de la
subida, así que la haría la sesión de quien ha subido el documento: un usuario cliente.

Pero un usuario cliente no puede escribir en los datos de un documento, y no debe poder: si pudiera,
podría inventarse «lo que propuso la IA» y la comparación de I7 no valdría nada. Tampoco puede cambiar el
estado del documento, que es de la asesoría.

## Opciones consideradas

- Abrirle al cliente permiso de escritura sobre los datos de sus documentos mientras no estén aprobados.
- Una función `security definer` en el esquema `public` que escriba por él, comprobando por dentro quién
  llama.
- Que esa escritura la haga el servidor con la clave secreta, que se salta las reglas por filas, en un
  módulo que solo se puede llamar desde el servidor.

## Decisión

La escritura de lo que propone la IA la hace el servidor con la clave secreta, en
`src/data/document-data.ts`, y solo para tres cosas: marcar el documento como «leyéndose», guardar la
propuesta y dejarlo «pendiente de revisión».

## Consecuencias

- El cliente sigue sin poder escribir ni un campo de los datos de un documento: sus políticas solo le
  dejan **leer** los datos de los documentos ya aprobados (R7).
- Y la propuesta de la IA no la lee nadie desde el navegador. Una política decide qué filas se ven, no
  qué columnas: por eso la columna `ai_proposal` tiene el permiso de lectura quitado para todo el mundo
  (migración `20260920170000`). Se guarda para poder comparar (I7) y solo la alcanza el servidor.
- La propuesta de la IA es de fiar: solo la escribe la app.
- La clave secreta suma un uso más a los que ya tenía (el seed, la limpieza de las pruebas y crear o
  borrar cuentas al invitar). Se usa en un único archivo, para un único fin, y nunca a partir de datos
  que venga del navegador: el identificador del documento sale de la subida que la propia app acaba de
  autorizar.
- La alternativa de la función `security definer` en `public` se descartó porque Supabase publica como
  API todo lo que hay en ese esquema: sería una puerta más, alcanzable desde internet, para algo que ya
  ocurre dentro del servidor.
