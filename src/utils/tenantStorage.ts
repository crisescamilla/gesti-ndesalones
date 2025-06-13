import { useTenant } from '../hooks/useTenant';
import { Client, Appointment, Service } from '../types';

// Tenant-aware storage utilities
export const useTenantStorage = () => {
  const { tenant } = useTenant();

  const getTenantStorageKey = (key: string): string => {
    if (!tenant) throw new Error('No tenant context available');
    return `tenant-${tenant.id}-${key}`;
  };

  // Clients
  const saveClient = (client: Client): void => {
    const clients = getClients();
    const existingIndex = clients.findIndex(c => c.id === client.id);
    
    if (existingIndex >= 0) {
      clients[existingIndex] = client;
    } else {
      clients.push(client);
    }
    
    localStorage.setItem(getTenantStorageKey('clients'), JSON.stringify(clients));
  };

  const getClients = (): Client[] => {
    const stored = localStorage.getItem(getTenantStorageKey('clients'));
    return stored ? JSON.parse(stored) : [];
  };

  const getClientById = (id: string): Client | undefined => {
    return getClients().find(client => client.id === id);
  };

  // Appointments
  const saveAppointment = (appointment: Appointment): void => {
    const appointments = getAppointments();
    const existingIndex = appointments.findIndex(a => a.id === appointment.id);
    
    if (existingIndex >= 0) {
      appointments[existingIndex] = appointment;
    } else {
      appointments.push(appointment);
    }
    
    localStorage.setItem(getTenantStorageKey('appointments'), JSON.stringify(appointments));
  };

  const getAppointments = (): Appointment[] => {
    const stored = localStorage.getItem(getTenantStorageKey('appointments'));
    return stored ? JSON.parse(stored) : [];
  };

  const getAppointmentsByDate = (date: string): Appointment[] => {
    return getAppointments().filter(apt => apt.date === date);
  };

  const getAppointmentsByClient = (clientId: string): Appointment[] => {
    return getAppointments().filter(apt => apt.clientId === clientId);
  };

  // Services
  const getServices = (): Service[] => {
    const stored = localStorage.getItem(getTenantStorageKey('services'));
    return stored ? JSON.parse(stored) : [];
  };

  const saveService = (service: Service): void => {
    const services = getServices();
    const existingIndex = services.findIndex(s => s.id === service.id);
    
    if (existingIndex >= 0) {
      services[existingIndex] = service;
    } else {
      services.push(service);
    }
    
    localStorage.setItem(getTenantStorageKey('services'), JSON.stringify(services));
  };

  // Generic data operations
  const getTenantData = (dataType: string): any => {
    const stored = localStorage.getItem(getTenantStorageKey(dataType));
    return stored ? JSON.parse(stored) : null;
  };

  const saveTenantData = (dataType: string, data: any): void => {
    localStorage.setItem(getTenantStorageKey(dataType), JSON.stringify(data));
  };

  return {
    tenant,
    // Clients
    saveClient,
    getClients,
    getClientById,
    // Appointments
    saveAppointment,
    getAppointments,
    getAppointmentsByDate,
    getAppointmentsByClient,
    // Services
    getServices,
    saveService,
    // Generic
    getTenantData,
    saveTenantData
  };
};

// Utility to check if user has access to tenant data
export const checkTenantAccess = (tenantId: string, userId: string): boolean => {
  // In a real implementation, this would check database permissions
  // For now, we'll use localStorage to check ownership
  const tenantDataKey = `beauty-app-tenant-data-${tenantId}`;
  const tenantData = localStorage.getItem(tenantDataKey);
  
  if (!tenantData) return false;
  
  // Additional access checks would go here
  return true;
};

// Migration utility to move existing data to tenant-specific storage
export const migrateLegacyData = (tenantId: string): void => {
  const legacyKeys = [
    'beauty-salon-clients',
    'beauty-salon-appointments', 
    'beauty-salon-services',
    'beauty-salon-settings',
    'beauty-salon-themes'
  ];

  legacyKeys.forEach(legacyKey => {
    const legacyData = localStorage.getItem(legacyKey);
    if (legacyData) {
      const newKey = legacyKey.replace('beauty-salon-', `tenant-${tenantId}-`);
      localStorage.setItem(newKey, legacyData);
      
      // Optionally remove legacy data
      // localStorage.removeItem(legacyKey);
    }
  });
};