# Encargo de diseño · Carpeta Fiscal

El encargo está partido en cuatro mensajes para que se pueda pegar por orden. Sirve igual en Claude Design
y en Google Stitch, cambia solo cómo se usa:

- **Claude Design** (claude.ai/design, en planes Pro, Max, Team y Enterprise): admite el encargo entero.
  Pega el mensaje 1 y espera, y después el 2, el 3 y el 4. Lo importante viene después: la primera versión
  es un punto de partida y se mejora pidiendo cambios de uno en uno, o pidiendo «enséñame dos o tres
  alternativas de esta pantalla».
- **Google Stitch** (Google Labs, gratuito con un tope mensual de generaciones): va mejor por bloques, y su
  exportación a Figma admite 16 pantallas de una vez. Pega los mensajes de uno en uno y exporta por bloques.

Lo exportado se deja todo dentro de `docs/design/`.

---

## Mensaje 1 · Contexto, estilo y reglas

```
Necesito el diseño de una aplicación web llamada Carpeta Fiscal.

QUÉ ES
Es el portal privado de una asesoría fiscal. Los clientes de la asesoría (empresas pequeñas y autónomos)
suben ahí las facturas y los tickets de cada trimestre, en vez de mandarlos por WhatsApp o en papel. Una IA
propone los datos de cada documento (fecha, proveedor, base imponible, IVA, total y categoría de gasto) y
el asesor los revisa, los corrige y los aprueba. Resuelve dos problemas: que la asesoría deje de perseguir
a sus clientes reclamando documentación, y que deje de teclear a mano los datos de cada factura.

QUIÉN LA USA Y EN QUÉ DISPOSITIVO
- Administrador de la asesoría: en ordenador. Da de alta clientes y usuarios, y reparte los clientes entre
  los asesores.
- Asesor: en ordenador, pantalla ancha. Pasa el día revisando documentos, así que necesita ver el archivo y
  sus datos a la vez.
- Cliente (el dueño de la panadería, el autónomo): sobre todo en el MÓVIL, porque fotografía tickets con el
  teléfono. Tiene que funcionar también en ordenador. Diséñalo pensando primero en el móvil.

ESTILO
Debe transmitir cuatro cosas, en este orden de importancia: serio y fiable, sencillo, cercano y moderno.
Serio porque la gente deja ahí sus facturas y tiene que notar que nada se pierde. Sencillo porque en cada
pantalla debe estar claro qué toca hacer ahora. Cercano en los textos: lenguaje normal, sin jerga fiscal,
porque quien sube los tickets no es contable. Moderno en el aire y la tipografía, no en efectos.

Fondo claro. Se usa de día, en una oficina, y hay que leer documentos escaneados.

Colores exactos (paleta «grafito y ámbar»):
- Fondo de la página: #FAFAF9 (blanco roto)
- Tarjetas y superficies: #FFFFFF
- Texto principal: #1F1D1B (grafito cálido)
- Texto secundario: #57534E
- Bordes y separadores: #E7E5E4
- Acciones principales (botones): fondo #1F1D1B con texto #FFFFFF
- Ámbar #B45309: RESERVADO para lo que urge. Solo para solicitudes vencidas, documentos pendientes de
  revisar y avisos que piden acción. Si el ámbar aparece en todas partes, deja de significar nada.
- Verde #15803D: aprobado
- Rojo #B91C1C: rechazado o error

Tipografía: una sans neutra y muy legible, tipo Inter. Los importes y los NIF van con cifras de ancho fijo
(tabular), para que las columnas de números queden alineadas.

LO QUE TIENE QUE RESPETAR PARA QUE SE PUEDA CONSTRUIR TAL CUAL
- Componentes estándar: botones, campos de formulario, tablas, tarjetas, diálogos, pestañas, insignias de
  estado y menús desplegables, como los de shadcn/ui. Nada de componentes exóticos.
- Iconos de una sola familia (por ejemplo Lucide), de trazo, no rellenos.
- Texto legible: mínimo 14px en el cuerpo, y contraste suficiente para leer sin esfuerzo.
- Todo utilizable con teclado, con el foco visible.
- Todo funcionando en pantallas de 375px de ancho.
- Los estados de cada documento y de cada solicitud se distinguen por texto y forma, no solo por color.

DATOS DE EJEMPLO
Usa estos, en español, y nunca texto de relleno tipo «Elemento 1»:
- Asesoría: Riera & Bono Asesores
- Asesores: Marta Solís, Javier Peña
- Clientes: Panadería La Espiga SL (B12345678), Talleres Moreno SL (B87654321), Floristería Azahar SL
  (B11223344), Ana Belmonte García (autónoma, 12345678Z)
- Proveedores: Makro, Endesa Energía, Harinas del Ebro SL, Repsol, Telefónica de España
- Categorías de gasto: Compras de mercancía, Suministros, Combustible, Telefonía e internet, Alquiler,
  Reparación y conservación, Servicios profesionales, Seguros, Material de oficina, Dietas y viajes
- Expediente: 2026 · Primer trimestre
- Importes realistas: base 124,30 € · IVA 21% · cuota 26,10 € · total 150,40 €
- Solicitudes: «Facturas de suministros de enero a marzo» (vence el 10/04/2026), «Tickets de combustible
  del trimestre» (vencida el 05/04/2026), «Factura del alquiler del local» (vence el 15/04/2026)

Confírmame que lo tienes y te paso las pantallas en los siguientes mensajes.
```

