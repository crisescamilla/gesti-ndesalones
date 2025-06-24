"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Activity,
  Bug,
  Wrench,
} from "lucide-react"
import { useTheme } from "../hooks/useTheme"
import { getClients, getAppointments, saveAppointment, deleteAppointment } from "../utils/storage"
import { getActiveServices } from "../utils/servicesManager"
import { getStaffData } from "../utils/staffDataManager"
import type { Appointment, Client, Service, StaffMember } from "../types"
import { subscribeToEvent, unsubscribeFromEvent, AppEvents, emitEvent } from "../utils/eventManager"
import AppointmentForm from "./AppointmentForm"
import { isSameDate, getTodayString, formatDateSpanish } from "../utils/dateUtils"
// ✅ IMPORTAR: Funciones de debugging
import { debugAppointments, repairStaffAssignments } from "../utils/appointmentDebugger"

const AppointmentManager: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [newAppointmentCount, setNewAppointmentCount] = useState(0)
  const [isConnected, setIsConnected] = useState(true)
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: string }>>([])
  // ✅ AGREGAR: Estado para debugging
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [debugResults, setDebugResults] = useState<any[]>([])

  const { colors } = useTheme()
  const notificationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    console.log("🔄 Configurando listeners de eventos en tiempo real...")

    const handleAppointmentCreated = (eventData: any) => {
      console.log("✅ Nueva cita detectada:", eventData)
      loadData()
      setLastUpdate(new Date())
      setNewAppointmentCount((prev) => prev + 1)
      showNotification("Nueva cita creada", "success")
    }

    const handleAppointmentUpdated = (eventData: any) => {
      console.log("🔄 Cita actualizada:", eventData)
      loadData()
      setLastUpdate(new Date())

      if (eventData.isStatusUpdate) {
        showNotification("Estado de cita actualizado", "info")
      }
    }

    const handleAppointmentDeleted = (eventData: any) => {
      console.log("🗑️ Cita eliminada:", eventData)
      loadData()
      setLastUpdate(new Date())
      showNotification("Cita eliminada", "warning")
    }

    const handleClientCreated = (eventData: any) => {
      console.log("👤 Nuevo cliente creado:", eventData)
      loadData()
      setLastUpdate(new Date())
    }

    const handleStaffUpdated = (eventData: any) => {
      console.log("👥 Staff actualizado:", eventData)
      loadData()
      setLastUpdate(new Date())
    }

    subscribeToEvent(AppEvents.APPOINTMENT_CREATED, handleAppointmentCreated)
    subscribeToEvent(AppEvents.APPOINTMENT_UPDATED, handleAppointmentUpdated)
    subscribeToEvent(AppEvents.APPOINTMENT_DELETED, handleAppointmentDeleted)
    subscribeToEvent(AppEvents.CLIENT_CREATED, handleClientCreated)
    subscribeToEvent(AppEvents.STAFF_UPDATED, handleStaffUpdated)

    return () => {
      console.log("🧹 Limpiando listeners de eventos...")
      unsubscribeFromEvent(AppEvents.APPOINTMENT_CREATED, handleAppointmentCreated)
      unsubscribeFromEvent(AppEvents.APPOINTMENT_UPDATED, handleAppointmentUpdated)
      unsubscribeFromEvent(AppEvents.APPOINTMENT_DELETED, handleAppointmentDeleted)
      unsubscribeFromEvent(AppEvents.CLIENT_CREATED, handleClientCreated)
      unsubscribeFromEvent(AppEvents.STAFF_UPDATED, handleStaffUpdated)
    }
  }, [])

  useEffect(() => {
    if (newAppointmentCount > 0) {
      const timer = setTimeout(() => {
        setNewAppointmentCount(0)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [newAppointmentCount])

  useEffect(() => {
    return () => {
      notificationTimeouts.current.forEach((timeout) => clearTimeout(timeout))
    }
  }, [])

  const loadData = () => {
    console.log("📊 Cargando datos de citas...")
    try {
      const appointmentsData = getAppointments()
      const clientsData = getClients()
      const servicesData = getActiveServices()
      const staffData = getStaffData()

      console.log("📊 Datos cargados:", {
        appointments: appointmentsData.length,
        clients: clientsData.length,
        services: servicesData.length,
        staff: staffData.length,
      })

      console.log(
        "👥 Staff IDs disponibles:",
        staffData.map((s) => ({ id: s.id, name: s.name })),
      )

      appointmentsData.forEach((apt) => {
        console.log("📝 Appointment staff assignment:", {
          appointmentId: apt.id,
          staffId: apt.staffId,
          staffFound: staffData.find((s) => s.id === apt.staffId)?.name || "NOT FOUND",
        })
      })

      setAppointments(appointmentsData)
      setClients(clientsData)
      setServices(servicesData)
      setStaffMembers(staffData)
    } catch (error) {
      console.error("Error loading data:", error)
      showNotification("Error al cargar datos", "error")
    }
  }

  const showNotification = (message: string, type: "success" | "info" | "warning" | "error") => {
    const id = Date.now().toString()
    const notification = { id, message, type }

    setNotifications((prev) => [...prev, notification])

    const timeout = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      notificationTimeouts.current.delete(id)
    }, 3000)

    notificationTimeouts.current.set(id, timeout)
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    const timeout = notificationTimeouts.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      notificationTimeouts.current.delete(id)
    }
  }

  // ✅ AGREGAR: Funciones de debugging
  const handleDebugAppointments = () => {
    console.log("🔍 Ejecutando debugging de citas...")
    const results = debugAppointments()
    setDebugResults(results)
    setShowDebugInfo(true)

    const issuesCount = results.filter((r) => r.issues.length > 0).length
    showNotification(`Debug completado: ${issuesCount} citas con problemas`, issuesCount > 0 ? "warning" : "success")
  }

  const handleRepairStaffAssignments = () => {
    console.log("🔧 Reparando asignaciones de especialistas...")
    const repairedCount = repairStaffAssignments()

    if (repairedCount > 0) {
      loadData() // Recargar datos después de reparar
      showNotification(`Reparadas ${repairedCount} asignaciones`, "success")
    } else {
      showNotification("No se encontraron problemas para reparar", "info")
    }
  }

  const filteredAppointments = appointments.filter((appointment) => {
    const client = clients.find((c) => c.id === appointment.clientId)
    const appointmentServices = services.filter((s) => appointment.serviceIds.includes(s.id))
    const staff = staffMembers.find((s) => s.id === appointment.staffId)

    const matchesSearch =
      client?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointmentServices.some((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      staff?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter
    const matchesDate = isSameDate(appointment.date, selectedDate)

    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleStatusChange = (appointmentId: string, newStatus: Appointment["status"]) => {
    try {
      const appointment = appointments.find((apt) => apt.id === appointmentId)
      if (appointment) {
        const updatedAppointment = { ...appointment, status: newStatus }
        saveAppointment(updatedAppointment)
        // Emitir evento de actualización
        emitEvent(AppEvents.APPOINTMENT_UPDATED, {
          appointment: updatedAppointment,
          oldStatus: appointment.status,
          newStatus: newStatus,
          isStatusUpdate: true,
          changedBy: "Administrador",
        })
        showNotification("Estado actualizado", "success")
      }
    } catch (error) {
      console.error("Error updating appointment status:", error)
      showNotification("Error al actualizar estado", "error")
    }
  }

  const handleDeleteAppointment = (appointmentId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta cita?")) {
      try {
        deleteAppointment(appointmentId)
        // Emitir evento de eliminación
        emitEvent(AppEvents.APPOINTMENT_DELETED, {
          appointmentId: appointmentId,
          deletedBy: "Administrador",
        })
        showNotification("Cita eliminada", "success")
      } catch (error) {
        console.error("Error deleting appointment:", error)
        showNotification("Error al eliminar cita", "error")
      }
    }
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setShowAddForm(true)
  }

  const handleFormClose = () => {
    setShowAddForm(false)
    setEditingAppointment(null)
  }

  const handleFormSave = () => {
    handleFormClose()
  }

  const handleManualRefresh = () => {
    loadData()
    setLastUpdate(new Date())
    setNewAppointmentCount(0)
    showNotification("Datos actualizados", "info")
  }

  return (
    <div className="space-y-6">
      {/* Notificaciones flotantes */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform translate-x-0 ${
              notification.type === "success"
                ? "bg-green-50 border-green-500 text-green-800"
                : notification.type === "info"
                  ? "bg-blue-50 border-blue-500 text-blue-800"
                  : notification.type === "warning"
                    ? "bg-yellow-50 border-yellow-500 text-yellow-800"
                    : "bg-red-50 border-red-500 text-red-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {notification.type === "success" && <CheckCircle className="w-5 h-5 mr-2" />}
                {notification.type === "info" && <Activity className="w-5 h-5 mr-2" />}
                {notification.type === "warning" && <AlertCircle className="w-5 h-5 mr-2" />}
                {notification.type === "error" && <XCircle className="w-5 h-5 mr-2" />}
                <span className="font-medium">{notification.message}</span>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
              Gestión de Citas
            </h1>
            {newAppointmentCount > 0 && (
              <div
                className="ml-3 px-3 py-1 rounded-full text-sm font-medium animate-pulse theme-transition"
                style={{
                  backgroundColor: `${colors?.success || "#10b981"}1a`,
                  color: colors?.success || "#10b981",
                }}
              >
                +{newAppointmentCount} nueva{newAppointmentCount !== 1 ? "s" : ""}
              </div>
            )}
            {isConnected && (
              <div className="ml-3 flex items-center">
                <div
                  className="w-2 h-2 rounded-full mr-2 animate-pulse"
                  style={{ backgroundColor: colors?.success || "#10b981" }}
                ></div>
                <span className="text-xs font-medium" style={{ color: colors?.success || "#10b981" }}>
                  EN VIVO
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center mt-1">
            <p className="theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
              Administra las citas de tu salón
            </p>
            <div className="ml-4 flex items-center text-xs">
              <Activity className="w-3 h-3 mr-1" style={{ color: colors?.textSecondary || "#6b7280" }} />
              <span style={{ color: colors?.textSecondary || "#6b7280" }}>
                Actualizado: {lastUpdate.toLocaleTimeString("es-ES")}
              </span>
            </div>
          </div>
          <div className="mt-2 text-sm" style={{ color: colors?.textSecondary || "#6b7280" }}>
            📅 Mostrando citas para: <strong>{formatDateSpanish(selectedDate)}</strong> ({selectedDate})
          </div>
          <div className="mt-1 text-xs" style={{ color: colors?.textSecondary || "#6b7280" }}>
            👥 Staff cargado: {staffMembers.length} especialistas
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* ✅ AGREGAR: Botones de debugging */}
          <button
            onClick={handleDebugAppointments}
            className="flex items-center px-3 py-2 rounded-lg transition-colors theme-transition"
            style={{
              backgroundColor: colors?.warning ? `${colors.warning}1a` : "#f59e0b1a",
              color: colors?.warning || "#f59e0b",
            }}
            title="Diagnosticar problemas"
          >
            <Bug className="w-4 h-4" />
          </button>

          <button
            onClick={handleRepairStaffAssignments}
            className="flex items-center px-3 py-2 rounded-lg transition-colors theme-transition"
            style={{
              backgroundColor: colors?.info ? `${colors.info}1a` : "#06b6d41a",
              color: colors?.info || "#06b6d4",
            }}
            title="Reparar asignaciones"
          >
            <Wrench className="w-4 h-4" />
          </button>

          <button
            onClick={handleManualRefresh}
            className="flex items-center px-3 py-2 rounded-lg transition-colors theme-transition"
            style={{
              backgroundColor: colors?.background || "#f8fafc",
              color: colors?.textSecondary || "#6b7280",
            }}
            title="Actualizar manualmente"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${colors?.primary || "#0ea5e9"}, ${colors?.secondary || "#06b6d4"})`,
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* ✅ AGREGAR: Panel de debugging */}
      {showDebugInfo && (
        <div
          className="p-4 rounded-lg border theme-transition"
          style={{
            backgroundColor: colors?.surface || "#ffffff",
            borderColor: colors?.border || "#e5e7eb",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium" style={{ color: colors?.text || "#1f2937" }}>
              🔍 Información de Debugging
            </h3>
            <button onClick={() => setShowDebugInfo(false)} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <strong>Total de citas:</strong> {debugResults.length}
            </div>
            <div>
              <strong>Citas con problemas:</strong> {debugResults.filter((r) => r.issues.length > 0).length}
            </div>
            <div>
              <strong>Citas sin especialista:</strong>{" "}
              {debugResults.filter((r) => !r.staff && r.appointment.staffId).length}
            </div>

            {debugResults.filter((r) => r.issues.length > 0).length > 0 && (
              <div className="mt-4">
                <strong>Problemas encontrados:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {debugResults
                    .filter((r) => r.issues.length > 0)
                    .map((result, index) => (
                      <li key={index} className="text-red-600">
                        Cita {result.appointment.id}: {result.issues.join(", ")}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 theme-transition"
            style={{ color: colors?.textSecondary || "#6b7280" }}
          />
          <input
            type="text"
            placeholder="Buscar citas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border theme-transition focus:ring-2 focus:ring-opacity-50"
            style={{
              backgroundColor: colors?.surface || "#ffffff",
              borderColor: colors?.border || "#e5e7eb",
              color: colors?.text || "#1f2937",
            }}
          />
        </div>

        <div className="relative">
          <Calendar
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 theme-transition"
            style={{ color: colors?.textSecondary || "#6b7280" }}
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              console.log("📅 Date changed from", selectedDate, "to", e.target.value)
              setSelectedDate(e.target.value)
            }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border theme-transition focus:ring-2 focus:ring-opacity-50"
            style={{
              backgroundColor: colors?.surface || "#ffffff",
              borderColor: colors?.border || "#e5e7eb",
              color: colors?.text || "#1f2937",
            }}
          />
        </div>

        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 theme-transition"
            style={{ color: colors?.textSecondary || "#6b7280" }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border theme-transition focus:ring-2 focus:ring-opacity-50 appearance-none"
            style={{
              backgroundColor: colors?.surface || "#ffffff",
              borderColor: colors?.border || "#e5e7eb",
              color: colors?.text || "#1f2937",
            }}
          >
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmadas</option>
            <option value="pending">Pendientes</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>

        <div
          className="flex items-center justify-center p-2 rounded-lg theme-transition"
          style={{ backgroundColor: colors?.surface || "#ffffff" }}
        >
          <span className="text-sm font-medium theme-transition" style={{ color: colors?.text || "#1f2937" }}>
            {filteredAppointments.length} citas
          </span>
        </div>
      </div>

      {/* Appointments List */}
      <div className="grid gap-4">
        {filteredAppointments.length === 0 ? (
          <div
            className="text-center py-12 rounded-lg theme-transition"
            style={{ backgroundColor: colors?.surface || "#ffffff" }}
          >
            <Calendar
              className="w-12 h-12 mx-auto mb-4 theme-transition"
              style={{ color: colors?.textSecondary || "#6b7280" }}
            />
            <h3 className="text-lg font-medium mb-2 theme-transition" style={{ color: colors?.text || "#1f2937" }}>
              No hay citas para esta fecha
            </h3>
            <p className="theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
              Selecciona otra fecha o crea una nueva cita
            </p>
            <div className="mt-4 text-sm" style={{ color: colors?.textSecondary || "#6b7280" }}>
              <p>Fecha seleccionada: {selectedDate}</p>
              <p>Total de citas en el sistema: {appointments.length}</p>
              <p>
                Fechas con citas:{" "}
                {[...new Set(appointments.map((apt) => apt.date))]
                  .sort()
                  .map((date) => `${date} (${appointments.filter((apt) => apt.date === date).length})`)
                  .join(", ")}
              </p>
            </div>
          </div>
        ) : (
          filteredAppointments.map((appointment) => {
            const client = clients.find((c) => c.id === appointment.clientId)
            const appointmentServices = services.filter((s) => appointment.serviceIds.includes(s.id))
            const staff = staffMembers.find((s) => s.id === appointment.staffId)

            console.log("🔍 Rendering appointment:", {
              appointmentId: appointment.id,
              staffId: appointment.staffId,
              staffFound: staff,
              staffName: staff?.name,
              allStaffIds: staffMembers.map((s) => s.id),
            })

            return (
              <div
                key={appointment.id}
                className="p-6 rounded-lg border theme-transition hover:shadow-md transition-all duration-200"
                style={{
                  backgroundColor: colors?.surface || "#ffffff",
                  borderColor: colors?.border || "#e5e7eb",
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Client Info */}
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <User
                          className="w-4 h-4 mr-2 theme-transition"
                          style={{ color: colors?.primary || "#0ea5e9" }}
                        />
                        <span className="font-medium theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                          {client?.fullName || "Cliente no encontrado"}
                        </span>
                      </div>
                      {client && (
                        <>
                          <div
                            className="flex items-center text-sm theme-transition"
                            style={{ color: colors?.textSecondary || "#6b7280" }}
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            {client.phone}
                          </div>
                          <div
                            className="flex items-center text-sm theme-transition"
                            style={{ color: colors?.textSecondary || "#6b7280" }}
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            {client.email}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Service & Staff */}
                    <div className="space-y-1">
                      <div className="font-medium theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                        {appointmentServices.map((s) => s.name).join(", ") || "Servicios no encontrados"}
                      </div>

                      <div className="space-y-1">
                        {staff ? (
                          <div className="flex items-center">
                            <img
                              src={staff.image || "/placeholder.svg?height=24&width=24"}
                              alt={staff.name}
                              className="w-6 h-6 rounded-full object-cover mr-2"
                            />
                            <div>
                              <div
                                className="text-sm font-medium theme-transition"
                                style={{ color: colors?.text || "#1f2937" }}
                              >
                                {staff.name}
                              </div>
                              <div
                                className="text-xs theme-transition"
                                style={{ color: colors?.textSecondary || "#6b7280" }}
                              >
                                {staff.role}
                              </div>
                            </div>
                          </div>
                        ) : appointment.staffId ? (
                          <div className="text-sm">
                            <span style={{ color: colors?.error || "#ef4444" }}>⚠ Especialista no encontrado</span>
                            <div className="text-xs" style={{ color: colors?.textSecondary || "#6b7280" }}>
                              ID: {appointment.staffId}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm" style={{ color: colors?.warning || "#f59e0b" }}>
                            Sin especialista asignado
                          </div>
                        )}
                      </div>

                      <div className="text-sm theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                        {appointmentServices.reduce((total, s) => total + s.duration, 0)} min • $
                        {appointment.totalPrice}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Clock
                          className="w-4 h-4 mr-2 theme-transition"
                          style={{ color: colors?.primary || "#0ea5e9" }}
                        />
                        <span className="font-medium theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                          {appointment.time}
                        </span>
                      </div>
                      <div className="text-sm theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                        {formatDateSpanish(appointment.date)}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        {getStatusIcon(appointment.status)}
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
                        >
                          {appointment.status === "confirmed" && "Confirmada"}
                          {appointment.status === "pending" && "Pendiente"}
                          {appointment.status === "cancelled" && "Cancelada"}
                          {appointment.status === "completed" && "Completada"}
                        </span>
                      </div>
                      {appointment.notes && (
                        <div className="text-xs theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                          {appointment.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={appointment.status}
                      onChange={(e) => handleStatusChange(appointment.id, e.target.value as Appointment["status"])}
                      className="px-3 py-1 rounded border text-sm theme-transition"
                      style={{
                        backgroundColor: colors?.surface || "#ffffff",
                        borderColor: colors?.border || "#e5e7eb",
                        color: colors?.text || "#1f2937",
                      }}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>

                    <button
                      onClick={() => handleEditAppointment(appointment)}
                      className="p-2 rounded-lg transition-colors theme-transition"
                      style={{
                        color: colors?.primary || "#0ea5e9",
                        backgroundColor: `${colors?.primary || "#0ea5e9"}0d`,
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      className="p-2 rounded-lg transition-colors theme-transition"
                      style={{
                        color: colors?.error || "#ef4444",
                        backgroundColor: `${colors?.error || "#ef4444"}0d`,
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <AppointmentForm onClose={handleFormClose} onSave={handleFormSave} editingAppointment={editingAppointment} />
      )}
    </div>
  )
}

export default AppointmentManager
