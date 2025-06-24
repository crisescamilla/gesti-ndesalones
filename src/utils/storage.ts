// ✅ Storage con aislamiento completo por tenant
import { emitEvent, AppEvents } from "./eventManager"
import type { Appointment, Client } from "../types"
import { getCurrentTenant } from "./tenantManager"

// Get tenant-specific storage key
const getTenantStorageKey = (key: string): string => {
  const tenant = getCurrentTenant()
  if (tenant) {
    return `tenant-${tenant.id}-${key}`
  }
  return key // Fallback to legacy key for backward compatibility
}

// Función para validar el formato de fecha (YYYY-MM-DD)
const isValidDateString = (dateString: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString)
}

// ✅ FUNCIONES CORREGIDAS CON AISLAMIENTO POR TENANT

export const saveAppointment = (appointment: Appointment): void => {
  try {
    // ✅ Validar formato de fecha antes de guardar
    if (!isValidDateString(appointment.date)) {
      console.error("❌ Invalid date format:", appointment.date)
      throw new Error(`Formato de fecha inválido: ${appointment.date}`)
    }

    const tenant = getCurrentTenant()
    console.log("💾 Saving appointment to storage for tenant:", tenant?.name, {
      id: appointment.id,
      date: appointment.date,
      time: appointment.time,
      clientId: appointment.clientId,
      staffId: appointment.staffId,
    })

    const appointments = getAppointments()
    const existingIndex = appointments.findIndex((apt) => apt.id === appointment.id)

    if (existingIndex >= 0) {
      // Actualizar cita existente
      console.log("🔄 Updating existing appointment:", appointment.id)
      appointments[existingIndex] = appointment
      localStorage.setItem(getTenantStorageKey("appointments"), JSON.stringify(appointments))

      // ✅ Emitir evento de actualización
      emitEvent(AppEvents.APPOINTMENT_UPDATED, {
        appointment,
        isStatusUpdate: true,
        timestamp: new Date().toISOString(),
        tenantId: tenant?.id
      })

      console.log("📝 Appointment updated:", appointment.id)
    } else {
      // Crear nueva cita
      console.log("✨ Creating new appointment:", appointment.id)
      appointments.push(appointment)
      localStorage.setItem(getTenantStorageKey("appointments"), JSON.stringify(appointments))

      // ✅ Emitir evento de creación
      emitEvent(AppEvents.APPOINTMENT_CREATED, {
        appointment,
        timestamp: new Date().toISOString(),
        tenantId: tenant?.id
      })

      console.log("✅ New appointment created:", appointment.id)
    }

    // ✅ Verificar que se guardó correctamente
    const savedAppointments = getAppointments()
    const savedAppointment = savedAppointments.find((apt) => apt.id === appointment.id)
    console.log("✅ Verification - Saved appointment:", savedAppointment)
  } catch (error) {
    console.error("Error saving appointment:", error)
    throw error
  }
}

export const deleteAppointment = (appointmentId: string): void => {
  try {
    const tenant = getCurrentTenant()
    const appointments = getAppointments()
    const appointmentToDelete = appointments.find((apt) => apt.id === appointmentId)

    if (appointmentToDelete) {
      const filteredAppointments = appointments.filter((apt) => apt.id !== appointmentId)
      localStorage.setItem(getTenantStorageKey("appointments"), JSON.stringify(filteredAppointments))

      // ✅ Emitir evento de eliminación
      emitEvent(AppEvents.APPOINTMENT_DELETED, {
        appointment: appointmentToDelete,
        timestamp: new Date().toISOString(),
        tenantId: tenant?.id
      })

      console.log("🗑️ Appointment deleted for tenant:", tenant?.name, appointmentId)
    }
  } catch (error) {
    console.error("Error deleting appointment:", error)
    throw error
  }
}

export const getAppointments = (): Appointment[] => {
  try {
    const tenant = getCurrentTenant()
    const stored = localStorage.getItem(getTenantStorageKey("appointments"))
    const appointments = stored ? JSON.parse(stored) : []
    
    console.log(`📊 Loading appointments for tenant: ${tenant?.name || 'default'} - Count: ${appointments.length}`)
    return appointments
  } catch (error) {
    console.error("Error loading appointments:", error)
    return []
  }
}