---

## Mensaje 2 · Pantallas comunes y del cliente (7 pantallas, diseñadas para móvil)

```
Aquí van las primeras siete pantallas de Carpeta Fiscal. Las tres comunes y las cuatro del cliente. Las del
cliente, pensadas primero para móvil.

COMUNES

1. ACCESO
Para: todos. Lo que se ve: el nombre Carpeta Fiscal, campos de correo y contraseña, botón «Entrar» y un
enlace «He olvidado mi contraseña». Un texto pequeño explica que las cuentas las crea la asesoría y que no
hay registro. Si la contraseña falla varias veces, un aviso de que hay que esperar unos minutos.

2. PONER CONTRASEÑA
Para: quien llega desde el correo de invitación o de recuperación. Lo que se ve: contraseña nueva,
repetirla, y los requisitos mínimos a la vista. Botón «Guardar y entrar». Variante con el enlace caducado,
que ofrece pedir otro.

3. SIN PERMISO
Para: quien abre algo que no le corresponde. Un mensaje corto y claro, nada alarmante, y un botón para
volver a su inicio. Sin detalles técnicos.

CLIENTE (móvil primero)

4. INICIO DEL CLIENTE
Para: el cliente de la asesoría. Lo que se ve, por orden: un saludo con el nombre de su empresa; un bloque
«Lo que te piden» con sus solicitudes pendientes ordenadas por fecha límite, las vencidas marcadas en
ámbar; un botón grande y siempre visible «Subir documento»; y debajo sus expedientes por trimestre con
cuántos documentos tiene cada uno. Cada solicitud lleva su título, su fecha límite y un botón «Subir».
Estado sin datos: «Todavía no te han pedido nada. Cuando tu asesor te pida documentación, aparecerá aquí».

5. MI EXPEDIENTE
Para: el cliente. Lo que se ve: el trimestre (2026 · Primer trimestre) y si está abierto o cerrado; las
solicitudes de ese expediente; y la lista de sus documentos, cada uno con una miniatura, el nombre del
archivo y su estado. Los estados son: Subido, Leyéndose, Pendiente de revisión, Aprobado, Rechazado. Si el
expediente está cerrado, se dice y no aparece el botón de subir.

6. SUBIR DOCUMENTO
Para: el cliente, en el móvil. Lo que se ve: elegir a qué solicitud responde (o «Ninguna en concreto»); dos
botones grandes, «Hacer una foto» y «Elegir un archivo»; un recordatorio de que es un documento por
archivo, y qué se admite (JPG, PNG, WebP o PDF, hasta 10 MB). Después: vista previa de lo elegido, barra de
progreso mientras sube, y confirmación. Variante de error: archivo demasiado grande o de un tipo que no se
admite, con un mensaje que dice qué sí se admite.

7. MI DOCUMENTO
Para: el cliente. Lo que se ve: el archivo grande, con posibilidad de ampliarlo; debajo su estado. Tres
variantes que necesito dibujadas:
   a) Pendiente de revisión: «Tu asesor lo está revisando». Sin datos a la vista, porque el cliente no ve
      lo que ha propuesto la IA. Botón «Borrar» disponible.
   b) Aprobado: los datos ya validados (fecha, proveedor, base, IVA, total, categoría) en una lista limpia.
      Sin botón de borrar.
   c) Rechazado: el motivo escrito por el asesor, destacado, y un botón «Subir otro archivo».
```

---

## Mensaje 3 · Pantallas del administrador (5 pantallas, ordenador)

```
Estas cinco son del administrador de la asesoría, en ordenador. Menú superior con: Clientes, Usuarios, y a
la derecha el nombre del usuario con la opción de salir.

8. PANEL DEL ADMINISTRADOR
Lo que se ve, por orden: cuatro cifras grandes (clientes activos, asesores, documentos pendientes de
revisar, solicitudes vencidas); debajo, una tabla corta con los clientes que tienen más cosas pendientes y
su asesor; y accesos a Clientes y Usuarios.

9. CLIENTES
Tabla con: razón social, NIF, asesor asignado, expediente en curso, documentos pendientes y si está activo.
Arriba, buscador y filtros por asesor y por activo. Botón «Nuevo cliente». Estado sin datos: «Todavía no
hay clientes. Empieza dando de alta el primero».

10. FICHA DE CLIENTE
Lo que se ve: razón social y NIF en cabecera; los datos de contacto editables; un bloque «Asesor asignado»
con el asesor actual y un desplegable para cambiarlo, que avisa de que el asesor anterior dejará de ver a
este cliente; un bloque con los usuarios de esa empresa (puede haber varios) y un botón para invitar a
otro; y la lista de expedientes por trimestre. Un interruptor para desactivar el cliente, explicando que
sus documentos se conservan.

11. USUARIOS
Tabla con: nombre, correo, rol (Administrador, Asesor, Cliente), empresa si es cliente, estado (Activo,
Invitación pendiente, Desactivado) y último acceso. Filtros por rol y por estado. Botón «Invitar usuario».

12. INVITAR USUARIO (diálogo)
Campos: nombre, correo, rol, y si el rol es Cliente, a qué empresa pertenece. Un texto explica que se le
enviará un correo con un enlace para poner su contraseña y que ese enlace caduca. Botones «Enviar
invitación» y «Cancelar».
```

