import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { z } from 'zod'

import { AppShell } from '@/components/app-shell'
import { Notice } from '@/components/notice'
import { ActivePill } from '@/components/status-pill'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { getClient, listAdvisors } from '@/data/clients'
import { listUsers } from '@/data/users'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'

import { ADMIN_NAV } from '../../_components/admin-nav'
import { changeAdvisorAction, toggleClientActiveAction, updateClientAction } from '../actions'
import { ClientForm } from '../_components/client-form'

export const metadata: Metadata = { title: 'Ficha de cliente · ' + APP_NAME }

function Seccion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-card">
      <h2 className="text-[22px] font-semibold tracking-[-0.01em]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

// Lo que llega por la dirección también se valida, aunque sea un aviso (docs/security.md).
const searchSchema = z.object({ guardado: z.literal('1').optional().catch(undefined) })

export default async function FichaClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const profile = await requireRole('admin')

  const { id } = await params
  const { guardado } = searchSchema.parse(await searchParams)
  if (!z.uuid().safeParse(id).success) notFound()

  const client = await getClient(id)
  if (!client) notFound()

  const [advisors, users] = await Promise.all([listAdvisors(), listUsers({ clientId: id })])
  const advisor = advisors.find((candidate) => candidate.id === client.advisorId)

  return (
    <AppShell profile={profile} nav={ADMIN_NAV}>
      <Link
        href="/admin/clientes"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Volver a clientes
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[34px] font-semibold tracking-[-0.02em]">{client.legalName}</h1>
        <ActivePill isActive={client.isActive} />
      </div>
      <p className="mt-1 text-[15px] text-muted-foreground tabular-nums">NIF {client.taxId}</p>

      {guardado ? <Notice>Datos guardados.</Notice> : null}

      <div className="mt-6 flex flex-col gap-4">
        <Seccion title="Datos de contacto">
          <ClientForm
            action={updateClientAction}
            submitLabel="Guardar cambios"
            clientId={client.id}
            defaults={{
              legalName: client.legalName,
              taxId: client.taxId,
              email: client.email ?? '',
              phone: client.phone ?? '',
            }}
          />
        </Seccion>

        <Seccion title="Asesor asignado a esta empresa">
          <p className="text-[15px]">
            {advisor ? `Lo lleva ${advisor.fullName}` : 'Todavía no tiene asesor asignado.'}
          </p>
          {advisor ? (
            <p className="mt-1 text-[13px] text-muted-foreground">
              Si lo cambias, {advisor.fullName} deja de ver a este cliente al momento.
            </p>
          ) : null}

          <form action={changeAdvisorAction} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="clientId" value={client.id} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="advisorId" className="text-sm font-medium">
                Asesor
              </label>
              <NativeSelect
                id="advisorId"
                name="advisorId"
                defaultValue={client.advisorId ?? ''}
                className="w-[260px]"
              >
                <option value="">Sin asignar</option>
                {advisors.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.fullName}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button type="submit" variant="outline" className="h-[42px] px-5">
              Cambiar de asesor
            </Button>
          </form>
        </Seccion>

        <Seccion title="Usuarios de esta empresa">
          {users.length === 0 ? (
            <p className="text-[15px] text-muted-foreground">
              Todavía no hay nadie de esta empresa con acceso al portal.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {users.map((user) => (
                <li key={user.id} className="flex flex-wrap items-center gap-3">
                  <span className="font-medium">{user.fullName}</span>
                  <span className="text-[13px] text-muted-foreground">{user.email}</span>
                  <ActivePill isActive={user.isActive} />
                </li>
              ))}
            </ul>
          )}

          <Link
            href={`/admin/usuarios/nuevo?empresa=${client.id}`}
            className="mt-4 inline-block rounded-sm text-sm font-medium underline-offset-2 hover:text-urgent hover:underline"
          >
            Invitar a otra persona
          </Link>
        </Seccion>

        <Seccion title="Estado del cliente">
          <p className="max-w-[620px] text-[15px] leading-relaxed text-muted-foreground">
            {client.isActive
              ? 'Si lo desactivas, deja de aparecer en las listas de trabajo de su asesor, pero sus expedientes y sus documentos se conservan. Puedes volver a activarlo cuando quieras.'
              : 'Está desactivado: no aparece en las listas de trabajo. Sus expedientes y sus documentos siguen guardados.'}
          </p>
          <form action={toggleClientActiveAction} className="mt-4">
            <input type="hidden" name="clientId" value={client.id} />
            <input type="hidden" name="isActive" value={client.isActive ? 'false' : 'true'} />
            <Button
              type="submit"
              variant={client.isActive ? 'destructive' : 'outline'}
              className="h-[42px] px-5"
            >
              {client.isActive ? 'Desactivar cliente' : 'Activar cliente'}
            </Button>
          </form>
        </Seccion>
      </div>
    </AppShell>
  )
}
