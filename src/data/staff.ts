import type { StaffMember, ServiceCategory } from "../types"

export const staffMembers: StaffMember[] = [
  {
    id: "1",
    name: "Isabella Martínez",
    role: "Especialista en Tratamientos Faciales",
    specialties: ["tratamientos-faciales", "tratamientos-corporales"],
    bio: "Especialista certificada en cuidado facial con más de 8 años de experiencia. Experta en tratamientos anti-edad y rejuvenecimiento.",
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
    bio: "Estilista profesional especializada en colorimetría y cortes modernos. Certificada en técnicas europeas de peinado.",
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
    bio: "Técnica certificada en nail art y extensiones. Especialista en diseños personalizados y técnicas de gel y acrílico.",
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
    bio: "Terapeuta certificada en masajes relajantes y descontracturantes. Especialista en técnicas de relajación y bienestar.",
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
    bio: "Especialista versátil con certificaciones múltiples. Experta en tratamientos integrales de belleza y cuidado personal.",
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
    bio: "Directora y fundadora del spa con más de 12 años de experiencia. Especialista en tratamientos de lujo y relajación profunda.",
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

// ✅ NUEVAS FUNCIONES QUE LEEN DESDE LOCALSTORAGE
const STORAGE_KEY = "beauty-salon-staff"

// Función para obtener empleados desde localStorage (datos actualizados)
export const getStaffFromStorage = (): StaffMember[] => {
  try {
    if (typeof window === "undefined") {
      // Si estamos en el servidor, devolver datos por defecto
      return staffMembers
    }

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    // Si no hay datos en localStorage, devolver empleados por defecto
    return staffMembers
  } catch (error) {
    console.error("Error loading staff from storage:", error)
    return staffMembers
  }
}

// Función para obtener empleados activos desde localStorage
export const getActiveStaffFromStorage = (): StaffMember[] => {
  return getStaffFromStorage().filter((staff) => staff.isActive)
}

// Función para obtener empleados disponibles para servicios específicos
export const getAvailableStaffForServicesFromStorage = (requiredSpecialties: ServiceCategory[]): StaffMember[] => {
  const allStaff = getActiveStaffFromStorage()
  return allStaff.filter((staff) => requiredSpecialties.some((specialty) => staff.specialties.includes(specialty)))
}

// Función para obtener empleado por ID desde localStorage
export const getStaffByIdFromStorage = (staffId: string): StaffMember | undefined => {
  return getStaffFromStorage().find((staff) => staff.id === staffId)
}

// Función para obtener empleados por especialidad desde localStorage
export const getStaffBySpecialtyFromStorage = (specialty: ServiceCategory): StaffMember[] => {
  return getActiveStaffFromStorage().filter((staff) => staff.specialties.includes(specialty))
}

// Función para verificar disponibilidad en un día específico desde localStorage
export const isStaffAvailableOnDayFromStorage = (staffId: string, dayOfWeek: string): boolean => {
  const staff = getStaffByIdFromStorage(staffId)
  if (!staff) return false

  const daySchedule = staff.schedule[dayOfWeek.toLowerCase()]
  return daySchedule ? daySchedule.available : false
}

// ✅ FUNCIONES ORIGINALES (MANTENER PARA COMPATIBILIDAD)
// Helper function to get staff by specialty
export const getStaffBySpecialty = (specialty: ServiceCategory): StaffMember[] => {
  return staffMembers.filter((staff) => staff.isActive && staff.specialties.includes(specialty))
}

// Helper function to get available staff for multiple specialties
export const getAvailableStaffForServices = (specialties: ServiceCategory[]): StaffMember[] => {
  return staffMembers.filter(
    (staff) => staff.isActive && specialties.some((specialty) => staff.specialties.includes(specialty)),
  )
}

// Helper function to check if staff is available on a specific day
export const isStaffAvailableOnDay = (staffId: string, dayOfWeek: string): boolean => {
  const staff = staffMembers.find((s) => s.id === staffId)
  if (!staff) return false

  const daySchedule = staff.schedule[dayOfWeek.toLowerCase()]
  return daySchedule ? daySchedule.available : false
}

// Get staff by ID
export const getStaffById = (staffId: string): StaffMember | undefined => {
  return staffMembers.find((staff) => staff.id === staffId)
}

// Get active staff
export const getActiveStaff = (): StaffMember[] => {
  return staffMembers.filter((staff) => staff.isActive)
}

