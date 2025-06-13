import { Service, Product, ServiceUpdate, PriceHistory, ServiceCategory } from '../types';
import { services as defaultServices } from '../data/services';
import { getCurrentTenant } from './tenantManager';

const STORAGE_KEYS = {
  SERVICES: 'beauty-salon-services',
  PRODUCTS: 'beauty-salon-products',
  SERVICE_UPDATES: 'beauty-salon-service-updates',
  PRICE_HISTORY: 'beauty-salon-price-history'
};

// Get tenant-specific storage key
const getTenantStorageKey = (key: string): string => {
  const tenant = getCurrentTenant();
  if (tenant) {
    return `tenant-${tenant.id}-${key}`;
  }
  return key; // Fallback to legacy key for backward compatibility
};

// Initialize services if not exists
export const initializeServices = (): void => {
  const stored = localStorage.getItem(getTenantStorageKey(STORAGE_KEYS.SERVICES));
  if (!stored) {
    const servicesWithDefaults = defaultServices.map(service => ({
      ...service,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.SERVICES), JSON.stringify(servicesWithDefaults));
  }
};

// Get all services
export const getServices = (): Service[] => {
  initializeServices();
  const stored = localStorage.getItem(getTenantStorageKey(STORAGE_KEYS.SERVICES));
  return stored ? JSON.parse(stored) : [];
};

// Get active services only
export const getActiveServices = (): Service[] => {
  return getServices().filter(service => service.isActive !== false);
};

// Get services by category
export const getServicesByCategory = (category: ServiceCategory): Service[] => {
  return getActiveServices().filter(service => service.category === category);
};

// Save service
export const saveService = (service: Service, updatedBy: string): void => {
  const services = getServices();
  const existingIndex = services.findIndex(s => s.id === service.id);
  
  if (existingIndex >= 0) {
    const oldService = services[existingIndex];
    
    // Track changes
    const changes: ServiceUpdate[] = [];
    
    if (oldService.name !== service.name) {
      changes.push(createServiceUpdate(service.id, 'name', oldService.name, service.name, updatedBy));
    }
    if (oldService.price !== service.price) {
      changes.push(createServiceUpdate(service.id, 'price', oldService.price, service.price, updatedBy));
      // Save price history
      savePriceHistory({
        id: Date.now().toString(),
        serviceId: service.id,
        oldPrice: oldService.price,
        newPrice: service.price,
        changedBy: updatedBy,
        changedAt: new Date().toISOString()
      });
    }
    if (oldService.duration !== service.duration) {
      changes.push(createServiceUpdate(service.id, 'duration', oldService.duration, service.duration, updatedBy));
    }
    if (oldService.description !== service.description) {
      changes.push(createServiceUpdate(service.id, 'description', oldService.description, service.description, updatedBy));
    }
    if (oldService.category !== service.category) {
      changes.push(createServiceUpdate(service.id, 'category', oldService.category, service.category, updatedBy));
    }
    if (oldService.isActive !== service.isActive) {
      changes.push(createServiceUpdate(service.id, 'isActive', oldService.isActive, service.isActive, updatedBy));
    }
    
    // Save all changes
    changes.forEach(change => saveServiceUpdate(change));
    
    service.updatedAt = new Date().toISOString();
    services[existingIndex] = service;
  } else {
    service.createdAt = new Date().toISOString();
    service.updatedAt = new Date().toISOString();
    service.isActive = service.isActive !== false;
    services.push(service);
  }
  
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.SERVICES), JSON.stringify(services));
};

// Create new service
export const createService = (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Service => {
  const newService: Service = {
    ...serviceData,
    id: Date.now().toString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  saveService(newService, createdBy);
  return newService;
};

// Delete service (soft delete)
export const deleteService = (serviceId: string, deletedBy: string): boolean => {
  const services = getServices();
  const serviceIndex = services.findIndex(s => s.id === serviceId);
  
  if (serviceIndex === -1) return false;
  
  const service = services[serviceIndex];
  service.isActive = false;
  service.updatedAt = new Date().toISOString();
  
  // Track deletion
  const update = createServiceUpdate(serviceId, 'isActive', true, false, deletedBy);
  saveServiceUpdate(update);
  
  services[serviceIndex] = service;
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.SERVICES), JSON.stringify(services));
  
  return true;
};

// Get service by ID
export const getServiceById = (serviceId: string): Service | undefined => {
  return getServices().find(service => service.id === serviceId);
};

