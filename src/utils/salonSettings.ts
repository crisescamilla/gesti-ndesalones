import { SalonSettings } from '../types';
import { getCurrentTenant } from './tenantManager';

const STORAGE_KEY = 'beauty-salon-settings';

// Get tenant-specific storage key
const getTenantStorageKey = (key: string): string => {
  const tenant = getCurrentTenant();
  if (tenant) {
    return `tenant-${tenant.id}-${key}`;
  }
  return key; // Fallback to legacy key for backward compatibility
};

// Default salon settings
const DEFAULT_SALON_SETTINGS: SalonSettings = {
  id: '1',
  salonName: 'Bella Vita Spa',
  salonMotto: 'Tu destino de belleza y relajación',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

// Event system for real-time updates
const eventListeners: ((settings: SalonSettings) => void)[] = [];

export const subscribeSalonSettingsChanges = (callback: (settings: SalonSettings) => void): (() => void) => {
  eventListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = eventListeners.indexOf(callback);
    if (index > -1) {
      eventListeners.splice(index, 1);
    }
  };
};

const notifySettingsChange = (settings: SalonSettings): void => {
  eventListeners.forEach(callback => {
    try {
      callback(settings);
    } catch (error) {
      console.error('Error in salon settings listener:', error);
    }
  });
};

// Get salon settings
export const getSalonSettings = (): SalonSettings => {
  const tenant = getCurrentTenant();
  let defaultSettings = DEFAULT_SALON_SETTINGS;
  
  // Use tenant name if available
  if (tenant) {
    defaultSettings = {
      ...DEFAULT_SALON_SETTINGS,
      salonName: tenant.name,
      salonMotto: tenant.description || DEFAULT_SALON_SETTINGS.salonMotto
    };
  }
  
  const stored = localStorage.getItem(getTenantStorageKey(STORAGE_KEY));
  const settings = stored ? JSON.parse(stored) : defaultSettings;
  
  return settings;
};

// Save salon settings with validation and real-time sync (CSRF protection removed)
export const saveSalonSettings = (
  settings: Partial<SalonSettings>, 
  updatedBy: string
): { success: boolean; error?: string } => {
  
  // Input validation (CSRF validation removed)
  if (!settings.salonName || settings.salonName.trim().length === 0) {
    return { success: false, error: 'El nombre del salón es requerido' };
  }

  if (!settings.salonMotto || settings.salonMotto.trim().length === 0) {
    return { success: false, error: 'El lema del salón es requerido' };
  }

  // Character limits
  if (settings.salonName.length > 50) {
    return { success: false, error: 'El nombre del salón no puede exceder 50 caracteres' };
  }

  if (settings.salonMotto.length > 100) {
    return { success: false, error: 'El lema del salón no puede exceder 100 caracteres' };
  }

  // Get current settings
  const currentSettings = getSalonSettings();

  // Sanitize input data
  const sanitizedSettings: SalonSettings = {
    ...currentSettings,
    salonName: settings.salonName.trim().replace(/[<>]/g, ''),
    salonMotto: settings.salonMotto.trim().replace(/[<>]/g, ''),
    updatedAt: new Date().toISOString(),
    updatedBy
  };

  try {
    localStorage.setItem(getTenantStorageKey(STORAGE_KEY), JSON.stringify(sanitizedSettings));
    
    // Notify all listeners about the change
    notifySettingsChange(sanitizedSettings);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al guardar la configuración' };
  }
};

// Get settings history (for audit purposes)
export const getSalonSettingsHistory = () => {
  const stored = localStorage.getItem(getTenantStorageKey('beauty-salon-settings-history'));
  return stored ? JSON.parse(stored) : [];
};

// Save settings change to history
export const saveSalonSettingsHistory = (oldSettings: SalonSettings, newSettings: SalonSettings) => {
  const history = getSalonSettingsHistory();
  const change = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    updatedBy: newSettings.updatedBy,
    changes: {
      salonName: {
        from: oldSettings.salonName,
        to: newSettings.salonName
      },
      salonMotto: {
        from: oldSettings.salonMotto,
        to: newSettings.salonMotto
      }
    }
  };
  
  history.push(change);
  
  // Keep only last 50 changes
  if (history.length > 50) {
    history.splice(0, history.length - 50);
  }
  
  localStorage.setItem(getTenantStorageKey('beauty-salon-settings-history'), JSON.stringify(history));
};

// Real-time salon name getter for components
export const useSalonName = (): string => {
  return getSalonSettings().salonName;
};

// Real-time salon motto getter for components
export const useSalonMotto = (): string => {
  return getSalonSettings().salonMotto;
};