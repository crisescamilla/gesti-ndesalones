import { ThemeSettings, ColorPalette, ThemePreset } from '../types';
import { getCurrentTenant } from './tenantManager';

const STORAGE_KEY = 'beauty-salon-themes';
const ACTIVE_THEME_KEY = 'beauty-salon-active-theme';

// Get tenant-specific storage key
const getTenantStorageKey = (key: string): string => {
  const tenant = getCurrentTenant();
  if (tenant) {
    return `tenant-${tenant.id}-${key}`;
  }
  return key; // Fallback to legacy key for backward compatibility
};

// Event system for real-time theme updates
const themeEventListeners: ((theme: ThemeSettings) => void)[] = [];

export const subscribeThemeChanges = (callback: (theme: ThemeSettings) => void): (() => void) => {
  themeEventListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = themeEventListeners.indexOf(callback);
    if (index > -1) {
      themeEventListeners.splice(index, 1);
    }
  };
};

const notifyThemeChange = (theme: ThemeSettings): void => {
  themeEventListeners.forEach(callback => {
    try {
      callback(theme);
    } catch (error) {
      console.error('Error in theme listener:', error);
    }
  });
};

// Get default colors based on tenant
const getDefaultColors = (): ColorPalette => {
  const tenant = getCurrentTenant();
  
  if (tenant) {
    return {
      primary: tenant.primaryColor,
      primaryLight: lightenColor(tenant.primaryColor, 0.3),
      primaryDark: darkenColor(tenant.primaryColor, 0.3),
      secondary: tenant.secondaryColor,
      secondaryLight: lightenColor(tenant.secondaryColor, 0.3),
      secondaryDark: darkenColor(tenant.secondaryColor, 0.3),
      accent: '#8b5cf6',
      accentLight: '#a78bfa',
      accentDark: '#7c3aed',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      shadow: 'rgba(0, 0, 0, 0.1)'
    };
  }
  
  // Default fallback colors
  return {
    primary: '#0ea5e9',
    primaryLight: '#38bdf8',
    primaryDark: '#0284c7',
    secondary: '#06b6d4',
    secondaryLight: '#22d3ee',
    secondaryDark: '#0891b2',
    accent: '#8b5cf6',
    accentLight: '#a78bfa',
    accentDark: '#7c3aed',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    shadow: 'rgba(0, 0, 0, 0.1)'
  };
};

