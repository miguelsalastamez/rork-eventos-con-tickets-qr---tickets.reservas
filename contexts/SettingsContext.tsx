import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';

export type SoundOption = {
  id: string;
  name: string;
  url: string;
};

export const SUCCESS_SOUNDS: SoundOption[] = [
  {
    id: 'success-1',
    name: 'Campana Simple',
    url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  },
  {
    id: 'success-2',
    name: 'Doble Campana',
    url: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  },
  {
    id: 'success-3',
    name: 'Timbre de Éxito',
    url: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  },
  {
    id: 'success-4',
    name: 'Éxito Digital',
    url: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  },
  {
    id: 'success-5',
    name: 'Victoria',
    url: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  },
];

export const ERROR_SOUNDS: SoundOption[] = [
  {
    id: 'error-1',
    name: 'Buzz Simple',
    url: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
  },
  {
    id: 'error-2',
    name: 'Error Digital',
    url: 'https://assets.mixkit.co/active_storage/sfx/2577/2577-preview.mp3',
  },
  {
    id: 'error-3',
    name: 'Alerta',
    url: 'https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3',
  },
  {
    id: 'error-4',
    name: 'Alerta Corta',
    url: 'https://assets.mixkit.co/active_storage/sfx/1873/1873-preview.mp3',
  },
  {
    id: 'error-5',
    name: 'Fallo',
    url: 'https://assets.mixkit.co/active_storage/sfx/1994/1994-preview.mp3',
  },
];

interface Settings {
  successSoundId: string;
  errorSoundId: string;
  vibrationEnabled: boolean;
}

const SETTINGS_STORAGE_KEY = '@eventpass_settings';

const defaultSettings: Settings = {
  successSoundId: 'success-1',
  errorSoundId: 'error-1',
  vibrationEnabled: true,
};

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const updateSuccessSound = useCallback((soundId: string) => {
    saveSettings({ ...settings, successSoundId: soundId });
  }, [settings]);

  const updateErrorSound = useCallback((soundId: string) => {
    saveSettings({ ...settings, errorSoundId: soundId });
  }, [settings]);

  const toggleVibration = useCallback(() => {
    saveSettings({ ...settings, vibrationEnabled: !settings.vibrationEnabled });
  }, [settings]);

  const getSuccessSound = useCallback(() => {
    return SUCCESS_SOUNDS.find(s => s.id === settings.successSoundId) || SUCCESS_SOUNDS[0];
  }, [settings.successSoundId]);

  const getErrorSound = useCallback(() => {
    return ERROR_SOUNDS.find(s => s.id === settings.errorSoundId) || ERROR_SOUNDS[0];
  }, [settings.errorSoundId]);

  return useMemo(() => ({
    settings,
    isLoading,
    updateSuccessSound,
    updateErrorSound,
    toggleVibration,
    getSuccessSound,
    getErrorSound,
  }), [settings, isLoading, updateSuccessSound, updateErrorSound, toggleVibration, getSuccessSound, getErrorSound]);
});
