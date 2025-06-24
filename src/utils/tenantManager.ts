import { Tenant, TenantOwner, BusinessTypeConfig } from '../types/tenant';
import { createTenantAdmin } from './auth';

const STORAGE_KEYS = {
  TENANTS: 'beauty-app-tenants',
  TENANT_OWNERS: 'beauty-app-tenant-owners',
  CURRENT_TENANT: 'beauty-app-current-tenant',
  TENANT_DATA_PREFIX: 'beauty-app-tenant-data-'
};

// Business type configurations
export const businessTypeConfigs: BusinessTypeConfig[] = [
  {
    id: 'salon',
    name: 'Salón de Belleza',
    description: 'Servicios completos de belleza para cabello, uñas y tratamientos faciales',
    defaultServices: [
      { name: 'Corte y Peinado', category: 'servicios-cabello', duration: 45, price: 430 },
      { name: 'Tinte Completo', category: 'servicios-cabello', duration: 120, price: 600 },
      { name: 'Manicure Clásica', category: 'servicios-unas', duration: 30, price: 250 },
      { name: 'Limpieza Facial', category: 'tratamientos-faciales', duration: 60, price: 400 }
    ],
    defaultColors: { primary: '#ec4899', secondary: '#8b5cf6' },
    features: ['Gestión de citas', 'Personal especializado', 'Inventario', 'Reportes']
  },
  {
    id: 'barberia',
    name: 'Barbería',
    description: 'Servicios especializados en cortes masculinos y cuidado de barba',
    defaultServices: [
      { name: 'Corte Clásico', category: 'servicios-cabello', duration: 30, price: 200 },
      { name: 'Corte + Barba', category: 'servicios-cabello', duration: 45, price: 300 },
      { name: 'Afeitado Tradicional', category: 'servicios-cabello', duration: 25, price: 150 },
      { name: 'Arreglo de Cejas', category: 'tratamientos-faciales', duration: 15, price: 80 }
    ],
    defaultColors: { primary: '#374151', secondary: '#f59e0b' },
    features: ['Gestión de citas', 'Servicios masculinos', 'Productos especializados']
  },
  {
    id: 'spa',
    name: 'Spa',
    description: 'Centro de relajación y bienestar con tratamientos corporales',
    defaultServices: [
      { name: 'Masaje Relajante', category: 'masajes', duration: 60, price: 750 },
      { name: 'Facial Anti-edad', category: 'tratamientos-faciales', duration: 75, price: 550 },
      { name: 'Exfoliación Corporal', category: 'tratamientos-corporales', duration: 45, price: 350 },
      { name: 'Tratamiento Reafirmante', category: 'tratamientos-corporales', duration: 90, price: 450 }
    ],
    defaultColors: { primary: '#059669', secondary: '#06b6d4' },
    features: ['Tratamientos de lujo', 'Ambiente relajante', 'Terapias especializadas']
  },
  {
    id: 'unas',
    name: 'Centro de Uñas',
    description: 'Especialistas en manicure, pedicure y nail art',
    defaultServices: [
      { name: 'Manicure Clásica', category: 'servicios-unas', duration: 30, price: 250 },
      { name: 'Pedicure Spa', category: 'servicios-unas', duration: 45, price: 450 },
      { name: 'Uñas de Gel', category: 'servicios-unas', duration: 60, price: 550 },
      { name: 'Nail Art', category: 'servicios-unas', duration: 90, price: 700 }
    ],
    defaultColors: { primary: '#8b5cf6', secondary: '#ec4899' },
    features: ['Diseños personalizados', 'Productos premium', 'Técnicas avanzadas']
  },
  {
    id: 'centro-bienestar',
    name: 'Centro de Bienestar',
    description: 'Servicios integrales de salud, belleza y relajación',
    defaultServices: [
      { name: 'Masaje Terapéutico', category: 'masajes', duration: 60, price: 600 },
      { name: 'Tratamiento Facial', category: 'tratamientos-faciales', duration: 60, price: 400 },
      { name: 'Depilación Láser', category: 'tratamientos-corporales', duration: 30, price: 300 },
      { name: 'Consulta Nutricional', category: 'tratamientos-corporales', duration: 45, price: 250 }
    ],
    defaultColors: { primary: '#10b981', secondary: '#3b82f6' },
    features: ['Servicios integrales', 'Profesionales certificados', 'Enfoque holístico']
  }
];

// Generate unique slug
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

