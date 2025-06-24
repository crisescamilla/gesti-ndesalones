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
  const selectedDate = new Date(year, month - 1, day)
  selectedDate.setHours(0, 0, 0, 0) // ✅ Agregar esto para consistencia

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
  const checkDate = new Date(year, month - 1, day)
  checkDate.setHours(0, 0, 0, 0) // ✅ Agregar esto para consistencia

  return checkDate < today
}

// Función para verificar si un horario es pasado
export const isPastTime = (date: string, time: string): boolean => {
  const now = new Date()
  const [year, month, day] = date.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)

  const dateTime = new Date(year, month - 1, day, hours, minutes)

  return dateTime < now
}

// ✅ FUNCIÓN CORREGIDA PARA OBTENER LA FECHA ACTUAL SIN PROBLEMAS DE ZONA HORARIA
export const getTodayString = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = (today.getMonth() + 1).toString().padStart(2, "0")
  const day = today.getDate().toString().padStart(2, "0")

  return `${year}-${month}-${day}`
}

// Función para crear una fecha desde string sin problemas de zona horaria
export const createDateFromString = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date
}

// Función para comparar fechas sin considerar la hora
export const isSameDate = (date1: string, date2: string): boolean => {
  return date1 === date2
}

// Función para obtener la fecha de mañana en formato string
export const getTomorrowString = (): string => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const year = tomorrow.getFullYear()
  const month = (tomorrow.getMonth() + 1).toString().padStart(2, "0")
  const day = tomorrow.getDate().toString().padStart(2, "0")

  return `${year}-${month}-${day}`
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
  console.log(`🗓️ ${label}:`, {
    input: dateString,
    parsed: createDateFromString(dateString),
    dayOfWeek: getDayOfWeekSpanish(dateString),
    formatted: formatDateSpanish(dateString),
    isToday: isSameDate(dateString, getTodayString()),
    isPast: isPastDate(dateString),
    isAvailable: isDateAvailable(dateString),
    isValid: isValidDateString(dateString),
  })
}

// ✅ Función para generar horarios disponibles
export const generateTimeSlots = (
  startTime = "09:00",
  endTime = "19:00",
  intervalMinutes = 30,
  lunchBreak?: { start: string; end: string },
): string[] => {
  const slots: string[] = []

  const [startHour, startMin] = startTime.split(":").map(Number)
  const [endHour, endMin] = endTime.split(":").map(Number)

  let currentTime = startHour * 60 + startMin // Convertir a minutos
  const endTimeMinutes = endHour * 60 + endMin

  // Convertir lunch break a minutos si existe
  let lunchStart = 0
  let lunchEnd = 0
  if (lunchBreak) {
    const [lunchStartHour, lunchStartMin] = lunchBreak.start.split(":").map(Number)
    const [lunchEndHour, lunchEndMin] = lunchBreak.end.split(":").map(Number)
    lunchStart = lunchStartHour * 60 + lunchStartMin
    lunchEnd = lunchEndHour * 60 + lunchEndMin
  }

  while (currentTime < endTimeMinutes) {
    // Saltar horario de almuerzo si está definido
    if (lunchBreak && currentTime >= lunchStart && currentTime < lunchEnd) {
      currentTime = lunchEnd
      continue
    }

    const hours = Math.floor(currentTime / 60)
    const minutes = currentTime % 60
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

    slots.push(timeString)
    currentTime += intervalMinutes
  }

  return slots
}

// ✅ Función para obtener horarios disponibles considerando citas existentes
export const getAvailableTimeSlots = (
  date: string,
  staffId: string,
  appointments: any[],
  serviceDuration = 60,
): string[] => {
  const businessHours = getBusinessHours()

  // Generar todos los horarios posibles
  let allSlots = generateTimeSlots(
    businessHours.start,
    businessHours.end,
    30, // Intervalos de 30 minutos
    businessHours.lunchBreak,
  )

  // Filtrar horarios pasados si es hoy
  allSlots = filterPastTimeSlots(date, allSlots)

  // Filtrar horarios ya reservados
  allSlots = filterBookedTimeSlots(date, allSlots, appointments, staffId)

  return allSlots
}

// ✅ Función para validar si una cita puede ser programada
export const canScheduleAppointment = (
  date: string,
  time: string,
  staffId: string,
  appointments: any[],
  excludeAppointmentId?: string,
): { canSchedule: boolean; reason?: string } => {
  // Validar formato de fecha
  if (!isValidDateString(date)) {
    return { canSchedule: false, reason: "Formato de fecha inválido" }
  }

  // Validar que no sea una fecha pasada
  if (isPastDate(date)) {
    return { canSchedule: false, reason: "No se pueden programar citas en fechas pasadas" }
  }

  // Validar que sea un día disponible
  if (!isDateAvailable(date)) {
    return { canSchedule: false, reason: "Fecha no disponible (domingo o día no laborable)" }
  }

  // Validar que no sea un horario pasado si es hoy
  if (isPastTime(date, time)) {
    return { canSchedule: false, reason: "No se pueden programar citas en horarios pasados" }
  }

  // Validar que el horario no esté ocupado
  const isBooked = appointments.some(
    (apt) =>
      apt.date === date &&
      apt.time === time &&
      apt.staffId === staffId &&
      apt.status !== "cancelled" &&
      apt.id !== excludeAppointmentId, // Excluir la cita que se está editando
  )

  if (isBooked) {
    return { canSchedule: false, reason: "Horario ya ocupado" }
  }

  return { canSchedule: true }
}