// Color manipulation utilities
const lightenColor = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const lightR = Math.min(255, Math.floor(r + (255 - r) * amount));
  const lightG = Math.min(255, Math.floor(g + (255 - g) * amount));
  const lightB = Math.min(255, Math.floor(b + (255 - b) * amount));
  
  return `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
};

const darkenColor = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const darkR = Math.floor(r * (1 - amount));
  const darkG = Math.floor(g * (1 - amount));
  const darkB = Math.floor(b * (1 - amount));
  
  return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
};

// Predefined theme presets with neutral and professional palettes
export const themePresets: ThemePreset[] = [
  {
    id: 'neutral-professional',
    name: 'Profesional Neutro',
    description: 'Paleta neutra y versátil para cualquier tipo de negocio de belleza',
    preview: 'linear-gradient(135deg, #6b7280, #9ca3af)',
    colors: {
      primary: '#6b7280',           // Gris medio profesional
      primaryLight: '#9ca3af',      // Gris claro
      primaryDark: '#4b5563',       // Gris oscuro
      secondary: '#d6d3d1',         // Beige claro
      secondaryLight: '#e7e5e4',    // Beige muy claro
      secondaryDark: '#a8a29e',     // Beige medio
      accent: '#78716c',            // Tierra medio
      accentLight: '#a8a29e',       // Tierra claro
      accentDark: '#57534e',        // Tierra oscuro
      success: '#059669',           // Verde profesional
      warning: '#d97706',           // Ámbar tierra
      error: '#dc2626',             // Rojo profesional
      info: '#0369a1',              // Azul profesional
      background: '#fafaf9',        // Blanco cálido
      surface: '#ffffff',           // Blanco puro
      text: '#1f2937',              // Gris muy oscuro
      textSecondary: '#6b7280',     // Gris medio
      border: '#e5e7eb',            // Gris muy claro
      shadow: 'rgba(107, 114, 128, 0.1)'
    }
  },
  {
    id: 'default',
    name: 'Personalizado (Predeterminado)',
    description: 'Tema basado en los colores de tu marca',
    preview: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    colors: getDefaultColors()
  }
];

// Get all themes
export const getThemes = (): ThemeSettings[] => {
  const stored = localStorage.getItem(getTenantStorageKey(STORAGE_KEY));
  const themes = stored ? JSON.parse(stored) : [];
  
  // Ensure default theme exists with tenant colors
  if (!themes.find((t: ThemeSettings) => t.id === 'default')) {
    const tenant = getCurrentTenant();
    const defaultTheme: ThemeSettings = {
      id: 'default',
      name: tenant ? `${tenant.name} (Predeterminado)` : 'Predeterminado',
      description: 'Tema basado en los colores de tu marca',
      colors: getDefaultColors(),
      isDefault: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system'
    };
    themes.unshift(defaultTheme);
    localStorage.setItem(getTenantStorageKey(STORAGE_KEY), JSON.stringify(themes));
  }
  
  return themes;
};

// Save theme with real-time sync
export const saveTheme = (theme: ThemeSettings): void => {
  const themes = getThemes();
  const existingIndex = themes.findIndex((t: ThemeSettings) => t.id === theme.id);
  
  if (existingIndex >= 0) {
    themes[existingIndex] = { ...theme, updatedAt: new Date().toISOString() };
  } else {
    themes.push(theme);
  }
  
  localStorage.setItem(getTenantStorageKey(STORAGE_KEY), JSON.stringify(themes));
  
  // Notify listeners if this is the active theme
  if (theme.isActive) {
    notifyThemeChange(theme);
  }
};

// Delete theme
export const deleteTheme = (themeId: string): boolean => {
  const themes = getThemes();
  const theme = themes.find((t: ThemeSettings) => t.id === themeId);
  
  if (!theme || theme.isDefault) {
    return false; // Cannot delete default theme
  }
  
  const filteredThemes = themes.filter((t: ThemeSettings) => t.id !== themeId);
  localStorage.setItem(getTenantStorageKey(STORAGE_KEY), JSON.stringify(filteredThemes));
  
  // If deleted theme was active, switch to default
  const activeTheme = getActiveTheme();
  if (activeTheme?.id === themeId) {
    setActiveTheme('default');
  }
  
  return true;
};

// Get active theme
export const getActiveTheme = (): ThemeSettings | null => {
  const activeThemeId = localStorage.getItem(getTenantStorageKey(ACTIVE_THEME_KEY)) || 'default';
  const themes = getThemes();
  return themes.find((t: ThemeSettings) => t.id === activeThemeId) || themes[0] || null;
};

// Set active theme with real-time sync and immediate DOM application
export const setActiveTheme = (themeId: string): boolean => {
  const themes = getThemes();
  const theme = themes.find((t: ThemeSettings) => t.id === themeId);
  
  if (!theme) return false;
  
  // Update active status
  themes.forEach((t: ThemeSettings) => {
    t.isActive = t.id === themeId;
  });
  
  localStorage.setItem(getTenantStorageKey(STORAGE_KEY), JSON.stringify(themes));
  localStorage.setItem(getTenantStorageKey(ACTIVE_THEME_KEY), themeId);
  
  // Apply theme to DOM immediately
  applyThemeToDOM(theme.colors);
  
  // Notify all listeners about the theme change
  notifyThemeChange(theme);
  
  return true;
};

// Apply theme colors to DOM with smooth transitions
export const applyThemeToDOM = (colors: ColorPalette): void => {
  const root = document.documentElement;
  
  // Add transition class to body for smooth color changes
  document.body.classList.add('theme-transition');
  
  // Set CSS custom properties
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-light', colors.primaryLight);
  root.style.setProperty('--color-primary-dark', colors.primaryDark);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-secondary-light', colors.secondaryLight);
  root.style.setProperty('--color-secondary-dark', colors.secondaryDark);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-accent-light', colors.accentLight);
  root.style.setProperty('--color-accent-dark', colors.accentDark);
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-info', colors.info);
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-surface', colors.surface);
  root.style.setProperty('--color-text', colors.text);
  root.style.setProperty('--color-text-secondary', colors.textSecondary);
  root.style.setProperty('--color-border', colors.border);
  root.style.setProperty('--color-shadow', colors.shadow);
  
  // Remove transition class after animation completes
  setTimeout(() => {
    document.body.classList.remove('theme-transition');
  }, 300);
};

// Initialize theme system with real-time capabilities
export const initializeThemeSystem = (): void => {
  const activeTheme = getActiveTheme();
  if (activeTheme) {
    applyThemeToDOM(activeTheme.colors);
  }
  
  // Set up global theme change listener for cross-tab synchronization
  window.addEventListener('storage', (e) => {
    if (e.key === getTenantStorageKey(ACTIVE_THEME_KEY) && e.newValue) {
      const newActiveTheme = getActiveTheme();
      if (newActiveTheme) {
        applyThemeToDOM(newActiveTheme.colors);
        notifyThemeChange(newActiveTheme);
      }
    }
  });
};

// Create theme from preset
export const createThemeFromPreset = (presetId: string, customName?: string, createdBy: string = 'user'): ThemeSettings | null => {
  const preset = themePresets.find(p => p.id === presetId);
  if (!preset) return null;
  
  const theme: ThemeSettings = {
    id: Date.now().toString(),
    name: customName || preset.name,
    description: preset.description,
    colors: { ...preset.colors },
    isDefault: false,
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy
  };
  
  saveTheme(theme);
  return theme;
};

// Export theme
export const exportTheme = (themeId: string): string | null => {
  const themes = getThemes();
  const theme = themes.find((t: ThemeSettings) => t.id === themeId);
  
  if (!theme) return null;
  
  const exportData = {
    name: theme.name,
    description: theme.description,
    colors: theme.colors,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
  
  return JSON.stringify(exportData, null, 2);
};

// Import theme
export const importTheme = (themeData: string, createdBy: string): ThemeSettings | null => {
  try {
    const data = JSON.parse(themeData);
    
    // Validate required fields
    if (!data.name || !data.colors) {
      throw new Error('Invalid theme data');
    }
    
    const theme: ThemeSettings = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description || 'Tema importado',
      colors: data.colors,
      isDefault: false,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy
    };
    
    saveTheme(theme);
    return theme;
  } catch (error) {
    console.error('Error importing theme:', error);
    return null;
  }
};

// Reset to default theme
export const resetToDefaultTheme = (): void => {
  setActiveTheme('default');
};

// Validate color palette
export const validateColorPalette = (colors: Partial<ColorPalette>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredColors = [
    'primary', 'secondary', 'accent', 'success', 'warning', 'error',
    'background', 'surface', 'text', 'textSecondary', 'border'
  ];
  
  requiredColors.forEach(colorKey => {
    const color = colors[colorKey as keyof ColorPalette];
    if (!color) {
      errors.push(`Color ${colorKey} es requerido`);
    } else if (!/^#[0-9A-F]{6}$/i.test(color)) {
      errors.push(`Color ${colorKey} debe ser un código hexadecimal válido`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate color variations
export const generateColorVariations = (baseColor: string): { light: string; dark: string } => {
  return {
    light: lightenColor(baseColor, 0.3),
    dark: darkenColor(baseColor, 0.3)
  };
};

// Hook for real-time theme updates
export const useActiveTheme = () => {
  const [activeTheme, setActiveThemeState] = useState<ThemeSettings | null>(getActiveTheme());

  useEffect(() => {
    const unsubscribe = subscribeThemeChanges((theme) => {
      setActiveThemeState(theme);
    });

    return unsubscribe;
  }, []);

  return activeTheme;
};