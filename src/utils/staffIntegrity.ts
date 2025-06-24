// ✅ Actualizar las importaciones en staffIntegrity.ts
import type { StaffMember, Appointment } from "../types"
import { getAppointments, saveAppointment } from "./storage"
import { emitEvent, AppEvents } from "./eventManager" // ✅ Importación correcta
import { getCurrentTenant } from "./tenantManager"

const STORAGE_KEY = "beauty-salon-staff-integrity-log"

// Get tenant-specific storage key
const getTenantStorageKey = (key: string): string => {
  const tenant = getCurrentTenant()
  if (tenant) {
    return `tenant-${tenant.id}-${key}`
  }
  return key
}

// Interface for integrity operations log
interface IntegrityOperation {
  id: string
  type: "staff_deleted" | "staff_updated" | "appointments_reassigned" | "appointments_cancelled"
  staffId: string
  staffName: string
  affectedAppointments: string[]
  timestamp: string
  details: any
}

// Log integrity operations for audit
const logIntegrityOperation = (operation: IntegrityOperation): void => {
  const log = getIntegrityLog()
  log.push(operation)

  // Keep only last 100 operations
  if (log.length > 100) {
    log.splice(0, log.length - 100)
  }

  localStorage.setItem(getTenantStorageKey(STORAGE_KEY), JSON.stringify(log))
}

// Get integrity operations log
export const getIntegrityLog = (): IntegrityOperation[] => {
  const stored = localStorage.getItem(getTenantStorageKey(STORAGE_KEY))
  return stored ? JSON.parse(stored) : []
}

// Get future appointments for a staff member
export const getFutureAppointmentsForStaff = (staffId: string): Appointment[] => {
  const appointments = getAppointments()
  const now = new Date()

  return appointments.filter(
    (apt) =>
      apt.staffId === staffId &&
      apt.status !== "cancelled" &&
      apt.status !== "completed" &&
      new Date(`${apt.date}T${apt.time}`) > now,
  )
}

// Get all appointments for a staff member (past and future)
export const getAllAppointmentsForStaff = (staffId: string): Appointment[] => {
  const appointments = getAppointments()
  return appointments.filter((apt) => apt.staffId === staffId)
}

// Reassign appointments to another staff member
export const reassignAppointments = (
  appointmentIds: string[],
  newStaffId: string,
  reason = "Reasignación automática",
): boolean => {
  try {
    const appointments = getAppointments()
    let reassignedCount = 0

    appointmentIds.forEach((appointmentId) => {
      const appointment = appointments.find((apt) => apt.id === appointmentId)
      if (appointment) {
        const oldStaffId = appointment.staffId
        appointment.staffId = newStaffId

        // Add status change to history
        if (!appointment.statusHistory) {
          appointment.statusHistory = []
        }

        appointment.statusHistory.push({
          id: Date.now().toString() + Math.random(),
          previousStatus: appointment.status,
          newStatus: appointment.status,
          changedBy: "Sistema",
          changedAt: new Date().toISOString(),
          reason: `${reason} - Empleado anterior: ${oldStaffId}, Nuevo empleado: ${newStaffId}`,
        })

        saveAppointment(appointment)
        reassignedCount++

        // ✅ Emit event for real-time updates
        emitEvent(AppEvents.APPOINTMENT_UPDATED, {
          appointment,
          isStaffReassignment: true,
          oldStaffId,
          newStaffId,
          reason,
        })
      }
    })

    return reassignedCount > 0
  } catch (error) {
    console.error("Error reassigning appointments:", error)
    return false
  }
}

// Cancel appointments when staff is deleted
export const cancelAppointmentsForDeletedStaff = (
  appointmentIds: string[],
  staffName: string,
  reason = "Empleado eliminado del sistema",
): boolean => {
  try {
    let cancelledCount = 0

    appointmentIds.forEach((appointmentId) => {
      const appointments = getAppointments()
      const appointment = appointments.find((apt) => apt.id === appointmentId)

      if (appointment && appointment.status !== "cancelled" && appointment.status !== "completed") {
        appointment.status = "cancelled"

        // Add status change to history
        if (!appointment.statusHistory) {
          appointment.statusHistory = []
        }

        appointment.statusHistory.push({
          id: Date.now().toString() + Math.random(),
          previousStatus: appointment.status === "cancelled" ? "confirmed" : appointment.status,
          newStatus: "cancelled",
          changedBy: "Sistema",
          changedAt: new Date().toISOString(),
          reason: `${reason} - Empleado: ${staffName}`,
        })

        appointment.notes =
          (appointment.notes || "") +
          `\n[SISTEMA] Cita cancelada automáticamente - Empleado ${staffName} eliminado del sistema.`

        saveAppointment(appointment)
        cancelledCount++

        // ✅ Emit event for real-time updates
        emitEvent(AppEvents.APPOINTMENT_UPDATED, {
          appointment,
          isAutoCancellation: true,
          reason: `Empleado ${staffName} eliminado`,
          staffName,
        })
      }
    })

    return cancelledCount > 0
  } catch (error) {
    console.error("Error cancelling appointments:", error)
    return false
  }
}

