/**
 * Utilidades de formateo para fechas y montos en SaleFast POS.
 * Maneja de forma segura strings ISO, arrays de LocalDateTime de Jackson y timestamps.
 */

export function parseDate(dateVal) {
  if (!dateVal) return new Date()

  // Si Java / Jackson devuelve un array: [YYYY, MM, DD, hh, mm, ss, ms]
  if (Array.isArray(dateVal)) {
    const [year, month, day, hours = 0, minutes = 0, seconds = 0] = dateVal
    // Nota: el mes en Date de JS es 0-indexado
    const d = new Date(year, month - 1, day, hours, minutes, seconds)
    return isNaN(d.getTime()) ? new Date() : d
  }

  // Si es un Date ya construido
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? new Date() : dateVal
  }

  // Si es string o número
  const str = String(dateVal).trim()

  // Jackson con write-dates-as-timestamps=false devuelve "2026-10-09T21:00:00" sin zona horaria.
  // El navegador lo trataría como UTC (5 horas adelantado en Perú).
  // Lo tratamos explícitamente como hora local usando el constructor de Date con partes.
  const localMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/)
  if (localMatch) {
    const [, y, mo, d, h, mi, s] = localMatch.map(Number)
    const date = new Date(y, mo - 1, d, h, mi, s)
    return isNaN(date.getTime()) ? new Date() : date
  }

  let d = new Date(str)

  // Si falló el parsing directo (por ejemplo fechas con formato "YYYY-MM-DD HH:mm:ss")
  if (isNaN(d.getTime())) {
    const isoLike = str.replace(' ', 'T')
    d = new Date(isoLike)
  }

  return isNaN(d.getTime()) ? new Date() : d
}

/**
 * Formatea fecha y hora completa en español (Perú): DD/MM/YYYY, HH:mm:ss
 */
export function formatDateTime(dateVal) {
  const d = parseDate(dateVal)
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/**
 * Formatea solo fecha: DD/MM/YYYY
 */
export function formatDate(dateVal) {
  const d = parseDate(dateVal)
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formatea solo hora: HH:mm
 */
export function formatTime(dateVal) {
  const d = parseDate(dateVal)
  return d.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
