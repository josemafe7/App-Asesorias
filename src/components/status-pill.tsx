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

/** E3 · Un expediente está abierto o cerrado. */
export function DossierPill({ status }: { status: 'open' | 'closed' }) {
  return (
    <StatusPill tone={status === 'open' ? 'success' : 'off'}>
      {status === 'open' ? 'Abierto' : 'Cerrado'}
    </StatusPill>
  )
}

/** S3 · Una solicitud está pendiente, cumplida o cancelada; y una pendiente puede estar vencida (S6). */
export function RequestPill({
  status,
  overdue = false,
}: {
  status: 'pending' | 'fulfilled' | 'cancelled'
  overdue?: boolean
}) {
  if (status === 'fulfilled') return <StatusPill tone="success">Cumplida</StatusPill>
  if (status === 'cancelled') return <StatusPill tone="off">Cancelada</StatusPill>

  return (
    <StatusPill tone={overdue ? 'urgent' : 'neutral'}>{overdue ? 'Vencida' : 'Pendiente'}</StatusPill>
  )
}
