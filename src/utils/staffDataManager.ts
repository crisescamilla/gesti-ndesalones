// ✅ NUEVO: Gestor centralizado de datos de personal con invalidación de caché
import type { StaffMember, ServiceCategory } from "../types"
import { emitEvent, subscribeToEvent, AppEvents } from "./eventManager"

const STORAGE_KEY = "beauty-salon-staff"

// Cache en memoria para mejorar rendimiento
let staffCache: StaffMember[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5000 // 5 segundos

// Datos por defecto (importados desde staff.ts)
const defaultStaffMembers: StaffMember[] = [
  {
    id: "1",
    name: "Isabella Martínez",
    role: "Especialista en Tratamientos Faciales",
    specialties: ["tratamientos-faciales", "tratamientos-corporales"],
    bio: "Especialista certificada en cuidado facial con más de 8 años de experiencia.",
    experience: "8 años",
    image: "https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    schedule: {
      monday: { start: "09:00", end: "17:00", available: true },
      tuesday: { start: "09:00", end: "17:00", available: true },
      wednesday: { start: "09:00", end: "17:00", available: true },
      thursday: { start: "09:00", end: "17:00", available: true },
      friday: { start: "09:00", end: "17:00", available: true },
      saturday: { start: "10:00", end: "16:00", available: true },
      sunday: { start: "10:00", end: "14:00", available: false },
    },
    rating: 4.9,
    completedServices: 1250,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Sofía Hernández",
    role: "Estilista Senior",
    specialties: ["servicios-cabello"],
    bio: "Estilista profesional especializada en colorimetría y cortes modernos.",
    experience: "6 años",
    image: "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    schedule: {
      monday: { start: "10:00", end: "18:00", available: true },
      tuesday: { start: "10:00", end: "18:00", available: true },
      wednesday: { start: "10:00", end: "18:00", available: true },
      thursday: { start: "10:00", end: "18:00", available: true },
      friday: { start: "10:00", end: "18:00", available: true },
      saturday: { start: "09:00", end: "17:00", available: true },
      sunday: { start: "10:00", end: "14:00", available: false },
    },
    rating: 4.8,
    completedServices: 980,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Carmen López",
    role: "Especialista en Uñas",
    specialties: ["servicios-unas"],
    bio: "Técnica certificada en nail art y extensiones.",
    experience: "5 años",
    image: "https://images.pexels.com/photos/3764013/pexels-photo-3764013.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    schedule: {
      monday: { start: "09:00", end: "17:00", available: true },
      tuesday: { start: "09:00", end: "17:00", available: true },
      wednesday: { start: "09:00", end: "17:00", available: false },
      thursday: { start: "09:00", end: "17:00", available: true },
      friday: { start: "09:00", end: "17:00", available: true },
      saturday: { start: "10:00", end: "16:00", available: true },
      sunday: { start: "10:00", end: "14:00", available: false },
    },
    rating: 4.7,
    completedServices: 750,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Alejandra Ruiz",
    role: "Masajista Terapéutica",
    specialties: ["masajes", "tratamientos-corporales"],
    bio: "Terapeuta certificada en masajes relajantes y descontracturantes.",
    experience: "7 años",
    image: "https://images.pexels.com/photos/3985163/pexels-photo-3985163.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    schedule: {
      monday: { start: "11:00", end: "19:00", available: true },
      tuesday: { start: "11:00", end: "19:00", available: true },
      wednesday: { start: "11:00", end: "19:00", available: true },
      thursday: { start: "11:00", end: "19:00", available: true },
      friday: { start: "11:00", end: "19:00", available: true },
      saturday: { start: "10:00", end: "16:00", available: true },
      sunday: { start: "10:00", end: "14:00", available: true },
    },
    rating: 4.9,
    completedServices: 1100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Valeria Torres",
    role: "Especialista Integral",
    specialties: ["tratamientos-faciales", "servicios-unas", "tratamientos-corporales"],
    bio: "Especialista versátil con certificaciones múltiples.",
    experience: "4 años",
    image: "https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    schedule: {
      monday: { start: "09:00", end: "17:00", available: true },
      tuesday: { start: "09:00", end: "17:00", available: true },
      wednesday: { start: "09:00", end: "17:00", available: true },
      thursday: { start: "09:00", end: "17:00", available: true },
      friday: { start: "09:00", end: "17:00", available: true },
      saturday: { start: "09:00", end: "17:00", available: true },
      sunday: { start: "10:00", end: "14:00", available: false },
    },
    rating: 4.6,
    completedServices: 650,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Gabriela Morales",
    role: "Directora de Spa",
    specialties: ["masajes", "tratamientos-faciales", "tratamientos-corporales"],
    bio: "Directora y fundadora del spa con más de 12 años de experiencia.",
    experience: "12 años",
    image: "https://images.pexels.com/photos/3985167/pexels-photo-3985167.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    schedule: {
      monday: { start: "10:00", end: "18:00", available: true },
      tuesday: { start: "10:00", end: "18:00", available: true },
      wednesday: { start: "10:00", end: "18:00", available: true },
      thursday: { start: "10:00", end: "18:00", available: true },
      friday: { start: "10:00", end: "18:00", available: true },
      saturday: { start: "10:00", end: "16:00", available: true },
      sunday: { start: "10:00", end: "14:00", available: false },
    },
    rating: 5.0,
    completedServices: 2100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// ✅ Función para invalidar caché
export const invalidateStaffCache = (): void => {
  console.log("🗑️ Invalidating staff cache...")
  staffCache = null
  cacheTimestamp = 0
}

