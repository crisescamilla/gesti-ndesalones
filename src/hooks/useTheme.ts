import { useState, useEffect } from 'react';
import { ThemeSettings } from '../types';
import { getActiveTheme, subscribeThemeChanges } from '../utils/themeManager';

// Custom hook for real-time theme updates
export const useTheme = () => {
  const [activeTheme, setActiveTheme] = useState<ThemeSettings | null>(getActiveTheme());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to theme changes
    const unsubscribe = subscribeThemeChanges((newTheme) => {
      setActiveTheme(newTheme);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const refreshTheme = () => {
    setLoading(true);
    try {
      const currentTheme = getActiveTheme();
      setActiveTheme(currentTheme);
    } finally {
      setLoading(false);
    }
  };

  return {
    activeTheme,
    loading,
    refreshTheme,
    colors: activeTheme?.colors,
    themeName: activeTheme?.name,
    themeId: activeTheme?.id
  };
};

// Hook for theme-aware components
export const useThemeColors = () => {
  const { colors } = useTheme();
  return colors;
};

// Hook for theme status
export const useThemeStatus = () => {
  const { activeTheme, loading } = useTheme();
  
  return {
    isThemeLoaded: !!activeTheme,
    isLoading: loading,
    themeId: activeTheme?.id,
    themeName: activeTheme?.name
  };
};