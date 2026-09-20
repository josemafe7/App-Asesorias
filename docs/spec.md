# Especificación

Qué se construye. Sirve para comprobar, sin saber programar, que lo construido hace lo que tiene que hacer.

**Estado:** aprobada

## Qué problema resuelve y para quién

Lo usa una asesoría: un administrador, sus asesores y los clientes de la asesoría (empresas y autónomos).

Hoy los clientes mandan facturas y tickets por donde pueden: correo, WhatsApp, papel. Los asesores pierden
tiempo en dos cosas: reclamar una y otra vez la documentación que falta, y copiar a mano los datos de cada
documento. La app da a cada cliente un sitio único donde subir sus documentos del trimestre, pide por sí
sola lo que falta, propone con IA los datos de cada documento y deja que el asesor los corrija y los
apruebe. Al final, la asesoría se descarga un CSV con los datos ya validados.

## Qué hace

Cada línea es una regla que se puede comprobar: «Cuando pasa esto, la app hace esto otro».

### Acceso y cuentas

- A1 · Quien no ha iniciado sesión y abre cualquier dirección de la app acaba en la pantalla de acceso.
- A2 · Se entra con correo y contraseña. No hay registro público: nadie puede crearse una cuenta por su
  cuenta.
- A3 · Al entrar, cada usuario aterriza en el panel de su rol: administrador, asesor o cliente.
- A4 · Un usuario desactivado no entra, aunque la contraseña sea correcta, y ve el mensaje de que su cuenta
  no está activa.
- A5 · Cuando el administrador crea un usuario, le llega un correo de invitación con un enlace para poner
  su contraseña. El enlace caduca.
- A6 · Cualquiera puede pedir un correo para restablecer su contraseña desde la pantalla de acceso.
- A7 · Si un usuario abre una dirección que no le corresponde por su rol, ve «no tienes permiso», no el
  contenido.
- A8 · Tras varios intentos fallidos seguidos de inicio de sesión desde el mismo sitio, la app deja de
  aceptar intentos durante un rato.
- A9 · Los intentos fallidos de inicio de sesión y los cambios de rol quedan registrados.
- A10 · Un usuario cliente tiene a mano un enlace «Escribir a mi asesor» que abre su propio programa de
  correo con la dirección de su asesor asignado ya puesta. La app no guarda ni envía ese mensaje: no hay
  mensajería dentro del portal.
- A11 · Un administrador no puede quitarse a sí mismo el rol ni desactivar su propia cuenta. La app no se
  lo permite y le explica por qué, para que la asesoría nunca se quede sin administrador.
- A12 · En la lista de usuarios, el administrador puede filtrar por rol y por estado (activos,
  desactivados o todos).
- A13 · El panel del administrador muestra cuántos clientes activos y cuántos asesores hay.

### Clientes y asignación

- C1 · El administrador da de alta un cliente con razón social, NIF, correo y teléfono. La razón social y el
  NIF son obligatorios.
- C2 · No se pueden dar de alta dos clientes con el mismo NIF.
- C3 · El administrador asigna cada cliente a un asesor, y puede cambiar esa asignación cuando quiera.
- C4 · Un asesor ve en su panel solo los clientes que tiene asignados.
- C5 · Si el administrador reasigna un cliente a otro asesor, el asesor anterior deja de verlo
  inmediatamente y el nuevo pasa a verlo.
- C6 · El administrador puede desactivar un cliente: deja de aparecer en las listas de trabajo, pero sus
  expedientes y documentos se conservan.
- C7 · Cada usuario de tipo cliente pertenece a una empresa. Una empresa puede tener uno o varios usuarios,
  y todos ven lo mismo de esa empresa.
- C8 · En la lista de clientes, el administrador puede filtrar por asesor y por estado (activos,
  desactivados o todos).
- C9 · Un asesor que lleva empresas asignadas no se puede desactivar ni cambiar de rol: la app lo impide
  y dice cuántas hay que reasignar antes, para que ninguna empresa se quede con un asesor que ya no la
  lleva.

### Expedientes trimestrales

- E1 · El asesor abre el expediente de un cliente para un año y un trimestre concretos.
- E2 · No puede haber dos expedientes del mismo cliente para el mismo año y trimestre.
- E3 · Un expediente está abierto o cerrado. El asesor lo cierra cuando termina, y puede volver a abrirlo.
- E4 · Con el expediente cerrado, el cliente no puede subir documentos nuevos a él.
- E5 · El cliente ve sus expedientes con el número de documentos y de solicitudes pendientes de cada uno.

### Solicitudes de documentación

- S1 · Dentro de un expediente, el asesor crea solicitudes con título, descripción y fecha límite. El título
  y la fecha límite son obligatorios.