// Check if slug is available
export const isSlugAvailable = (slug: string, excludeTenantId?: string): boolean => {
  const tenants = getTenants();
  return !tenants.some(t => t.slug === slug && t.id !== excludeTenantId);
};

// Get all tenants
export const getTenants = (): Tenant[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.TENANTS);
  return stored ? JSON.parse(stored) : [];
};

// Get tenant by slug
export const getTenantBySlug = (slug: string): Tenant | null => {
  const tenants = getTenants();
  return tenants.find(t => t.slug === slug && t.isActive) || null;
};

// Get tenant by ID
export const getTenantById = (tenantId: string): Tenant | null => {
  const tenants = getTenants();
  return tenants.find(t => t.id === tenantId) || null;
};

// Save tenant
export const saveTenant = (tenant: Tenant): void => {
  const tenants = getTenants();
  const existingIndex = tenants.findIndex(t => t.id === tenant.id);
  
  if (existingIndex >= 0) {
    tenants[existingIndex] = { ...tenant, updatedAt: new Date().toISOString() };
  } else {
    tenants.push(tenant);
  }
  
  localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
};

// Delete tenant (soft delete by setting isActive to false)
export const deleteTenant = (tenantId: string): boolean => {
  try {
    const tenants = getTenants();
    const tenantIndex = tenants.findIndex(t => t.id === tenantId);
    
    if (tenantIndex === -1) {
      return false; // Tenant not found
    }
    
    // Soft delete - set isActive to false
    tenants[tenantIndex].isActive = false;
    tenants[tenantIndex].updatedAt = new Date().toISOString();
    
    // Save updated tenants list
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
    
    // Clean up tenant-specific data
    const tenantDataKey = `${STORAGE_KEYS.TENANT_DATA_PREFIX}${tenantId}`;
    localStorage.removeItem(tenantDataKey);
    
    // Clean up tenant-specific storage keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(`tenant-${tenantId}-`)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    return true;
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return false;
  }
};

// Create new tenant with admin user
export const createTenant = (
  tenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>,
  ownerId: string,
  ownerCredentials?: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }
): Tenant => {
  const tenant: Tenant = {
    ...tenantData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerId
  };
  
  saveTenant(tenant);
  
  // Initialize tenant data storage
  initializeTenantData(tenant.id, tenantData.businessType);
  
  // Create admin user for this tenant if credentials provided
  if (ownerCredentials) {
    createTenantAdmin(tenant.id, ownerCredentials);
  }
  
  return tenant;
};

