import { useContext } from 'react';
import { OfflineSettingsContext } from './OfflineSettingsContext';

export function useOfflineSettings() {
  return useContext(OfflineSettingsContext);
}
