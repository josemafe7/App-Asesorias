/**
 * Fechas del negocio, siempre en el día que es en España.
 *
 * El servidor puede estar en otro huso horario: en un VPS lo normal es que vaya en horario universal.
 * Si «hoy» se calculara con la hora del servidor, una solicitud creada a las once y media de la noche
 * tendría fecha del día siguiente y la regla S2 rechazaría una fecha límite perfectamente válida.
 */

const SPAIN = 'Europe/Madrid'

const SPANISH_DAY = new Intl.DateTimeFormat('es-ES', {
  timeZone: SPAIN,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Un día, sin hora: `2026-03-31`. Es como se guardan las fechas límite. */
export type DayString = string

function partes(date: Date): Record<string, string> {
  return Object.fromEntries(SPANISH_DAY.formatToParts(date).map((parte) => [parte.type, parte.value]))
}

/** El día que es hoy en España, como año-mes-día. */
export function todayInSpain(now: Date = new Date()): DayString {
  const { year, month, day } = partes(now)

  return `${year}-${month}-${day}`
}

/** El trimestre al que pertenece un día. */
export function quarterOf(day: DayString): { year: number; quarter: number } {
  const [year, month] = day.split('-').map(Number)

  return { year, quarter: Math.ceil(month / 3) }
}

/** Cómo se nombra un trimestre en las pantallas. */
export function quarterLabel(year: number, quarter: number): string {
  return `${year} · T${quarter}`
}

/** Una fecha como se escribe en España: `31/03/2026`. */
export function formatDay(day: DayString): string {
  const [year, month, date] = day.split('-')

  return `${date}/${month}/${year}`
}

/**
 * Si un texto es un día de verdad: `2026-02-31` tiene la forma de una fecha, pero no existe.
 */
export function isDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const fecha = new Date(`${value}T00:00:00Z`)

  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === value
}

/** Un momento concreto, como se dice en España: `21/03/2026 a las 9:00`. */
export function formatMoment(date: Date): string {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
      .formatToParts(date)
      .map((parte) => [parte.type, parte.value]),
  )

  return `${partes.day}/${partes.month}/${partes.year} a las ${partes.hour}:${partes.minute}`
}

/** S6 · Una solicitud está vencida cuando su fecha límite ya ha pasado. El mismo día, todavía no. */
export function isOverdue(dueDate: DayString, today: DayString = todayInSpain()): boolean {
  return dueDate < today
}
