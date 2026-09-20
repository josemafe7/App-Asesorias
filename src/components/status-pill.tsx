import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'

/**
 * La píldora de estado de DESIGN.md: borde y texto en el color del estado, nunca el fondo tintado.
 *
 * El estado no se distingue solo por el color: la píldora lleva siempre su palabra.
 */
const pillVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-[9px] py-0.5 text-[13px] font-medium',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-muted text-muted-foreground',
        urgent: 'border-urgent bg-card text-urgent',
        success: 'border-success bg-card text-success',
        danger: 'border-destructive bg-card text-destructive',
        off: 'border-disabled bg-card text-disabled',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export function StatusPill({
  tone,
  className,
  children,
}: VariantProps<typeof pillVariants> & { className?: string; children: React.ReactNode }) {
  return <span className={cn(pillVariants({ tone }), className)}>{children}</span>
}

/** Activo o desactivado, que es el estado que se repite en clientes y usuarios. */
export function ActivePill({ isActive }: { isActive: boolean }) {
  return (
    <StatusPill tone={isActive ? 'success' : 'off'}>
      {isActive ? 'Activo' : 'Desactivado'}
    </StatusPill>
  )
}
