import { useState, useEffect } from 'react';
import { SalonSettings } from '../types';
import { getSalonSettings, subscribeSalonSettingsChanges } from '../utils/salonSettings';

// Custom hook for real-time salon settings
export const useSalonSettings = () => {
  const [settings, setSettings] = useState<SalonSettings>(getSalonSettings());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to settings changes
    const unsubscribe = subscribeSalonSettingsChanges((newSettings) => {
      setSettings(newSettings);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const refreshSettings = () => {
    setLoading(true);
    try {
      const currentSettings = getSalonSettings();
      setSettings(currentSettings);
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    salonName: settings.salonName,
    salonMotto: settings.salonMotto,
    loading,
    refreshSettings
  };
};

// Hook specifically for salon name with real-time updates
export const useSalonName = (): string => {
  const [salonName, setSalonName] = useState<string>(getSalonSettings().salonName);

  useEffect(() => {
    const unsubscribe = subscribeSalonSettingsChanges((settings) => {
      setSalonName(settings.salonName);
    });

    return unsubscribe;
  }, []);

  return salonName;
};

// Hook specifically for salon motto with real-time updates
export const useSalonMotto = (): string => {
  const [salonMotto, setSalonMotto] = useState<string>(getSalonSettings().salonMotto);

  useEffect(() => {
    const unsubscribe = subscribeSalonSettingsChanges((settings) => {
      setSalonMotto(settings.salonMotto);
    });

    return unsubscribe;
  }, []);

  return salonMotto;
};