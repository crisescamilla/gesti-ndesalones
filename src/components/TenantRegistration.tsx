// "use client"

import type React from "react"
import { useState } from "react"
import { ArrowLeft, Palette, MapPin, Phone, Mail, Globe, Save, AlertCircle, CheckCircle } from "lucide-react"
import type { Tenant, TenantOwner } from "../types/tenant"
import {
  createTenant,
  generateSlug,
  isSlugAvailable,
  businessTypeConfigs,
  saveTenantOwner,
} from "../utils/tenantManager"
import { useTheme } from "../hooks/useTheme"
import { createTenantInSupabase } from '../utils/supabaseSync'

const origin = typeof window !== "undefined" ? window.location.origin : "";

// Expanded color palette for salon customization
const COLOR_OPTIONS = [
  { name: "Azul", value: "#1E90FF", description: "Profesional y confiable" },
  { name: "Verde", value: "#32CD32", description: "Natural y relajante" },
  { name: "Rojo", value: "#FF4500", description: "Energético y llamativo" },
  { name: "Amarillo", value: "#FFD700", description: "Alegre y luminoso" },
  { name: "Morado", value: "#9370DB", description: "Elegante y sofisticado" },
  { name: "Naranja", value: "#FFA500", description: "Cálido y acogedor" },
  { name: "Rosa", value: "#FF69B4", description: "Femenino y delicado" },
  { name: "Turquesa", value: "#40E0D0", description: "Fresco y moderno" },
  { name: "Gris", value: "#808080", description: "Neutro y versátil" },
  { name: "Marrón", value: "#8B4513", description: "Cálido y natural" },
  // Additional complementary colors
  { name: "Coral", value: "#FF7F50", description: "Vibrante y tropical" },
  { name: "Lavanda", value: "#E6E6FA", description: "Suave y relajante" },
  { name: "Dorado", value: "#DAA520", description: "Lujoso y premium" },
  { name: "Menta", value: "#98FB98", description: "Fresco y spa" },
  { name: "Fucsia", value: "#FF1493", description: "Audaz y moderno" },
]

