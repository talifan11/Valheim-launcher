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

const MOCK_MODS: ModItem[] = [
  {
    id: 'm1',
    name: 'Valheim Plus',
    author: 'Community',
    description: 'Расширенные настройки строительства, крафта и выживания.',
    version: '2.4.1',
    latestVersion: '2.4.1',
    sizeKb: 820,
    enabled: true,
    status: 'installed',
    iconKind: 'hammer',
  },
  {
    id: 'm2',
    name: 'Epic Loot',
    author: 'RandyKnapp',
    description: 'Diablo-подобная система лута с редкостями и эффектами.',
    version: '0.9.2',
    latestVersion: '0.9.5',
    sizeKb: 1240,
    enabled: true,
    status: 'update-available',
    iconKind: 'sword',
  },
  {
    id: 'm3',
    name: 'Farm Grid',
    author: 'Community',
    description: 'Автоматическая сетка при посадке семян.',
    version: '1.2.0',
    latestVersion: '1.2.0',
    sizeKb: 320,
    enabled: true,
    status: 'installed',
    iconKind: 'crosshair',
  },
  {
    id: 'm4',
    name: 'Magic Overhaul',
    author: 'BepInEx Team',
    description: 'Полная переработка магии: новые посохи, заклинания, руны.',
    version: '—',
    latestVersion: '3.1.0',
    sizeKb: 2100,
    enabled: false,
    status: 'not-installed',
    iconKind: 'wand',
  },
  {
    id: 'm5',
    name: 'Shield & Block',
    author: 'Community',
    description: 'Улучшенная механика щитов и парирования.',
    version: '—',
    latestVersion: '1.0.4',
    sizeKb: 410,
    enabled: false,
    status: 'not-installed',
    iconKind: 'shield',
  },
  {
    id: 'm6',
    name: 'Better Mining',
    author: 'Rockbreaker',
    description: 'Ускоренная добыча руды и камня без потери баланса.',
    version: '2.0.1',
    latestVersion: '2.0.1',
    sizeKb: 180,
    enabled: true,
    status: 'installed',
    iconKind: 'pickaxe',
  },
];

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
