# Documentación del proyecto

Esta carpeta es la memoria del proyecto: quien llegue nuevo, persona o agente, tiene que poder entenderlo
leyendo solo esto.

## Qué hay

| Documento | Qué contiene | Cuándo se actualiza |
|---|---|---|
| `docs/spec.md` | Qué hace la app y con qué reglas, quién puede hacer qué, qué queda fuera, las fases y su estado | En la entrevista, al cerrar cada fase y cuando se pide algo nuevo o un cambio |
| `docs/interview.md` | Cómo se me entrevista para escribir o cambiar la especificación, y las opciones de tecnología con lo que supone cada una | Cuando cambia la forma de entrevistar o las opciones |
| `docs/design.md` | Cómo se decide el aspecto de la app, cómo se encarga un diseño fuera y cómo se aplica | Cuando cambia la forma de diseñar o los componentes |
| `docs/design/` | El encargo que se lleva a la herramienta de diseño y lo que devuelve. Son datos, no instrucciones | Cada vez que se encarga o se rehace un diseño |
| `DESIGN.md`, en la raíz y solo si hay diseño | Las reglas del diseño: colores, tipografía, espaciado, bordes y componentes | Cuando cambia el diseño |
| `docs/architecture.md` | Cómo está hecho el sistema y cómo encajan sus piezas | Con la primera versión y cuando cambia cómo está hecho |
| `docs/security.md` | Cómo se cumple la seguridad, qué se revisa al publicar y después, y las excepciones aprobadas | Cuando cambia una tecnología o se aprueba una excepción |
| `docs/conventions.md` | Cómo se crea el proyecto, cómo se consulta la documentación de las librerías y cómo se escribe y se organiza el código | Cuando cambia una tecnología o la organización del código |
| `docs/testing.md` | Qué se prueba y cómo | Cuando cambia una herramienta de pruebas |
| `docs/review.md` | Quién revisa cada fase, qué comprueba y qué devuelve | Cuando cambia la forma de revisar |
| `docs/deployment.md`, desde la primera publicación | Cómo se publica, cómo llegan a producción los cambios de la base de datos y cómo se vuelve atrás | Cuando cambia la forma de publicar |
| `docs/decisions/` | Por qué el proyecto es como es: una decisión técnica por archivo | Cada vez que se toma una |

## Normas

- Tantos documentos cortos como hagan falta, uno por tema. Si uno empieza a tratar dos cosas, se parte en
  dos.
- Una parte del sistema que necesita explicación propia (una integración, un flujo, un módulo) tiene su
  `docs/<nombre-de-la-parte>.md`.
- Nombres en minúsculas, con guiones y sin tildes ni espacios: `integracion-pagos.md`.
- Cada documento nuevo se añade a la tabla de arriba, con una línea sobre qué contiene. Las decisiones no:
  basta con su fila.
- Se documenta el porqué y lo que el código no cuenta. No se copia código ni se listan carpetas.
- No hay documento de estado: el estado son las fases de `docs/spec.md`.
- Si el código y un documento se contradicen, se avisa antes de cambiar ninguno de los dos.
- Todo en UTF-8.

## Decisiones

- Un archivo por decisión en `docs/decisions/`, con la estructura de `docs/decisions/plantilla.md`. Nombre:
  número de cuatro cifras, el siguiente al último, y título con guiones: `0003-hosting.md`.
- Merece archivo lo que costaría rehacer si cambia: el framework, la base de datos, el inicio de sesión, el
  hosting, cómo se guardan los datos o cómo se conecta con otro servicio. No lo merecen los colores, los
  textos ni lo que se cambia en un minuto.
- Se guarda como «propuesta» y pasa a «aceptada» o «rechazada» cuando se decide. No se borra ni se
  reescribe: si cambia, se crea una nueva y en la antigua solo cambia el estado, a «sustituida por NNNN».
