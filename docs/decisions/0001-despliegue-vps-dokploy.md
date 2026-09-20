# 0001 · Publicar en un VPS de Hostinger con Dokploy

- **Estado:** aceptada
- **Fecha:** 2026-09-20

## Contexto y problema

Hay que decidir dónde se publica la app antes que nada, porque de eso depende dónde se pueden guardar los
datos y cómo se ponen los límites de peticiones y las tareas programadas. Es la app de un negocio, así que
el plan gratuito de Vercel queda descartado: sus condiciones solo permiten uso personal no comercial.

## Opciones consideradas

- Vercel en plan Pro: 20 $ al mes por desarrollador, se publica sola, sin servidor que mantener, con
  firewall y tareas programadas incluidos.
- Un VPS de Hostinger con Dokploy: coste fijo del servidor, sin límites de uso comercial, pero el
  mantenimiento y la seguridad del servidor son del proyecto.

## Decisión

VPS de Hostinger con Dokploy. Es la infraestructura que ya tiene el responsable del proyecto, el coste es
fijo y previsible, y no hay restricciones de uso comercial.

## Consecuencias

- La app se empaqueta en Docker con `output: 'standalone'` de Next.js.
- Las claves de producción van en las variables de entorno de la aplicación en el panel de Dokploy, nunca
  dentro de la imagen.
- HTTPS y el dominio los resuelve el proxy Traefik que trae Dokploy.
- Sin firewall de Vercel: los límites de peticiones los pone el proyecto, en la app y en el proxy.
- Sin Vercel Cron: el recordatorio diario es un Schedule Job de Dokploy que llama a una ruta protegida con
  un secreto compartido.
- El servidor hay que mantenerlo: actualizaciones del sistema, de Docker, de Dokploy y de Next.js, puertos
  cerrados, SSH con clave y copias de seguridad fuera del servidor.