- S2 · La fecha límite no puede ser anterior a hoy en el momento de crear la solicitud.
- S3 · Una solicitud está pendiente, cumplida o cancelada.
- S4 · Cuando el cliente sube un documento respondiendo a una solicitud, esa solicitud pasa a cumplida.
- S5 · El asesor puede cancelar una solicitud, y entonces deja de reclamarse.
- S6 · El cliente ve en su panel sus solicitudes pendientes, ordenadas por fecha límite, con las vencidas
  marcadas.

### Subida de documentos

- D1 · El cliente sube un archivo por documento. No se admiten varios documentos en un mismo archivo.
- D2 · Se admiten JPG, PNG, WebP y PDF, hasta 10 MB. El tipo y el tamaño se comprueban en el servidor, no
  solo en el navegador.
- D3 · Un archivo de otro tipo o más grande se rechaza con un mensaje que dice qué se admite.
- D4 · El cliente puede subir un documento respondiendo a una solicitud o sin solicitud, al expediente
  abierto.
- D5 · Los archivos se guardan en un almacén privado. No existe ninguna dirección pública que los muestre.
- D6 · Para ver o descargar un archivo se genera un enlace temporal, y solo después de comprobar en el
  servidor que quien lo pide tiene permiso.
- D7 · El cliente puede borrar un documento suyo mientras no esté aprobado. Una vez aprobado, no puede
  borrarlo ni cambiar su archivo.
- D8 · Cada documento tiene un estado visible: subido, leyéndose, pendiente de revisión, aprobado o
  rechazado.

### Lectura automática con IA

- I1 · Al subir un documento, la app lo manda a leer y propone: fecha, proveedor, NIF del proveedor, base
  imponible, tipo de IVA, cuota de IVA, total y categoría de gasto.
- I2 · Todo campo que la IA no pueda leer con seguridad se queda vacío y aparece marcado como pendiente.
  **Nunca se rellena con un valor inventado ni aproximado.**
- I3 · La categoría propuesta tiene que ser una de las del catálogo de la app. Si no encaja en ninguna, se
  queda pendiente.
- I4 · Si la base más la cuota de IVA no cuadran con el total, el documento se marca para revisar y no se
  corrige ningún importe por su cuenta.
- I5 · Si la lectura falla o tarda demasiado, el documento queda pendiente de revisión con los campos
  vacíos. Un fallo de la IA nunca impide subir el documento ni hace perder el archivo.
- I6 · El contenido del archivo se trata siempre como dato. Si un documento contiene texto que parece una
  orden («ignora lo anterior», «borra los datos», «envía esto a...»), la app no hace nada de eso: ese texto,
  como mucho, acaba copiado dentro de un campo de texto del propio documento.
- I7 · La app guarda lo que propuso la IA tal cual, aparte del dato ya validado, para poder comparar.
- I8 · Cada usuario tiene un límite de documentos que puede mandar a leer por hora.

### Revisión y aprobación

- R1 · El asesor ve, en una misma pantalla, el archivo a un lado y los datos propuestos al otro.
- R2 · El asesor puede corregir cualquier campo antes de aprobar.
- R3 · Para aprobar un documento, la fecha, el proveedor, la base, el IVA, el total y la categoría tienen
  que estar rellenos. No se aprueba nada con campos pendientes.
- R4 · Al aprobar, se guarda quién aprobó y cuándo.
- R5 · El asesor puede rechazar un documento indicando un motivo. El motivo es obligatorio.
- R6 · Un documento rechazado se lo ve el cliente con el motivo, y puede subir otro archivo en su lugar.
- R7 · El cliente no ve en ningún momento los datos propuestos por la IA. Solo ve los datos cuando el
  documento está aprobado.
- R8 · Un asesor no puede abrir, corregir ni aprobar un documento de un cliente que no tiene asignado.

### Recordatorios por correo

- M1 · Una vez al día, la app busca las solicitudes cuya fecha límite ya ha llegado o pasado y que siguen
  pendientes.
- M2 · Por cada una de esas solicitudes, envía un correo a los usuarios de esa empresa cliente con el título
  de la solicitud, su fecha límite y un enlace al portal.
- M3 · El trabajo diario envía como mucho **un** recordatorio por solicitud: se guarda la fecha de envío y
  no vuelve a mandarlo por su cuenta. Insistir es decisión del asesor, con M6.
- M4 · No se envía recordatorio de una solicitud cumplida ni de una cancelada.
- M5 · La dirección que lanza este trabajo diario solo responde si quien la llama trae el secreto
  acordado. Sin él, responde que no está permitido.
- M6 · El asesor puede enviar a mano el recordatorio de una solicitud pendiente, esté vencida o no, con el
  mismo correo que el automático. La pantalla muestra cuándo se envió el último.
