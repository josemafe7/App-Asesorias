# DESIGN.md · Carpeta Fiscal

Las reglas de aspecto de la app, sacadas del diseño de `docs/design/export/`. Mandan aquí: una pantalla que
el diseño no dibujó se construye siguiendo este archivo, para que parezca de la misma app.

El tema se aplica **una sola vez**, como variables de Tailwind y shadcn/ui en los estilos globales. El HTML
exportado es una referencia para ver cómo debe quedar, no código para pegar.

## Overview

Paleta «grafito y ámbar» sobre fondo claro. Serio y fiable primero, sencillo después; cercano en los textos
y moderno en el aire y la tipografía, no en efectos. Nada de degradados, cristales ni animaciones vistosas.

La regla que da carácter a todo: **el ámbar significa «esto te está esperando»**. Solicitudes vencidas,
documentos sin revisar y campos que la IA no pudo leer. En ningún otro sitio. Las acciones normales son
grafito. Si el ámbar empieza a salir en botones corrientes, deja de avisar de nada.

## Colors

| Uso | Valor |
|---|---|
| Fondo de página | `#FAFAF9` |
| Superficies y tarjetas | `#FFFFFF` |
| Relleno sutil: cabeceras de tabla, píldoras neutras, hover de fila | `#F5F5F4` |
| Bordes y separadores | `#E7E5E4` |
| Borde marcado y texto desactivado | `#A8A29E` |
| Texto principal | `#1F1D1B` |
| Texto secundario | `#57534E` |
| Acción principal: fondo | `#1F1D1B`, texto `#FFFFFF` |
| Acción principal: hover | `#33302D` |
| Ámbar, solo urgencia | `#B45309`, superficie `#FFFBF5` |
| Aprobado | `#15803D` |
| Rechazado y error | `#B91C1C`, hover `#991717` |
| Velo de diálogo | `rgba(31,29,27,.32)` |

El estado nunca se distingue solo por color: siempre lleva también su palabra («Vencida», «Pendiente»,
«Aprobado») y, donde ayuda, su icono.

## Typography

- Familia: **Inter** (400, 500, 600, 700), con `system-ui, sans-serif` de reserva.
- Escala: 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 24, 34, 40 px.
- Cuerpo 14-15 px. Etiquetas y texto de apoyo 13 px. Rótulos en versalitas 12 px, `letter-spacing:.14em`.
- Títulos de sección 22 px / 600. Título de pantalla 34 px / 600, `letter-spacing:-0.02em`. Cifras grandes
  de los paneles 40 px / 600.
- Pesos: 600 para títulos, botones y datos destacados; 500 para etiquetas; 400 para texto corrido.
- Interlineado 1.6 en párrafos.
- **Importes, NIF y fechas con cifras tabulares** (`font-variant-numeric: tabular-nums`), para que las
  columnas de números queden alineadas. Esto no es un detalle: es una app de contabilidad.

## Layout

- Anchos de referencia: **375 px** (cliente, móvil primero), **1180 px** y **1440 px** (asesor y
  administrador).
- Escala de separación: 6, 8, 10, 12, 16, 20, 28, 56 px.
- Contenido centrado con ancho máximo; los formularios de una columna, a 380 px.
- **Revisar documento** va a dos columnas que no se mueven una respecto de la otra: el archivo ocupa algo
  más de la mitad a la izquierda, el formulario a la derecha, y los botones de aprobar y rechazar quedan
  fijos abajo.
- En el móvil del cliente, el botón de subir documento está siempre a mano.

## Elevation & Depth

Cuatro niveles y ni uno más. La profundidad la dan sobre todo los bordes, no las sombras.

| Nivel | Sombra | Dónde |
|---|---|---|
| Tarjeta | `0 1px 2px rgba(31,29,27,.06)` | Tarjetas y paneles en reposo |
| Elevado | `0 2px 10px rgba(31,29,27,.07)` | Tarjetas destacadas, menús desplegables |
| Flotante | `0 4px 14px rgba(31,29,27,.22)` | Botón de acción flotante en móvil |
| Diálogo | `0 18px 44px rgba(31,29,27,.18)` | Diálogos, sobre el velo |

