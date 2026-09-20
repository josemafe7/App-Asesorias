import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { z } from 'zod'

import { AppShell } from '@/components/app-shell'
import { Notice } from '@/components/notice'
import { ActivePill } from '@/components/status-pill'
import { Button } from '@/components/ui/button'
import { countClientsByAdvisor, listClients } from '@/data/clients'
import { getUser } from '@/data/users'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'

import { ADMIN_NAV } from '../../_components/admin-nav'
import { toggleUserActiveAction } from '../actions'
import { UserRoleForm } from '../_components/user-role-form'

export const metadata: Metadata = { title: 'Ficha de usuario · ' + APP_NAME }

function Seccion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-card">
      <h2 className="text-[22px] font-semibold tracking-[-0.01em]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** «1 cliente» o «3 clientes», para no escribir «1 clientes». */
function textoClientes(cuantos: number): string {
  return cuantos === 1 ? '1 cliente' : `${cuantos} clientes`
}

// Lo que llega por la dirección también se valida, aunque sea un aviso (docs/security.md).
const searchSchema = z.object({ guardado: z.literal('1').optional().catch(undefined) })

export default async function FichaUsuarioPage({
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

  const user = await getUser(id)
  if (!user) notFound()

  const clients = await listClients()
  const empresas = clients.map((client) => ({ id: client.id, legalName: client.legalName }))

  // C9 · Mientras lleve empresas, ni cambia de rol ni se desactiva: primero se reasignan.
  const cuantosClientes = user.role === 'advisor' ? await countClientsByAdvisor(user.id) : 0

  // A11 · Consigo mismo no: ni cambiarse el rol ni desactivarse.
  const esUnoMismo = user.id === profile.id

  return (
    <AppShell profile={profile} nav={ADMIN_NAV}>
      <Link
        href="/admin/usuarios"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Volver a usuarios
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[34px] font-semibold tracking-[-0.02em]">{user.fullName}</h1>
        <ActivePill isActive={user.isActive} />
      </div>
      <p className="mt-1 text-[15px] text-muted-foreground">{user.email}</p>

      {guardado ? <Notice>Datos guardados.</Notice> : null}

      {esUnoMismo ? (
        <div className="mt-6 max-w-[620px] rounded-xl border bg-card p-6 shadow-card">
          <p className="text-[15px] leading-relaxed">
            Esta es tu propia cuenta. No puedes cambiar tu propio rol ni desactivarte, para que la
            asesoría no se quede sin administrador. Si hace falta, que lo haga otro administrador.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <Seccion title="Rol y empresa">
            {cuantosClientes > 0 ? (
              <p className="mb-4 max-w-[620px] text-[15px] leading-relaxed text-muted-foreground">
                Lleva {textoClientes(cuantosClientes)}. Para cambiarle el rol, antes hay que{' '}
                <Link
                  href={`/admin/clientes?asesor=${user.id}`}
                  className="rounded-sm font-medium underline underline-offset-2 hover:text-urgent"
                >
                  reasignar sus empresas
                </Link>{' '}
                a otro asesor.
              </p>
            ) : null}
            <UserRoleForm
              key={`${user.role}-${user.clientId ?? ''}`}
              userId={user.id}
              role={user.role}
              clientId={user.clientId}
              empresas={empresas}
            />
          </Seccion>

          <Seccion title="Estado de la cuenta">
            {cuantosClientes > 0 ? (
              <p className="max-w-[620px] text-[15px] leading-relaxed text-muted-foreground">
                No se puede desactivar mientras lleve {textoClientes(cuantosClientes)}: sus empresas se
                quedarían con un asesor que ya no las lleva. Reasígnalas a otro asesor y vuelve aquí.
              </p>
            ) : (
              <>
                <p className="max-w-[620px] text-[15px] leading-relaxed text-muted-foreground">
                  {user.isActive
                    ? 'Si la desactivas, esta persona deja de entrar en el portal aunque acierte su contraseña. Puedes volver a activarla cuando quieras.'
                    : 'Está desactivada: no entra en el portal aunque acierte su contraseña.'}
                </p>
                <form action={toggleUserActiveAction} className="mt-4">
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="isActive" value={user.isActive ? 'false' : 'true'} />
                  <Button
                    type="submit"
                    variant={user.isActive ? 'destructive' : 'outline'}
                    className="h-[42px] px-5"
                  >
                    {user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                  </Button>
                </form>
              </>
            )}
          </Seccion>
        </div>
      )}
    </AppShell>
  )
}
