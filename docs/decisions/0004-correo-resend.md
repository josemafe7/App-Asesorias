# 0004 · Enviar los correos con Resend

- **Estado:** aceptada
- **Fecha:** 2026-09-20

## Contexto y problema

La app manda dos tipos de correo: la invitación para que un usuario nuevo ponga su contraseña, y el
recordatorio de una solicitud que sigue pendiente al llegar su fecha límite. Tienen que llegar a la bandeja
de entrada, no a spam.

## Opciones consideradas

- Resend: servicio pensado para correos de aplicación, con SPF, DKIM y DMARC.
- La cuenta de correo que ya tiene la asesoría, por SMTP.

## Decisión

Resend, con el dominio de la asesoría verificado.

## Consecuencias

- Gratis hasta 3.000 correos al mes, con un máximo de 100 al día. Por encima, 20 $ al mes.
- Hay que configurar los registros del dominio de la asesoría para que los correos no caigan en spam.
- En las pruebas no se llama al servicio de verdad: se simula, y se comprueba que se habría enviado.
