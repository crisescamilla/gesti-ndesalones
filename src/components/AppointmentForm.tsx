"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { useTheme } from "../hooks/useTheme"
import { getClients, saveClient, saveAppointment, getAppointments } from "../utils/storage"
import { getActiveServices } from "../utils/servicesManager"
import type { Appointment, Client, Service } from "../types"
import { useStaffForServices } from "../hooks/useStaffData"
import { CheckCircle } from "lucide-react"
import {
  isValidDateString,
  getTodayString,
  generateTimeSlots,
  filterPastTimeSlots,
  filterBookedTimeSlots,
} from "../utils/dateUtils"
import { getDateFromInput } from "../utils/dateHelpers"
import { debugSpecificAppointment } from "../utils/appointmentDebugger"
import { validatePhoneServerSide } from "../utils/phoneValidation"
import PhoneInput from "./PhoneInput"
import { emitEvent, AppEvents } from "../utils/eventManager"

interface AppointmentFormProps {
  onClose: () => void
  onSave: () => void
  editingAppointment?: Appointment | null
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ onClose, onSave, editingAppointment }) => {
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [phoneValidation, setPhoneValidation] = useState({ isValid: true, error: "" })

  const [formData, setFormData] = useState({
    clientId: "",
    staffId: "",
    serviceIds: [] as string[],
    date: getTodayString(),
    time: "",
    notes: "",
    status: "pending" as Appointment["status"],
  })

  const [newClient, setNewClient] = useState({
    fullName: "",
    email: "",
    phone: "",
  })

  const { colors } = useTheme()

  useEffect(() => {
    const loadData = async () => {
      const clientsData = await getClients()
      setClients(clientsData)

      const servicesData = await getActiveServices()
      setServices(servicesData)
    }

    loadData()
  }, [])

  useEffect(() => {
    if (editingAppointment) {
      setFormData({
        clientId: editingAppointment.clientId,
        staffId: editingAppointment.staffId || "",
        serviceIds: editingAppointment.serviceIds,
        date: editingAppointment.date,
        time: editingAppointment.time,
        notes: editingAppointment.notes || "",
        status: editingAppointment.status,
      })
    }
  }, [editingAppointment])

  const selectedServices = services.filter((s) => formData.serviceIds.includes(s.id))
  const requiredSpecialties = [...new Set(selectedServices.map((service) => service.category))]
  const { availableStaff, loading: staffLoading } = useStaffForServices(requiredSpecialties)

  // ✅ Función mejorada para actualizar horarios disponibles
  const updateAvailableTimeSlots = () => {
    console.log("🕐 Updating available time slots...")
    console.log("Current form data:", {
      date: formData.date,
      staffId: formData.staffId,
      serviceIds: formData.serviceIds,
    })

    // Validar que tenemos los datos necesarios
    if (!formData.date || !isValidDateString(formData.date)) {
      console.log("❌ Invalid or missing date")
      setAvailableTimeSlots([])
      return
    }

    if (formData.serviceIds.length === 0) {
      console.log("❌ No services selected")
      setAvailableTimeSlots([])
      return
    }

    try {
      // Calcular duración total de los servicios
      const selectedServices = services.filter((s) => formData.serviceIds.includes(s.id))
      const totalDuration = selectedServices.reduce((total, service) => total + service.duration, 0)

      console.log(
        "📋 Selected services:",
        selectedServices.map((s) => s.name),
      )
      console.log("⏱️ Total duration:", totalDuration, "minutes")

      // Obtener todas las citas existentes
      const allAppointments = getAppointments()
      console.log("📅 Total appointments in system:", allAppointments.length)

      // Generar horarios base (9:00 AM a 7:00 PM con descanso de almuerzo)
      let timeSlots = generateTimeSlots(
        "09:00", // Inicio
        "19:00", // Fin
        30, // Intervalos de 30 minutos
        { start: "13:00", end: "14:00" }, // Almuerzo
      )

      console.log("🕐 Generated base time slots:", timeSlots.length)

      // Filtrar horarios pasados si es hoy
      timeSlots = filterPastTimeSlots(formData.date, timeSlots)
      console.log("🕐 After filtering past times:", timeSlots.length)

      // Si hay un staff específico seleccionado, filtrar por sus citas
      if (formData.staffId) {
        timeSlots = filterBookedTimeSlots(formData.date, timeSlots, allAppointments, formData.staffId)
        console.log("👤 After filtering staff bookings:", timeSlots.length)
      } else {
        // Si no hay staff específico, mostrar horarios que al menos un staff puede cubrir
        const staffAppointments = allAppointments.filter(
          (apt) =>
            apt.date === formData.date &&
            apt.status !== "cancelled" &&
            availableStaff.some((staff) => staff.id === apt.staffId),
        )

        // Filtrar horarios que están completamente ocupados por todo el staff disponible
        timeSlots = timeSlots.filter((slot) => {
          const conflictingAppointments = staffAppointments.filter((apt) => apt.time === slot)
          return conflictingAppointments.length < availableStaff.length
        })

        console.log("👥 After filtering for available staff:", timeSlots.length)
      }

      // Excluir la cita que se está editando
      if (editingAppointment) {
        console.log("✏️ Excluding current appointment from conflicts")
      }

      console.log("✅ Final available slots:", timeSlots)
      setAvailableTimeSlots(timeSlots)
    } catch (error) {
      console.error("❌ Error updating time slots:", error)
      setAvailableTimeSlots([])
    }
  }

  // ✅ Efecto para actualizar horarios cuando cambien las dependencias
  useEffect(() => {
    console.log("🔄 Dependencies changed, updating time slots...")
    updateAvailableTimeSlots()
  }, [formData.date, formData.staffId, formData.serviceIds, services, availableStaff, editingAppointment?.id])

  const handlePhoneValidation = (isValid: boolean, error?: string) => {
    setPhoneValidation({ isValid, error: error || "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("💾 === SAVING APPOINTMENT ===")
      console.log("Form data before processing:", formData)

      if (!isValidDateString(formData.date)) {
        console.error("❌ Invalid date format:", formData.date)
        alert("Formato de fecha inválido")
        return
      }

      let clientId = formData.clientId
      let newClientCreated = null

      // Create new client if necessary
      if (!clientId && newClient.fullName) {
        // Server-side phone validation
        const phoneValidation = validatePhoneServerSide(newClient.phone)

        if (!phoneValidation.isValid) {
          alert(`Error en el teléfono: ${phoneValidation.error}`)
          return
        }

        const client: Client = {
          id: Date.now().toString(),
          fullName: newClient.fullName,
          email: newClient.email,
          phone: phoneValidation.sanitized || newClient.phone,
          createdAt: new Date().toISOString(),
        }

        saveClient(client)
        clientId = client.id
        newClientCreated = client
        console.log("✅ New client created with validated phone:", client)

        // ✅ Emit client creation event
        console.log("📡 Emitting CLIENT_CREATED event...")
        emitEvent(AppEvents.CLIENT_CREATED, {
          client,
          source: "appointment_form",
          timestamp: new Date().toISOString(),
        })
      }

      const selectedServices = services.filter((s) => formData.serviceIds.includes(s.id))
      const totalPrice = selectedServices.reduce((total, service) => total + service.price, 0)

      // Auto-assign staff if none selected
      let finalStaffId = formData.staffId

      if (!finalStaffId && availableStaff.length > 0) {
        const appointments = getAppointments()
        const staffWorkload = availableStaff.map((staff) => ({
          ...staff,
          appointmentCount: appointments.filter(
            (apt) => apt.staffId === staff.id && apt.date === formData.date && apt.status !== "cancelled",
          ).length,
        }))

        staffWorkload.sort((a, b) => a.appointmentCount - b.appointmentCount)
        finalStaffId = staffWorkload[0].id

        console.log(
          `🤖 Auto-assigned staff: ${staffWorkload[0].name} (ID: ${finalStaffId}, ${staffWorkload[0].appointmentCount} appointments)`,
        )
      }

      if (!finalStaffId) {
        console.error("❌ No staff ID assigned")
        alert("Error: No se pudo asignar un especialista")
        return
      }

      const appointmentId = editingAppointment?.id || Date.now().toString()

      const appointment: Appointment = {
        id: appointmentId,
        clientId,
        staffId: finalStaffId,
        serviceIds: formData.serviceIds,
        date: formData.date,
        time: formData.time,
        status: formData.status,
        notes: formData.notes,
        totalPrice,
        createdAt: editingAppointment?.createdAt || new Date().toISOString(),
      }

      console.log("💾 Final appointment object:", appointment)

      saveAppointment(appointment)

      // Get additional data for event
      const client = newClientCreated || clients.find((c) => c.id === clientId)
      const staff = availableStaff.find((s) => s.id === finalStaffId)
      const serviceNames = selectedServices.map((s) => s.name).join(", ")

      // ✅ Emit appointment event with proper enum
      if (editingAppointment) {
        console.log("📡 Emitting APPOINTMENT_UPDATED event...")
        emitEvent(AppEvents.APPOINTMENT_UPDATED, {
          appointment,
          previousAppointment: editingAppointment,
          client,
          staff,
          services: selectedServices,
          isStatusUpdate: false,
          changedBy: "Usuario",
          source: "appointment_form",
          timestamp: new Date().toISOString(),
        })
      } else {
        console.log("📡 Emitting APPOINTMENT_CREATED event...")
        emitEvent(AppEvents.APPOINTMENT_CREATED, {
          appointment,
          client,
          staff,
          services: selectedServices,
          source: "appointment_form",
          timestamp: new Date().toISOString(),
        })
      }

      setTimeout(() => {
        console.log("🔍 Verifying saved appointment...")
        debugSpecificAppointment(appointmentId)
      }, 100)

      onSave()
    } catch (error) {
      console.error("Error saving appointment:", error)
      alert("Error al guardar la cita")
    } finally {
      setLoading(false)
    }
  }

  // Safe color access with fallbacks
  const safeColors = {
    surface: colors?.surface || "#ffffff",
    text: colors?.text || "#1f2937",
    textSecondary: colors?.textSecondary || "#6b7280",
    background: colors?.background || "#f8fafc",
    border: colors?.border || "#e5e7eb",
    primary: colors?.primary || "#0ea5e9",
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: safeColors.surface }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold" style={{ color: safeColors.text }}>
              {editingAppointment ? "Editar Cita" : "Nueva Cita"}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: safeColors.textSecondary }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: safeColors.text }}>
                Cliente
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: safeColors.background,
                  borderColor: safeColors.border,
                  color: safeColors.text,
                }}
              >
                <option value="">Seleccionar cliente existente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName} - {client.phone}
                  </option>
                ))}
              </select>

              {!formData.clientId && (
                <div className="mt-4 p-4 border rounded-lg" style={{ borderColor: safeColors.border }}>
                  <h4 className="font-medium mb-3" style={{ color: safeColors.text }}>
                    O crear nuevo cliente
                  </h4>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={newClient.fullName}
                      onChange={(e) => setNewClient({ ...newClient, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        backgroundColor: safeColors.background,
                        borderColor: safeColors.border,
                        color: safeColors.text,
                      }}
                      required
                    />

                    {/* Enhanced Phone Input */}
                    <PhoneInput
                      value={newClient.phone}
                      onChange={(value) => setNewClient({ ...newClient, phone: value })}
                      onValidation={handlePhoneValidation}
                      placeholder="Número de teléfono"
                      required
                      showFormatHint={true}
                    />

                    <input
                      type="email"
                      placeholder="Email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        backgroundColor: safeColors.background,
                        borderColor: safeColors.border,
                        color: safeColors.text,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Servicios */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: safeColors.text }}>
                Servicios
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {services.map((service) => (
                  <label key={service.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(service.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            serviceIds: [...formData.serviceIds, service.id],
                            time: "", // Reset time when services change
                          })
                        } else {
                          setFormData({
                            ...formData,
                            serviceIds: formData.serviceIds.filter((id) => id !== service.id),
                            time: "", // Reset time when services change
                          })
                        }
                      }}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: safeColors.primary }}
                    />
                    <span className="ml-2 text-sm" style={{ color: safeColors.text }}>
                      {service.name} - ${service.price} ({service.duration}min)
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Staff Selection */}
            <div>
              <h3 className="text-lg font-medium mb-4 theme-transition" style={{ color: safeColors.text }}>
                Seleccionar Especialista
              </h3>

              {formData.serviceIds.length === 0 ? (
                <div
                  className="p-6 rounded-lg border-2 border-dashed text-center theme-transition"
                  style={{
                    borderColor: safeColors.border,
                    backgroundColor: safeColors.background,
                  }}
                >
                  <p className="theme-transition" style={{ color: safeColors.textSecondary }}>
                    Primero selecciona los servicios para ver los especialistas disponibles
                  </p>
                </div>
              ) : availableStaff.length === 0 ? (
                <div
                  className="p-6 rounded-lg border-2 text-center theme-transition"
                  style={{
                    borderColor: "#ef4444",
                    backgroundColor: "#ef444410",
                  }}
                >
                  <p className="font-medium theme-transition" style={{ color: "#ef4444" }}>
                    No hay especialistas disponibles para estos servicios
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => setFormData((prev) => ({ ...prev, staffId: "", time: "" }))}
                    className="p-4 rounded-lg border-2 cursor-pointer transition-all theme-transition"
                    style={{
                      borderColor: !formData.staffId ? safeColors.primary : safeColors.border,
                      backgroundColor: !formData.staffId ? `${safeColors.primary}0d` : safeColors.surface,
                    }}
                  >
                    <h4 className="font-medium theme-transition" style={{ color: safeColors.text }}>
                      Asignación automática
                    </h4>
                    <p className="text-sm theme-transition" style={{ color: safeColors.textSecondary }}>
                      Se asignará el especialista con menos carga
                    </p>
                  </div>

                  {availableStaff.map((staff) => {
                    const selectedServices = services.filter((s) => formData.serviceIds.includes(s.id))
                    const canPerformAll = selectedServices.every((service) =>
                      staff.specialties.includes(service.category),
                    )

                    return (
                      <div
                        key={staff.id}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            staffId: staff.id,
                            time: "", // Reset time when staff changes
                          }))
                        }}
                        className="p-4 rounded-lg border-2 cursor-pointer transition-all theme-transition"
                        style={{
                          borderColor: formData.staffId === staff.id ? safeColors.primary : safeColors.border,
                          backgroundColor:
                            formData.staffId === staff.id ? `${safeColors.primary}0d` : safeColors.surface,
                        }}
                      >
                        <div className="flex items-center mb-2">
                          <img
                            src={staff.image || "/placeholder.svg"}
                            alt={staff.name}
                            className="w-10 h-10 rounded-full object-cover mr-3"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium theme-transition" style={{ color: safeColors.text }}>
                              {staff.name}
                            </h4>
                            <p className="text-sm theme-transition" style={{ color: safeColors.textSecondary }}>
                              {staff.role}
                            </p>
                          </div>
                          {canPerformAll && (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: "#10b981" }}
                            >
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Fecha y Hora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: safeColors.text }}>
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    const selectedDate = getDateFromInput(e.target.value)
                    setFormData({ ...formData, date: selectedDate, time: "" }) // Reset time when date changes
                  }}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: safeColors.background,
                    borderColor: safeColors.border,
                    color: safeColors.text,
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: safeColors.text }}>
                  Hora
                </label>
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: safeColors.background,
                    borderColor: safeColors.border,
                    color: safeColors.text,
                  }}
                  required
                  disabled={formData.serviceIds.length === 0}
                >
                  <option value="">
                    {formData.serviceIds.length === 0
                      ? "Primero selecciona servicios"
                      : availableTimeSlots.length === 0
                        ? "No hay horarios disponibles"
                        : "Seleccionar hora"}
                  </option>
                  {availableTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>

                {/* Debug info */}
                {formData.serviceIds.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: safeColors.textSecondary }}>
                    {availableTimeSlots.length} horarios disponibles
                  </p>
                )}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: safeColors.text }}>
                Notas (opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: safeColors.background,
                  borderColor: safeColors.border,
                  color: safeColors.text,
                }}
                rows={3}
                placeholder="Notas adicionales sobre la cita..."
              />
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border rounded-lg transition-colors"
                style={{
                  color: safeColors.textSecondary,
                  borderColor: safeColors.border,
                  backgroundColor: safeColors.background,
                }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: safeColors.primary }}
                disabled={
                  loading ||
                  (!formData.clientId && (!newClient.fullName || !phoneValidation.isValid)) ||
                  formData.serviceIds.length === 0 ||
                  !formData.date ||
                  !formData.time
                }
              >
                {loading ? "Guardando..." : editingAppointment ? "Actualizar Cita" : "Crear Cita"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AppointmentForm


