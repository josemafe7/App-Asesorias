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

/** S6 · Una solicitud está vencida cuando su fecha límite ya ha pasado. El mismo día, todavía no. */
export function isOverdue(dueDate: DayString, today: DayString = todayInSpain()): boolean {
  return dueDate < today
}