export const getClients = (): Client[] => {
  try {
    const tenant = getCurrentTenant()
    const stored = localStorage.getItem(getTenantStorageKey("clients"))
    const clients = stored ? JSON.parse(stored) : []
    
    console.log(`👥 Loading clients for tenant: ${tenant?.name || 'default'} - Count: ${clients.length}`)
    return clients
  } catch (error) {
    console.error("Error loading clients:", error)
    return []
  }
}

export const saveClient = (client: Client): void => {
  try {
    const tenant = getCurrentTenant()
    const clients = getClients()
    const existingIndex = clients.findIndex((c) => c.id === client.id)

    if (existingIndex >= 0) {
      // Actualizar cliente existente
      clients[existingIndex] = client
      localStorage.setItem(getTenantStorageKey("clients"), JSON.stringify(clients))

      // ✅ Emitir evento de actualización
      emitEvent(AppEvents.CLIENT_UPDATED, {
        client,
        timestamp: new Date().toISOString(),
        tenantId: tenant?.id
      })

      console.log("📝 Client updated for tenant:", tenant?.name, client.id)
    } else {
      // Crear nuevo cliente
      clients.push(client)
      localStorage.setItem(getTenantStorageKey("clients"), JSON.stringify(clients))

      // ✅ Emitir evento de creación
      emitEvent(AppEvents.CLIENT_CREATED, {
        client,
        timestamp: new Date().toISOString(),
        tenantId: tenant?.id
      })

      console.log("✅ New client created for tenant:", tenant?.name, client.id)
    }
  } catch (error) {
    console.error("Error saving client:", error)
    throw error
  }
}

export const deleteClient = (clientId: string): void => {
  try {
    const tenant = getCurrentTenant()
    const clients = getClients()
    const clientToDelete = clients.find((c) => c.id === clientId)

    if (clientToDelete) {
      const filteredClients = clients.filter((c) => c.id !== clientId)
      localStorage.setItem(getTenantStorageKey("clients"), JSON.stringify(filteredClients))

      // ✅ Emitir evento de eliminación
      emitEvent(AppEvents.CLIENT_DELETED, {
        client: clientToDelete,
        timestamp: new Date().toISOString(),
        tenantId: tenant?.id
      })

      console.log("🗑️ Client deleted for tenant:", tenant?.name, clientId)
    }
  } catch (error) {
    console.error("Error deleting client:", error)
    throw error
  }
}

// ✅ Funciones adicionales con aislamiento por tenant

