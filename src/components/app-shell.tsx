import { Folder } from 'lucide-react'
import Link from 'next/link'

import { signOut } from '@/app/acceso/actions'
import { Button } from '@/components/ui/button'
import { type CurrentProfile } from '@/data/profile'
import { ROLE_HOME, ROLE_LABELS } from '@/lib/roles'
import { APP_NAME, FIRM_NAME } from '@/lib/app-config'

export type NavLink = { href: string; label: string }

/**
 * El marco común de todas las pantallas privadas: barra superior con el nombre de la app, el menú del
 * rol y quién ha entrado.
 *
 * Los enlaces del menú los pasa cada panel, y van apareciendo conforme se construyen las fases: no se
 * dibujan enlaces a pantallas que todavía no existen.
 */
export function AppShell({
  profile,
  nav = [],
  children,
}: {
  profile: CurrentProfile
  nav?: NavLink[]
  children: React.ReactNode
}) {
  return (
    <>
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center gap-8 px-4">
          <Link
            href={ROLE_HOME[profile.role]}
            className="flex shrink-0 items-center gap-2.5 rounded-sm"
          >
            <Folder className="size-[22px]" strokeWidth={1.75} aria-hidden />
            <span className="text-[17px] font-semibold tracking-[-0.01em]">{APP_NAME}</span>
          </Link>

          {nav.length > 0 ? (
            <nav className="flex items-center gap-6" aria-label="Secciones">
              {nav.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-sm text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium leading-tight">{profile.fullName}</div>
              <div className="text-[13px] leading-tight text-muted-foreground">
                {ROLE_LABELS[profile.role]}
              </div>
            </div>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-8">
        {children}
        <p className="mt-12 text-[13px] text-muted-foreground">{FIRM_NAME}</p>
      </main>
    </>
  )
}