// ✅ Función principal para obtener personal (con caché inteligente)
export const getStaffData = (forceRefresh = false): StaffMember[] => {
  const now = Date.now()

  // Verificar si necesitamos refrescar el caché
  if (forceRefresh || !staffCache || now - cacheTimestamp > CACHE_DURATION) {
    console.log("🔄 Refreshing staff cache from localStorage...")

    try {
      if (typeof window === "undefined") {
        staffCache = defaultStaffMembers
      } else {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsedData = JSON.parse(stored)
          console.log("📊 Staff data loaded from localStorage:", parsedData.length, "members")
          staffCache = parsedData
        } else {
          console.log("📊 No staff data in localStorage, using defaults")
          // Inicializar localStorage con datos por defecto
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStaffMembers))
          staffCache = defaultStaffMembers
        }
      }

      cacheTimestamp = now
    } catch (error) {
      console.error("❌ Error loading staff data:", error)
      staffCache = defaultStaffMembers
    }
  } else {
    console.log("✅ Using cached staff data")
  }

  return staffCache || defaultStaffMembers
}

// ✅ Función para obtener personal activo
export const getActiveStaff = (forceRefresh = false): StaffMember[] => {
  const allStaff = getStaffData(forceRefresh)
  const activeStaff = allStaff.filter((staff) => staff.isActive)
  console.log("👥 Active staff members:", activeStaff.length, "of", allStaff.length)
  return activeStaff
}

// ✅ Función para obtener personal por especialidades
export const getStaffForServices = (requiredSpecialties: ServiceCategory[], forceRefresh = false): StaffMember[] => {
  const activeStaff = getActiveStaff(forceRefresh)
  const availableStaff = activeStaff.filter((staff) =>
    requiredSpecialties.some((specialty) => staff.specialties.includes(specialty)),
  )

  console.log("🎯 Staff available for specialties:", {
    requiredSpecialties,
    availableStaff: availableStaff.length,
    staffNames: availableStaff.map((s) => s.name),
  })

  return availableStaff
}

// ✅ Función para obtener personal por ID
export const getStaffById = (staffId: string, forceRefresh = false): StaffMember | null => {
  const allStaff = getStaffData(forceRefresh)
  const staff = allStaff.find((s) => s.id === staffId) || null

  console.log("🔍 Staff lookup by ID:", { staffId, found: !!staff, name: staff?.name })
  return staff
}

// ✅ Función para obtener personal por especialidad específica
export const getStaffBySpecialty = (specialty: ServiceCategory, forceRefresh = false): StaffMember[] => {
  const activeStaff = getActiveStaff(forceRefresh)
  const specialtyStaff = activeStaff.filter((staff) => staff.specialties.includes(specialty))

  console.log("🏷️ Staff for specialty:", { specialty, count: specialtyStaff.length })
  return specialtyStaff
}

// ✅ Función para verificar disponibilidad en día específico
export const isStaffAvailableOnDay = (staffId: string, dayOfWeek: string, forceRefresh = false): boolean => {
  const staff = getStaffById(staffId, forceRefresh)
  if (!staff) return false

  const daySchedule = staff.schedule[dayOfWeek.toLowerCase()]
  const isAvailable = daySchedule ? daySchedule.available : false

  console.log("📅 Staff availability check:", { staffId, dayOfWeek, isAvailable })
  return isAvailable
}

// ✅ Función para forzar actualización de datos
export const refreshStaffData = (): StaffMember[] => {
  console.log("🔄 Force refreshing staff data...")
  invalidateStaffCache()

  // Emitir evento para notificar a componentes
  emitEvent(AppEvents.STAFF_UPDATED, {
    type: "data_refresh",
    timestamp: new Date().toISOString(),
  })

  return getStaffData(true)
}

// ✅ Suscribirse a eventos de cambios de personal
export const initializeStaffDataManager = (): void => {
  console.log("🚀 Initializing Staff Data Manager...")

  // Invalidar caché cuando se actualice el personal
  subscribeToEvent(AppEvents.STAFF_UPDATED, () => {
    console.log("📡 Staff updated event received, invalidating cache...")
    invalidateStaffCache()
  })

  // Invalidar caché cuando se elimine personal
  subscribeToEvent(AppEvents.STAFF_DELETED, () => {
    console.log("📡 Staff deleted event received, invalidating cache...")
    invalidateStaffCache()
  })

  // Invalidar caché cuando se active/desactive personal
  subscribeToEvent(AppEvents.STAFF_ACTIVATED, () => {
    console.log("📡 Staff activated event received, invalidating cache...")
    invalidateStaffCache()
  })

  subscribeToEvent(AppEvents.STAFF_DEACTIVATED, () => {
    console.log("📡 Staff deactivated event received, invalidating cache...")
    invalidateStaffCache()
  })
}

// ✅ Función de debugging para verificar estado
export const debugStaffData = (): void => {
  console.log("🔍 === STAFF DATA DEBUG ===")
  console.log("Cache status:", {
    hasCacheData: !!staffCache,
    cacheAge: staffCache ? Date.now() - cacheTimestamp : "No cache",
    cacheSize: staffCache?.length || 0,
  })

  const localStorageData = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
  console.log("LocalStorage status:", {
    hasData: !!localStorageData,
    dataSize: localStorageData ? JSON.parse(localStorageData).length : 0,
  })

  const currentData = getStaffData()
  console.log("Current staff data:", {
    total: currentData.length,
    active: currentData.filter((s) => s.isActive).length,
    names: currentData.map((s) => s.name),
  })

  console.log("🔍 === END DEBUG ===")
}