---

## Mensaje 4 · Pantallas del asesor (5 pantallas, ordenador)

```
Estas cinco son del asesor, en ordenador. Es donde pasa el día, así que es la parte más importante del
diseño. Menú superior con: Mis clientes, y a la derecha su nombre con la opción de salir.

13. PANEL DEL ASESOR
Lo que se ve, por orden: dos cifras grandes (documentos pendientes de revisar, solicitudes vencidas); una
lista «Para revisar hoy» con los documentos esperando, cada uno con el cliente, el nombre del archivo y
cuánto lleva esperando, y un botón «Revisar» que lleva directo; y debajo, mis clientes.

14. MIS CLIENTES
Tarjetas o tabla con solo los clientes asignados a este asesor: razón social, NIF, trimestre en curso,
documentos pendientes de revisar y solicitudes vencidas en ámbar.

15. EXPEDIENTES DE UN CLIENTE
Cabecera con la razón social y el NIF. Lista de expedientes por año y trimestre, cada uno con su estado
(Abierto o Cerrado) y cuántos documentos tiene. Botón «Abrir trimestre», que pregunta año y trimestre y
avisa si ese trimestre ya existe.

16. EXPEDIENTE
La pantalla de trabajo. Cabecera: cliente, 2026 · Primer trimestre, estado, y tres botones: «Nueva
solicitud», «Exportar CSV» y «Cerrar expediente».
Dos bloques uno debajo del otro:
   - «Documentación pedida»: cada solicitud con título, fecha límite, estado (Pendiente, Cumplida,
     Cancelada) y si se envió ya el recordatorio. Las vencidas y pendientes, en ámbar. Cada una con la
     opción de cancelarla.
   - «Documentos»: tabla con miniatura, archivo, fecha, proveedor, base, IVA, total, categoría y estado.
     Los pendientes de revisar arriba y destacados, con un botón «Revisar».
Estado sin datos del segundo bloque: «Aún no ha subido nada. Pídele la documentación con el botón de
arriba». Variante del botón Exportar CSV cuando no hay nada aprobado: se explica que no hay documentos
aprobados todavía.

17. REVISAR DOCUMENTO
La pantalla más importante. Pantalla partida en dos columnas que no se mueven una respecto de la otra:
   - IZQUIERDA (algo más de la mitad): el archivo grande, con zoom, girar y descargar. Si es un PDF de
     varias páginas, navegación entre páginas.
   - DERECHA: el formulario con fecha, proveedor, NIF del proveedor, base imponible, tipo de IVA, cuota de
     IVA, total y categoría (desplegable). Arriba del formulario, una línea discreta que dice «Datos
     propuestos automáticamente. Revísalos antes de aprobar».
Los campos que la IA no pudo leer aparecen VACÍOS y marcados con la palabra «Pendiente» en ámbar, nunca con
un valor inventado. Los campos que sí leyó aparecen rellenos y editables, con una marca sutil de que vienen
de la propuesta automática.
Abajo, fijos: botón «Aprobar» (deshabilitado mientras quede algún campo obligatorio vacío, explicando por
qué) y botón «Rechazar», que abre un diálogo pidiendo el motivo, obligatorio.
Necesito tres variantes de esta pantalla:
   a) La IA lo leyó todo: formulario relleno.
   b) La IA dejó cosas pendientes: base y cuota de IVA vacías y marcadas, y un aviso de que la base más el
      IVA no cuadraban con el total.
   c) La lectura falló: todos los campos vacíos, con un mensaje sereno de que no se pudo leer el documento
      y hay que rellenarlo a mano. Que no parezca un error grave: el archivo está a salvo.
```

---

## Qué tiene que devolver

Pídele, al terminar:

1. Las 17 pantallas, con sus variantes y sus estados (sin datos, cargando, error y sin permiso).
2. Las reglas del diseño: colores con su código, tipografía y tamaños, espaciado, radios de borde, sombras
   y el aspecto de cada componente. En un archivo `DESIGN.md` si la herramienta lo exporta.
3. La exportación: en Claude Design, el paquete para un agente de código o el HTML; en Stitch, la
   exportación a Figma y el código en HTML con Tailwind.

Todo se deja dentro de `docs/design/`.
