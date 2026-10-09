// Моды: вкл/выкл, установка. Сохраняется в localStorage.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModStatus = 'installed' | 'update-available' | 'not-installed';

export interface ModItem {
  id: string;
  name: string;
  author: string;
  description: string;
  version: string;
  latestVersion: string;
  sizeKb: number;
  enabled: boolean;
  status: ModStatus;
  iconKind: 'sword' | 'shield' | 'pickaxe' | 'wand' | 'hammer' | 'crosshair';
}

interface ModsState {
  mods: ModItem[];
  toggle: (id: string) => void;
  install: (id: string) => void;
  uninstall: (id: string) => void;
  countEnabled: () => number;
  countUpdates: () => number;
  reset: () => void;
}

const MOCK_MODS: ModItem[] = [];

export const useModsStore = create<ModsState>()(
  persist(
    (set, get) => ({
      mods: MOCK_MODS,

      toggle: (id) =>
        set((s) => ({
          mods: s.mods.map((m) =>
            m.id === id && m.status !== 'not-installed' ? { ...m, enabled: !m.enabled } : m
          ),
        })),

      install: (id) =>
        set((s) => ({
          mods: s.mods.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status: 'installed',
                  enabled: true,
                  version: m.latestVersion,
                }
              : m
          ),
        })),

      uninstall: (id) =>
        set((s) => ({
          mods: s.mods.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status: 'not-installed',
                  enabled: false,
                  version: '—',
                }
              : m
          ),
        })),

      countEnabled: () => get().mods.filter((m) => m.enabled).length,
      countUpdates: () => get().mods.filter((m) => m.status === 'update-available').length,

      reset: () => set({ mods: MOCK_MODS }),
    }),
    {
      name: 'valheim-rouge:mods',
      version: 1,
      partialize: (state) => ({ mods: state.mods }),
    }
  )
);