// Bulk update prices
export const bulkUpdatePrices = (updates: { serviceId: string; newPrice: number }[], updatedBy: string): void => {
  const services = getServices();
  
  updates.forEach(update => {
    const serviceIndex = services.findIndex(s => s.id === update.serviceId);
    if (serviceIndex >= 0) {
      const oldPrice = services[serviceIndex].price;
      services[serviceIndex].price = update.newPrice;
      services[serviceIndex].updatedAt = new Date().toISOString();
      
      // Save price history
      savePriceHistory({
        id: Date.now().toString() + Math.random(),
        serviceId: update.serviceId,
        oldPrice,
        newPrice: update.newPrice,
        changedBy: updatedBy,
        changedAt: new Date().toISOString()
      });
      
      // Save update record
      const updateRecord = createServiceUpdate(update.serviceId, 'price', oldPrice, update.newPrice, updatedBy);
      saveServiceUpdate(updateRecord);
    }
  });
  
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.SERVICES), JSON.stringify(services));
};

// Products management
export const getProducts = (): Product[] => {
  const stored = localStorage.getItem(getTenantStorageKey(STORAGE_KEYS.PRODUCTS));
  return stored ? JSON.parse(stored) : [];
};

export const getActiveProducts = (): Product[] => {
  return getProducts().filter(product => product.isActive !== false);
};

export const saveProduct = (product: Product, updatedBy: string): void => {
  const products = getProducts();
  const existingIndex = products.findIndex(p => p.id === product.id);
  
  if (existingIndex >= 0) {
    product.updatedAt = new Date().toISOString();
    products[existingIndex] = product;
  } else {
    product.createdAt = new Date().toISOString();
    product.updatedAt = new Date().toISOString();
    product.isActive = product.isActive !== false;
    products.push(product);
  }
  
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.PRODUCTS), JSON.stringify(products));
};

export const createProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Product => {
  const newProduct: Product = {
    ...productData,
    id: Date.now().toString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  saveProduct(newProduct, createdBy);
  return newProduct;
};

export const deleteProduct = (productId: string, deletedBy: string): boolean => {
  const products = getProducts();
  const productIndex = products.findIndex(p => p.id === productId);
  
  if (productIndex === -1) return false;
  
  products[productIndex].isActive = false;
  products[productIndex].updatedAt = new Date().toISOString();
  
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.PRODUCTS), JSON.stringify(products));
  return true;
};

// Service updates tracking
const createServiceUpdate = (
  serviceId: string,
  field: ServiceUpdate['field'],
  oldValue: any,
  newValue: any,
  updatedBy: string
): ServiceUpdate => ({
  id: Date.now().toString() + Math.random(),
  serviceId,
  field,
  oldValue,
  newValue,
  updatedBy,
  updatedAt: new Date().toISOString()
});

const saveServiceUpdate = (update: ServiceUpdate): void => {
  const updates = getServiceUpdates();
  updates.push(update);
  
  // Keep only last 100 updates
  if (updates.length > 100) {
    updates.splice(0, updates.length - 100);
  }
  
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.SERVICE_UPDATES), JSON.stringify(updates));
};

export const getServiceUpdates = (): ServiceUpdate[] => {
  const stored = localStorage.getItem(getTenantStorageKey(STORAGE_KEYS.SERVICE_UPDATES));
  return stored ? JSON.parse(stored) : [];
};

// Price history
const savePriceHistory = (history: PriceHistory): void => {
  const histories = getPriceHistory();
  histories.push(history);
  
  // Keep only last 200 price changes
  if (histories.length > 200) {
    histories.splice(0, histories.length - 200);
  }
  
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.PRICE_HISTORY), JSON.stringify(histories));
};

export const getPriceHistory = (): PriceHistory[] => {
  const stored = localStorage.getItem(getTenantStorageKey(STORAGE_KEYS.PRICE_HISTORY));
  return stored ? JSON.parse(stored) : [];
};

export const getServicePriceHistory = (serviceId: string): PriceHistory[] => {
  return getPriceHistory()
    .filter(history => history.serviceId === serviceId)
    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
};

// Statistics
export const getServicesStatistics = () => {
  const services = getServices();
  const products = getProducts();
  const priceHistory = getPriceHistory();
  
  const activeServices = services.filter(s => s.isActive !== false);
  const activeProducts = products.filter(p => p.isActive !== false);
  
  const avgServicePrice = activeServices.length > 0 
    ? activeServices.reduce((sum, s) => sum + s.price, 0) / activeServices.length 
    : 0;
    
  const avgProductPrice = activeProducts.length > 0
    ? activeProducts.reduce((sum, p) => sum + p.price, 0) / activeProducts.length
    : 0;
  
  const recentPriceChanges = priceHistory.filter(h => {
    const changeDate = new Date(h.changedAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return changeDate > weekAgo;
  }).length;
  
  return {
    totalServices: services.length,
    activeServices: activeServices.length,
    totalProducts: products.length,
    activeProducts: activeProducts.length,
    avgServicePrice,
    avgProductPrice,
    recentPriceChanges
  };
};