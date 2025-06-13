import { Client, Appointment, Service, Product, StatusChange } from '../types';
import { checkAllClientsForRewards } from './rewards';
import { getCurrentTenant } from './tenantManager';

const STORAGE_KEYS = {
  CLIENTS: 'beauty-salon-clients',
  APPOINTMENTS: 'beauty-salon-appointments',
  PRODUCTS: 'beauty-salon-products'
};

// Get tenant-specific storage key
const getTenantStorageKey = (key: string): string => {
  const tenant = getCurrentTenant();
  if (tenant) {
    return `tenant-${tenant.id}-${key}`;
  }
  return key; // Fallback to legacy key for backward compatibility
};

// Client management
export const saveClient = (client: Client): void => {
  const clients = getClients();
  const existingIndex = clients.findIndex(c => c.id === client.id);
  
  if (existingIndex >= 0) {
    clients[existingIndex] = client;
  } else {
    clients.push(client);
  }
  
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.CLIENTS), JSON.stringify(clients));
};

export const getClients = (): Client[] => {
  const stored = localStorage.getItem(getTenantStorageKey(STORAGE_KEYS.CLIENTS));
  return stored ? JSON.parse(stored) : [];
};

export const getClientById = (id: string): Client | undefined => {
  return getClients().find(client => client.id === id);
};

// Appointment management  
export const saveAppointment = (appointment: Appointment): void => {
  const appointments = getAppointments();
  const existingIndex = appointments.findIndex(a => a.id === appointment.id);
  
  if (existingIndex >= 0) {
    appointments[existingIndex] = appointment;
  } else {
    appointments.push(appointment);
  }
  
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.APPOINTMENTS), JSON.stringify(appointments));
  
  // Check for rewards after saving appointment
  if (appointment.status === 'completed') {
    setTimeout(() => {
      checkAllClientsForRewards();
    }, 100);
  }
};

export const getAppointments = (): Appointment[] => {
  const stored = localStorage.getItem(getTenantStorageKey(STORAGE_KEYS.APPOINTMENTS));
  return stored ? JSON.parse(stored) : [];
};

export const getAppointmentsByDate = (date: string): Appointment[] => {
  return getAppointments().filter(apt => apt.date === date);
};

export const getAppointmentsByClient = (clientId: string): Appointment[] => {
  return getAppointments().filter(apt => apt.clientId === clientId);
};

// Get today's appointments count
export const getTodayAppointmentsCount = (): number => {
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = getAppointmentsByDate(today);
  return todayAppointments.filter(apt => apt.status !== 'cancelled').length;
};

// Update appointment status with history tracking
export const updateAppointmentStatus = (
  appointmentId: string,
  newStatus: 'confirmed' | 'pending' | 'cancelled' | 'completed',
  changedBy: string,
  reason?: string
): boolean => {
  const appointments = getAppointments();
  const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
  
  if (appointmentIndex === -1) return false;
  
  const appointment = appointments[appointmentIndex];
  const previousStatus = appointment.status;
  
  // Create status change record
  const statusChange: StatusChange = {
    id: Date.now().toString(),
    previousStatus,
    newStatus,
    changedBy,
    changedAt: new Date().toISOString(),
    reason
  };
  
  // Update appointment
  appointment.status = newStatus;
  appointment.statusHistory = appointment.statusHistory || [];
  appointment.statusHistory.push(statusChange);
  
  // Save updated appointments
  appointments[appointmentIndex] = appointment;
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.APPOINTMENTS), JSON.stringify(appointments));
  
  // Check for rewards if appointment completed
  if (newStatus === 'completed') {
    setTimeout(() => {
      checkAllClientsForRewards();
    }, 100);
  }
  
  return true;
};

export const isTimeSlotAvailable = (date: string, time: string, duration: number): boolean => {
  const appointments = getAppointmentsByDate(date);
  
  const requestedStart = new Date(`${date}T${time}`);
  const requestedEnd = new Date(requestedStart.getTime() + duration * 60000);
  
  return !appointments.some(apt => {
    if (apt.status === 'cancelled') return false;
    
    const aptStart = new Date(`${apt.date}T${apt.time}`);
    // Calculate duration from services (you'd need to pass services)
    const aptEnd = new Date(aptStart.getTime() + 60 * 60000); // Default 1 hour
    
    return (requestedStart < aptEnd && requestedEnd > aptStart);
  });
};

// Generate available time slots
export const getAvailableTimeSlots = (date: string): string[] => {
  const slots: string[] = [];
  const startHour = 9; // 9 AM
  const endHour = 19; // 7 PM
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      if (isTimeSlotAvailable(date, time, 60)) {
        slots.push(time);
      }
    }
  }
  
  return slots;
};

// Product management
export const getProducts = (): Product[] => {
  const stored = localStorage.getItem(getTenantStorageKey(STORAGE_KEYS.PRODUCTS));
  return stored ? JSON.parse(stored) : [];
};

export const saveProduct = (product: Product): void => {
  const products = getProducts();
  const existingIndex = products.findIndex(p => p.id === product.id);
  
  if (existingIndex >= 0) {
    products[existingIndex] = product;
  } else {
    products.push(product);
  }
  
  localStorage.setItem(getTenantStorageKey(STORAGE_KEYS.PRODUCTS), JSON.stringify(products));
};