// Initialize tenant-specific data
export const initializeTenantData = (tenantId: string, businessType: string): void => {
  const config = businessTypeConfigs.find(c => c.id === businessType);
  if (!config) return;
  
  const tenantDataKey = `${STORAGE_KEYS.TENANT_DATA_PREFIX}${tenantId}`;
  
  // Initialize with default services for business type
  const initialData = {
    services: config.defaultServices.map((service, index) => ({
      id: (index + 1).toString(),
      ...service,
      description: `Servicio de ${service.name.toLowerCase()}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })),
    clients: [],
    appointments: [],
    staff: [],
    settings: {
      salonName: '',
      salonMotto: 'Tu destino de belleza y relajación',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    },
    themes: [],
    rewards: {
      settings: {
        id: '1',
        spendingThreshold: 5000,
        discountPercentage: 20,
        couponValidityDays: 30,
        isActive: true,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system'
      },
      coupons: [],
      history: []
    }
  };
  
  localStorage.setItem(tenantDataKey, JSON.stringify(initialData));
};

// Get tenant-specific data
export const getTenantData = (tenantId: string, dataType: string): any => {
  const tenantDataKey = `${STORAGE_KEYS.TENANT_DATA_PREFIX}${tenantId}`;
  const stored = localStorage.getItem(tenantDataKey);
  
  if (!stored) return null;
  
  const data = JSON.parse(stored);
  return data[dataType] || null;
};

// Save tenant-specific data
export const saveTenantData = (tenantId: string, dataType: string, data: any): void => {
  const tenantDataKey = `${STORAGE_KEYS.TENANT_DATA_PREFIX}${tenantId}`;
  const stored = localStorage.getItem(tenantDataKey);
  
  let tenantData = stored ? JSON.parse(stored) : {};
  tenantData[dataType] = data;
  
  localStorage.setItem(tenantDataKey, JSON.stringify(tenantData));
};

// Tenant owner management
export const getTenantOwners = (): TenantOwner[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.TENANT_OWNERS);
  return stored ? JSON.parse(stored) : [];
};

export const getTenantOwnerById = (ownerId: string): TenantOwner | null => {
  const owners = getTenantOwners();
  return owners.find(o => o.id === ownerId) || null;
};

export const getTenantOwnerByEmail = (email: string): TenantOwner | null => {
  const owners = getTenantOwners();
  return owners.find(o => o.email.toLowerCase() === email.toLowerCase()) || null;
};

export const saveTenantOwner = (owner: TenantOwner): void => {
  const owners = getTenantOwners();
  const existingIndex = owners.findIndex(o => o.id === owner.id);
  
  if (existingIndex >= 0) {
    owners[existingIndex] = owner;
  } else {
    owners.push(owner);
  }
  
  localStorage.setItem(STORAGE_KEYS.TENANT_OWNERS, JSON.stringify(owners));
};

// Current tenant context
export const getCurrentTenant = (): Tenant | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_TENANT);
  return stored ? JSON.parse(stored) : null;
};

export const setCurrentTenant = (tenant: Tenant | null): void => {
  if (tenant) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_TENANT, JSON.stringify(tenant));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_TENANT);
  }
};

// URL routing for tenants
export const getTenantFromURL = (): Tenant | null => {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  
  // Check if first segment is a tenant slug
  if (segments.length > 0) {
    const potentialSlug = segments[0];
    return getTenantBySlug(potentialSlug);
  }
  
  return null;
};

// Generate tenant URL
export const generateTenantURL = (tenant: Tenant): string => {
  const baseURL = window.location.origin;
  return `${baseURL}/${tenant.slug}`;
};

// Tenant data isolation utilities
export const withTenantContext = <T>(tenantId: string, operation: () => T): T => {
  const currentTenant = getCurrentTenant();
  
  if (currentTenant?.id !== tenantId) {
    throw new Error('Unauthorized access to tenant data');
  }
  
  return operation();
};

// Migration utility for existing data
export const migrateToMultiTenant = (): void => {
  const existingClients = localStorage.getItem('beauty-salon-clients');
  const existingAppointments = localStorage.getItem('beauty-salon-appointments');
  const existingServices = localStorage.getItem('beauty-salon-services');
  
  if (existingClients || existingAppointments || existingServices) {
    // Create default tenant for existing data
    const defaultTenant: Tenant = {
      id: 'default-tenant',
      name: 'Bella Vita Spa',
      slug: 'bella-vita-spa',
      businessType: 'salon',
      primaryColor: '#ec4899',
      secondaryColor: '#8b5cf6',
      address: 'Av.  1234, Tijuana, BC',
      phone: '66',
      email: 'info@bellavitaspa.com',
      description: 'Tu destino de belleza y relajación',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'default-owner',
      subscription: {
        plan: 'premium',
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      settings: {
        allowOnlineBooking: true,
        requireApproval: false,
        timeZone: 'America/Tijuana',
        currency: 'MXN',
        language: 'es'
      }
    };
    
    // Create default owner
    const defaultOwner: TenantOwner = {
      id: 'default-owner',
      email: 'admin@bellavitaspa.com',
      firstName: 'Admin',
      lastName: 'Bella Vita',
      phone: '664-563-6423',
      passwordHash: 'hashed-password', // This would be properly hashed
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      tenants: ['default-tenant']
    };
    
    // Save default tenant and owner
    saveTenant(defaultTenant);
    saveTenantOwner(defaultOwner);
    
    // Create admin user for default tenant
    createTenantAdmin('default-tenant', {
      firstName: 'Admin',
      lastName: 'Bella Vita',
      email: 'admin@bellavitaspa.com',
      password: 'Admin123!'
    });
    
    // Migrate existing data to tenant-specific storage
    const tenantDataKey = `${STORAGE_KEYS.TENANT_DATA_PREFIX}default-tenant`;
    const migratedData = {
      clients: existingClients ? JSON.parse(existingClients) : [],
      appointments: existingAppointments ? JSON.parse(existingAppointments) : [],
      services: existingServices ? JSON.parse(existingServices) : [],
      settings: {
        salonName: 'Bella Vita Spa',
        salonMotto: 'Tu destino de belleza y relajación',
        updatedAt: new Date().toISOString(),
        updatedBy: 'migration'
      }
    };
    
    localStorage.setItem(tenantDataKey, JSON.stringify(migratedData));
    
    // Set as current tenant
    setCurrentTenant(defaultTenant);
    
    console.log('Data migrated to multi-tenant structure');
  }
};