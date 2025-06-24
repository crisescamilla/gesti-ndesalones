"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Activity,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  RefreshCw,
  Zap,
  CheckCircle,
  UserPlus,
  CalendarPlus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
import { useTheme } from "../hooks/useTheme"
import { getClients, getAppointments } from "../utils/storage"
// ✅ Importar el sistema de eventos real
import { subscribeToEvent, unsubscribeFromEvent, AppEvents } from "../utils/eventManager"

interface ActivityItem {
  id: string
  type:
    | "appointment_created"
    | "appointment_updated"
    | "client_registered"
    | "service_updated"
    | "staff_updated"
    | "staff_deleted"
  title: string
  description: string
  timestamp: string
  user?: string
  metadata?: any
  isNew?: boolean
}

interface WeeklySummary {
  totalAppointments: number
  totalRevenue: number
  newClients: number
  completedServices: number
  averageServiceValue: number
  growthMetrics: {
    appointments: number
    revenue: number
    clients: number
  }
}

// ✅ NUEVO: Función para crear actividad real basada en eventos del sistema
const createActivityFromEvent = (eventType: AppEvents, eventData: any): ActivityItem => {
  const timestamp = new Date().toISOString()
  const id = `${timestamp}-${Math.random()}`

  switch (eventType) {
    case AppEvents.APPOINTMENT_CREATED:
      return {
        id,
        type: "appointment_created",
        title: "Nueva cita creada",
        description: `Cita programada para ${eventData.appointment?.date || "fecha no especificada"}`,
        timestamp,
        user: "Sistema",
        metadata: eventData,
        isNew: true,
      }

    case AppEvents.APPOINTMENT_UPDATED:
      return {
        id,
        type: "appointment_updated",
        title: "Cita actualizada",
        description: eventData.isStatusUpdate ? `Estado de cita actualizado` : `Cita modificada`,
        timestamp,
        user: "Sistema",
        metadata: eventData,
        isNew: true,
      }

    case AppEvents.CLIENT_CREATED:
      return {
        id,
        type: "client_registered",
        title: "Nuevo cliente registrado",
        description: `Cliente ${eventData.client?.fullName || "sin nombre"} registrado`,
        timestamp,
        user: "Sistema",
        metadata: eventData,
        isNew: true,
      }

    case AppEvents.SERVICE_UPDATED:
      return {
        id,
        type: "service_updated",
        title: "Servicio actualizado",
        description: `Servicio ${eventData.service?.name || "sin nombre"} modificado`,
        timestamp,
        user: eventData.changedBy || "Sistema",
        metadata: eventData,
        isNew: true,
      }

    case AppEvents.STAFF_UPDATED:
      return {
        id,
        type: "staff_updated",
        title: "Personal actualizado",
        description: `Información de ${eventData.newStaff?.name || "empleado"} actualizada`,
        timestamp,
        user: "Sistema",
        metadata: eventData,
        isNew: true,
      }

    case AppEvents.STAFF_DELETED:
      return {
        id,
        type: "staff_deleted",
        title: "Personal eliminado",
        description: `Empleado ${eventData.staff?.name || "sin nombre"} eliminado del sistema`,
        timestamp,
        user: "Sistema",
        metadata: eventData,
        isNew: true,
      }

    default:
      return {
        id,
        type: "appointment_updated",
        title: "Actividad del sistema",
        description: "Evento registrado en el sistema",
        timestamp,
        user: "Sistema",
        metadata: eventData,
        isNew: true,
      }
  }
}

// Calculate weekly summary from actual data
const calculateWeeklySummary = (): WeeklySummary => {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const appointments = getAppointments()
  const clients = getClients()

  // Current week data
  const currentWeekAppointments = appointments.filter(
    (apt) => new Date(apt.createdAt) >= weekAgo && apt.status !== "cancelled",
  )
  const currentWeekRevenue = currentWeekAppointments
    .filter((apt) => apt.status === "completed")
    .reduce((sum, apt) => sum + apt.totalPrice, 0)
  const currentWeekClients = clients.filter((client) => new Date(client.createdAt) >= weekAgo)

  // Previous week data for comparison
  const previousWeekAppointments = appointments.filter(
    (apt) => new Date(apt.createdAt) >= twoWeeksAgo && new Date(apt.createdAt) < weekAgo && apt.status !== "cancelled",
  )
  const previousWeekRevenue = previousWeekAppointments
    .filter((apt) => apt.status === "completed")
    .reduce((sum, apt) => sum + apt.totalPrice, 0)
  const previousWeekClients = clients.filter(
    (client) => new Date(client.createdAt) >= twoWeeksAgo && new Date(client.createdAt) < weekAgo,
  )

  // Calculate growth percentages
  const appointmentGrowth =
    previousWeekAppointments.length > 0
      ? ((currentWeekAppointments.length - previousWeekAppointments.length) / previousWeekAppointments.length) * 100
      : currentWeekAppointments.length > 0
        ? 100
        : 0

  const revenueGrowth =
    previousWeekRevenue > 0
      ? ((currentWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100
      : currentWeekRevenue > 0
        ? 100
        : 0

  const clientGrowth =
    previousWeekClients.length > 0
      ? ((currentWeekClients.length - previousWeekClients.length) / previousWeekClients.length) * 100
      : currentWeekClients.length > 0
        ? 100
        : 0

  return {
    totalAppointments: currentWeekAppointments.length,
    totalRevenue: currentWeekRevenue,
    newClients: currentWeekClients.length,
    completedServices: currentWeekAppointments.filter((apt) => apt.status === "completed").length,
    averageServiceValue: currentWeekAppointments.length > 0 ? currentWeekRevenue / currentWeekAppointments.length : 0,
    growthMetrics: {
      appointments: appointmentGrowth,
      revenue: revenueGrowth,
      clients: clientGrowth,
    },
  }
}

const Dashboard: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newActivityCount, setNewActivityCount] = useState(0)

  const { colors } = useTheme()

  // ✅ NUEVO: Suscribirse a eventos reales del sistema
  useEffect(() => {
    console.log("📊 Dashboard: Configurando listeners de eventos reales...")

    // Handlers para diferentes tipos de eventos
    const handleAppointmentCreated = (eventData: any) => {
      console.log("📊 Dashboard: Nueva cita creada", eventData)
      const activity = createActivityFromEvent(AppEvents.APPOINTMENT_CREATED, eventData)
      setActivities((prev) => [activity, ...prev.slice(0, 19)]) // Mantener solo 20 actividades
      setNewActivityCount((prev) => prev + 1)
      setLastUpdate(new Date())
    }

    const handleAppointmentUpdated = (eventData: any) => {
      console.log("📊 Dashboard: Cita actualizada", eventData)
      const activity = createActivityFromEvent(AppEvents.APPOINTMENT_UPDATED, eventData)
      setActivities((prev) => [activity, ...prev.slice(0, 19)])
      setNewActivityCount((prev) => prev + 1)
      setLastUpdate(new Date())
    }

    const handleClientCreated = (eventData: any) => {
      console.log("📊 Dashboard: Nuevo cliente", eventData)
      const activity = createActivityFromEvent(AppEvents.CLIENT_CREATED, eventData)
      setActivities((prev) => [activity, ...prev.slice(0, 19)])
      setNewActivityCount((prev) => prev + 1)
      setLastUpdate(new Date())
    }

    const handleServiceUpdated = (eventData: any) => {
      console.log("📊 Dashboard: Servicio actualizado", eventData)
      const activity = createActivityFromEvent(AppEvents.SERVICE_UPDATED, eventData)
      setActivities((prev) => [activity, ...prev.slice(0, 19)])
      setNewActivityCount((prev) => prev + 1)
      setLastUpdate(new Date())
    }

    const handleStaffUpdated = (eventData: any) => {
      console.log("📊 Dashboard: Personal actualizado", eventData)
      const activity = createActivityFromEvent(AppEvents.STAFF_UPDATED, eventData)
      setActivities((prev) => [activity, ...prev.slice(0, 19)])
      setNewActivityCount((prev) => prev + 1)
      setLastUpdate(new Date())
    }

    const handleStaffDeleted = (eventData: any) => {
      console.log("📊 Dashboard: Personal eliminado", eventData)
      const activity = createActivityFromEvent(AppEvents.STAFF_DELETED, eventData)
      setActivities((prev) => [activity, ...prev.slice(0, 19)])
      setNewActivityCount((prev) => prev + 1)
      setLastUpdate(new Date())
    }

    // Suscribirse a todos los eventos relevantes
    subscribeToEvent(AppEvents.APPOINTMENT_CREATED, handleAppointmentCreated)
    subscribeToEvent(AppEvents.APPOINTMENT_UPDATED, handleAppointmentUpdated)
    subscribeToEvent(AppEvents.CLIENT_CREATED, handleClientCreated)
    subscribeToEvent(AppEvents.SERVICE_UPDATED, handleServiceUpdated)
    subscribeToEvent(AppEvents.STAFF_UPDATED, handleStaffUpdated)
    subscribeToEvent(AppEvents.STAFF_DELETED, handleStaffDeleted)

    // Cleanup
    return () => {
      console.log("📊 Dashboard: Limpiando listeners...")
      unsubscribeFromEvent(AppEvents.APPOINTMENT_CREATED, handleAppointmentCreated)
      unsubscribeFromEvent(AppEvents.APPOINTMENT_UPDATED, handleAppointmentUpdated)
      unsubscribeFromEvent(AppEvents.CLIENT_CREATED, handleClientCreated)
      unsubscribeFromEvent(AppEvents.SERVICE_UPDATED, handleServiceUpdated)
      unsubscribeFromEvent(AppEvents.STAFF_UPDATED, handleStaffUpdated)
      unsubscribeFromEvent(AppEvents.STAFF_DELETED, handleStaffDeleted)
    }
  }, [])

  // ✅ MODIFICADO: Load initial data - Solo datos reales, sin simulaciones
  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      console.log("📊 Dashboard: Cargando datos iniciales...")

      // Cargar datos reales del sistema
      setWeeklySummary(calculateWeeklySummary())
      setLastUpdate(new Date())

      // Inicializar con actividades vacías - se llenarán con eventos reales
      setActivities([])

      console.log("📊 Dashboard: Datos iniciales cargados")
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      console.log("📊 Dashboard: Actualizando datos...")
      await new Promise((resolve) => setTimeout(resolve, 500))
      setWeeklySummary(calculateWeeklySummary())
      setNewActivityCount(0)
      setLastUpdate(new Date())

      // Mark all activities as read
      setActivities((prev) => prev.map((activity) => ({ ...activity, isNew: false })))
      console.log("📊 Dashboard: Datos actualizados")
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // ✅ MODIFICADO: Auto-refresh solo para métricas, no para simulaciones
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      setWeeklySummary(calculateWeeklySummary())
      setLastUpdate(new Date())
    }, 60000) // Cada minuto

    return () => clearInterval(autoRefreshInterval)
  }, [])

  useEffect(() => {
    loadInitialData()
    // ✅ ELIMINADO: initializeWebSocket() - Ya no necesitamos simulaciones
  }, [])

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "appointment_created":
        return <CalendarPlus className="w-4 h-4" />
      case "appointment_updated":
        return <Edit className="w-4 h-4" />
      case "client_registered":
        return <UserPlus className="w-4 h-4" />
      case "service_updated":
        return <Edit className="w-4 h-4" />
      case "staff_updated":
        return <Users className="w-4 h-4" />
      case "staff_deleted":
        return <Trash2 className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "appointment_created":
        return colors?.success || "#10b981"
      case "appointment_updated":
        return colors?.primary || "#0ea5e9"
      case "client_registered":
        return colors?.accent || "#8b5cf6"
      case "service_updated":
        return colors?.warning || "#f59e0b"
      case "staff_updated":
        return colors?.primary || "#0ea5e9"
      case "staff_deleted":
        return colors?.error || "#ef4444"
      default:
        return colors?.textSecondary || "#6b7280"
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Ahora mismo"
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`
  }

  const formatGrowth = (growth: number) => {
    if (growth === 0)
      return { icon: <Minus className="w-3 h-3" />, color: colors?.textSecondary || "#6b7280", text: "0%" }
    if (growth > 0)
      return {
        icon: <ArrowUp className="w-3 h-3" />,
        color: colors?.success || "#10b981",
        text: `+${growth.toFixed(1)}%`,
      }
    return {
      icon: <ArrowDown className="w-3 h-3" />,
      color: colors?.error || "#ef4444",
      text: `${growth.toFixed(1)}%`,
    }
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center theme-transition"
        style={{ backgroundColor: colors?.background || "#f8fafc" }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: `${colors?.border || "#e5e7eb"}`,
              borderTopColor: colors?.primary || "#0ea5e9",
            }}
          ></div>
          <p style={{ color: colors?.textSecondary || "#6b7280" }}>Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
            Dashboard en Tiempo Real
          </h1>
          <p className="mt-1 theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
            Última actualización: {lastUpdate.toLocaleTimeString("es-ES")}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center px-4 py-2 text-white rounded-lg transition-all duration-300 disabled:opacity-50 theme-transition"
          style={{ backgroundColor: colors?.primary || "#0ea5e9" }}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Appointments */}
        <div
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || "#ffffff" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                Citas Esta Semana
              </p>
              <p className="text-2xl font-bold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                {weeklySummary?.totalAppointments || 0}
              </p>
              <div className="flex items-center mt-1">
                {(() => {
                  const growth = formatGrowth(weeklySummary?.growthMetrics.appointments || 0)
                  return (
                    <div className="flex items-center" style={{ color: growth.color }}>
                      {growth.icon}
                      <span className="text-xs ml-1">{growth.text}</span>
                    </div>
                  )
                })()}
              </div>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.primary || "#0ea5e9"}1a` }}
            >
              <Calendar className="w-6 h-6" style={{ color: colors?.primary || "#0ea5e9" }} />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || "#ffffff" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                Ingresos Semanales
              </p>
              <p className="text-2xl font-bold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                ${(weeklySummary?.totalRevenue || 0).toLocaleString()}
              </p>
              <div className="flex items-center mt-1">
                {(() => {
                  const growth = formatGrowth(weeklySummary?.growthMetrics.revenue || 0)
                  return (
                    <div className="flex items-center" style={{ color: growth.color }}>
                      {growth.icon}
                      <span className="text-xs ml-1">{growth.text}</span>
                    </div>
                  )
                })()}
              </div>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.success || "#10b981"}1a` }}
            >
              <DollarSign className="w-6 h-6" style={{ color: colors?.success || "#10b981" }} />
            </div>
          </div>
        </div>

        {/* New Clients */}
        <div
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || "#ffffff" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                Nuevos Clientes
              </p>
              <p className="text-2xl font-bold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                {weeklySummary?.newClients || 0}
              </p>
              <div className="flex items-center mt-1">
                {(() => {
                  const growth = formatGrowth(weeklySummary?.growthMetrics.clients || 0)
                  return (
                    <div className="flex items-center" style={{ color: growth.color }}>
                      {growth.icon}
                      <span className="text-xs ml-1">{growth.text}</span>
                    </div>
                  )
                })()}
              </div>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.accent || "#8b5cf6"}1a` }}
            >
              <Users className="w-6 h-6" style={{ color: colors?.accent || "#8b5cf6" }} />
            </div>
          </div>
        </div>

        {/* Average Service Value */}
        <div
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || "#ffffff" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                Valor Promedio
              </p>
              <p className="text-2xl font-bold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                ${(weeklySummary?.averageServiceValue || 0).toFixed(0)}
              </p>
              <p className="text-xs mt-1 theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                Por servicio
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.warning || "#f59e0b"}1a` }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: colors?.warning || "#f59e0b" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div
            className="rounded-xl shadow-lg theme-transition"
            style={{ backgroundColor: colors?.surface || "#ffffff" }}
          >
            <div className="p-6 border-b theme-transition" style={{ borderColor: colors?.border || "#e5e7eb" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h2 className="text-xl font-semibold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                    Actividad Reciente
                  </h2>
                  {newActivityCount > 0 && (
                    <div
                      className="ml-3 px-2 py-1 rounded-full text-xs font-medium theme-transition"
                      style={{
                        backgroundColor: `${colors?.primary || "#0ea5e9"}1a`,
                        color: colors?.primary || "#0ea5e9",
                      }}
                    >
                      {newActivityCount} nuevo{newActivityCount !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <Zap className="w-4 h-4 mr-1" style={{ color: colors?.success || "#10b981" }} />
                  <span className="text-sm theme-transition" style={{ color: colors?.success || "#10b981" }}>
                    En vivo
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto mb-4" style={{ color: colors?.textSecondary || "#6b7280" }} />
                  <h3 className="text-lg font-medium mb-2" style={{ color: colors?.text || "#1f2937" }}>
                    Sin actividad reciente
                  </h3>
                  <p style={{ color: colors?.textSecondary || "#6b7280" }}>
                    Las actividades del sistema aparecerán aquí en tiempo real
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-theme">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`flex items-start space-x-4 p-4 rounded-lg transition-all duration-300 theme-transition ${
                        activity.isNew ? "ring-2 ring-opacity-50" : ""
                      }`}
                      style={{
                        backgroundColor: activity.isNew
                          ? `${colors?.primary || "#0ea5e9"}0d`
                          : colors?.background || "#f8fafc",
                        ringColor: activity.isNew ? colors?.primary || "#0ea5e9" : "transparent",
                      }}
                    >
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center theme-transition"
                        style={{ backgroundColor: `${getActivityColor(activity.type)}1a` }}
                      >
                        <div style={{ color: getActivityColor(activity.type) }}>{getActivityIcon(activity.type)}</div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p
                            className="text-sm font-medium theme-transition"
                            style={{ color: colors?.text || "#1f2937" }}
                          >
                            {activity.title}
                          </p>
                          <span
                            className="text-xs theme-transition"
                            style={{ color: colors?.textSecondary || "#6b7280" }}
                          >
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                        <p
                          className="text-sm mt-1 theme-transition"
                          style={{ color: colors?.textSecondary || "#6b7280" }}
                        >
                          {activity.description}
                        </p>
                        {activity.user && (
                          <p
                            className="text-xs mt-1 theme-transition"
                            style={{ color: colors?.textSecondary || "#6b7280" }}
                          >
                            Por: {activity.user}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats & Charts */}
        <div className="space-y-6">
          {/* Performance Chart */}
          <div
            className="rounded-xl shadow-lg p-6 theme-transition"
            style={{ backgroundColor: colors?.surface || "#ffffff" }}
          >
            <h3 className="text-lg font-semibold mb-4 theme-transition" style={{ color: colors?.text || "#1f2937" }}>
              Rendimiento Semanal
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                  Servicios Completados
                </span>
                <span className="font-semibold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                  {weeklySummary?.completedServices || 0}
                </span>
              </div>

              <div
                className="w-full rounded-full h-2 theme-transition"
                style={{ backgroundColor: colors?.border || "#e5e7eb" }}
              >
                <div
                  className="h-2 rounded-full transition-all duration-500 theme-transition"
                  style={{
                    backgroundColor: colors?.success || "#10b981",
                    width: `${Math.min(((weeklySummary?.completedServices || 0) / 50) * 100, 100)}%`,
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                  Meta Semanal
                </span>
                <span className="text-sm theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                  50 servicios
                </span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div
            className="rounded-xl shadow-lg p-6 theme-transition"
            style={{ backgroundColor: colors?.surface || "#ffffff" }}
          >
            <h3 className="text-lg font-semibold mb-4 theme-transition" style={{ color: colors?.text || "#1f2937" }}>
              Estado del Sistema
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" style={{ color: colors?.success || "#10b981" }} />
                  <span className="text-sm theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                    Eventos en tiempo real
                  </span>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full theme-transition"
                  style={{
                    backgroundColor: `${colors?.success || "#10b981"}1a`,
                    color: colors?.success || "#10b981",
                  }}
                >
                  Activo
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" style={{ color: colors?.success || "#10b981" }} />
                  <span className="text-sm theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                    Base de datos
                  </span>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full theme-transition"
                  style={{
                    backgroundColor: `${colors?.success || "#10b981"}1a`,
                    color: colors?.success || "#10b981",
                  }}
                >
                  Operativo
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" style={{ color: colors?.success || "#10b981" }} />
                  <span className="text-sm theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                    Sincronización
                  </span>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full theme-transition"
                  style={{
                    backgroundColor: `${colors?.success || "#10b981"}1a`,
                    color: colors?.success || "#10b981",
                  }}
                >
                  Funcionando
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
