// События: список с VPS, создание, join/leave.
import { create } from 'zustand';
import * as api from '../lib/api';
import { useLauncherStore } from './useLauncherStore';

const CACHE_TTL_MS = 60 * 1000;

interface EventsState {
  events: api.GameEvent[];
  loading: boolean;
  error: string | null;
  busyId: number | null;
  lastFetched: number;

  loadEvents: (force?: boolean) => Promise<void>;
  createEvent: (payload: api.CreateEventPayload) => Promise<number>;
  joinEvent: (id: number) => Promise<void>;
  leaveEvent: (id: number) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;
  reset: () => void;
}

function getToken(): string | null {
  return useLauncherStore.getState().authToken;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  loading: false,
  error: null,
  busyId: null,
  lastFetched: 0,

  loadEvents: async (force = false) => {
    const token = getToken();
    if (!token) return;
    const now = Date.now();
    if (!force && now - get().lastFetched < CACHE_TTL_MS && get().events.length > 0) return;
    set({ loading: true, error: null });
    try {
      const events = await api.getEvents(token);
      set({ events, loading: false, lastFetched: now });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Ошибка',
      });
    }
  },

  createEvent: async (payload) => {
    const token = getToken();
    if (!token) throw new Error('Нет токена');
    const res = await api.createEvent(token, payload);
    await get().loadEvents(true);
    return res.id;
  },

  joinEvent: async (id) => {
    const token = getToken();
    if (!token) return;
    set({ busyId: id });
    try {
      await api.joinEvent(token, id);
      await get().loadEvents(true);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      set({ busyId: null });
    }
  },

  leaveEvent: async (id) => {
    const token = getToken();
    if (!token) return;
    set({ busyId: id });
    try {
      await api.leaveEvent(token, id);
      await get().loadEvents(true);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      set({ busyId: null });
    }
  },

  deleteEvent: async (id) => {
    const token = getToken();
    if (!token) return;
    try {
      await api.deleteEvent(token, id);
      await get().loadEvents(true);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка' });
    }
  },

  reset: () => set({ events: [], loading: false, error: null, busyId: null, lastFetched: 0 }),
}));