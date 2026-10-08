// Проверка обновлений лаунчера.

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { LAUNCHER_VERSION } from '../config';

export interface LauncherUpdate {
  version: string;
  download_url: string;
  release_notes: string;
  published_at: string;
}

interface LauncherUpdateState {
  available: LauncherUpdate | null;
  checking: boolean;
  dismissed: boolean;

  check: () => Promise<void>;
  dismiss: () => void;
}

export const useLauncherUpdateStore = create<LauncherUpdateState>((set) => ({
  available: null,
  checking: false,
  dismissed: false,

  check: async () => {
    set({ checking: true });
    try {
      const result = await invoke<LauncherUpdate | null>('check_launcher_update', {
        currentVersion: LAUNCHER_VERSION,
      });
      set({ available: result, checking: false });
    } catch (err) {
      console.warn('Ошибка проверки обновления лаунчера:', err);
      set({ checking: false });
    }
  },

  dismiss: () => set({ dismissed: true }),
}));
