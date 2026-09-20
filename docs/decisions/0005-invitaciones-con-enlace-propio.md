# 0005 · Las invitaciones las envía la app, no Supabase

- **Estado:** aceptada
- **Fecha:** 2026-09-20

## Contexto y problema

La regla A5 dice que, al crear un usuario, le llega un correo con un enlace para poner su contraseña.
Supabase sabe crear la cuenta y sabe enviar ese correo con su propia plantilla, pero entonces el texto y el
aspecto del correo se configuran en su panel, fuera del repositorio, y en las pruebas no hay forma de
comprobar que se habría enviado, porque el envío ocurre dentro de Supabase.

## Opciones consideradas

- Que Supabase envíe la invitación con su plantilla, configurando Resend como su servidor de correo en el
  panel.
- Que Supabase cree la cuenta y **genere el enlace sin enviarlo** (`generateLink`), y que la app monte el
  correo y lo envíe con Resend.
- Igual que la anterior, pero llamando a Resend con su paquete oficial en vez de con una petición normal.

## Decisión

La app monta el correo y lo envía ella, llamando a la API de Resend con una petición normal (`fetch`), sin
añadir ninguna dependencia.

## Consecuencias

- El texto del correo vive en el repositorio (`src/lib/email/invitation.ts`), se revisa como cualquier otro
  código y se prueba sin llamar a ningún servicio.
- La fase 7 reutiliza el mismo envío para los recordatorios.
- Crear la cuenta necesita la clave secreta de Supabase en el servidor. Se usa solo para eso y solo después
  de comprobar que quien lo pide es administrador (ver `docs/architecture.md`).
- Si el correo no sale, la cuenta recién creada se borra: no quedan usuarios a medias.
- En desarrollo, sin clave de Resend, el correo se escribe en la consola del servidor con su enlace. En
  producción, sin clave, el envío falla en vez de fingir que ha salido.
- Hay que configurar en Supabase cuánto dura el enlace, y ese mismo número aparece en el correo y en la
  pantalla (`INVITATION_EXPIRY_HOURS`).
