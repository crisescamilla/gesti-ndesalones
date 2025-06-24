"use client"

import { useState, useEffect } from "react"
import { Sparkles, Settings, Calendar, MapPin, Phone, Clock, Instagram, MessageCircle } from "lucide-react"
import ClientBooking from "./components/ClientBooking"
import AdminPanel from "./components/AdminPanel"
import LoginForm from "./components/LoginForm"
import { initializeDefaultAdmin, isAuthenticated, getCurrentUser } from "./utils/auth"
import { initializeThemeSystem } from "./utils/themeManager"
import {
  useSalonName,
  useSalonMotto,
  useSalonAddress,
  useSalonPhone,
  useSalonEmail,
  useSalonWhatsApp,
  useSalonInstagram,
  useSalonFacebook,
  useSalonWebsite,
  useSalonHours,
} from "./hooks/useSalonSettings"
import { useTheme } from "./hooks/useTheme"
import { useTenant } from "./hooks/useTenant"
import type { AdminUser, AuthSession } from "./types"

// Utility functions for social media URL processing
const getInstagramUsername = (input: string): string => {
  if (!input) return ""

  // If it's a full URL, extract username
  if (input.includes("instagram.com/")) {
    const match = input.match(/instagram\.com\/([^/?]+)/)
    return match ? `@${match[1]}` : input
  }

  // If it already has @, return as is
  if (input.startsWith("@")) {
    return input
  }

  // Otherwise, add @ prefix
  return `@${input}`
}

const getInstagramUrl = (input: string): string => {
  if (!input) return ""

  // If it's already a full URL, return as is
  if (input.startsWith("http")) {
    return input
  }

  // Extract username (remove @ if present)
  const username = input.replace("@", "")
  return `https://www.instagram.com/${username}`
}

const getFacebookDisplayName = (input: string): string => {
  if (!input) return ""

  // If it's a full URL, try to extract a readable name
  if (input.includes("facebook.com/")) {
    const match = input.match(/facebook\.com\/([^/?]+)/)
    if (match) {
      // Decode URL components and make it more readable
      const name = decodeURIComponent(match[1])
      return name
        .replace(/\./g, " ")
        .replace(/([A-Z])/g, " $1")
        .trim()
    }
  }

  return input
}

const getFacebookUrl = (input: string): string => {
  if (!input) return ""

  // If it's already a full URL, return as is
  if (input.startsWith("http")) {
    return input
  }

  return `https://www.facebook.com/${input}`
}