// Handle staff deletion with integrity checks
export const handleStaffDeletion = (
  staff: StaffMember,
  action: "cancel" | "reassign" = "cancel",
  newStaffId?: string,
): {
  success: boolean
  affectedAppointments: number
  futureAppointments: number
  message: string
} => {
  try {
    const allAppointments = getAllAppointmentsForStaff(staff.id)
    const futureAppointments = getFutureAppointmentsForStaff(staff.id)

    if (futureAppointments.length === 0) {
      // No future appointments, safe to delete
      logIntegrityOperation({
        id: Date.now().toString(),
        type: "staff_deleted",
        staffId: staff.id,
        staffName: staff.name,
        affectedAppointments: [],
        timestamp: new Date().toISOString(),
        details: { action: "no_future_appointments" },
      })

      // ✅ Emit staff deletion event
      emitEvent(AppEvents.STAFF_DELETED, {
        staff,
        affectedAppointments: allAppointments.length,
        futureAppointments: 0,
      })

      return {
        success: true,
        affectedAppointments: allAppointments.length,
        futureAppointments: 0,
        message: `Empleado eliminado. No hay citas futuras afectadas.`,
      }
    }

    const futureAppointmentIds = futureAppointments.map((apt) => apt.id)

    if (action === "reassign" && newStaffId) {
      // Reassign future appointments to another staff member
      const reassigned = reassignAppointments(
        futureAppointmentIds,
        newStaffId,
        `Empleado ${staff.name} eliminado del sistema`,
      )

      if (reassigned) {
        logIntegrityOperation({
          id: Date.now().toString(),
          type: "appointments_reassigned",
          staffId: staff.id,
          staffName: staff.name,
          affectedAppointments: futureAppointmentIds,
          timestamp: new Date().toISOString(),
          details: { newStaffId, action: "reassign" },
        })

        // ✅ Emit staff deletion event
        emitEvent(AppEvents.STAFF_DELETED, {
          staff,
          affectedAppointments: allAppointments.length,
          futureAppointments: futureAppointments.length,
          action: "reassign",
          newStaffId,
        })

        return {
          success: true,
          affectedAppointments: allAppointments.length,
          futureAppointments: futureAppointments.length,
          message: `Empleado eliminado. ${futureAppointments.length} citas futuras reasignadas.`,
        }
      }
    } else {
      // Cancel future appointments
      const cancelled = cancelAppointmentsForDeletedStaff(
        futureAppointmentIds,
        staff.name,
        "Empleado eliminado del sistema",
      )

      if (cancelled) {
        logIntegrityOperation({
          id: Date.now().toString(),
          type: "appointments_cancelled",
          staffId: staff.id,
          staffName: staff.name,
          affectedAppointments: futureAppointmentIds,
          timestamp: new Date().toISOString(),
          details: { action: "cancel" },
        })

        // ✅ Emit staff deletion event
        emitEvent(AppEvents.STAFF_DELETED, {
          staff,
          affectedAppointments: allAppointments.length,
          futureAppointments: futureAppointments.length,
          action: "cancel",
        })

        return {
          success: true,
          affectedAppointments: allAppointments.length,
          futureAppointments: futureAppointments.length,
          message: `Empleado eliminado. ${futureAppointments.length} citas futuras canceladas.`,
        }
      }
    }

    return {
      success: false,
      affectedAppointments: allAppointments.length,
      futureAppointments: futureAppointments.length,
      message: "Error al procesar las citas del empleado eliminado.",
    }
  } catch (error) {
    console.error("Error handling staff deletion:", error)
    return {
      success: false,
      affectedAppointments: 0,
      futureAppointments: 0,
      message: "Error del sistema al eliminar empleado.",
    }
  }
}

