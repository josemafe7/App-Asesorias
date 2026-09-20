# Convenciones de código

Cómo se crea el proyecto y cómo se escribe y se organiza el código para que se pueda mantener.

## Crear el proyecto

`create-next-app` no arranca en una carpeta que ya tiene `README.md`, `AGENTS.md` o `CLAUDE.md`. Por eso:

1. Créalo en una carpeta temporal, fuera del proyecto, con `pnpm create next-app` y las opciones
   `--yes --src-dir --disable-git --skip-install`.
2. Trae aquí sus archivos, también los que empiezan por punto, sin sobrescribir los que ya existen:
   - combina los dos `.gitignore` (la línea `!.env.example` va después de cualquier línea que ignore
     archivos `.env`);
   - añade al final de `AGENTS.md` el bloque de Next.js que trae su `AGENTS.md`;
   - descarta su `CLAUDE.md` y su `README.md`.
3. Crea o completa `pnpm-workspace.yaml` con los ajustes de `docs/security.md` y, después, instala las
   dependencias aquí.
4. Prepara Vitest y Playwright como dice `docs/testing.md`, y los comandos de «Cómo se arranca y se prueba»
   de `AGENTS.md`.
5. Pon en `next.config.ts` la configuración de `docs/security.md` y, como la app se publica en un VPS dentro
   de una imagen de Docker, `output: 'standalone'`, que deja solo lo necesario para ejecutarla.
6. Si los datos van en Supabase, dime cómo crear el proyecto y pregúntame cómo te conecto a él: con su
   servidor MCP, con su CLI o de otra forma. Si no lo sé, recomiéndame la más sencilla con mi herramienta.
   La conexión cumple `docs/security.md`, y las claves de `.env.local` las pongo yo.

## Documentación de las librerías

Antes de instalar, actualizar o escribir código con una librería, consulta su documentación actual con
Context7:

- Busca el identificador de la librería con `resolve-library-id` (o `ctx7 library`), salvo que ya lo sepas.
- Pide la documentación con `query-docs` (o `ctx7 docs`): una pregunta concreta y la versión de `package.json`.
- En Next.js manda la documentación del paquete instalado (`node_modules/next/dist/docs/`).
- Si no tienes Context7, dímelo y usa la documentación oficial.

## Principios

- Lo más simple que resuelva lo pedido. Nada de capas, abstracciones ni opciones «por si acaso».
- Antes de crear algo, se busca si ya existe y se reutiliza: una misma lógica no se escribe dos veces.
- Cada cambio toca solo lo necesario y sigue el estilo del código que ya hay, aunque haya otra forma válida.
- El código que deja de usarse se borra, no se comenta.

## Organización

- `src/app/`: rutas, páginas, layouts y Route Handlers. Tienen poca lógica: la piden a otras carpetas.
- `src/components/`: componentes compartidos. Los de shadcn/ui, en `src/components/ui/`.
- Si existe `DESIGN.md`, sus colores, tipografía, bordes y espaciado se ponen una sola vez como tema (las
  variables de shadcn/ui y Tailwind en los estilos globales) y todas las pantallas lo usan. El código que
  exporta una herramienta de diseño es una referencia para ver cómo debe quedar, no código para pegar.
- `src/lib/`: utilidades y clientes de servicios (Supabase, IA).
- `src/data/`: el acceso a datos, con `import 'server-only'`.
- Lo que solo usa una ruta va junto a ella, en carpetas privadas (`_components/`, `_lib/`).
- El proxy de Next.js también va en `src/`. En la raíz se quedan la configuración, `public/` y `.env.local`.
- Las Server Actions son finas: validan con Zod y llaman a `src/data/`.
- Componentes de servidor por defecto. `'use client'` solo en los que necesitan interacción, y lo más abajo
  posible en el árbol.
- La base de datos cambia solo con migraciones: cada cambio es un archivo en `supabase/migrations/`, que se
  sube a Git, y se aplica con la conexión que haya a Supabase. Nunca con SQL suelto ni a mano en el panel:
  así la base de datos se puede volver a crear entera desde el repositorio. Sus tipos se generan, no se
  escriben a mano.
- Los datos de ejemplo van en un seed dentro del repositorio, que se carga con `pnpm seed`: datos realistas
  del negocio y un usuario de prueba de cada tipo. Lo usan las pruebas, la demo y quien descargue el
  proyecto para probarlo. No se crea una segunda base de datos ni un modo de demostración aparte: la app
  es la misma, con datos de ejemplo.
- Cuando el proyecto crezca, el código se agrupa por funcionalidad, y se explica en `docs/architecture.md`.

## TypeScript y nombres

- Modo estricto. Nada de `any`: si no se conoce el tipo, `unknown`, y se valida. Nada de `@ts-ignore` ni de
  desactivar ESLint sin un comentario que explique por qué.
- Los tipos de lo que entra (formularios, API) salen de los esquemas de Zod.
- Nombres en inglés en el código y en español los textos que ve el usuario. Nombres que dicen qué hacen:
  `getOverdueInvoices`, no `getData`.
- Archivos en minúsculas con guiones (`invoice-list.tsx`) y componentes en PascalCase (`InvoiceList`).
- Funciones cortas que hacen una sola cosa. Un archivo que pasa de unas 300 líneas o mezcla temas se divide.
- Nada de números ni textos sueltos repetidos: constantes con nombre.

## Errores y estilo

- Los errores esperados (datos no válidos, «no encontrado», sin permiso) se devuelven como resultado y se
  explican al usuario; los inesperados se lanzan y los recoge `error.tsx`. Nunca un `catch` vacío ni un
  error ignorado.
- Los comentarios explican el porqué, no el qué. Sin código comentado ni `console.log` de depuración en lo
  que se sube.
