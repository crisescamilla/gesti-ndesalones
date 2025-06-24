import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vikgdvmhrfsijaufxedv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpa2dkdm1ocmZzaWphdWZ4ZWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODMxMjMsImV4cCI6MjA2NjM1OTEyM30.DykKHMsdtXSHD8y2bEUdtp3lgxF_86atQ2UcLF5OsCI'
export const supabase = createClient(supabaseUrl, supabaseKey)


export interface Client {
  id: string
  fullName: string
  phone: string
  email: string
  createdAt: string
  totalSpent?: number
  rewardsEarned?: number
}

export interface Service {
  id: string
  name: string
  category: ServiceCategory
  duration: number // in minutes
  price: number
  description: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Appointment {
  id: string
  clientId: string
  serviceIds: string[]
  date: string
  time: string
  status: "confirmed" | "pending" | "cancelled" | "completed"
  totalPrice: number
  notes?: string
  createdAt: string
  statusHistory?: StatusChange[]
  discountApplied?: number
  couponUsed?: string
  staffId?: string // Added staff selection
}

export interface StatusChange {
  id: string
  previousStatus: string
  newStatus: string
  changedBy: string
  changedAt: string
  reason?: string
}

export interface Employee {
  id: string
  name: string
  specialties: ServiceCategory[]
  schedule: WorkingHours
}

export interface WorkingHours {
  [key: string]: {
    start: string
    end: string
    available: boolean
  }
}

export type ServiceCategory =
  | "tratamientos-corporales"
  | "servicios-unas"
  | "tratamientos-faciales"
  | "servicios-cabello"
  | "masajes"
  | "productos"

export interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  description: string
  brand: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AppointmentSlot {
  date: string
  time: string
  available: boolean
  employeeId?: string
}

export interface AdminUser {
  id: string
  username: string
  passwordHash: string
  role: "owner" | "admin"
  createdAt: string
  lastLogin?: string
  isActive: boolean
}

export interface LoginAttempt {
  id: string
  username: string
  ipAddress: string
  timestamp: string
  success: boolean
  userAgent: string
}

export interface AuthSession {
  id: string
  userId: string
  token: string
  expiresAt: string
  createdAt: string
  lastActivity: string
  ipAddress: string
  userAgent: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: AdminUser | null
  session: AuthSession | null
  loading: boolean
}

// Rewards System Types
export interface RewardCoupon {
  id: string
  clientId: string
  code: string
  discountPercentage: number
  discountAmount?: number
  isUsed: boolean
  createdAt: string
  expiresAt: string
  usedAt?: string
  usedInAppointment?: string
  triggerAmount: number
}

export interface RewardHistory {
  id: string
  clientId: string
  type: "coupon_generated" | "coupon_used" | "milestone_reached"
  description: string
  amount: number
  couponId?: string
  createdAt: string
}

export interface RewardSettings {
  id: string
  spendingThreshold: number
  discountPercentage: number
  couponValidityDays: number
  isActive: boolean
  updatedAt: string
  updatedBy: string
}

export interface AdminNotification {
  id: string
  type: "reward_generated" | "milestone_reached" | "coupon_expired"
  title: string
  message: string
  clientId: string
  couponId?: string
  isRead: boolean
  createdAt: string
}

// Services Management Types
export interface ServiceUpdate {
  id: string
  field: "name" | "price" | "duration" | "description" | "category" | "isActive"
  oldValue: any
  newValue: any
  updatedBy: string
  updatedAt: string
}

export interface PriceHistory {
  id: string
  serviceId: string
  oldPrice: number
  newPrice: number
  changedBy: string
  changedAt: string
  reason?: string
}

// Enhanced Salon Settings Types with social media
export interface SalonSettings {
  id: string
  salonName: string
  salonMotto: string
  address?: string
  phone?: string
  email?: string
  whatsapp?: string
  instagram?: string
  facebook?: string
  website?: string
  hours?: {
    [key: string]: {
      open: string
      close: string
      isOpen: boolean
    }
  }
  updatedAt: string
  updatedBy: string
}

// Staff Management Types
export interface StaffMember {
  id: string
  name: string
  role: string
  specialties: ServiceCategory[]
  bio: string
  experience: string
  image: string
  isActive: boolean
  schedule: {
    [key: string]: {
      start: string
      end: string
      available: boolean
    }
  }
  rating: number
  completedServices: number
  createdAt: string
  updatedAt: string
}

// Theme System Types
export interface ColorPalette {
  primary: string
  primaryLight: string
  primaryDark: string
  secondary: string
  secondaryLight: string
  secondaryDark: string
  accent: string
  accentLight: string
  accentDark: string
  success: string
  warning: string
  error: string
  info: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  shadow: string
}

export interface ThemeSettings {
  id: string
  name: string
  description: string
  colors: ColorPalette
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface ThemePreset {
  id: string
  name: string
  description: string
  colors: ColorPalette
  preview: string
}

export interface Cita {
  id: string;
  tenant_id: string;
  cliente_id: string;
  fecha_hora: string;
  servicio: string;
  // ...otros campos...
}


