export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0]
}

export const formatTime = (date: Date): string => {
  return date.toTimeString().slice(0, 5)
}

export const formatDateTime = (date: string, time: string): string => {
  // Crear la fecha correctamente sin problemas de zona horaria
  const [year, month, day] = date.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)

  // ✅ CORREGIDO: No restar 1 al día
  // Crear fecha usando el constructor con parámetros individuales
  // Esto evita problemas de zona horaria
  const dateObj = new Date(year, month - 1, day, hours, minutes)

  return dateObj.toLocaleString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const isDateAvailable = (date: string): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Resetear horas para comparar solo fechas

  const [year, month, day] = date.split("-").map(Number)
  // ✅ CORREGIDO: No restar 1 al día
  const selectedDate = new Date(year, month - 1, day)
  selectedDate.setHours(0, 0, 0, 0) // Asegurar que las horas est��n en 0

  // Must be at least today or future
  if (selectedDate < today) return false

  // Check if it's a valid business day (not Sunday)
  const dayOfWeek = selectedDate.getDay()
  return dayOfWeek !== 0 // Sunday = 0
}

export const getBusinessHours = () => {
  return {
    start: "09:00",
    end: "19:00",
    lunchBreak: { start: "13:00", end: "14:00" },
  }
}

export const generateDateRange = (startDate: Date, days: number): string[] => {
  const dates: string[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    dates.push(formatDate(date))
  }

  return dates.filter(isDateAvailable)
}

// Función para filtrar horarios pasados del día actual
export const filterPastTimeSlots = (date: string, timeSlots: string[]): string[] => {
  const today = new Date()
  const todayString = formatDate(today)

  // Si la fecha no es hoy, devolver todos los horarios
  if (date !== todayString) {
    return timeSlots
  }

  // Si es hoy, filtrar horarios que ya pasaron
  const currentTime = today.getHours() * 60 + today.getMinutes()

  return timeSlots.filter((timeSlot) => {
    const [hours, minutes] = timeSlot.split(":").map(Number)
    const slotTime = hours * 60 + minutes
    return slotTime > currentTime + 30 // Agregar 30 minutos de buffer
  })
}

// Función para verificar si un horario específico ya está reservado
export const isTimeSlotBooked = (date: string, time: string, appointments: any[], staffId?: string): boolean => {
  return appointments.some(
    (apt) =>
      apt.date === date && apt.time === time && apt.status !== "cancelled" && (!staffId || apt.staffId === staffId),
  )
}

// Función para filtrar horarios ya reservados
export const filterBookedTimeSlots = (
  date: string,
  timeSlots: string[],
  appointments: any[],
  staffId?: string,
): string[] => {
  return timeSlots.filter((timeSlot) => !isTimeSlotBooked(date, timeSlot, appointments, staffId))
}

// Función para verificar si una fecha es pasada
export const isPastDate = (date: string): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [year, month, day] = date.split("-").map(Number)
  // ✅ CORREGIDO: No restar 1 al día
  const checkDate = new Date(year, month - 1, day)
  checkDate.setHours(0, 0, 0, 0)

  return checkDate < today
}

// Función para verificar si un horario es pasado
export const isPastTime = (date: string, time: string): boolean => {
  const now = new Date()
  const [year, month, day] = date.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)

  // ✅ CORREGIDO: No restar 1 al día
  const dateTime = new Date(year, month - 1, day, hours, minutes)

  return dateTime < now
}

// ✅ NUEVAS FUNCIONES ÚTILES PARA MANEJO DE FECHAS

// Función para crear una fecha desde string sin problemas de zona horaria
export const createDateFromString = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

// Función para comparar fechas sin considerar la hora
export const isSameDate = (date1: string, date2: string): boolean => {
  return date1 === date2
}

// Función para obtener la fecha de hoy en formato string
export const getTodayString = (): string => {
  return formatDate(new Date())
}

// Función para obtener la fecha de mañana en formato string
export const getTomorrowString = (): string => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return formatDate(tomorrow)
}

// Función para formatear fecha en español sin hora
export const formatDateSpanish = (dateString: string): string => {
  const [year, month, day] = dateString.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Función para validar formato de fecha
export const isValidDateString = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false

  const [year, month, day] = dateString.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

// Función para obtener el día de la semana en español
export const getDayOfWeekSpanish = (dateString: string): string => {
  const [year, month, day] = dateString.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  return days[date.getDay()]
}

// ✅ Función para debugging - mostrar información de fecha
export const debugDate = (dateString: string, label = "Date"): void => {
  console.log(`${label}:`, {
    input: dateString,
    parsed: createDateFromString(dateString),
    dayOfWeek: getDayOfWeekSpanish(dateString),
    isToday: isSameDate(dateString, getTodayString()),
    isPast: isPastDate(dateString),
    isAvailable: isDateAvailable(dateString),
  })
}

// ✅ FUNCIÓN SEGURA PARA INPUTS DE FECHA
export const handleDateInput = (dateString: string): string => {
  // Si viene del input date HTML, ya está en formato correcto
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }

  // Si viene de otro formato, convertir sin zona horaria
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")

  return `${year}-${month}-${day}`
}

// ✅ FUNCIÓN PARA CREAR FECHA SIN PROBLEMAS DE ZONA HORARIA
export const createSafeDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number)
  // Crear fecha en zona horaria local, no UTC
  return new Date(year, month - 1, day, 12, 0, 0) // Usar mediodía para evitar cambios
}

// ✅ FUNCIÓN PARA OBTENER FECHA DEL INPUT SIN CAMBIOS
export const getDateFromInput = (inputValue: string): string => {
  // Los inputs de tipo "date" ya devuelven formato YYYY-MM-DD
  return inputValue
}
