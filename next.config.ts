import type { NextConfig } from 'next'

// Cabeceras de seguridad (docs/security.md). Se aplican a todas las rutas.
// La Content Security Policy se añadirá cuando la app esté estable, siguiendo la guía de Next.js.
const securityHeaders = [
  // El navegador no adivina el tipo de un archivo: respeta el que declara el servidor.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // No se filtra la dirección completa de la página al salir hacia otro sitio.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Nadie puede meter la app dentro de un marco en otra web (clickjacking).
  { key: 'X-Frame-Options', value: 'DENY' },
  // La app no pide cámara, micrófono ni ubicación: se deniegan de raíz.
  // Las fotos de tickets se hacen con un campo de archivo, que no necesita este permiso.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // El navegador solo se conectará por HTTPS durante dos años.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig: NextConfig = {
  // Se publica en un VPS dentro de una imagen de Docker: deja solo lo necesario para ejecutarla.
  output: 'standalone',
  // D2 · Un documento puede pesar hasta 10 MB, y el cuerpo de una Server Action viene limitado a 1 MB.
  // Se sube justo lo necesario: más que eso, además, lo rechaza el propio almacén.
  experimental: {
    serverActions: { bodySizeLimit: '11mb' },
  },
  // No anunciamos con qué está hecha la app.
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
