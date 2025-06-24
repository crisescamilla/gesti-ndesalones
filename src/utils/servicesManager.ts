// ✅ Gestor de servicios completo - Compatible con ServicesManager.tsx - TENANT AWARE
import type { Service, Product, ServiceCategory } from "../types"
import { emitEvent, AppEvents } from "./eventManager"

// Interfaces para el historial de precios
interface PriceHistory {
  id: string
  serviceId: string
  oldPrice: number
  newPrice: number
  changedBy: string
  changedAt: string
  reason?: string
}

interface ServicesStatistics {
  activeServices: number
  activeProducts: number
  avgServicePrice: number
  recentPriceChanges: number
}

// Función para obtener la clave de almacenamiento específica del tenant
const getTenantStorageKey = (key: string, tenantId?: string): string => {
  // Si no se proporciona tenantId, intentar obtenerlo del contexto actual
  if (!tenantId) {
    const currentTenant = getCurrentTenantFromStorage()
    tenantId = currentTenant?.id
  }

  if (!tenantId) {
    console.warn("No tenant ID available, using default storage")
    return key // Fallback para compatibilidad
  }

  return `tenant-${tenantId}-${key}`
}

// Función auxiliar para obtener el tenant actual del localStorage
const getCurrentTenantFromStorage = () => {
  try {
    const stored = localStorage.getItem("beauty-app-current-tenant")
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Datos de ejemplo de servicios (se inicializarán por tenant)
const getDefaultServices = (): Service[] => [
  {
    id: "1",
    name: "Corte de Cabello",
    description: "Corte profesional personalizado",
    price: 25,
    duration: 45,
    category: "servicios-cabello",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Manicure",
    description: "Cuidado completo de uñas",
    price: 20,
    duration: 60,
    category: "servicios-unas",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Facial Hidratante",
    description: "Tratamiento facial profundo",
    price: 45,
    duration: 90,
    category: "tratamientos-faciales",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Masaje Relajante",
    description: "Masaje corporal completo",
    price: 60,
    duration: 60,
    category: "masajes",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Datos de ejemplo de productos (se inicializarán por tenant)
const getDefaultProducts = (): Product[] => [
  {
    id: "1",
    name: "Shampoo Hidratante",
    description: "Shampoo para cabello seco",
    price: 15,
    brand: "L'Oréal",
    category: "cabello",
    stock: 25,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Crema Facial Anti-edad",
    description: "Crema con retinol para anti-envejecimiento",
    price: 35,
    brand: "Neutrogena",
    category: "facial",
    stock: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// ✅ Funciones principales para servicios - TENANT AWARE
export const getServices = (tenantId?: string): Service[] => {
  try {
    const storageKey = getTenantStorageKey("services", tenantId)
    const stored = localStorage.getItem(storageKey)

    if (stored) {
      return JSON.parse(stored)
    } else {
      // Inicializar con servicios por defecto para este tenant
      const defaultServices = getDefaultServices()
      localStorage.setItem(storageKey, JSON.stringify(defaultServices))
      return defaultServices
    }
  } catch (error) {
    console.error("Error loading services:", error)
    return getDefaultServices()
  }
}

export const getActiveServices = (tenantId?: string): Service[] => {
  try {
    const services = getServices(tenantId)
    return services.filter((service) => service.isActive !== false)
  } catch (error) {
    console.error("Error loading active services:", error)
    return getDefaultServices().filter((service) => service.isActive)
  }
}

export const saveService = (service: Service, changedBy: string, tenantId?: string): void => {
  try {
    const storageKey = getTenantStorageKey("services", tenantId)
    const services = getServices(tenantId)
    const existingIndex = services.findIndex((s) => s.id === service.id)

    if (existingIndex >= 0) {
      const oldService = services[existingIndex]

      // Registrar cambio de precio si es diferente
      if (oldService.price !== service.price) {
        savePriceHistory(
          {
            id: Date.now().toString(),
            serviceId: service.id,
            oldPrice: oldService.price,
            newPrice: service.price,
            changedBy,
            changedAt: new Date().toISOString(),
            reason: "Actualización manual",
          },
          tenantId,
        )
      }

      services[existingIndex] = { ...service, updatedAt: new Date().toISOString() }
    } else {
      services.push(service)
    }

    localStorage.setItem(storageKey, JSON.stringify(services))

    // ✅ Emitir evento
    emitEvent(AppEvents.SERVICE_UPDATED, {
      service,
      changedBy,
      tenantId: tenantId || getCurrentTenantFromStorage()?.id,
      timestamp: new Date().toISOString(),
    })

    console.log(`✅ Service saved for tenant ${tenantId || "current"}:`, service.id)
  } catch (error) {
    console.error("Error saving service:", error)
    throw error
  }
}

export const createService = (
  serviceData: Omit<Service, "id" | "createdAt" | "updatedAt">,
  createdBy: string,
  tenantId?: string,
): Service => {
  try {
    const newService: Service = {
      ...serviceData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const storageKey = getTenantStorageKey("services", tenantId)
    const services = getServices(tenantId)
    services.push(newService)
    localStorage.setItem(storageKey, JSON.stringify(services))

    // ✅ Emitir evento
    emitEvent(AppEvents.SERVICE_CREATED, {
      service: newService,
      createdBy,
      tenantId: tenantId || getCurrentTenantFromStorage()?.id,
      timestamp: new Date().toISOString(),
    })

    console.log(`✅ Service created for tenant ${tenantId || "current"}:`, newService.id)
    return newService
  } catch (error) {
    console.error("Error creating service:", error)
    throw error
  }
}

export const deleteService = (serviceId: string, deletedBy: string, tenantId?: string): void => {
  try {
    const storageKey = getTenantStorageKey("services", tenantId)
    const services = getServices(tenantId)
    const serviceToDelete = services.find((s) => s.id === serviceId)

    if (serviceToDelete) {
      const filteredServices = services.filter((s) => s.id !== serviceId)
      localStorage.setItem(storageKey, JSON.stringify(filteredServices))

      // ✅ Emitir evento
      emitEvent(AppEvents.SERVICE_DELETED, {
        service: serviceToDelete,
        deletedBy,
        tenantId: tenantId || getCurrentTenantFromStorage()?.id,
        timestamp: new Date().toISOString(),
      })

      console.log(`🗑️ Service deleted for tenant ${tenantId || "current"}:`, serviceId)
    }
  } catch (error) {
    console.error("Error deleting service:", error)
    throw error
  }
}

// ✅ Funciones principales para productos - TENANT AWARE
export const getProducts = (tenantId?: string): Product[] => {
  try {
    const storageKey = getTenantStorageKey("products", tenantId)
    const stored = localStorage.getItem(storageKey)

    if (stored) {
      return JSON.parse(stored)
    } else {
      // Inicializar con productos por defecto para este tenant
      const defaultProducts = getDefaultProducts()
      localStorage.setItem(storageKey, JSON.stringify(defaultProducts))
      return defaultProducts
    }
  } catch (error) {
    console.error("Error loading products:", error)
    return getDefaultProducts()
  }
}

export const saveProduct = (product: Product, changedBy: string, tenantId?: string): void => {
  try {
    const storageKey = getTenantStorageKey("products", tenantId)
    const products = getProducts(tenantId)
    const existingIndex = products.findIndex((p) => p.id === product.id)

    if (existingIndex >= 0) {
      products[existingIndex] = { ...product, updatedAt: new Date().toISOString() }
    } else {
      products.push(product)
    }

    localStorage.setItem(storageKey, JSON.stringify(products))

    // ✅ Emitir evento
    emitEvent(AppEvents.PRODUCT_UPDATED, {
      product,
      changedBy,
      tenantId: tenantId || getCurrentTenantFromStorage()?.id,
      timestamp: new Date().toISOString(),
    })

    console.log(`✅ Product saved for tenant ${tenantId || "current"}:`, product.id)
  } catch (error) {
    console.error("Error saving product:", error)
    throw error
  }
}

export const createProduct = (
  productData: Omit<Product, "id" | "createdAt" | "updatedAt">,
  createdBy: string,
  tenantId?: string,
): Product => {
  try {
    const newProduct: Product = {
      ...productData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const storageKey = getTenantStorageKey("products", tenantId)
    const products = getProducts(tenantId)
    products.push(newProduct)
    localStorage.setItem(storageKey, JSON.stringify(products))

    // ✅ Emitir evento
    emitEvent(AppEvents.PRODUCT_CREATED, {
      product: newProduct,
      createdBy,
      tenantId: tenantId || getCurrentTenantFromStorage()?.id,
      timestamp: new Date().toISOString(),
    })

    console.log(`✅ Product created for tenant ${tenantId || "current"}:`, newProduct.id)
    return newProduct
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

export const deleteProduct = (productId: string, deletedBy: string, tenantId?: string): void => {
  try {
    const storageKey = getTenantStorageKey("products", tenantId)
    const products = getProducts(tenantId)
    const productToDelete = products.find((p) => p.id === productId)

    if (productToDelete) {
      const filteredProducts = products.filter((p) => p.id !== productId)
      localStorage.setItem(storageKey, JSON.stringify(filteredProducts))

      // ✅ Emitir evento
      emitEvent(AppEvents.PRODUCT_DELETED, {
        product: productToDelete,
        deletedBy,
        tenantId: tenantId || getCurrentTenantFromStorage()?.id,
        timestamp: new Date().toISOString(),
      })

      console.log(`🗑️ Product deleted for tenant ${tenantId || "current"}:`, productId)
    }
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

// ✅ Funciones para estadísticas - TENANT AWARE
export const getServicesStatistics = (tenantId?: string): ServicesStatistics => {
  try {
    const services = getServices(tenantId)
    const products = getProducts(tenantId)
    const priceHistory = getPriceHistory(tenantId)

    const activeServices = services.filter((s) => s.isActive !== false).length
    const activeProducts = products.filter((p) => p.isActive !== false).length

    const totalServicePrice = services
      .filter((s) => s.isActive !== false)
      .reduce((sum, service) => sum + service.price, 0)
    const avgServicePrice = activeServices > 0 ? totalServicePrice / activeServices : 0

    // Cambios de precio en los últimos 7 días
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentPriceChanges = priceHistory.filter((history) => new Date(history.changedAt) > sevenDaysAgo).length

    return {
      activeServices,
      activeProducts,
      avgServicePrice,
      recentPriceChanges,
    }
  } catch (error) {
    console.error("Error getting services statistics:", error)
    return {
      activeServices: 0,
      activeProducts: 0,
      avgServicePrice: 0,
      recentPriceChanges: 0,
    }
  }
}

// ✅ Funciones para historial de precios - TENANT AWARE
export const getPriceHistory = (tenantId?: string): PriceHistory[] => {
  try {
    const storageKey = getTenantStorageKey("priceHistory", tenantId)
    const stored = localStorage.getItem(storageKey)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error loading price history:", error)
    return []
  }
}

export const savePriceHistory = (history: PriceHistory, tenantId?: string): void => {
  try {
    const storageKey = getTenantStorageKey("priceHistory", tenantId)
    const priceHistory = getPriceHistory(tenantId)
    priceHistory.push(history)

    // Mantener solo los últimos 1000 registros
    if (priceHistory.length > 1000) {
      priceHistory.splice(0, priceHistory.length - 1000)
    }

    localStorage.setItem(storageKey, JSON.stringify(priceHistory))
  } catch (error) {
    console.error("Error saving price history:", error)
  }
}

export const getServicePriceHistory = (serviceId: string, tenantId?: string): PriceHistory[] => {
  try {
    const priceHistory = getPriceHistory(tenantId)
    return priceHistory
      .filter((history) => history.serviceId === serviceId)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
  } catch (error) {
    console.error("Error getting service price history:", error)
    return []
  }
}

// ✅ Función para actualización masiva de precios - TENANT AWARE
export const bulkUpdatePrices = (
  updates: { serviceId: string; newPrice: number }[],
  changedBy: string,
  tenantId?: string,
): void => {
  try {
    const storageKey = getTenantStorageKey("services", tenantId)
    const services = getServices(tenantId)

    updates.forEach(({ serviceId, newPrice }) => {
      const serviceIndex = services.findIndex((s) => s.id === serviceId)
      if (serviceIndex >= 0) {
        const oldPrice = services[serviceIndex].price

        // Registrar cambio de precio
        savePriceHistory(
          {
            id: Date.now().toString() + Math.random(),
            serviceId,
            oldPrice,
            newPrice,
            changedBy,
            changedAt: new Date().toISOString(),
            reason: "Actualización masiva",
          },
          tenantId,
        )

        // Actualizar precio
        services[serviceIndex] = {
          ...services[serviceIndex],
          price: newPrice,
          updatedAt: new Date().toISOString(),
        }
      }
    })

    localStorage.setItem(storageKey, JSON.stringify(services))

    // ✅ Emitir evento
    emitEvent(AppEvents.BULK_PRICE_UPDATE, {
      updates,
      changedBy,
      tenantId: tenantId || getCurrentTenantFromStorage()?.id,
      timestamp: new Date().toISOString(),
    })

    console.log(`✅ Bulk price update completed for tenant ${tenantId || "current"}:`, updates.length, "services")
  } catch (error) {
    console.error("Error in bulk price update:", error)
    throw error
  }
}

// ✅ Funciones de utilidad adicionales - TENANT AWARE
export const getServiceById = (serviceId: string, tenantId?: string): Service | null => {
  try {
    const services = getServices(tenantId)
    return services.find((service) => service.id === serviceId) || null
  } catch (error) {
    console.error("Error getting service by ID:", error)
    return null
  }
}

export const getProductById = (productId: string, tenantId?: string): Product | null => {
  try {
    const products = getProducts(tenantId)
    return products.find((product) => product.id === productId) || null
  } catch (error) {
    console.error("Error getting product by ID:", error)
    return null
  }
}

export const getServicesByCategory = (category: ServiceCategory, tenantId?: string): Service[] => {
  try {
    const services = getServices(tenantId)
    return services.filter((service) => service.category === category && service.isActive !== false)
  } catch (error) {
    console.error("Error getting services by category:", error)
    return []
  }
}

export const searchServices = (query: string, tenantId?: string): Service[] => {
  try {
    const services = getServices(tenantId)
    const lowercaseQuery = query.toLowerCase()

    return services.filter(
      (service) =>
        service.isActive !== false &&
        (service.name.toLowerCase().includes(lowercaseQuery) ||
          service.description.toLowerCase().includes(lowercaseQuery)),
    )
  } catch (error) {
    console.error("Error searching services:", error)
    return []
  }
}

export const searchProducts = (query: string, tenantId?: string): Product[] => {
  try {
    const products = getProducts(tenantId)
    const lowercaseQuery = query.toLowerCase()

    return products.filter(
      (product) =>
        product.isActive !== false &&
        (product.name.toLowerCase().includes(lowercaseQuery) ||
          product.description.toLowerCase().includes(lowercaseQuery) ||
          product.brand.toLowerCase().includes(lowercaseQuery)),
    )
  } catch (error) {
    console.error("Error searching products:", error)
    return []
  }
}

// ✅ Hook para usar servicios con contexto de tenant
export const useServicesManager = () => {
  const currentTenant = getCurrentTenantFromStorage()
  const tenantId = currentTenant?.id

  return {
    // Servicios
    getServices: () => getServices(tenantId),
    getActiveServices: () => getActiveServices(tenantId),
    saveService: (service: Service, changedBy: string) => saveService(service, changedBy, tenantId),
    createService: (serviceData: Omit<Service, "id" | "createdAt" | "updatedAt">, createdBy: string) =>
      createService(serviceData, createdBy, tenantId),
    deleteService: (serviceId: string, deletedBy: string) => deleteService(serviceId, deletedBy, tenantId),

    // Productos
    getProducts: () => getProducts(tenantId),
    saveProduct: (product: Product, changedBy: string) => saveProduct(product, changedBy, tenantId),
    createProduct: (productData: Omit<Product, "id" | "createdAt" | "updatedAt">, createdBy: string) =>
      createProduct(productData, createdBy, tenantId),
    deleteProduct: (productId: string, deletedBy: string) => deleteProduct(productId, deletedBy, tenantId),

    // Estadísticas y utilidades
    getServicesStatistics: () => getServicesStatistics(tenantId),
    getPriceHistory: () => getPriceHistory(tenantId),
    getServicePriceHistory: (serviceId: string) => getServicePriceHistory(serviceId, tenantId),
    bulkUpdatePrices: (updates: { serviceId: string; newPrice: number }[], changedBy: string) =>
      bulkUpdatePrices(updates, changedBy, tenantId),

    // Búsquedas
    getServiceById: (serviceId: string) => getServiceById(serviceId, tenantId),
    getProductById: (productId: string) => getProductById(productId, tenantId),
    getServicesByCategory: (category: ServiceCategory) => getServicesByCategory(category, tenantId),
    searchServices: (query: string) => searchServices(query, tenantId),
    searchProducts: (query: string) => searchProducts(query, tenantId),

    // Info del tenant
    tenantId,
    currentTenant,
  }
}
