"use client"

// ✅ NUEVO: Hook personalizado para gestión reactiva de datos de personal
import { useState, useEffect, useCallback } from "react"
import type { StaffMember, ServiceCategory } from "../types"
import {
  getStaffData,
  getActiveStaff,
  getStaffForServices,
  getStaffById,
  refreshStaffData,
  initializeStaffDataManager,
} from "../utils/staffDataManager"
import { subscribeToEvent, unsubscribeFromEvent, AppEvents } from "../utils/eventManager"

// Hook para obtener todos los datos de personal
export const useStaffData = (autoRefresh = true) => {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const refreshData = useCallback(() => {
    console.log("🔄 useStaffData: Refreshing data...")
    setLoading(true)
    try {
      const data = refreshStaffData()
      setStaff(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("❌ useStaffData: Error refreshing data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Inicializar gestor de datos
    initializeStaffDataManager()

    // Cargar datos iniciales
    console.log("🚀 useStaffData: Loading initial data...")
    const initialData = getStaffData()
    setStaff(initialData)
    setLoading(false)

    if (autoRefresh) {
      // Suscribirse a eventos de cambios
      const handleStaffChange = () => {
        console.log("📡 useStaffData: Staff change detected, refreshing...")
        refreshData()
      }

      subscribeToEvent(AppEvents.STAFF_UPDATED, handleStaffChange)
      subscribeToEvent(AppEvents.STAFF_DELETED, handleStaffChange)
      subscribeToEvent(AppEvents.STAFF_ACTIVATED, handleStaffChange)
      subscribeToEvent(AppEvents.STAFF_DEACTIVATED, handleStaffChange)

      return () => {
        unsubscribeFromEvent(AppEvents.STAFF_UPDATED, handleStaffChange)
        unsubscribeFromEvent(AppEvents.STAFF_DELETED, handleStaffChange)
        unsubscribeFromEvent(AppEvents.STAFF_ACTIVATED, handleStaffChange)
        unsubscribeFromEvent(AppEvents.STAFF_DEACTIVATED, handleStaffChange)
      }
    }
  }, [autoRefresh, refreshData])

  return {
    staff,
    loading,
    lastUpdate,
    refreshData,
  }
}

// Hook para obtener personal activo
export const useActiveStaff = (autoRefresh = true) => {
  const [activeStaff, setActiveStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  const refreshData = useCallback(() => {
    console.log("🔄 useActiveStaff: Refreshing data...")
    setLoading(true)
    try {
      const data = getActiveStaff(true)
      setActiveStaff(data)
    } catch (error) {
      console.error("❌ useActiveStaff: Error refreshing data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Cargar datos iniciales
    const initialData = getActiveStaff()
    setActiveStaff(initialData)
    setLoading(false)

    if (autoRefresh) {
      // Suscribirse a eventos de cambios
      const handleStaffChange = () => {
        console.log("📡 useActiveStaff: Staff change detected, refreshing...")
        refreshData()
      }

      subscribeToEvent(AppEvents.STAFF_UPDATED, handleStaffChange)
      subscribeToEvent(AppEvents.STAFF_DELETED, handleStaffChange)
      subscribeToEvent(AppEvents.STAFF_ACTIVATED, handleStaffChange)
      subscribeToEvent(AppEvents.STAFF_DEACTIVATED, handleStaffChange)

      return () => {
        unsubscribeFromEvent(AppEvents.STAFF_UPDATED, handleStaffChange)
        unsubscribeFromEvent(AppEvents.STAFF_DELETED, handleStaffChange)
        unsubscribeFromEvent(AppEvents.STAFF_ACTIVATED, handleStaffChange)
        unsubscribeFromEvent(AppEvents.STAFF_DEACTIVATED, handleStaffChange)
      }
    }
  }, [autoRefresh, refreshData])

  return {
    activeStaff,
    loading,
    refreshData,
  }
}

// Hook para obtener personal por servicios específicos
export const useStaffForServices = (requiredSpecialties: ServiceCategory[], autoRefresh = true) => {
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  const refreshData = useCallback(() => {
    console.log("🔄 useStaffForServices: Refreshing data for specialties:", requiredSpecialties)
    setLoading(true)
    try {
      const data = getStaffForServices(requiredSpecialties, true)
      setAvailableStaff(data)
    } catch (error) {
      console.error("❌ useStaffForServices: Error refreshing data:", error)
    } finally {
      setLoading(false)
    }
  }, [requiredSpecialties])

  useEffect(() => {
    if (requiredSpecialties.length === 0) {
      setAvailableStaff([])
      setLoading(false)
      return
    }

    // Cargar datos iniciales
    const initialData = getStaffForServices(requiredSpecialties)
    setAvailableStaff(initialData)
    setLoading(false)

    if (autoRefresh) {
      // Suscribirse a eventos de cambios
      const handleStaffChange = () => {
        console.log("📡 useStaffForServices: Staff change detected, refreshing...")
        refreshData()
      }

      subscribeToEvent(AppEvents.STAFF_UPDATED, handleStaffChange)
      subscribeToEvent(AppEvents.STAFF_DELETED, handleStaffChange)
      subscribeToEvent(AppEvents.STAFF_ACTIVATED, handleStaffChange)
      subscribeToEvent(AppEvents.STAFF_DEACTIVATED, handleStaffChange)

      return () => {
        unsubscribeFromEvent(AppEvents.STAFF_UPDATED, handleStaffChange)
        unsubscribeFromEvent(AppEvents.STAFF_DELETED, handleStaffChange)
        unsubscribeFromEvent(AppEvents.STAFF_ACTIVATED, handleStaffChange)
        unsubscribeFromEvent(AppEvents.STAFF_DEACTIVATED, handleStaffChange)
      }
    }
  }, [requiredSpecialties, autoRefresh, refreshData])

  return {
    availableStaff,
    loading,
    refreshData,
  }
}

// Hook para obtener un empleado específico por ID
export const useStaffById = (staffId: string, autoRefresh = true) => {
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshData = useCallback(() => {
    console.log("🔄 useStaffById: Refreshing data for ID:", staffId)
    setLoading(true)
    try {
      const data = getStaffById(staffId, true)
      setStaff(data)
    } catch (error) {
      console.error("❌ useStaffById: Error refreshing data:", error)
    } finally {
      setLoading(false)
    }
  }, [staffId])

  useEffect(() => {
    if (!staffId) {
      setStaff(null)
      setLoading(false)
      return
    }

    // Cargar datos iniciales
    const initialData = getStaffById(staffId)
    setStaff(initialData)
    setLoading(false)

    if (autoRefresh) {
      // Suscribirse a eventos de cambios
      const handleStaffChange = () => {
        console.log("📡 useStaffById: Staff change detected, refreshing...")
        refreshData()
      }

      subscribeToEvent(AppEvents.STAFF_UPDATED, handleStaffChange)
      subscribeToEvent(AppEvents.STAFF_DELETED, handleStaffChange)
      subscribeToEvent(AppEvents.STAFF_ACTIVATED, handleStaffChange)
      subscribeToEvent(AppEvents.STAFF_DEACTIVATED, handleStaffChange)

      return () => {
        unsubscribeFromEvent(AppEvents.STAFF_UPDATED, handleStaffChange)
        unsubscribeFromEvent(AppEvents.STAFF_DELETED, handleStaffChange)
        unsubscribeFromEvent(AppEvents.STAFF_ACTIVATED, handleStaffChange)
        unsubscribeFromEvent(AppEvents.STAFF_DEACTIVATED, handleStaffChange)
      }
    }
  }, [staffId, autoRefresh, refreshData])

  return {
    staff,
    loading,
    refreshData,
  }
}
