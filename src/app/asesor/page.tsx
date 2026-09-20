import Link from 'next/link'
import type { Metadata } from 'next'

import { AppShell } from '@/components/app-shell'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listClients } from '@/data/clients'
import { APP_NAME } from '@/lib/app-config'
import { requireRole } from '@/lib/auth-guards'

export const metadata: Metadata = { title: 'Panel del asesor · ' + APP_NAME }

export default async function AsesorPage() {
  // El administrador entra aquí también: la especificación le da todo lo de cualquier cliente.
  const profile = await requireRole('admin', 'advisor')

  // C4 · Las políticas de la base de datos ya devuelven solo los clientes de este asesor.
  // C6 · Los desactivados no salen en las listas de trabajo.
  const clients = await listClients({ status: 'active' })

  const esAdmin = profile.role === 'admin'

  return (
    <AppShell profile={profile} nav={[{ href: '/asesor', label: 'Mis clientes' }]}>
      <h1 className="text-[34px] font-semibold tracking-[-0.02em]">Panel del asesor</h1>
      <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
        {esAdmin
          ? 'Todos los clientes activos de la asesoría. Los expedientes y los documentos llegan en las fases 3 y 4.'
          : 'Los clientes que tienes asignados. Sus expedientes y sus documentos llegan en las fases 3 y 4.'}
      </p>

      <h2 className="mt-8 text-[22px] font-semibold tracking-[-0.01em]">
        {esAdmin ? 'Clientes de la asesoría' : 'Mis clientes'}
      </h2>

      {clients.length === 0 ? (
        <div className="mt-6 rounded-xl border bg-card p-8 text-center shadow-card">
          <p className="text-[17px] font-semibold">Todavía no tienes clientes asignados</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando el administrador te asigne uno, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razón social</TableHead>
                <TableHead>NIF</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.legalName}</TableCell>
                  <TableCell className="tabular-nums">{client.taxId}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/asesor/clientes/${client.id}`}
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
