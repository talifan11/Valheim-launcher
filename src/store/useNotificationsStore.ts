// Уведомления. Сохраняются в localStorage.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationKind = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message?: string;
  timestamp: number;
  read: boolean;
}

interface NotificationsState {
  items: AppNotification[];
  add: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  remove: (id: string) => void;
  clearAll: () => void;
  unreadCount: () => number;
  reset: () => void;
}


const MOCK: AppNotification[] = [];

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      items: MOCK,

      add: (n) =>
        set((s) => ({
          items: [
            {
              ...n,
              id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              timestamp: Date.now(),
              read: false,
            },
            ...s.items,
          ].slice(0, 50),
        })),

      markAllRead: () =>
        set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) })),

      markRead: (id) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, read: true } : i)),
        })),

      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      clearAll: () => set({ items: [] }),

      unreadCount: () => get().items.filter((i) => !i.read).length,

      reset: () => set({ items: MOCK }),
    }),
    {
      name: 'valheim-rouge:notifications',
      version: 1,
      partialize: (state) => ({ items: state.items }),
    }
  )
);
