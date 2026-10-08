// Настройки приложения: тема, язык, звук, поведение.
// Хранятся в localStorage и применяются на лету.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'navy' | 'charcoal';
export type Language = 'ru' | 'en';

interface AppSettingsState {
  theme: Theme;
  language: Language;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  checkUpdatesOnStart: boolean;
  autoLaunchGame: boolean;
  minimizeToTray: boolean;

  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  toggleSound: () => void;
  toggleNotifications: () => void;
  toggleCheckUpdates: () => void;
  toggleAutoLaunch: () => void;
  toggleMinimizeToTray: () => void;
  reset: () => void;
}

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'ru',
      soundEnabled: true,
      notificationsEnabled: true,
      checkUpdatesOnStart: true,
      autoLaunchGame: false,
      minimizeToTray: false,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleNotifications: () =>
        set((s) => ({ notificationsEnabled: !s.notificationsEnabled })),
      toggleCheckUpdates: () =>
        set((s) => ({ checkUpdatesOnStart: !s.checkUpdatesOnStart })),
      toggleAutoLaunch: () =>
        set((s) => ({ autoLaunchGame: !s.autoLaunchGame })),
      toggleMinimizeToTray: () =>
        set((s) => ({ minimizeToTray: !s.minimizeToTray })),

      reset: () =>
        set({
          theme: 'dark',
          language: 'ru',
          soundEnabled: true,
          notificationsEnabled: true,
          checkUpdatesOnStart: true,
          autoLaunchGame: false,
          minimizeToTray: false,
        }),
    }),
    {
      name: 'valheim-rouge:settings',
      version: 1,
    }
  )
);
