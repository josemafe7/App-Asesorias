# 0002 · Guardar datos, usuarios y archivos en Supabase gestionado

- **Estado:** aceptada
- **Fecha:** 2026-09-20

## Contexto y problema

El portal necesita tres cosas que van muy juntas: una base de datos, inicio de sesión con tres roles y un
almacén de archivos privado donde cada cliente solo alcance lo suyo. Como se publica en un VPS, cabía
resolverlo todo dentro del propio servidor.

## Opciones consideradas

- Supabase gestionado: base de datos, usuarios y archivos en un servicio externo, con reglas de acceso por
  filas incluidas.
- PostgreSQL instalado en el propio VPS: solo la base de datos; usuarios y archivos habría que resolverlos
  aparte.
- SQLite con Prisma: los datos en un archivo del servidor, sin cuentas externas.

## Decisión

Supabase gestionado, en una región de la Unión Europea.

El control de acceso por filas y el almacén privado con políticas son justo la pieza más delicada de esta
app: que un cliente no vea los documentos de otro. Reimplementar eso a mano sobre PostgreSQL o SQLite
significaría escribir desde cero el inicio de sesión, la invitación por correo, el almacén de archivos y
sus permisos, que es donde se cometen los fallos graves.

## Consecuencias

- Los documentos, que son datos fiscales de terceros, viven en un servicio externo. Por eso la región es de
  la Unión Europea.
- Gratis mientras se construye. Al pasar a datos reales hace falta el plan Pro, 25 $ al mes, porque el plan
  gratuito no hace copias de seguridad y pausa los proyectos inactivos.
- Antes de meter datos reales se separan dos proyectos: uno de desarrollo y uno de producción creado desde
  las migraciones.
- La base de datos solo cambia con migraciones guardadas en el repositorio, para poder recrearla entera.
