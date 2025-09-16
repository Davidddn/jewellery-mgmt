// src/hooks/useOfflineSync.js
// Custom hook for accessing offline sync context

import { useContext } from 'react';
import { OfflineSyncContext } from '../contexts/OfflineSyncContext';

export const useOfflineSync = () => {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }
  return context;
};
