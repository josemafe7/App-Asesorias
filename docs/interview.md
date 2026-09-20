# Entrevista

Cómo me entrevistas para escribir `docs/spec.md`, y para cambiarla cuando pida algo grande o quiera cambiar
una tecnología. La entrevista es para conseguir la información y ponérmelo fácil: no me abrumes, pero
tampoco te quedes sin un dato importante ni decidas por mí algo que me toca decidir a mí.

## Cómo preguntas

- Poco a poco, de una en una y sin preguntas obvias. Si ya te he contado mi idea, parte de ella.
- Si no sé responder algo, recomiéndame la opción más sencilla y explícame por qué.

## Qué necesitas saber

- Quién lo va a usar y qué puede hacer cada tipo de usuario.
- Cómo debe funcionar y qué pasa en los casos raros.
- Qué datos maneja, de dónde salen y si son personales o delicados.
- Qué queda fuera.
- Al final, las tecnologías, como dice más abajo.

## Cómo escribes la especificación

Cuando puedas hacerlo sin inventar nada, rellena `docs/spec.md`:

- Cada cosa que hace la app va como una regla que yo pueda comprobar sin saber programar («Cuando pasa
  esto, la app hace esto otro»), también los casos raros.
- Las fases son pequeñas y cada una termina en algo que se pueda probar.
- Las decisiones técnicas se guardan en `docs/decisions/`.

Después pídeme que la apruebe y, cuando lo haga, cambia su estado a «aprobada».

## Las tecnologías

Tres preguntas, al final de la entrevista, cuando ya sepas qué hace la app, y de una en una. Primero dónde
se publica, porque de eso depende dónde se pueden guardar los datos. Explícame cada opción con palabras
normales y con lo que supone para mí en coste, mantenimiento y límites, comprobando antes los precios y las
condiciones actuales. Ofréceme solo las que encajen con la especificación y marca tu recomendación, que es
la que está entre corchetes. Si respondo «no lo sé», usa la recomendada.

Las opciones son una ayuda, no un límite: en las tres preguntas puedo decir otra. Entonces cuéntame en dos o
tres frases qué gano y qué pierdo, avísame si no encaja con la app o con dónde se publica y, si la sigo
queriendo, úsala. La decisión es mía. Lo recomendado está pensado para una aplicación web: si lo que voy a
construir es otra cosa (una app de móvil, una automatización, una extensión, un programa de escritorio),
propónme tú las tecnologías que encajen: pocas, conocidas y fáciles de mantener.

1. **Dónde se publica.**
   - [Vercel]: se publica sola y no hay servidor que mantener. Su plan gratuito es solo para uso personal no
     comercial: para la app de un negocio hace falta el plan de pago.
   - Un VPS de Hostinger con Dokploy: un servidor propio con un panel para publicar. Coste fijo y sin límites
     de uso comercial, pero el mantenimiento y la seguridad del servidor son míos.
2. **Dónde se guardan los datos, los usuarios y los archivos.**
   - [Supabase]: base de datos, usuarios y archivos en un servicio externo. Vale con Vercel y con un VPS.
   - SQLite + Prisma: los datos en un archivo, sin cuentas externas. Solo si se publica en un VPS, porque en
     Vercel no funciona.
   - PostgreSQL en el propio VPS: la base de datos que Supabase usa por dentro, pero sola. Los usuarios y los
     archivos hay que resolverlos aparte.
   - LocalStorage: los datos se quedan en el navegador de cada persona, sin usuarios ni datos compartidos.
     Solo para una demo o una primera versión.

   Si el proyecto va a ser público o de muestra (un portfolio, una plantilla, código abierto), tenlo en
   cuenta al recomendar y dímelo: solo las opciones que no dependen de un servicio externo permiten
   descargarlo y ejecutarlo sin crear cuentas ni configurar nada.
3. **Con qué se construye.** En una sola pregunta, no pieza a pieza: enséñame la lista de «Tecnologías» de
   `AGENTS.md`, con [Next.js] como framework recomendado y una frase sobre para qué sirve cada pieza, y
   pregúntame si lo dejo así o quiero cambiar algo. Con un «así está bien» o un «no lo sé» basta para
   seguir con lo recomendado.

Con lo que elija, y antes de pedirme que apruebe la especificación, actualiza los corchetes de «Tecnologías»
de `AGENTS.md` y guarda la decisión en `docs/decisions/`. Si he cambiado alguna tecnología, haz lo que dice
esa sección.
