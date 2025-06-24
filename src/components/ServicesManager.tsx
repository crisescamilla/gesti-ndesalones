"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  DollarSign,
  Clock,
  Tag,
  Search,
  Filter,
  TrendingUp,
  Package,
  Scissors,
  History,
} from "lucide-react"
import type { Service, Product, ServiceCategory } from "../types"
import { useServicesManager } from "../utils/servicesManager"
import { serviceCategories } from "../data/services"
import { getCurrentUser } from "../utils/auth"
import { useTheme } from "../hooks/useTheme"

const ServicesManager: React.FC = () => {
  const servicesManager = useServicesManager()
  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState<"services" | "products" | "bulk-edit">("services")
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<ServiceCategory | "all">("all")
  const [statistics, setStatistics] = useState(servicesManager.getServicesStatistics())
  const [showPriceHistory, setShowPriceHistory] = useState<string | null>(null)
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [bulkPriceChange, setBulkPriceChange] = useState<{ type: "percentage" | "fixed"; value: number }>({
    type: "percentage",
    value: 0,
  })

  const currentUser = getCurrentUser()

  // Real-time theme
  const { colors } = useTheme()

  useEffect(() => {
    loadData()
  }, [servicesManager.tenantId]) // Recargar cuando cambie el tenant

  const loadData = () => {
    setServices(servicesManager.getServices())
    setProducts(servicesManager.getProducts())
    setStatistics(servicesManager.getServicesStatistics())
  }

  const handleSaveService = (serviceData: Partial<Service>) => {
    if (!currentUser) return

    try {
      if (serviceData.id) {
        const existingService = services.find((s) => s.id === serviceData.id)
        if (existingService) {
          const updatedService = { ...existingService, ...serviceData }
          servicesManager.saveService(updatedService, currentUser.username)
        }
      } else {
        servicesManager.createService(
          serviceData as Omit<Service, "id" | "createdAt" | "updatedAt">,
          currentUser.username,
        )
      }

      loadData()
      setEditingItem(null)
      setShowAddForm(false)
    } catch (error) {
      console.error("Error saving service:", error)
    }
  }

  const handleSaveProduct = (productData: Partial<Product>) => {
    if (!currentUser) return

    try {
      if (productData.id) {
        // Update existing product
        const existingProduct = products.find((p) => p.id === productData.id)
        if (existingProduct) {
          const updatedProduct = { ...existingProduct, ...productData }
          servicesManager.saveProduct(updatedProduct, currentUser.username)
        }
      } else {
        // Create new product
        servicesManager.createProduct(
          productData as Omit<Product, "id" | "createdAt" | "updatedAt">,
          currentUser.username,
        )
      }

      loadData()
      setEditingItem(null)
      setShowAddForm(false)
    } catch (error) {
      console.error("Error saving product:", error)
    }
  }

  const handleDeleteService = (serviceId: string) => {
    if (!currentUser) return

    if (confirm("¿Estás seguro de que deseas eliminar este servicio?")) {
      servicesManager.deleteService(serviceId, currentUser.username)
      loadData()
    }
  }

  const handleDeleteProduct = (productId: string) => {
    if (!currentUser) return

    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      servicesManager.deleteProduct(productId, currentUser.username)
      loadData()
    }
  }

  const handleBulkPriceUpdate = () => {
    if (!currentUser || selectedItems.length === 0) return

    const updates = selectedItems
      .map((serviceId) => {
        const service = services.find((s) => s.id === serviceId)
        if (!service) return null

        let newPrice: number
        if (bulkPriceChange.type === "percentage") {
          newPrice = service.price * (1 + bulkPriceChange.value / 100)
        } else {
          newPrice = service.price + bulkPriceChange.value
        }

        return {
          serviceId,
          newPrice: Math.round(newPrice),
        }
      })
      .filter(Boolean) as { serviceId: string; newPrice: number }[]

    if (confirm(`¿Actualizar precios de ${updates.length} servicios?`)) {
      servicesManager.bulkUpdatePrices(updates, currentUser.username)
      loadData()
      setSelectedItems([])
      setBulkEditMode(false)
    }
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || service.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const filteredProducts = products.filter((product) => {
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold flex items-center theme-transition"
            style={{ color: colors?.text || "#1f2937" }}
          >
            <Scissors className="w-8 h-8 mr-3" style={{ color: colors?.accent || "#8b5cf6" }} />
            Gestión de Servicios y Productos
          </h2>
          <p className="mt-1 theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
            Administra servicios, productos y precios del salón
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 text-white rounded-lg transition-colors theme-transition"
          style={{ backgroundColor: colors?.accent || "#8b5cf6" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar {activeTab === "services" ? "Servicio" : "Producto"}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || "#ffffff" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                Servicios Activos
              </p>
              <p className="text-2xl font-bold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                {statistics.activeServices}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.primary || "#0ea5e9"}1a` }}
            >
              <Scissors className="w-6 h-6" style={{ color: colors?.primary || "#0ea5e9" }} />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || "#ffffff" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                Productos Activos
              </p>
              <p className="text-2xl font-bold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                {statistics.activeProducts}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.success || "#10b981"}1a` }}
            >
              <Package className="w-6 h-6" style={{ color: colors?.success || "#10b981" }} />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || "#ffffff" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                Precio Promedio Servicios
              </p>
              <p className="text-2xl font-bold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                ${statistics.avgServicePrice.toFixed(0)}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.accent || "#8b5cf6"}1a` }}
            >
              <DollarSign className="w-6 h-6" style={{ color: colors?.accent || "#8b5cf6" }} />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || "#ffffff" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                Cambios de Precio (7d)
              </p>
              <p className="text-2xl font-bold theme-transition" style={{ color: colors?.warning || "#f59e0b" }}>
                {statistics.recentPriceChanges}
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

      {/* Tabs */}
      <div className="rounded-xl shadow-lg theme-transition" style={{ backgroundColor: colors?.surface || "#ffffff" }}>
        <div className="border-b theme-transition" style={{ borderColor: colors?.border || "#e5e7eb" }}>
          <nav className="flex space-x-8 px-6">
            {[
              { id: "services", label: "Servicios", icon: Scissors },
              { id: "products", label: "Productos", icon: Package },
              { id: "bulk-edit", label: "Edición Masiva", icon: Edit3 },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors theme-transition"
                  style={{
                    borderBottomColor: isActive ? colors?.accent || "#8b5cf6" : "transparent",
                    color: isActive ? colors?.accent || "#8b5cf6" : colors?.textSecondary || "#6b7280",
                  }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: colors?.textSecondary || "#6b7280" }}
              />
              <input
                type="text"
                placeholder={`Buscar ${activeTab === "services" ? "servicios" : "productos"}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:border-transparent theme-transition"
                style={{
                  border: `1px solid ${colors?.border || "#e5e7eb"}`,
                  backgroundColor: colors?.background || "#f8fafc",
                  color: colors?.text || "#1f2937",
                }}
              />
            </div>

            {activeTab === "services" && (
              <div className="relative">
                <Filter
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: colors?.textSecondary || "#6b7280" }}
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as ServiceCategory | "all")}
                  className="pl-10 pr-8 py-2 rounded-lg focus:ring-2 focus:border-transparent theme-transition"
                  style={{
                    border: `1px solid ${colors?.border || "#e5e7eb"}`,
                    backgroundColor: colors?.background || "#f8fafc",
                    color: colors?.text || "#1f2937",
                  }}
                >
                  <option value="all">Todas las categorías</option>
                  {serviceCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === "bulk-edit" && (
              <button
                onClick={() => setBulkEditMode(!bulkEditMode)}
                className="px-4 py-2 rounded-lg font-medium transition-colors theme-transition"
                style={{
                  backgroundColor: bulkEditMode ? colors?.accent || "#8b5cf6" : colors?.background || "#f8fafc",
                  color: bulkEditMode ? "white" : colors?.textSecondary || "#6b7280",
                }}
              >
                {bulkEditMode ? "Cancelar Edición" : "Modo Edición"}
              </button>
            )}
          </div>

          {/* Bulk Edit Controls */}
          {activeTab === "bulk-edit" && bulkEditMode && (
            <div
              className="rounded-lg p-4 mb-6 border theme-transition"
              style={{
                backgroundColor: `${colors?.accent || "#8b5cf6"}0d`,
                borderColor: `${colors?.accent || "#8b5cf6"}33`,
              }}
            >
              <h3 className="font-semibold mb-3 theme-transition" style={{ color: colors?.accent || "#8b5cf6" }}>
                Actualización Masiva de Precios
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label
                    className="block text-sm font-medium mb-2 theme-transition"
                    style={{ color: colors?.text || "#1f2937" }}
                  >
                    Tipo de Cambio
                  </label>
                  <select
                    value={bulkPriceChange.type}
                    onChange={(e) =>
                      setBulkPriceChange({
                        ...bulkPriceChange,
                        type: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg focus:ring-2 theme-transition"
                    style={{
                      border: `1px solid ${colors?.border || "#e5e7eb"}`,
                      backgroundColor: colors?.surface || "#ffffff",
                      color: colors?.text || "#1f2937",
                    }}
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Cantidad Fija ($)</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2 theme-transition"
                    style={{ color: colors?.text || "#1f2937" }}
                  >
                    Valor del Cambio
                  </label>
                  <input
                    type="number"
                    value={bulkPriceChange.value}
                    onChange={(e) =>
                      setBulkPriceChange({
                        ...bulkPriceChange,
                        value: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg focus:ring-2 theme-transition"
                    style={{
                      border: `1px solid ${colors?.border || "#e5e7eb"}`,
                      backgroundColor: colors?.surface || "#ffffff",
                      color: colors?.text || "#1f2937",
                    }}
                    placeholder={bulkPriceChange.type === "percentage" ? "10" : "50"}
                  />
                </div>

                <button
                  onClick={handleBulkPriceUpdate}
                  disabled={selectedItems.length === 0 || bulkPriceChange.value === 0}
                  className="px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed theme-transition"
                  style={{ backgroundColor: colors?.accent || "#8b5cf6" }}
                >
                  Aplicar a {selectedItems.length} servicios
                </button>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === "services" && (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <ServiceRow
                  key={service.id}
                  service={service}
                  isEditing={editingItem === service.id}
                  onEdit={() => setEditingItem(service.id)}
                  onSave={handleSaveService}
                  onCancel={() => setEditingItem(null)}
                  onDelete={() => handleDeleteService(service.id)}
                  onShowHistory={() => setShowPriceHistory(service.id)}
                  bulkEditMode={bulkEditMode}
                  isSelected={selectedItems.includes(service.id)}
                  onSelect={(selected) => {
                    if (selected) {
                      setSelectedItems([...selectedItems, service.id])
                    } else {
                      setSelectedItems(selectedItems.filter((id) => id !== service.id))
                    }
                  }}
                />
              ))}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isEditing={editingItem === product.id}
                  onEdit={() => setEditingItem(product.id)}
                  onSave={handleSaveProduct}
                  onCancel={() => setEditingItem(null)}
                  onDelete={() => handleDeleteProduct(product.id)}
                />
              ))}
            </div>
          )}

          {/* Bulk Edit Tab */}
          {activeTab === "bulk-edit" && (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <ServiceRow
                  key={service.id}
                  service={service}
                  isEditing={false}
                  onEdit={() => {}}
                  onSave={() => {}}
                  onCancel={() => {}}
                  onDelete={() => {}}
                  onShowHistory={() => setShowPriceHistory(service.id)}
                  bulkEditMode={true}
                  isSelected={selectedItems.includes(service.id)}
                  onSelect={(selected) => {
                    if (selected) {
                      setSelectedItems([...selectedItems, service.id])
                    } else {
                      setSelectedItems(selectedItems.filter((id) => id !== service.id))
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <AddItemModal
          type={activeTab === "services" ? "service" : "product"}
          onSave={activeTab === "services" ? handleSaveService : handleSaveProduct}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Price History Modal */}
      {showPriceHistory && <PriceHistoryModal serviceId={showPriceHistory} onClose={() => setShowPriceHistory(null)} />}
    </div>
  )
}

// Service Row Component
interface ServiceRowProps {
  service: Service
  isEditing: boolean
  onEdit: () => void
  onSave: (data: Partial<Service>) => void
  onCancel: () => void
  onDelete: () => void
  onShowHistory: () => void
  bulkEditMode: boolean
  isSelected: boolean
  onSelect: (selected: boolean) => void
}

const ServiceRow: React.FC<ServiceRowProps> = ({
  service,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onShowHistory,
  bulkEditMode,
  isSelected,
  onSelect,
}) => {
  const [formData, setFormData] = useState(service)
  const { colors } = useTheme()

  const handleSave = () => {
    onSave(formData)
  }

  if (isEditing) {
    return (
      <div
        className="border rounded-lg p-4 theme-transition"
        style={{
          backgroundColor: `${colors?.primary || "#0ea5e9"}0d`,
          borderColor: `${colors?.primary || "#0ea5e9"}33`,
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
            style={{
              border: `1px solid ${colors?.border || "#e5e7eb"}`,
              backgroundColor: colors?.surface || "#ffffff",
              color: colors?.text || "#1f2937",
            }}
            placeholder="Nombre del servicio"
          />

          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
            className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
            style={{
              border: `1px solid ${colors?.border || "#e5e7eb"}`,
              backgroundColor: colors?.surface || "#ffffff",
              color: colors?.text || "#1f2937",
            }}
          >
            {serviceCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
            style={{
              border: `1px solid ${colors?.border || "#e5e7eb"}`,
              backgroundColor: colors?.surface || "#ffffff",
              color: colors?.text || "#1f2937",
            }}
            placeholder="Precio"
          />

          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
            className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
            style={{
              border: `1px solid ${colors?.border || "#e5e7eb"}`,
              backgroundColor: colors?.surface || "#ffffff",
              color: colors?.text || "#1f2937",
            }}
            placeholder="Duración (min)"
          />
        </div>

        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full mt-4 px-3 py-2 rounded-lg focus:ring-2 theme-transition"
          style={{
            border: `1px solid ${colors?.border || "#e5e7eb"}`,
            backgroundColor: colors?.surface || "#ffffff",
            color: colors?.text || "#1f2937",
          }}
          placeholder="Descripción del servicio"
          rows={2}
        />

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-1 border rounded-lg transition-colors theme-transition"
            style={{
              color: colors?.textSecondary || "#6b7280",
              borderColor: colors?.border || "#e5e7eb",
              backgroundColor: colors?.background || "#f8fafc",
            }}
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 text-white rounded-lg transition-colors theme-transition"
            style={{ backgroundColor: colors?.success || "#10b981" }}
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow theme-transition"
      style={{
        backgroundColor: isSelected ? `${colors?.accent || "#8b5cf6"}0d` : colors?.surface || "#ffffff",
        borderColor: isSelected ? colors?.accent || "#8b5cf6" : colors?.border || "#e5e7eb",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {bulkEditMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="w-4 h-4 rounded focus:ring-2 theme-transition"
              style={{ accentColor: colors?.accent || "#8b5cf6" }}
            />
          )}

          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                {service.name}
              </h3>
              <span
                className="px-2 py-1 text-xs rounded-full theme-transition"
                style={{
                  backgroundColor:
                    service.isActive !== false
                      ? `${colors?.success || "#10b981"}1a`
                      : `${colors?.error || "#ef4444"}1a`,
                  color: service.isActive !== false ? colors?.success || "#10b981" : colors?.error || "#ef4444",
                }}
              >
                {service.isActive !== false ? "Activo" : "Inactivo"}
              </span>
            </div>

            <p className="text-sm mt-1 theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
              {service.description}
            </p>

            <div className="flex items-center space-x-4 mt-2 text-sm">
              <span
                className="flex items-center theme-transition"
                style={{ color: colors?.textSecondary || "#6b7280" }}
              >
                <Tag className="w-4 h-4 mr-1" />
                {serviceCategories.find((c) => c.id === service.category)?.name}
              </span>
              <span
                className="flex items-center theme-transition"
                style={{ color: colors?.textSecondary || "#6b7280" }}
              >
                <DollarSign className="w-4 h-4 mr-1" />${service.price}
              </span>
              <span
                className="flex items-center theme-transition"
                style={{ color: colors?.textSecondary || "#6b7280" }}
              >
                <Clock className="w-4 h-4 mr-1" />
                {service.duration} min
              </span>
            </div>
          </div>
        </div>

        {!bulkEditMode && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onShowHistory}
              className="p-2 rounded-lg transition-colors theme-transition"
              style={{
                color: colors?.textSecondary || "#6b7280",
                backgroundColor: `${colors?.textSecondary || "#6b7280"}0d`,
              }}
              title="Ver historial de precios"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={onEdit}
              className="p-2 rounded-lg transition-colors theme-transition"
              style={{
                color: colors?.primary || "#0ea5e9",
                backgroundColor: `${colors?.primary || "#0ea5e9"}0d`,
              }}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg transition-colors theme-transition"
              style={{
                color: colors?.error || "#ef4444",
                backgroundColor: `${colors?.error || "#ef4444"}0d`,
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Product Row Component
interface ProductRowProps {
  product: Product
  isEditing: boolean
  onEdit: () => void
  onSave: (data: Partial<Product>) => void
  onCancel: () => void
  onDelete: () => void
}

const ProductRow: React.FC<ProductRowProps> = ({ product, isEditing, onEdit, onSave, onCancel, onDelete }) => {
  const [formData, setFormData] = useState(product)
  const { colors } = useTheme()

  const handleSave = () => {
    onSave(formData)
  }

  if (isEditing) {
    return (
      <div
        className="border rounded-lg p-4 theme-transition"
        style={{
          backgroundColor: `${colors?.primary || "#0ea5e9"}0d`,
          borderColor: `${colors?.primary || "#0ea5e9"}33`,
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
            style={{
              border: `1px solid ${colors?.border || "#e5e7eb"}`,
              backgroundColor: colors?.surface || "#ffffff",
              color: colors?.text || "#1f2937",
            }}
            placeholder="Nombre del producto"
          />

          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
            style={{
              border: `1px solid ${colors?.border || "#e5e7eb"}`,
              backgroundColor: colors?.surface || "#ffffff",
              color: colors?.text || "#1f2937",
            }}
            placeholder="Marca"
          />

          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
            style={{
              border: `1px solid ${colors?.border || "#e5e7eb"}`,
              backgroundColor: colors?.surface || "#ffffff",
              color: colors?.text || "#1f2937",
            }}
            placeholder="Precio"
          />

          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
            className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
            style={{
              border: `1px solid ${colors?.border || "#e5e7eb"}`,
              backgroundColor: colors?.surface || "#ffffff",
              color: colors?.text || "#1f2937",
            }}
            placeholder="Stock"
          />
        </div>

        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full mt-4 px-3 py-2 rounded-lg focus:ring-2 theme-transition"
          style={{
            border: `1px solid ${colors?.border || "#e5e7eb"}`,
            backgroundColor: colors?.surface || "#ffffff",
            color: colors?.text || "#1f2937",
          }}
          placeholder="Descripción del producto"
          rows={2}
        />

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-1 border rounded-lg transition-colors theme-transition"
            style={{
              color: colors?.textSecondary || "#6b7280",
              borderColor: colors?.border || "#e5e7eb",
              backgroundColor: colors?.background || "#f8fafc",
            }}
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 text-white rounded-lg transition-colors theme-transition"
            style={{ backgroundColor: colors?.success || "#10b981" }}
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow theme-transition"
      style={{
        backgroundColor: colors?.surface || "#ffffff",
        borderColor: colors?.border || "#e5e7eb",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
              {product.name}
            </h3>
            <span
              className="px-2 py-1 text-xs rounded-full theme-transition"
              style={{
                backgroundColor:
                  product.isActive !== false ? `${colors?.success || "#10b981"}1a` : `${colors?.error || "#ef4444"}1a`,
                color: product.isActive !== false ? colors?.success || "#10b981" : colors?.error || "#ef4444",
              }}
            >
              {product.isActive !== false ? "Activo" : "Inactivo"}
            </span>
          </div>

          <p className="text-sm mt-1 theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
            {product.description}
          </p>

          <div className="flex items-center space-x-4 mt-2 text-sm">
            <span className="flex items-center theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
              <Tag className="w-4 h-4 mr-1" />
              {product.brand}
            </span>
            <span className="flex items-center theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
              <DollarSign className="w-4 h-4 mr-1" />${product.price}
            </span>
            <span className="flex items-center theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
              <Package className="w-4 h-4 mr-1" />
              Stock: {product.stock}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg transition-colors theme-transition"
            style={{
              color: colors?.primary || "#0ea5e9",
              backgroundColor: `${colors?.primary || "#0ea5e9"}0d`,
            }}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
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
}

// Add Item Modal
interface AddItemModalProps {
  type: "service" | "product"
  onSave: (data: any) => void
  onCancel: () => void
}

const AddItemModal: React.FC<AddItemModalProps> = ({ type, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    type === "service"
      ? {
          name: "",
          category: "tratamientos-faciales" as ServiceCategory,
          price: 0,
          duration: 60,
          description: "",
        }
      : {
          name: "",
          brand: "",
          category: "",
          price: 0,
          stock: 0,
          description: "",
        },
  )

  const { colors } = useTheme()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="rounded-xl shadow-xl max-w-md w-full mx-4 theme-transition"
        style={{ backgroundColor: colors?.surface || "#ffffff" }}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 theme-transition" style={{ color: colors?.text || "#1f2937" }}>
            Agregar Nuevo {type === "service" ? "Servicio" : "Producto"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg focus:ring-2 theme-transition"
              style={{
                border: `1px solid ${colors?.border || "#e5e7eb"}`,
                backgroundColor: colors?.background || "#f8fafc",
                color: colors?.text || "#1f2937",
              }}
              required
            />

            {type === "service" ? (
              <>
                <select
                  value={(formData as any).category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
                  className="w-full px-3 py-2 rounded-lg focus:ring-2 theme-transition"
                  style={{
                    border: `1px solid ${colors?.border || "#e5e7eb"}`,
                    backgroundColor: colors?.background || "#f8fafc",
                    color: colors?.text || "#1f2937",
                  }}
                >
                  {serviceCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Duración (minutos)"
                  value={(formData as any).duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg focus:ring-2 theme-transition"
                  style={{
                    border: `1px solid ${colors?.border || "#e5e7eb"}`,
                    backgroundColor: colors?.background || "#f8fafc",
                    color: colors?.text || "#1f2937",
                  }}
                  required
                />
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Marca"
                  value={(formData as any).brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg focus:ring-2 theme-transition"
                  style={{
                    border: `1px solid ${colors?.border || "#e5e7eb"}`,
                    backgroundColor: colors?.background || "#f8fafc",
                    color: colors?.text || "#1f2937",
                  }}
                  required
                />

                <input
                  type="number"
                  placeholder="Stock inicial"
                  value={(formData as any).stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg focus:ring-2 theme-transition"
                  style={{
                    border: `1px solid ${colors?.border || "#e5e7eb"}`,
                    backgroundColor: colors?.background || "#f8fafc",
                    color: colors?.text || "#1f2937",
                  }}
                  required
                />
              </>
            )}

            <input
              type="number"
              placeholder="Precio"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg focus:ring-2 theme-transition"
              style={{
                border: `1px solid ${colors?.border || "#e5e7eb"}`,
                backgroundColor: colors?.background || "#f8fafc",
                color: colors?.text || "#1f2937",
              }}
              required
            />

            <textarea
              placeholder="Descripción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg focus:ring-2 theme-transition"
              style={{
                border: `1px solid ${colors?.border || "#e5e7eb"}`,
                backgroundColor: colors?.background || "#f8fafc",
                color: colors?.text || "#1f2937",
              }}
              rows={3}
              required
            />

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border rounded-lg transition-colors theme-transition"
                style={{
                  color: colors?.textSecondary || "#6b7280",
                  borderColor: colors?.border || "#e5e7eb",
                  backgroundColor: colors?.background || "#f8fafc",
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-white rounded-lg transition-colors theme-transition"
                style={{ backgroundColor: colors?.accent || "#8b5cf6" }}
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Price History Modal
interface PriceHistoryModalProps {
  serviceId: string
  onClose: () => void
}

const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({ serviceId, onClose }) => {
  const [priceHistory, setPriceHistory] = useState(servicesManager.getServicePriceHistory(serviceId))
  const service = services.find((s) => s.id === serviceId)
  const { colors } = useTheme()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-96 overflow-hidden theme-transition"
        style={{ backgroundColor: colors?.surface || "#ffffff" }}
      >
        <div className="p-6 border-b theme-transition" style={{ borderColor: colors?.border || "#e5e7eb" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold theme-transition" style={{ color: colors?.text || "#1f2937" }}>
              Historial de Precios - {service?.name}
            </h3>
            <button
              onClick={onClose}
              className="transition-colors theme-transition"
              style={{ color: colors?.textSecondary || "#6b7280" }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-80">
          {priceHistory.length > 0 ? (
            <div className="space-y-3">
              {priceHistory.map((history) => (
                <div
                  key={history.id}
                  className="flex items-center justify-between p-3 rounded-lg theme-transition"
                  style={{ backgroundColor: colors?.background || "#f8fafc" }}
                >
                  <div>
                    <p className="text-sm font-medium theme-transition" style={{ color: colors?.text || "#1f2937" }}>
                      ${history.oldPrice} → ${history.newPrice}
                    </p>
                    <p className="text-xs theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                      Por {history.changedBy} • {new Date(history.changedAt).toLocaleString("es-ES")}
                    </p>
                  </div>
                  <div
                    className="px-2 py-1 rounded-full text-xs font-medium theme-transition"
                    style={{
                      backgroundColor:
                        history.newPrice > history.oldPrice
                          ? `${colors?.error || "#ef4444"}1a`
                          : `${colors?.success || "#10b981"}1a`,
                      color:
                        history.newPrice > history.oldPrice ? colors?.error || "#ef4444" : colors?.success || "#10b981",
                    }}
                  >
                    {history.newPrice > history.oldPrice ? "+" : ""}${history.newPrice - history.oldPrice}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="w-12 h-12 mx-auto mb-3" style={{ color: colors?.textSecondary || "#6b7280" }} />
              <p className="theme-transition" style={{ color: colors?.textSecondary || "#6b7280" }}>
                No hay cambios de precio registrados
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServicesManager
