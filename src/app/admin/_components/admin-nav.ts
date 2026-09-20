import type { NavLink } from '@/components/app-shell'

/** El menú del administrador. Solo lleva a pantallas que existen. */
export const ADMIN_NAV: NavLink[] = [
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/usuarios', label: 'Usuarios' },
]
