// Changelog: тянется с VPS. Кэш 3 минуты.
import { create } from 'zustand';
import * as api from '../lib/api';

const CACHE_TTL_MS = 3 * 60 * 1000;

interface ChangelogState {
  items: api.ApiChangelogEntry[];
  loading: boolean;
  error: string | null;
  lastFetched: number;
  loadChangelog: (force?: boolean) => Promise<void>;
}

export const useChangelogStore = create<ChangelogState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  lastFetched: 0,

  loadChangelog: async (force = false) => {
    const now = Date.now();
    const { lastFetched, loading } = get();
    if (!force && now - lastFetched < CACHE_TTL_MS && get().items.length > 0) return;
    if (loading) return;
    set({ loading: true, error: null });
    try {
      const items = await api.getChangelog();
      set({ items, loading: false, lastFetched: now, error: null });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Ошибка' });
    }
  },
}));
