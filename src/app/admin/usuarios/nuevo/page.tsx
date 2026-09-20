import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { z } from 'zod'

import { AppShell } from '@/components/app-shell'
import { listClients } from '@/data/clients'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'
import { INVITATION_EXPIRY_HOURS } from '@/lib/email/invitation'

import { ADMIN_NAV } from '../../_components/admin-nav'
import { InviteUserForm } from '../_components/invite-user-form'

export const metadata: Metadata = { title: 'Invitar usuario · ' + APP_NAME }

// La empresa puede venir puesta desde la ficha de un cliente. También se valida.
const searchSchema = z.object({ empresa: z.uuid().optional().catch(undefined) })

export default async function InvitarUsuarioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const profile = await requireRole('admin')
  const { empresa } = searchSchema.parse(await searchParams)

  const clients = await listClients({ status: 'active' })
  const empresas = clients.map((client) => ({ id: client.id, legalName: client.legalName }))

  return (
    <AppShell profile={profile} nav={ADMIN_NAV}>
      <Link
        href="/admin/usuarios"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Volver a usuarios
      </Link>

      <h1 className="mt-4 text-[34px] font-semibold tracking-[-0.02em]">Invitar usuario</h1>
      <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
        Le enviaremos un correo con un enlace para que ponga su contraseña. El enlace caduca a las{' '}
        {INVITATION_EXPIRY_HOURS} horas; si se le pasa, puede pedir uno nuevo desde «He olvidado mi
        contraseña».
      </p>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-card">
        <InviteUserForm empresas={empresas} empresaPorDefecto={empresa} />
      </div>
    </AppShell>
  )
}