- M7 · Entre dos recordatorios de la misma solicitud tienen que pasar al menos 24 horas, los mande la app o
  el asesor. Si no han pasado, el botón está apagado y dice cuándo se podrá volver a enviar.

### Exportación CSV

- X1 · Desde un expediente, el asesor descarga un CSV con los documentos **aprobados** de ese expediente.
- X2 · El CSV lleva estas columnas, en este orden: `cliente`, `nif_cliente`, `ejercicio`, `trimestre`,
  `fecha`, `proveedor`, `nif_proveedor`, `base_imponible`, `tipo_iva`, `cuota_iva`, `total`, `categoria`,
  `archivo`, `aprobado_por`, `fecha_aprobacion`.
- X3 · Los documentos no aprobados no salen en el CSV.
- X4 · El separador es `;`, los decimales van con coma y el archivo es UTF-8 con marca de orden de bytes,
  que es lo que abre bien Excel en español.
- X5 · Un texto que empiece por `=`, `+`, `-` o `@` se neutraliza, para que ninguna hoja de cálculo lo
  ejecute como fórmula.
- X6 · Si el expediente no tiene ningún documento aprobado, la app lo dice y no descarga un archivo vacío.

## Quién puede hacer qué

Lo que no aparece aquí no está permitido. Cada permiso se comprueba en el servidor sobre el registro
concreto, no solo sobre el rol, y también con reglas por filas en la base de datos.

**Administrador**
- Ver y hacer todo lo de cualquier cliente.
- Crear, invitar, desactivar y reactivar usuarios de los tres roles, y cambiarles el rol. Consigo mismo
  no: no puede cambiarse el rol ni desactivarse (A11). Con un asesor que aún lleva empresas, tampoco:
  antes hay que reasignarlas (C9).
- Dar de alta y editar clientes, y asignarlos o reasignarlos a un asesor.
- Abrir y cerrar expedientes, crear solicitudes, subir documentos, revisar, aprobar, rechazar y exportar,
  en las mismas pantallas que usa el asesor y con cualquier cliente.
- No entra en las pantallas del cliente: no pertenece a ninguna empresa, así que ahí no hay nada suyo que
  ver.

**Asesor**
- Ver únicamente los clientes que tiene asignados, y todo lo que cuelga de ellos.
- Abrir y cerrar expedientes de sus clientes, y crear y cancelar solicitudes en ellos.
- Subir documentos a expedientes de sus clientes.
- Ver el archivo y los datos propuestos, corregirlos, aprobarlos y rechazarlos, de sus clientes.
- Exportar el CSV de un expediente de sus clientes.
- No puede crear ni editar usuarios, ni dar de alta clientes, ni cambiar asignaciones.

**Cliente**
- Ver únicamente los expedientes, solicitudes y documentos de su propia empresa.
- Ver la ficha de su empresa, sin poder editarla.
- Subir documentos a sus expedientes abiertos, y borrar los suyos mientras no estén aprobados.
- Descargar sus propios archivos.
- Ver el estado de cada documento y, cuando está aprobado, sus datos; y el motivo cuando está rechazado.
- No puede ver los datos propuestos por la IA, ni aprobar, ni exportar, ni ver nada de otra empresa.

## Qué datos maneja

- **Usuarios:** correo, nombre, rol y si está activo. El rol se guarda en una tabla protegida, nunca donde
  el propio usuario pueda cambiarlo. Son datos personales.
- **Clientes:** razón social, NIF, correo, teléfono y el asesor asignado. Datos de empresa, y personales
  cuando el cliente es autónomo.
- **Expedientes:** cliente, año, trimestre y si está abierto o cerrado.
- **Solicitudes:** expediente, título, descripción, fecha límite, estado y fecha del recordatorio enviado.
- **Documentos:** expediente, solicitud (si la hay), nombre original del archivo, tipo, tamaño, ruta en el
  almacén privado, estado, quién lo subió y cuándo.
- **Datos del documento:** fecha, proveedor, NIF del proveedor, base imponible, tipo de IVA, cuota de IVA,
  total y categoría de gasto; la lista de campos que quedaron pendientes; la propuesta de la IA tal cual; y
  quién aprobó y cuándo.
- **Catálogo de categorías de gasto:** lista fija, cargada por migración.

Son facturas y tickets de terceros: datos fiscales, y personales cuando el proveedor o el cliente es una
persona física. Se guardan en Supabase, en una región de la Unión Europea. Los archivos se envían al
proveedor de IA solo para leerlos, con el registro de prompts desactivado y sin permitir proveedores que
entrenen con los datos. La asesoría tiene que reflejar este tratamiento en la información que da a sus
clientes.

