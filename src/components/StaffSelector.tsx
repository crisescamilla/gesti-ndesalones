"use client"

import type React from "react"
import { CheckCircle, Users, Star, Clock } from "lucide-react"
import type { Service } from "../types"
import { useStaffForServices } from "../hooks/useStaffData"
import { useTheme } from "../hooks/useTheme"

interface StaffSelectorProps {
  selectedServices: Service[]
  onStaffSelect: (staffId: string) => void
  selectedStaffId: string
}

const StaffSelector: React.FC<StaffSelectorProps> = ({ selectedServices, onStaffSelect, selectedStaffId }) => {
  const { colors } = useTheme()

  // Obtener especialidades requeridas
  const requiredSpecialties = [...new Set(selectedServices.map((service) => service.category))]

  // Usar el hook para obtener personal disponible
  const { availableStaff, loading } = useStaffForServices(requiredSpecialties)

  console.log("🎯 StaffSelector: Available staff:", {
    requiredSpecialties,
    availableCount: availableStaff.length,
    staffNames: availableStaff.map((s) => s.name),
  })

  if (loading) {
    return (
      <div className="text-center py-8">
        <div
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: colors?.primary || "#0ea5e9" }}
        />
        <p style={{ color: colors?.textSecondary || "#6b7280" }}>Cargando especialistas...</p>
      </div>
    )
  }

  if (availableStaff.length === 0) {
    return (
      <div
        className="p-6 rounded-lg border-2 text-center"
        style={{
          borderColor: colors?.error || "#ef4444",
          backgroundColor: `${colors?.error || "#ef4444"}0d`,
        }}
      >
        <Users className="w-12 h-12 mx-auto mb-4" style={{ color: colors?.error || "#ef4444" }} />
        <h3 className="font-medium mb-2" style={{ color: colors?.error || "#ef4444" }}>
          No hay especialistas disponibles
        </h3>
        <p className="text-sm" style={{ color: colors?.textSecondary || "#6b7280" }}>
          No se encontraron especialistas activos que puedan realizar los servicios seleccionados
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Opción sin especialista asignado */}
      <div
        onClick={() => onStaffSelect("")}
        className="p-4 rounded-lg border-2 cursor-pointer transition-all"
        style={{
          borderColor: !selectedStaffId ? colors?.primary || "#0ea5e9" : colors?.border || "#e5e7eb",
          backgroundColor: !selectedStaffId ? `${colors?.primary || "#0ea5e9"}0d` : colors?.surface || "#ffffff",
        }}
      >
        <h4 className="font-medium" style={{ color: colors?.text || "#1f2937" }}>
          Sin especialista asignado
        </h4>
        <p className="text-sm" style={{ color: colors?.textSecondary || "#6b7280" }}>
          Se asignará automáticamente
        </p>
      </div>

      {/* Lista de especialistas disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableStaff.map((staff) => {
          const canPerformAll = selectedServices.every((service) => staff.specialties.includes(service.category))

          return (
            <div
              key={staff.id}
              onClick={() => onStaffSelect(staff.id)}
              className="p-4 rounded-lg border-2 cursor-pointer transition-all"
              style={{
                borderColor: selectedStaffId === staff.id ? colors?.primary || "#0ea5e9" : colors?.border || "#e5e7eb",
                backgroundColor:
                  selectedStaffId === staff.id ? `${colors?.primary || "#0ea5e9"}0d` : colors?.surface || "#ffffff",
              }}
            >
              <div className="flex items-center mb-3">
                <img
                  src={staff.image || "/placeholder.svg"}
                  alt={staff.name}
                  className="w-12 h-12 rounded-full object-cover mr-3"
                />
                <div className="flex-1">
                  <h4 className="font-medium" style={{ color: colors?.text || "#1f2937" }}>
                    {staff.name}
                  </h4>
                  <p className="text-sm" style={{ color: colors?.textSecondary || "#6b7280" }}>
                    {staff.role}
                  </p>
                </div>
                {canPerformAll && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors?.success || "#10b981" }}
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Rating y experiencia */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1" style={{ color: colors?.warning || "#f59e0b" }} />
                  <span className="text-sm font-medium" style={{ color: colors?.text || "#1f2937" }}>
                    {staff.rating}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" style={{ color: colors?.textSecondary || "#6b7280" }} />
                  <span className="text-sm" style={{ color: colors?.textSecondary || "#6b7280" }}>
                    {staff.experience}
                  </span>
                </div>
              </div>

              {/* Especialidades relevantes */}
              <div className="flex flex-wrap gap-1 mb-2">
                {staff.specialties
                  .filter((specialty) => selectedServices.some((s) => s.category === specialty))
                  .map((specialty) => (
                    <span
                      key={specialty}
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: `${colors?.success || "#10b981"}1a`,
                        color: colors?.success || "#10b981",
                      }}
                    >
                      {specialty.replace("-", " ")}
                    </span>
                  ))}
              </div>

              {/* Indicador de compatibilidad */}
              {canPerformAll ? (
                <p className="text-xs" style={{ color: colors?.success || "#10b981" }}>
                  ✓ Puede realizar todos los servicios seleccionados
                </p>
              ) : (
                <p className="text-xs" style={{ color: colors?.warning || "#f59e0b" }}>
                  ⚠ Puede realizar algunos servicios
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Información adicional */}
      <div
        className="p-3 rounded-lg"
        style={{
          backgroundColor: colors?.background || "#f8fafc",
          border: `1px solid ${colors?.border || "#e5e7eb"}`,
        }}
      >
        <p className="text-sm" style={{ color: colors?.textSecondary || "#6b7280" }}>
          💡 <strong>{availableStaff.length}</strong> especialista{availableStaff.length !== 1 ? "s" : ""} disponible
          {availableStaff.length !== 1 ? "s" : ""} para los servicios seleccionados
        </p>
      </div>
    </div>
  )
}

export default StaffSelector
