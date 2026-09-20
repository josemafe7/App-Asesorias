import { Mail } from 'lucide-react'
import type { Metadata } from 'next'

import { AppShell } from '@/components/app-shell'
import { getAdvisor, getClient } from '@/data/clients'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'

export const metadata: Metadata = { title: 'Inicio · ' + APP_NAME }

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[13px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[15px]">{value}</div>
    </div>
  )
}

export default async function ClientePage() {
  const profile = await requireRole('client')

  // C7 · Cada usuario cliente pertenece a una empresa, y todos los de la misma empresa ven lo mismo.
  const client = profile.clientId ? await getClient(profile.clientId) : null
  const advisor = client?.advisorId ? await getAdvisor(client.advisorId) : null

  return (
    <AppShell profile={profile}>
      <h1 className="text-[34px] font-semibold tracking-[-0.02em]">Hola, {profile.fullName}</h1>
      <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
        Aquí verás lo que te pide tu asesoría y podrás subir tus facturas y tickets del trimestre. Esas
        pantallas llegan en las fases 3 y 4.
      </p>

      {client ? (
        <section className="mt-8 rounded-xl border bg-card p-6 shadow-card">
          <h2 className="text-[22px] font-semibold tracking-[-0.01em]">{client.legalName}</h2>
          <p className="mt-1 text-[15px] text-muted-foreground tabular-nums">NIF {client.taxId}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Dato label="Correo de contacto" value={client.email ?? 'Sin correo'} />
            <Dato label="Teléfono" value={client.phone ?? 'Sin teléfono'} />
          </div>

          <div className="mt-6 border-t pt-5">
            {advisor ? (
              <>
                <p className="text-[15px]">
                  Tu asesor es <span className="font-semibold">{advisor.fullName}</span>.
                </p>
                {/* A10 · Abre el programa de correo de la persona. La app no guarda ni envía nada. */}
                <a
                  href={`mailto:${advisor.email}`}
                  className="mt-3 inline-flex items-center gap-2 rounded-sm text-[15px] font-medium underline-offset-2 hover:text-urgent hover:underline"
                >
                  <Mail className="size-[18px]" strokeWidth={1.75} aria-hidden />
                  Escribir a mi asesor
                </a>
              </>
            ) : (
              <p className="text-[15px] text-muted-foreground">
                Todavía no tienes asesor asignado. En cuanto la asesoría te asigne uno, aparecerá aquí.
              </p>
            )}
          </div>
        </section>
      ) : (
        <p className="mt-8 text-[15px] text-muted-foreground">
          Todavía no hay ninguna empresa asociada a tu cuenta. Avisa a tu asesoría.
        </p>
      )}
    </AppShell>
  )
}