## Shapes

- Radio por defecto: **8 px** (botones, campos, selects).
- 6 px en elementos pequeños; 10 y 12 px en tarjetas; 14 px en contenedores grandes; 20 px en bloques
  destacados.
- Píldoras de estado: `999px`. Avatares: `50%`.
- Bordes de 1 px. No se usan bordes gruesos ni de colores salvo en las píldoras de estado.

## Components

**Botón principal** · fondo `#1F1D1B`, texto `#FFFFFF`, radio 8, 14-15 px, peso 600, altura 42 px.
Deshabilitado: `opacity:.45` y `cursor:not-allowed`, y siempre con un texto al lado que explica por qué.

**Botón secundario** · fondo `#FFFFFF`, borde `#E7E5E4`, texto `#1F1D1B`, mismo radio y altura. Hover
`#F5F5F4`.

**Botón destructivo** · texto y borde `#B91C1C` sobre blanco. Nunca relleno en rojo: rechazar un documento
no es borrarlo.

**Campo de formulario** · fondo `#FFFFFF`, borde `#E7E5E4`, radio 8, `padding:10px 12px`, altura 42 px,
texto 15 px. Etiqueta encima, 14 px / 500. El error va debajo, en `#B91C1C`, y dice qué hacer.

**Foco** · `outline: 2px solid #1F1D1B; outline-offset: 2px;` en todo lo que se puede enfocar. No se quita
nunca.

**Píldora de estado** · `inline-flex`, `gap:6px`, radio 999, `padding:2px 9px`, 13 px. Fondo `#FFFFFF` o
`#F5F5F4`, y **borde y texto en el color del estado**. Nunca rellenos tintados.

| Estado | Color |
|---|---|
| Subido, Abierto, neutro | `#57534E` sobre `#F5F5F4` |
| Pendiente de revisión, Vencida | `#B45309` |
| Aprobado, Al día | `#15803D` |
| Rechazado | `#B91C1C` |
| Cerrado, Desactivado | `#A8A29E` |

**Tarjeta** · fondo `#FFFFFF`, borde `#E7E5E4`, radio 12-14, sombra de tarjeta, `padding` 20-28.

**Tabla** · cabecera sobre `#F5F5F4` con texto 13 px / 600; filas separadas por `#E7E5E4`; hover de fila
`#F5F5F4`; importes alineados a la derecha y con cifras tabulares.

**Diálogo** · tarjeta blanca de radio 14 sobre el velo, con sombra de diálogo. Título, cuerpo y dos
botones abajo a la derecha: el secundario a la izquierda.

**Enlaces** · color `#1F1D1B`, en hover `#B45309`.

**Iconos** · Lucide, de trazo, `stroke-width:1.75`, 22 px junto al título y 16-18 px en línea con el texto.
Una sola familia en toda la app.

**Estado sin datos** · una frase que dice qué pasa y qué hacer ahora, y el botón que lo hace. Nunca una
tabla vacía a secas.

## Do's and Don'ts

**Sí**
- Usar el ámbar solo para lo vencido, lo pendiente de revisar y los campos que la IA no pudo leer.
- Acompañar cada color de estado con su palabra.
- Cifras tabulares en todo importe, NIF y fecha.
- Escribir en lenguaje normal: «Tu asesor lo está revisando», no «Estado: PENDING_REVIEW».
- Dejar el foco visible y todo alcanzable con el teclado.
- En un botón deshabilitado, explicar al lado qué falta.

**No**
- Rellenar píldoras de estado con fondos de color.
- Inventar colores nuevos fuera de la tabla de arriba.
- Poner más de cuatro niveles de sombra, ni degradados o cristales.
- Enseñar al cliente los datos propuestos por la IA antes de que el asesor los apruebe.
- Distinguir algo solo por color.
- Pegar el HTML exportado: se construye con los componentes del proyecto siguiendo estas reglas.