// Handle staff updates with appointment synchronization
export const handleStaffUpdate = (
  oldStaff: StaffMember,
  newStaff: StaffMember,
): {
  success: boolean
  affectedAppointments: number
  message: string
} => {
  try {
    const appointments = getAllAppointmentsForStaff(oldStaff.id)

    // Check if staff became inactive
    if (oldStaff.isActive && !newStaff.isActive) {
      const futureAppointments = getFutureAppointmentsForStaff(oldStaff.id)

      if (futureAppointments.length > 0) {
        // Cancel future appointments for inactive staff
        const futureAppointmentIds = futureAppointments.map((apt) => apt.id)
        const cancelled = cancelAppointmentsForDeletedStaff(futureAppointmentIds, newStaff.name, "Empleado desactivado")

        if (cancelled) {
          logIntegrityOperation({
            id: Date.now().toString(),
            type: "appointments_cancelled",
            staffId: newStaff.id,
            staffName: newStaff.name,
            affectedAppointments: futureAppointmentIds,
            timestamp: new Date().toISOString(),
            details: { action: "staff_deactivated" },
          })

          // ✅ Emit staff deactivation event
          emitEvent(AppEvents.STAFF_DEACTIVATED, {
            oldStaff,
            newStaff,
            cancelledAppointments: futureAppointments.length,
          })

          return {
            success: true,
            affectedAppointments: futureAppointments.length,
            message: `Empleado desactivado. ${futureAppointments.length} citas futuras canceladas.`,
          }
        }
      }
    }

    // Check if staff became active
    if (!oldStaff.isActive && newStaff.isActive) {
      // ✅ Emit staff activation event
      emitEvent(AppEvents.STAFF_ACTIVATED, {
        oldStaff,
        newStaff,
      })
    }

    // Log the update
    logIntegrityOperation({
      id: Date.now().toString(),
      type: "staff_updated",
      staffId: newStaff.id,
      staffName: newStaff.name,
      affectedAppointments: appointments.map((apt) => apt.id),
      timestamp: new Date().toISOString(),
      details: {
        changes: {
          name: oldStaff.name !== newStaff.name,
          isActive: oldStaff.isActive !== newStaff.isActive,
          specialties: JSON.stringify(oldStaff.specialties) !== JSON.stringify(newStaff.specialties),
        },
      },
    })

    // ✅ Emit event for real-time updates in appointment views
    emitEvent(AppEvents.STAFF_UPDATED, {
      staffUpdate: true,
      oldStaff,
      newStaff,
      affectedAppointments: appointments.length,
    })

    return {
      success: true,
      affectedAppointments: appointments.length,
      message: `Empleado actualizado. ${appointments.length} citas sincronizadas.`,
    }
  } catch (error) {
    console.error("Error handling staff update:", error)
    return {
      success: false,
      affectedAppointments: 0,
      message: "Error del sistema al actualizar empleado.",
    }
  }
}

// Validate staff availability for appointments
export const validateStaffAvailability = (
  staffId: string,
): {
  isAvailable: boolean
  reason?: string
} => {
  // This would be called before showing staff in booking forms
  // Implementation depends on your staff data structure
  return {
    isAvailable: true,
  }
}

// Get available staff for booking (excludes inactive staff)
export const getAvailableStaffForBooking = (staffMembers: StaffMember[]): StaffMember[] => {
  return staffMembers.filter((staff) => staff.isActive)
}

// Check for orphaned appointments (appointments with deleted staff)
export const findOrphanedAppointments = (staffMembers: StaffMember[]): Appointment[] => {
  const appointments = getAppointments()
  const activeStaffIds = staffMembers.filter((s) => s.isActive).map((s) => s.id)

  return appointments.filter(
    (apt) =>
      apt.staffId && !activeStaffIds.includes(apt.staffId) && apt.status !== "cancelled" && apt.status !== "completed",
  )
}

// Clean up orphaned appointments
export const cleanupOrphanedAppointments = (staffMembers: StaffMember[]): number => {
  const orphanedAppointments = findOrphanedAppointments(staffMembers)

  orphanedAppointments.forEach((appointment) => {
    appointment.status = "cancelled"
    appointment.notes =
      (appointment.notes || "") + "\n[SISTEMA] Cita cancelada automáticamente - Empleado no disponible."

    if (!appointment.statusHistory) {
      appointment.statusHistory = []
    }

    appointment.statusHistory.push({
      id: Date.now().toString() + Math.random(),
      previousStatus: "confirmed",
      newStatus: "cancelled",
      changedBy: "Sistema",
      changedAt: new Date().toISOString(),
      reason: "Limpieza automática - Empleado no disponible",
    })

    saveAppointment(appointment)

    // ✅ Emit event for orphaned appointment cleanup
    emitEvent(AppEvents.APPOINTMENT_UPDATED, {
      appointment,
      isOrphanedCleanup: true,
      reason: "Empleado no disponible",
    })
  })

  return orphanedAppointments.length
}
