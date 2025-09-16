// src/contexts/OfflineSettingsContext.jsx
// User settings for offline sync behavior and PWA preferences

import React, { createContext, useEffect, useState, useCallback } from 'react';

const OfflineSettingsContext = createContext();

const DEFAULT_SETTINGS = {
  autoSync: true,
  syncInterval: 30000, // 30 seconds
  notificationsEnabled: true,
  offlineCacheDuration: 24 * 60 * 60 * 1000, // 24 hours
  conflictResolution: 'ask', // 'ask' | 'keepLocal' | 'useServer'
  backgroundSync: true,
  dataCompressionEnabled: true,
  maxRetryAttempts: 3
};

export function OfflineSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('offlineSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.warn('Failed to parse offline settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('offlineSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Request notification permission if enabled
  useEffect(() => {
    if (settings.notificationsEnabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [settings.notificationsEnabled]);

  return (
    <OfflineSettingsContext.Provider value={{
      settings,
      updateSetting,
      updateSettings,
      resetSettings,
      DEFAULT_SETTINGS
    }}>
      {children}
    </OfflineSettingsContext.Provider>
  );
}

export { OfflineSettingsContext };
