import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Inter es la tipografía de DESIGN.md.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Carpeta Fiscal',
  description:
    'El portal donde los clientes de la asesoría suben sus facturas y tickets de cada trimestre.',
  // Es un portal privado: no queremos que ninguna de sus páginas acabe en un buscador.
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
