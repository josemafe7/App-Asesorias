import * as React from 'react'
import { cn } from 'cn'

/**
 * Un desplegable normal del navegador, con el aspecto del tema.
 *
 * Es el `<select>` de toda la vida a propósito: funciona sin JavaScript, el móvil lo pinta con su propio
 * selector y no añade ninguna dependencia. Cuando haga falta uno con búsqueda o con varios valores, será
 * el momento de traer el de shadcn/ui.
 */
function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        'h-[42px] w-full min-w-0 rounded-md border border-input bg-card px-2.5 text-[15px] transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { NativeSelect }
