import type { Metadata } from 'next'
import Link from 'next/link'

import { APP_NAME } from '@/lib/app-config'

import { RecoveryForm } from './_components/recovery-form'

export const metadata: Metadata = { title: 'Recuperar contraseña · ' + APP_NAME }

export default function RecuperarPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-[380px]">
        <h1 className="text-[24px] font-semibold tracking-[-0.01em]">Recuperar la contraseña</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Escribe tu correo y te enviamos un enlace para poner una contraseña nueva.
        </p>

        <div className="mt-7">
          <RecoveryForm />
        </div>

        <p className="mt-7 text-[13px]">
          <Link href="/acceso" className="underline-offset-2 hover:text-urgent hover:underline">
            Volver al acceso
          </Link>
        </p>
      </div>
    </main>
  )
}