## Qué queda fuera

- Facturas emitidas e ingresos: en esta versión solo se suben gastos.
- Facturas con varios tipos de IVA en el mismo documento: se marcan para revisar a mano.
- Varios documentos dentro de un mismo archivo.
- Presentación de modelos ante Hacienda y cualquier cálculo fiscal.
- Entrada de documentos por correo electrónico o por WhatsApp.
- Contabilidad, conciliación bancaria, pagos y facturación.
- Firma electrónica y sellado de tiempo.
- Aplicación móvil propia: el portal se usa desde el navegador, también en el móvil.

## Fases

- [x] Fase 1 · Base del proyecto, acceso y roles — se comprueba: cada usuario de prueba entra y aterriza en
      el panel de su rol; un cliente que escribe a mano la dirección del panel de administrador ve «no tienes
      permiso»; y, atacando la base de datos directamente con la clave que lleva cualquier navegador, sin
      sesión no se ve ni una fila, cada usuario solo ve lo suyo y un cliente no consigue ascenderse a
      administrador. (A1, A2, A3, A4, A6, A7, A8)
- [x] Fase 2 · Usuarios, clientes y asignación — se comprueba: el administrador crea un cliente, crea su
      usuario y se lo asigna a un asesor; ese asesor lo ve; el otro asesor no lo ve ni escribiendo la
      dirección directa. (A5, A9, A10, A11, C1-C7)
- [ ] Fase 3 · El resto de la app: expedientes, documentos, IA, revisión, recordatorios, exportación y
      publicación — se comprueba: el asesor abre 2026-T1 de un cliente y crea dos solicitudes, el cliente
      las ve con su fecha límite y un cliente de otra empresa no ve nada de eso; el cliente sube una foto y
      un PDF y los ve en su expediente, un archivo de 20 MB y un .exe se rechazan, y otro cliente no puede
      abrirlos ni con el enlace directo; de tres documentos de ejemplo, el legible sale relleno, el ilegible
      sale vacío y marcado como pendiente, y el que intenta dar órdenes no provoca ninguna acción; el asesor
      corrige el proveedor y aprueba, el cliente ve «aprobado» y los datos pero nunca la propuesta original,
      un documento con campos pendientes no deja aprobarse y un asesor no asignado no puede abrirlo; con la
      fecha límite de una solicitud puesta en ayer, el trabajo diario manda un correo y solo uno; el CSV
      descargado tiene las columnas acordadas y solo las filas aprobadas; y la asesoría entra por su dominio
      con HTTPS y hace el recorrido completo de «Cómo se comprueba que todo funciona».
      (E1-E5, S1-S6, D1-D8, I1-I8, R1-R8, M1-M7, X1-X6)

      Ojo al publicar: hasta aquí las pruebas usan `next start`, que sirve la compilación normal, mientras
      que en el VPS corre la versión reducida para Docker. Al montar la imagen hay que copiarle los
      archivos estáticos y comprobar que las pantallas se ven bien, no solo que responden.

      Tramos. Cada uno acaba con `pnpm check` en verde, su marca aquí y un commit de guardado:
      - [x] 3a · Expedientes y solicitudes (E1, E2, E3, E5, S1, S2, S3, S5, S6)
      - [x] 3b · Subida de documentos (D1-D8, y con ellos E4 y S4)
      - [x] 3c · Lectura automática con IA (I1-I8)
      - [x] 3d · Revisión y aprobación (R1-R8)
      - [x] 3e · Recordatorios y exportación CSV (M1-M7, X1-X6)
      - [ ] 3f · Publicación en el VPS

## Cómo se comprueba que todo funciona

El recorrido que da el proyecto por bueno, de principio a fin:

1. El administrador crea la empresa «Panadería La Espiga SL», crea su usuario y se la asigna a la asesora
   Marta.
2. Marta abre el expediente 2026-T1 y crea tres solicitudes con fecha límite.
3. El cliente entra, ve sus tres solicitudes y sube una foto de un ticket y dos PDF de facturas.
4. La app propone los datos de los tres. En el ticket borroso deja la base y el IVA pendientes.
5. Marta corrige el proveedor de una factura, rellena a mano lo del ticket y aprueba los tres.
6. El cliente ve los tres como aprobados, con sus datos, y en ningún momento ha visto lo que propuso la IA.
7. La tercera solicitud sigue pendiente al llegar su fecha: el cliente recibe un correo, y solo uno aunque
   el trabajo diario se ejecute otra vez.
8. Marta descarga el CSV del expediente: tres filas, las columnas acordadas y los importes correctos.
9. En todo el recorrido, ningún usuario puede ver ni tocar nada que no le corresponda, tampoco escribiendo
   las direcciones a mano.