export const getAvailableTimeSlots = (date: string, staffId: string, serviceDuration: number): string[] => {
  try {
    const appointments = getAppointments() // Ya usa el tenant correcto
    const staffAppointments = appointments.filter(
      (apt) => apt.date === date && apt.staffId === staffId && apt.status !== "cancelled",
    )

    // Horarios disponibles (ejemplo: 9:00 AM a 6:00 PM)
    const workingHours = {
      start: 9, // 9:00 AM
      end: 18, // 6:00 PM
      interval: 30, // 30 minutos entre citas
    }

    const availableSlots: string[] = []

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += workingHours.interval) {
        const timeSlot = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`

        // Verificar si el slot está ocupado
        const isOccupied = staffAppointments.some((apt) => {
          const appointmentTime = apt.time
          const appointmentStart = new Date(`${date}T${appointmentTime}`)
          const appointmentEnd = new Date(appointmentStart.getTime() + serviceDuration * 60000)
          const slotStart = new Date(`${date}T${timeSlot}`)
          const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000)

          return slotStart < appointmentEnd && slotEnd > appointmentStart
        })

        if (!isOccupied) {
          availableSlots.push(timeSlot)
        }
      }
    }

    return availableSlots
  } catch (error) {
    console.error("Error getting available time slots:", error)
    return []
  }
}

export const getAppointmentById = (appointmentId: string): Appointment | null => {
  try {
    const appointments = getAppointments()
    return appointments.find((apt) => apt.id === appointmentId) || null
  } catch (error) {
    console.error("Error getting appointment by ID:", error)
    return null
  }
}

export const getClientById = (clientId: string): Client | null => {
  try {
    const clients = getClients()
    return clients.find((client) => client.id === clientId) || null
  } catch (error) {
    console.error("Error getting client by ID:", error)
    return null
  }
}

export const getAppointmentsByDate = (date: string): Appointment[] => {
  try {
    const appointments = getAppointments()
    return appointments.filter((apt) => apt.date === date)
  } catch (error) {
    console.error("Error getting appointments by date:", error)
    return []
  }
}

export const getAppointmentsByStaff = (staffId: string): Appointment[] => {
  try {
    const appointments = getAppointments()
    return appointments.filter((apt) => apt.staffId === staffId)
  } catch (error) {
    console.error("Error getting appointments by staff:", error)
    return []
  }
}

export const getAppointmentsByClient = (clientId: string): Appointment[] => {
  try {
    const appointments = getAppointments()
    return appointments.filter((apt) => apt.clientId === clientId)
  } catch (error) {
    console.error("Error getting appointments by client:", error)
    return []
  }
}

export const getAppointmentsByStatus = (status: Appointment["status"]): Appointment[] => {
  try {
    const appointments = getAppointments()
    return appointments.filter((apt) => apt.status === status)
  } catch (error) {
    console.error("Error getting appointments by status:", error)
    return []
  }
}

// ✅ Función para validar disponibilidad de cita
export const isTimeSlotAvailable = (
  date: string,
  time: string,
  staffId: string,
  duration: number,
  excludeAppointmentId?: string,
): boolean => {
  try {
    const appointments = getAppointments()
    const staffAppointments = appointments.filter(
      (apt) =>
        apt.date === date && apt.staffId === staffId && apt.status !== "cancelled" && apt.id !== excludeAppointmentId,
    )

    const newStart = new Date(`${date}T${time}`)
    const newEnd = new Date(newStart.getTime() + duration * 60000)

    return !staffAppointments.some((apt) => {
      const existingStart = new Date(`${apt.date}T${apt.time}`)
      // Asumir duración de 60 minutos si no está especificada
      const existingEnd = new Date(existingStart.getTime() + 60 * 60000)

      return newStart < existingEnd && newEnd > existingStart
    })
  } catch (error) {
    console.error("Error checking time slot availability:", error)
    return false
  }
}

// ✅ Función para obtener estadísticas de citas
export const getAppointmentStats = () => {
  try {
    const appointments = getAppointments()
    const today = new Date().toISOString().split("T")[0]

    return {
      total: appointments.length,
      today: appointments.filter((apt) => apt.date === today).length,
      confirmed: appointments.filter((apt) => apt.status === "confirmed").length,
      pending: appointments.filter((apt) => apt.status === "pending").length,
      completed: appointments.filter((apt) => apt.status === "completed").length,
      cancelled: appointments.filter((apt) => apt.status === "cancelled").length,
    }
  } catch (error) {
    console.error("Error getting appointment stats:", error)
    return {
      total: 0,
      today: 0,
      confirmed: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
    }
  }
}

// ✅ Función para limpiar datos antiguos
export const cleanupOldAppointments = (daysOld = 90): number => {
  try {
    const appointments = getAppointments()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const oldAppointments = appointments.filter((apt) => {
      const appointmentDate = new Date(apt.date)
      return appointmentDate < cutoffDate && apt.status === "completed"
    })

    if (oldAppointments.length > 0) {
      const remainingAppointments = appointments.filter((apt) => {
        const appointmentDate = new Date(apt.date)
        return !(appointmentDate < cutoffDate && apt.status === "completed")
      })

      localStorage.setItem(getTenantStorageKey("appointments"), JSON.stringify(remainingAppointments))
      console.log(`🧹 Cleaned up ${oldAppointments.length} old appointments for tenant:`, getCurrentTenant()?.name)
    }

    return oldAppointments.length
  } catch (error) {
    console.error("Error cleaning up old appointments:", error)
    return 0
  }
}

// ✅ Función para debugging de datos por tenant
export const debugTenantData = (): void => {
  const tenant = getCurrentTenant()
  console.log("🔍 === TENANT DATA DEBUG ===")
  console.log("Current tenant:", tenant?.name || "No tenant")
  console.log("Tenant ID:", tenant?.id || "No ID")
  
  const appointments = getAppointments()
  const clients = getClients()
  
  console.log("Data for this tenant:", {
    appointments: appointments.length,
    clients: clients.length,
    appointmentIds: appointments.map(a => a.id),
    clientIds: clients.map(c => c.id)
  })
  
  // Verificar si hay datos mezclados
  const allKeys = Object.keys(localStorage).filter(key => 
    key.includes('appointments') || key.includes('clients')
  )
  
  console.log("All storage keys related to appointments/clients:", allKeys)
  console.log("🔍 === END DEBUG ===")
}

// ✅ Hacer función disponible globalmente para debugging
if (typeof window !== "undefined") {
  const w = window as any
  w.debugTenantData = debugTenantData
}