const TenantRegistration: React.FC = () => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Owner data
  const [ownerData, setOwnerData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  // Tenant data
  const [tenantData, setTenantData] = useState({
    name: "",
    businessType: "salon" as const,
    slug: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    primaryColor: "#ec4899",
    secondaryColor: "#8b5cf6",
  })

  const { colors } = useTheme()

  const handleOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!ownerData.firstName || !ownerData.lastName || !ownerData.email || !ownerData.phone) {
      setMessage({ type: "error", text: "Todos los campos son requeridos" })
      return
    }

    if (ownerData.password !== ownerData.confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" })
      return
    }

    if (ownerData.password.length < 8) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 8 caracteres" })
      return
    }

    setMessage(null)
    setStep(2)
  }

  const handleTenantNameChange = (name: string) => {
    setTenantData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }))
  }

  const handleSlugChange = (slug: string) => {
    const cleanSlug = generateSlug(slug)
    setTenantData((prev) => ({ ...prev, slug: cleanSlug }))
  }

  const handleBusinessTypeChange = (businessType: string) => {
    const config = businessTypeConfigs.find((c) => c.id === businessType)
    if (config) {
      setTenantData((prev) => ({
        ...prev,
        businessType: businessType as any,
        primaryColor: config.defaultColors.primary,
        secondaryColor: config.defaultColors.secondary,
      }))
    }
  }

  const handleColorChange = (colorType: "primary" | "secondary", colorValue: string) => {
    setTenantData((prev) => ({
      ...prev,
      [colorType === "primary" ? "primaryColor" : "secondaryColor"]: colorValue,
    }))
  }

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Validation
      if (!tenantData.name || !tenantData.slug || !tenantData.address || !tenantData.phone || !tenantData.email) {
        throw new Error("Todos los campos obligatorios deben ser completados")
      }

      if (!isSlugAvailable(tenantData.slug)) {
        throw new Error("La URL personalizada ya está en uso. Elige otra.")
      }

      // Create owner
      const owner: TenantOwner = {
        id: Date.now().toString(),
        email: ownerData.email,
        firstName: ownerData.firstName,
        lastName: ownerData.lastName,
        phone: ownerData.phone,
        passwordHash: await hashPassword(ownerData.password),
        isEmailVerified: false,
        createdAt: new Date().toISOString(),
        tenants: [],
      }

      // Create tenant with admin user
      const tenant: Omit<Tenant, "id" | "createdAt" | "updatedAt"> = {
        name: tenantData.name,
        slug: tenantData.slug,
        businessType: tenantData.businessType,
        logo: undefined,
        primaryColor: tenantData.primaryColor,
        secondaryColor: tenantData.secondaryColor,
        address: tenantData.address,
        phone: tenantData.phone,
        email: tenantData.email,
        website: tenantData.website || undefined,
        description: tenantData.description,
        isActive: true,
        ownerId: owner.id,
        subscription: {
          plan: "premium",
          status: "active",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        settings: {
          allowOnlineBooking: true,
          requireApproval: false,
          timeZone: "America/Mexico_City",
          currency: "MXN",
          language: "es",
        },
      }

      // Create tenant locally
      const createdTenant = createTenant(tenant, owner.id, {
        firstName: ownerData.firstName,
        lastName: ownerData.lastName,
        email: ownerData.email,
        password: ownerData.password,
      })

      // Update owner with tenant ID
      owner.tenants = [createdTenant.id]
      saveTenantOwner(owner)

      // Sincronizar con Supabase
      const syncResult = await createTenantInSupabase(createdTenant, owner)
      
      if (syncResult.success) {
        setMessage({
          type: "success",
          text: "¡Negocio registrado exitosamente! Sincronizado con la base de datos. Redirigiendo...",
        })
      } else {
        setMessage({
          type: "success",
          text: "¡Negocio registrado localmente! Error de sincronización: " + syncResult.message,
        })
      }

      // Redirect to tenant URL after 2 seconds
      setTimeout(() => {
        window.location.href = `/${createdTenant.slug}`
      }, 2000)
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error al registrar el negocio",
      })
    } finally {
      setLoading(false)
    }
  }

  // Simple password hashing (in production, use proper bcrypt)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password + "beauty-app-salt")
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  const selectedBusinessConfig = businessTypeConfigs.find((c) => c.id === tenantData.businessType)
  const isSlugValid = tenantData.slug && isSlugAvailable(tenantData.slug)

  // Color selector component
  const ColorSelector = ({
    label,
    value,
    onChange,
    colorType,
  }: {
    label: string
    value: string
    onChange: (color: string) => void
    colorType: "primary" | "secondary"
  }) => {
    const [isOpen, setIsOpen] = useState(false)
    const selectedColor = COLOR_OPTIONS.find((c) => c.value === value)

    return (
      <div className="relative">
        <label className="block text-xs text-gray-600 mb-2">{label}</label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200" style={{ backgroundColor: value }} />
            <span className="text-sm font-medium">{selectedColor?.name || "Color personalizado"}</span>
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            <div className="p-2">
              <div className="grid grid-cols-1 gap-1">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => {
                      onChange(color.value)
                      setIsOpen(false)
                    }}
                    className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                      value === color.value ? "bg-purple-50 border border-purple-200" : ""
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-200 flex-shrink-0"
                      style={{ backgroundColor: color.value }}
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm text-gray-900">{color.name}</div>
                      <div className="text-xs text-gray-500">{color.description}</div>
                      <div className="text-xs text-gray-400 font-mono">{color.value}</div>
                    </div>
                    {value === color.value && <CheckCircle className="w-4 h-4 text-purple-600" />}
                  </button>
                ))}
              </div>

              {/* Custom color input */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <label className="block text-xs text-gray-600 mb-2">Color personalizado</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                    aria-label="Seleccionar color personalizado"
                    title="Seleccionar color personalizado"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 font-mono"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <button
              onClick={() => (step === 1 ? window.history.back() : setStep(1))}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
              title="Regresar"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Registrar Nuevo Negocio</h1>
              <p className="text-gray-600 mt-1">
                Paso {step} de 2: {step === 1 ? "Información del Propietario" : "Información del Negocio"}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= 1 ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <div className={`flex-1 h-1 mx-4 ${step >= 2 ? "bg-purple-600" : "bg-gray-200"}`} />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= 2 ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center">
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}

          {/* Step 1: Owner Information */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Información del Propietario</h2>

              <form onSubmit={handleOwnerSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                    <input
                      type="text"
                      value={ownerData.firstName}
                      onChange={(e) => setOwnerData((prev) => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apellido *</label>
                    <input
                      type="text"
                      value={ownerData.lastName}
                      onChange={(e) => setOwnerData((prev) => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (será tu nombre de usuario) *
                  </label>
                  <input
                    type="email"
                    value={ownerData.email}
                    onChange={(e) => setOwnerData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Este email será tu nombre de usuario para acceder al panel administrativo
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                  <input
                    type="tel"
                    value={ownerData.phone}
                    onChange={(e) => setOwnerData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña *</label>
                    <input
                      type="password"
                      value={ownerData.password}
                      onChange={(e) => setOwnerData((prev) => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      minLength={8}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña *</label>
                    <input
                      type="password"
                      value={ownerData.confirmPassword}
                      onChange={(e) => setOwnerData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      minLength={8}
                      required
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Credenciales de Acceso</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Estas credenciales te permitirán acceder al panel administrativo de tu negocio:
                      </p>
                      <ul className="text-sm text-blue-700 mt-2 space-y-1">
                        <li>
                          • <strong>Usuario:</strong> Tu email
                        </li>
                        <li>
                          • <strong>Contraseña:</strong> La que elijas aquí
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                >
                  Continuar
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Business Information */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Información del Negocio</h2>

              <form onSubmit={handleTenantSubmit} className="space-y-6">
                {/* Business Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Negocio *</label>
                  <select
                    value={tenantData.businessType}
                    onChange={(e) => handleBusinessTypeChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    aria-label="Seleccionar tipo de negocio"
                  >
                    {businessTypeConfigs.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                  {selectedBusinessConfig && (
                    <p className="text-sm text-gray-600 mt-1">{selectedBusinessConfig.description}</p>
                  )}
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Negocio *</label>
                  <input
                    type="text"
                    value={tenantData.name}
                    onChange={(e) => handleTenantNameChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    //placeholder="Ej: Bella Vita Spa"
                    required
                  />
                </div>

                {/* Custom URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL Personalizada *</label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 text-gray-600 px-4 py-3 rounded-l-xl border border-r-0 border-gray-300">
                      {origin}/
                    </span>
                    <input
                      type="text"
                      value={tenantData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className={`flex-1 px-4 py-3 border rounded-r-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        isSlugValid ? "border-gray-300" : "border-red-300"
                      }`}
                      placeholder="mi-salon-belleza"
                      required
                    />
                  </div>
                  {tenantData.slug && (
                    <p className={`text-sm mt-1 ${isSlugValid ? "text-green-600" : "text-red-600"}`}>
                      {isSlugValid ? "✓ URL disponible" : "✗ URL no disponible"}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <textarea
                    value={tenantData.description}
                    onChange={(e) => setTenantData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe tu negocio..."
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={tenantData.phone}
                      onChange={(e) => setTenantData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={tenantData.email}
                      onChange={(e) => setTenantData((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={tenantData.address}
                    onChange={(e) => setTenantData((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Dirección completa del negocio"
                    required
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Sitio Web (Opcional)
                  </label>
                  <input
                    type="url"
                    value={tenantData.website}
                    onChange={(e) => setTenantData((prev) => ({ ...prev, website: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://mi-sitio-web.com"
                  />
                </div>

                {/* Enhanced Brand Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    <Palette className="w-4 h-4 inline mr-1" />
                    Colores de Marca
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ColorSelector
                      label="Color Primario"
                      value={tenantData.primaryColor}
                      onChange={(color) => handleColorChange("primary", color)}
                      colorType="primary"
                    />

                    <ColorSelector
                      label="Color Secundario"
                      value={tenantData.secondaryColor}
                      onChange={(color) => handleColorChange("secondary", color)}
                      colorType="secondary"
                    />
                  </div>

                  {/* Enhanced Color Preview */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Vista Previa de Colores</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Gradient Preview */}
                      <div
                        className="p-6 rounded-xl text-white"
                        style={{
                          background: `linear-gradient(135deg, ${tenantData.primaryColor}, ${tenantData.secondaryColor})`,
                        }}
                      >
                        <h3 className="font-bold text-lg">{tenantData.name || "Tu Salón"}</h3>
                        <p className="text-sm opacity-90">Así se verá tu marca</p>
                      </div>

                      {/* Individual Colors Preview */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-gray-200"
                            style={{ backgroundColor: tenantData.primaryColor }}
                          />
                          <div>
                            <p className="font-medium text-sm">Color Primario</p>
                            <p className="text-xs text-gray-500 font-mono">{tenantData.primaryColor}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-gray-200"
                            style={{ backgroundColor: tenantData.secondaryColor }}
                          />
                          <div>
                            <p className="font-medium text-sm">Color Secundario</p>
                            <p className="text-xs text-gray-500 font-mono">{tenantData.secondaryColor}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !isSlugValid}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  {loading ? "Registrando..." : "Registrar Negocio"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TenantRegistration
