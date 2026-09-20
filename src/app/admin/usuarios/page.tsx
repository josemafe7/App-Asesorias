import { cn } from 'cn'
import Link from 'next/link'
import type { Metadata } from 'next'
import { z } from 'zod'

import { AppShell } from '@/components/app-shell'
import { Notice } from '@/components/notice'
import { ActivePill } from '@/components/status-pill'
import { Button, buttonVariants } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listClients } from '@/data/clients'
import { listUsers } from '@/data/users'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'
import { ROLE_LABELS, ROLES } from '@/lib/roles'

import { ADMIN_NAV } from '../_components/admin-nav'

export const metadata: Metadata = { title: 'Usuarios · ' + APP_NAME }

const filtersSchema = z.object({
  rol: z.enum(ROLES).optional().catch(undefined),
  estado: z.enum(['todos', 'activos', 'inactivos']).optional().catch(undefined),
  invitado: z.literal('1').optional().catch(undefined),
})

const ESTADOS = { todos: 'all', activos: 'active', inactivos: 'inactive' } as const

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const profile = await requireRole('admin')
  const filters = filtersSchema.parse(await searchParams)
  const estado = filters.estado ?? 'todos'

  const [users, clients] = await Promise.all([
    listUsers({ role: filters.rol, status: ESTADOS[estado] }),
    listClients(),
  ])

  const companyName = new Map(clients.map((client) => [client.id, client.legalName]))

  return (
    <AppShell profile={profile} nav={ADMIN_NAV}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[34px] font-semibold tracking-[-0.02em]">Usuarios</h1>
        <Link href="/admin/usuarios/nuevo" className={cn(buttonVariants(), 'h-[42px] px-5')}>
          Invitar usuario
        </Link>
      </div>

      {filters.invitado ? (
        <Notice>Invitación enviada. En cuanto ponga su contraseña, podrá entrar.</Notice>
      ) : null}

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rol" className="text-sm font-medium">
            Rol
          </label>
          <NativeSelect id="rol" name="rol" defaultValue={filters.rol ?? ''} className="w-[200px]">
            <option value="">Todos los roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="estado" className="text-sm font-medium">
            Estado
          </label>
          <NativeSelect id="estado" name="estado" defaultValue={estado} className="w-[200px]">
            <option value="todos">Activos e inactivos</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo desactivados</option>
          </NativeSelect>
        </div>

        <Button type="submit" variant="outline" className="h-[42px] px-5">
          Filtrar
        </Button>
      </form>

      {users.length === 0 ? (
        <div className="mt-6 rounded-xl border bg-card p-8 text-center shadow-card">
          <p className="text-[17px] font-semibold">No hay usuarios que se ajusten a eso</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cambia los filtros o invita a alguien nuevo.
          </p>
          <Link
            href="/admin/usuarios/nuevo"
            className={cn(buttonVariants(), 'mt-4 h-[42px] px-5')}
          >
            Invitar usuario
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{ROLE_LABELS[user.role]}</TableCell>
                  <TableCell>
                    {user.clientId ? (companyName.get(user.clientId) ?? '—') : '—'}
                  </TableCell>
                  <TableCell>
                    <ActivePill isActive={user.isActive} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/usuarios/${user.id}`}
                      className="rounded-sm font-medium underline-offset-2 hover:text-urgent hover:underline"
                    >
                      Abrir ficha
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  )
}
