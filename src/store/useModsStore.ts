// Моды: список с VPS + локальные предпочтения игрока.
import { create } from 'zustand';
import * as api from '../lib/api';
import { useLauncherStore } from './useLauncherStore';

interface ModsState {
  mods: api.UserMod[];
  loading: boolean;
  error: string | null;
  busyName: string | null;

  loadMods: () => Promise<void>;
  toggleMod: (name: string, enabled: boolean) => Promise<void>;
  reset: () => void;
}

export const useModsStore = create<ModsState>((set) => ({
  mods: [],
  loading: false,
  error: null,
  busyName: null,

  loadMods: async () => {
    const token = useLauncherStore.getState().authToken;
    if (!token) return;
    set({ loading: true, error: null });
    try {
      const mods = await api.getUserMods(token);
      set({ mods, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Ошибка',
      });
    }
  },

  toggleMod: async (name, enabled) => {
    const token = useLauncherStore.getState().authToken;
    if (!token) return;
    set({ busyName: name });
    try {
      await api.toggleUserMod(token, name, enabled);
      set((s) => ({
        mods: s.mods.map((m) => (m.name === name ? { ...m, enabled } : m)),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      set({ busyName: null });
    }
  },

  reset: () => set({ mods: [], loading: false, error: null, busyName: null }),
}));
