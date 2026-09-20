import Link from 'next/link'
import type { Metadata } from 'next'
import { cn } from 'cn'
import { z } from 'zod'

import { AppShell } from '@/components/app-shell'
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
import { listAdvisors, listClients } from '@/data/clients'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'

import { ADMIN_NAV } from '../_components/admin-nav'

export const metadata: Metadata = { title: 'Clientes · ' + APP_NAME }

// Lo que llega por la dirección también se valida (docs/security.md · «Entradas y peticiones»).
const filtersSchema = z.object({
  asesor: z.uuid().optional().catch(undefined),
  estado: z.enum(['todos', 'activos', 'inactivos']).optional().catch(undefined),
})

const ESTADOS = {
  todos: 'all',
  activos: 'active',
  inactivos: 'inactive',
} as const

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const profile = await requireRole('admin')
  const filters = filtersSchema.parse(await searchParams)
  const estado = filters.estado ?? 'todos'

  const [clients, advisors] = await Promise.all([
    listClients({ advisorId: filters.asesor, status: ESTADOS[estado] }),
    listAdvisors(),
  ])

  const advisorName = new Map(advisors.map((advisor) => [advisor.id, advisor.fullName]))

  return (
    <AppShell profile={profile} nav={ADMIN_NAV}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[34px] font-semibold tracking-[-0.02em]">Clientes</h1>
        <Link href="/admin/clientes/nuevo" className={cn(buttonVariants(), 'h-[42px] px-5')}>
          Nuevo cliente
        </Link>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="asesor" className="text-sm font-medium">
            Asesor
          </label>
          <NativeSelect id="asesor" name="asesor" defaultValue={filters.asesor ?? ''} className="w-[220px]">
            <option value="">Todos los asesores</option>
            {advisors.map((advisor) => (
              <option key={advisor.id} value={advisor.id}>
                {advisor.fullName}
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
            <option value="inactivos">Solo inactivos</option>
          </NativeSelect>
        </div>

        <Button type="submit" variant="outline" className="h-[42px] px-5">
          Filtrar
        </Button>
      </form>

      {clients.length === 0 ? (
        <div className="mt-6 rounded-xl border bg-card p-8 text-center shadow-card">
          <p className="text-[17px] font-semibold">No hay clientes que se ajusten a eso</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cambia los filtros o da de alta el primer cliente.
          </p>
          <Link
            href="/admin/clientes/nuevo"
            className={cn(buttonVariants(), 'mt-4 h-[42px] px-5')}
          >
            Nuevo cliente
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razón social</TableHead>
                <TableHead>NIF</TableHead>
                <TableHead>Asesor asignado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.legalName}</TableCell>
                  <TableCell className="tabular-nums">{client.taxId}</TableCell>
                  <TableCell>
                    {client.advisorId
                      ? (advisorName.get(client.advisorId) ?? 'Sin asignar')
                      : 'Sin asignar'}
                  </TableCell>
                  <TableCell>
                    <ActivePill isActive={client.isActive} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/clientes/${client.id}`}
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