// Componente principal de la aplicación con contexto de tenant
function App() {
  const [view, setView] = useState<"home" | "booking" | "admin" | "login">("home")
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null as AdminUser | null,
    loading: true,
  })

  // Contexto de tenant
  const { tenant, isLoading: tenantLoading, error: tenantError } = useTenant()

  // Real-time salon settings (ahora específicos del tenant y actualizables)
  const salonName = useSalonName()
  const salonMotto = useSalonMotto()
  const salonAddress = useSalonAddress()
  const salonPhone = useSalonPhone()
  const salonEmail = useSalonEmail()
  const salonWhatsApp = useSalonWhatsApp()
  const salonInstagram = useSalonInstagram()
  const salonFacebook = useSalonFacebook()
  const salonWebsite = useSalonWebsite()
  const salonHours = useSalonHours()

  // Real-time theme (ahora específico del tenant)
  const { activeTheme, colors } = useTheme()

  useEffect(() => {
    const initAuth = async () => {
      // Solo inicializar auth si tenemos un tenant válido
      if (!tenant) return

      await initializeDefaultAdmin()

      const authenticated = isAuthenticated()
      const user = getCurrentUser()

      setAuthState({
        isAuthenticated: authenticated,
        user,
        loading: false,
      })
    }

    if (tenant && !tenantLoading) {
      initAuth()
      // Initialize theme system para el tenant específico
      initializeThemeSystem()
    }
  }, [tenant, tenantLoading])

  // Mostrar loading mientras se carga el tenant
  if (tenantLoading || (!tenant && !tenantError)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando salón...</p>
        </div>
      </div>
    )
  }

  // Mostrar error si no se encuentra el tenant
  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Salón no encontrado</h1>
          <p className="text-gray-600 mb-6">{tenantError || "El salón que buscas no existe o no está disponible."}</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  const handleLoginSuccess = (user: AdminUser, session: AuthSession) => {
    setAuthState({
      isAuthenticated: true,
      user,
      loading: false,
    })
    setView("admin")
  }

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
    })
    setView("home")
  }

  const handleAdminAccess = () => {
    if (authState.isAuthenticated) {
      setView("admin")
    } else {
      setView("login")
    }
  }

  if (authState.loading) {
    return (
      <div
        className="min-h-screen theme-transition"
        style={{
          background: `linear-gradient(135deg, ${colors?.background || "#f8fafc"}, ${colors?.surface || "#ffffff"})`,
        }}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div
              className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
              style={{
                borderColor: `${colors?.border || "#e5e7eb"}`,
                borderTopColor: colors?.primary || "#0ea5e9",
              }}
            ></div>
            <p style={{ color: colors?.textSecondary || "#6b7280" }}>Cargando sistema...</p>
            <p className="text-sm mt-2" style={{ color: colors?.textSecondary || "#6b7280" }}>
              Salón: {tenant.name}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderHome = () => (
    <div
      className="min-h-screen relative overflow-hidden theme-transition"
      style={{
        background: `linear-gradient(135deg, ${colors?.background || "#f8fafc"}, ${colors?.surface || "#ffffff"})`,
      }}
    >
      {/* Información del tenant en desarrollo */}
      <div className="fixed top-4 right-4 z-40 bg-black/80 text-white px-3 py-1 rounded text-xs">
        Tenant: {tenant.name} ({tenant.slug})
      </div>

      {/* Mediterranean decorative elements with theme colors */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(135deg, ${colors?.primary || "#0ea5e9"}, ${colors?.secondary || "#06b6d4"})`,
          }}
        ></div>
        <div
          className="absolute top-40 right-20 w-48 h-48 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(135deg, ${colors?.secondary || "#06b6d4"}, ${colors?.accent || "#8b5cf6"})`,
          }}
        ></div>
        <div
          className="absolute bottom-40 left-1/4 w-40 h-40 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(135deg, ${colors?.accent || "#8b5cf6"}, ${colors?.primary || "#0ea5e9"})`,
          }}
        ></div>
        <div
          className="absolute bottom-20 right-1/3 w-36 h-36 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(135deg, ${colors?.primary || "#0ea5e9"}, ${colors?.secondary || "#06b6d4"})`,
          }}
        ></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div
              className="p-4 rounded-full shadow-lg theme-transition"
              style={{
                background: `linear-gradient(135deg, ${colors?.primary || "#0ea5e9"}, ${colors?.secondary || "#06b6d4"})`,
              }}
            >
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold mb-6 theme-transition"
            style={{
              background: `linear-gradient(135deg, ${colors?.primary || "#0ea5e9"}, ${colors?.secondary || "#06b6d4"}, ${colors?.accent || "#8b5cf6"})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {salonName || tenant.name}
          </h1>
          <p
            className="text-xl max-w-2xl mx-auto mb-12 theme-transition"
            style={{ color: colors?.textSecondary || "#6b7280" }}
          >
            {salonMotto || tenant.description}
          </p>
        </div>

        {/* Solo mostrar la opción de Reservar Cita */}
        <div className="flex justify-center mb-16">
          <div
            onClick={() => setView("booking")}
            className="group rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 max-w-md w-full theme-transition"
            style={{
              backgroundColor: `${colors?.surface || "#ffffff"}cc`,
              backdropFilter: "blur(8px)",
              border: `1px solid ${colors?.border || "#e5e7eb"}33`,
            }}
          >
            <div
              className="p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform shadow-lg mx-auto theme-transition"
              style={{
                background: `linear-gradient(135deg, ${colors?.primary || "#0ea5e9"}, ${colors?.secondary || "#06b6d4"})`,
              }}
            >
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3
              className="text-2xl font-bold mb-4 text-center theme-transition"
              style={{ color: colors?.text || "#1f2937" }}
            >
              Reservar Cita
            </h3>
            <p className="text-center mb-6 theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
              Agenda tu cita de manera fácil y rápida. Selecciona tus servicios favoritos y el horario que mejor te
              convenga.
            </p>
            <div
              className="flex items-center justify-center font-semibold group-hover:translate-x-1 transition-transform theme-transition"
              style={{ color: colors?.primary || "#0ea5e9" }}
            >
              <span>Comenzar reserva</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Contact Information Panel - Now using real-time salon settings */}
        <div className="max-w-6xl mx-auto mb-16">
          <div
            className="rounded-3xl shadow-xl overflow-hidden theme-transition"
            style={{
              backgroundColor: `${colors?.surface || "#ffffff"}cc`,
              backdropFilter: "blur(8px)",
              border: `1px solid ${colors?.border || "#e5e7eb"}33`,
            }}
          >
            <div
              className="p-8 text-white text-center theme-transition"
              style={{
                background: `linear-gradient(135deg, ${colors?.primary || "#0ea5e9"}, ${colors?.secondary || "#06b6d4"}, ${colors?.accent || "#8b5cf6"})`,
              }}
            >
              <h2 className="text-3xl font-bold mb-2">📍 Visítanos</h2>
              <p className="opacity-90">Información de contacto y ubicación</p>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Location - Now from salon settings */}
                <div className="text-center group">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-md theme-transition"
                    style={{ backgroundColor: `${colors?.primary || "#0ea5e9"}1a` }}
                  >
                    <MapPin className="w-8 h-8" style={{ color: colors?.primary || "#0ea5e9" }} />
                  </div>
                  <h3
                    className="text-lg font-semibold mb-2 theme-transition"
                    style={{ color: colors?.text || "#1f2937" }}
                  >
                    Ubicación
                  </h3>
                  <p
                    className="text-sm leading-relaxed theme-transition"
                    style={{ color: colors?.textSecondary || "#6b7280" }}
                  >
                    {salonAddress || tenant.address}
                  </p>
                </div>

                {/* Contact - Now from salon settings */}
                <div className="text-center group">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-md theme-transition"
                    style={{ backgroundColor: `${colors?.accent || "#8b5cf6"}1a` }}
                  >
                    <Phone className="w-8 h-8" style={{ color: colors?.accent || "#8b5cf6" }} />
                  </div>
                  <h3
                    className="text-lg font-semibold mb-2 theme-transition"
                    style={{ color: colors?.text || "#1f2937" }}
                  >
                    Contacto
                  </h3>
                  <div className="text-sm space-y-2">
                    <a
                      href={`tel:${salonPhone || tenant.phone}`}
                      className="block font-medium transition-colors theme-transition"
                      style={{ color: colors?.primary || "#0ea5e9" }}
                    >
                      📱 {salonPhone || tenant.phone}
                    </a>
                    <a
                      href={`mailto:${salonEmail || tenant.email}`}
                      className="block transition-colors theme-transition"
                      style={{ color: colors?.primary || "#0ea5e9" }}
                    >
                      📧 {salonEmail || tenant.email}
                    </a>
                  </div>
                </div>

                {/* WhatsApp - New from salon settings */}
                {salonWhatsApp && (
                  <div className="text-center group">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-md theme-transition"
                      style={{ backgroundColor: `${colors?.success || "#10b981"}1a` }}
                    >
                      <MessageCircle className="w-8 h-8" style={{ color: colors?.success || "#10b981" }} />
                    </div>
                    <h3
                      className="text-lg font-semibold mb-2 theme-transition"
                      style={{ color: colors?.text || "#1f2937" }}
                    >
                      WhatsApp
                    </h3>
                    <a
                      href={`https://wa.me/${salonWhatsApp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium transition-colors theme-transition"
                      style={{ color: colors?.success || "#10b981" }}
                    >
                      💬 Enviar mensaje
                    </a>
                  </div>
                )}

                {/* Social Media - Enhanced with clean display */}
                {(salonInstagram || salonFacebook || salonWebsite) && (
                  <div className="text-center group">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-md theme-transition"
                      style={{ backgroundColor: `${colors?.secondary || "#06b6d4"}1a` }}
                    >
                      <Instagram className="w-8 h-8" style={{ color: colors?.secondary || "#06b6d4" }} />
                    </div>
                    <h3
                      className="text-lg font-semibold mb-2 theme-transition"
                      style={{ color: colors?.text || "#1f2937" }}
                    >
                      Síguenos
                    </h3>
                    <div className="text-sm space-y-2">
                      {salonInstagram && (
                        <a
                          href={getInstagramUrl(salonInstagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block transition-colors hover:scale-105 transform theme-transition"
                          style={{ color: colors?.secondary || "#06b6d4" }}
                        >
                          📷 {getInstagramUsername(salonInstagram)}
                        </a>
                      )}
                      {salonFacebook && (
                        <a
                          href={getFacebookUrl(salonFacebook)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block transition-colors hover:scale-105 transform theme-transition"
                          style={{ color: colors?.secondary || "#06b6d4" }}
                        >
                          👥 {getFacebookDisplayName(salonFacebook)}
                        </a>
                      )}
                      {salonWebsite && (
                        <a
                          href={salonWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block transition-colors hover:scale-105 transform theme-transition"
                          style={{ color: colors?.secondary || "#06b6d4" }}
                        >
                          🌐 Sitio Web
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Hours Section - New from salon settings */}
              {salonHours && Object.keys(salonHours).length > 0 && (
                <div className="mt-12 pt-8 border-t" style={{ borderColor: colors?.border || "#e5e7eb" }}>
                  <div className="text-center mb-6">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 theme-transition"
                      style={{ backgroundColor: `${colors?.warning || "#f59e0b"}1a` }}
                    >
                      <Clock className="w-6 h-6" style={{ color: colors?.warning || "#f59e0b" }} />
                    </div>
                    <h3 className="text-xl font-semibold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                      Horarios de Atención
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                    {Object.entries(salonHours).map(([day, schedule]: [string, any]) => {
                      const dayNames = {
                        monday: "Lunes",
                        tuesday: "Martes",
                        wednesday: "Miércoles",
                        thursday: "Jueves",
                        friday: "Viernes",
                        saturday: "Sábado",
                        sunday: "Domingo",
                      }

                      return (
                        <div
                          key={day}
                          className="text-center p-3 rounded-lg theme-transition"
                          style={{ backgroundColor: colors?.background || "#f8fafc" }}
                        >
                          <div
                            className="font-semibold text-sm mb-1 theme-transition"
                            style={{ color: colors?.text || "#1f2937" }}
                          >
                            {dayNames[day as keyof typeof dayNames]}
                          </div>
                          <div
                            className="text-xs theme-transition"
                            style={{ color: colors?.textSecondary || "#6b7280" }}
                          >
                            {schedule?.isOpen ? `${schedule.open} - ${schedule.close}` : "Cerrado"}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Admin Button - Bottom Right */}
      <button
        onClick={handleAdminAccess}
        className="fixed bottom-6 right-6 z-50 group text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 theme-transition"
        style={{
          background: `linear-gradient(135deg, ${colors?.accent || "#8b5cf6"}, ${colors?.primary || "#0ea5e9"})`,
        }}
        title="Panel Administrativo"
      >
        <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  )

  if (view === "login") {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />
  }

  if (view === "booking") {
    return (
      <div>
        <button
          onClick={() => setView("home")}
          className="fixed top-4 left-4 z-50 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-shadow font-medium theme-transition"
          style={{
            backgroundColor: colors?.surface || "#ffffff",
            color: colors?.primary || "#0ea5e9",
          }}
        >
          ← Volver al Inicio
        </button>
        <ClientBooking />
      </div>
    )
  }

  if (view === "admin") {
    return (
      <div>
        <button
          onClick={() => setView("home")}
          className="fixed top-4 left-4 z-50 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-shadow font-medium theme-transition"
          style={{
            backgroundColor: colors?.surface || "#ffffff",
            color: colors?.primary || "#0ea5e9",
          }}
        >
          ← Volver al Inicio
        </button>
        <AdminPanel onLogout={handleLogout} />
      </div>
    )
  }

  return renderHome()
}

export default App
