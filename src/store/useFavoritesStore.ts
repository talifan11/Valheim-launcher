// Избранные новости. Сохраняется в localStorage.

import { create } from 'zustand';

const STORAGE_KEY = 'valheim-rouge:favorites';

function load(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(ids: number[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // тихо
  }
}

interface FavoritesState {
  ids: number[];
  toggle: (id: number) => boolean;
  has: (id: number) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: load(),

  toggle: (id) => {
    const current = get().ids;
    const exists = current.includes(id);
    const next = exists ? current.filter((x) => x !== id) : [...current, id];
    set({ ids: next });
    persist(next);
    return !exists;
  },

  has: (id) => get().ids.includes(id),
}));
