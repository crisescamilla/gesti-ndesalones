import { getAppointments, getClients } from "./storage"
import { getActiveServices } from "./servicesManager"
import { getStaffData } from "./staffDataManager"
import type { Appointment, Client, Service, StaffMember } from "../types"

export interface AppointmentDebugInfo {
  appointment: Appointment
  client: Client | null
  services: Service[]
  staff: StaffMember | null
  issues: string[]
}

export const debugAppointments = (): AppointmentDebugInfo[] => {
  console.log("🔍 === APPOINTMENT DEBUG SESSION ===")

  const appointments = getAppointments()
  const clients = getClients()
  const services = getActiveServices()
  const staffMembers = getStaffData()

  console.log("📊 Data loaded:", {
    appointments: appointments.length,
    clients: clients.length,
    services: services.length,
    staff: staffMembers.length,
  })

  console.log(
    "👥 Available staff IDs:",
    staffMembers.map((s) => ({ id: s.id, name: s.name })),
  )

  const debugResults: AppointmentDebugInfo[] = appointments.map((appointment) => {
    const client = clients.find((c) => c.id === appointment.clientId) || null
    const appointmentServices = services.filter((s) => appointment.serviceIds.includes(s.id))
    const staff = staffMembers.find((s) => s.id === appointment.staffId) || null

    const issues: string[] = []

    // Verificar problemas
    if (!client) {
      issues.push(`Cliente no encontrado (ID: ${appointment.clientId})`)
    }

    if (appointmentServices.length === 0) {
      issues.push(`Servicios no encontrados (IDs: ${appointment.serviceIds.join(", ")})`)
    }

    if (appointment.staffId && !staff) {
      issues.push(`Especialista no encontrado (ID: ${appointment.staffId})`)
    }

    if (!appointment.staffId) {
      issues.push("Sin especialista asignado")
    }

    // Log detallado para cada cita
    console.log(`📝 Appointment ${appointment.id}:`, {
      clientId: appointment.clientId,
      clientFound: !!client,
      clientName: client?.fullName,
      staffId: appointment.staffId,
      staffFound: !!staff,
      staffName: staff?.name,
      serviceIds: appointment.serviceIds,
      servicesFound: appointmentServices.length,
      issues: issues.length,
    })

    return {
      appointment,
      client,
      services: appointmentServices,
      staff,
      issues,
    }
  })

  console.log("🔍 === DEBUG SUMMARY ===")
  console.log("Total appointments:", debugResults.length)
  console.log("Appointments with issues:", debugResults.filter((r) => r.issues.length > 0).length)
  console.log("Appointments missing staff:", debugResults.filter((r) => !r.staff && r.appointment.staffId).length)
  console.log("Appointments without staff assigned:", debugResults.filter((r) => !r.appointment.staffId).length)

  return debugResults
}

export const repairStaffAssignments = (): number => {
  console.log("🔧 Reparando asignaciones de especialistas...")

  const appointments = getAppointments()
  const staffMembers = getStaffData()
  let repairedCount = 0

  const repairedAppointments = appointments.map((appointment) => {
    // Si no tiene staffId o el staff no existe
    if (!appointment.staffId || !staffMembers.find((s) => s.id === appointment.staffId)) {
      // Asignar el primer especialista disponible como fallback
      if (staffMembers.length > 0) {
        const newStaffId = staffMembers[0].id
        console.log(`🔧 Reparando appointment ${appointment.id}: asignando staff ${newStaffId}`)
        repairedCount++
        return { ...appointment, staffId: newStaffId }
      }
    }
    return appointment
  })

  if (repairedCount > 0) {
    localStorage.setItem("appointments", JSON.stringify(repairedAppointments))
    console.log(`✅ Reparadas ${repairedCount} asignaciones de especialistas`)
  }

  return repairedCount
}

export const findAppointmentsWithStaffIssues = (): AppointmentDebugInfo[] => {
  const debugResults = debugAppointments()
  return debugResults.filter((result) =>
    result.issues.some(
      (issue) => issue.includes("Especialista no encontrado") || issue.includes("Sin especialista asignado"),
    ),
  )
}

export const debugSpecificAppointment = (appointmentId: string): AppointmentDebugInfo | null => {
  const appointments = getAppointments()
  const clients = getClients()
  const services = getActiveServices()
  const staffMembers = getStaffData()

  const appointment = appointments.find((a) => a.id === appointmentId)
  if (!appointment) {
    console.warn(`❌ Cita no encontrada (ID: ${appointmentId})`)
    return null
  }

  const client = clients.find((c) => c.id === appointment.clientId) || null
  const appointmentServices = services.filter((s) => appointment.serviceIds.includes(s.id))
  const staff = staffMembers.find((s) => s.id === appointment.staffId) || null

  const issues: string[] = []

  if (!client) issues.push(`Cliente no encontrado (ID: ${appointment.clientId})`)
  if (appointmentServices.length === 0)
    issues.push(`Servicios no encontrados (IDs: ${appointment.serviceIds.join(", ")})`)
  if (appointment.staffId && !staff) issues.push(`Especialista no encontrado (ID: ${appointment.staffId})`)
  if (!appointment.staffId) issues.push("Sin especialista asignado")

  const debugInfo: AppointmentDebugInfo = {
    appointment,
    client,
    services: appointmentServices,
    staff,
    issues,
  }

  console.log("🔍 Resultado debug individual:", debugInfo)
  return debugInfo
}

// ✅ Hacer funciones disponibles globalmente para debugging desde consola
if (typeof window !== "undefined") {
  const w = window as any
  w.debugAppointments = debugAppointments
  w.repairStaffAssignments = repairStaffAssignments
  w.findAppointmentsWithStaffIssues = findAppointmentsWithStaffIssues
  w.debugSpecificAppointment = debugSpecificAppointment
}
