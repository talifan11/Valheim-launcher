// Друзья, заявки, сообщения. Синхронизация с API на VPS.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '../lib/api';
import { useLauncherStore } from './useLauncherStore';

export type FriendStatus = 'online' | 'in-game' | 'offline';

export interface Friend {
  id: string;
  userId: number;
  name: string;
  status: FriendStatus;
  activity?: string;
  lastSeenMinutes?: number;
  level?: number;
}

interface FriendsState {
  friends: Friend[];
  incoming: Friend[];
  outgoing: Friend[];
  activeProfileId: string | null;
  loading: boolean;
  error: string | null;

  loadFriends: () => Promise<void>;
  sendRequest: (userId: number) => Promise<void>;
  acceptRequest: (userId: number) => Promise<void>;
  rejectRequest: (userId: number) => Promise<void>;
  removeFriend: (userId: number) => Promise<void>;
  setActiveProfile: (id: string | null) => void;
  getById: (id: string) => Friend | undefined;
  onlineCount: () => number;
  startPolling: () => () => void;
  reset: () => void;
}

function getToken(): string | null {
  return useLauncherStore.getState().authToken;
}

interface ApiUserWithOnline {
  user_id: number;
  username: string;
  online?: boolean;
}

function mapUser(u: ApiUserWithOnline): Friend {
  return {
    id: `u${u.user_id}`,
    userId: u.user_id,
    name: u.username,
    status: u.online ? 'online' : 'offline',
    lastSeenMinutes: undefined,
  };
}

export const useFriendsStore = create<FriendsState>()(
  persist(
    (set, get) => ({
      friends: [],
      incoming: [],
      outgoing: [],
      activeProfileId: null,
      loading: false,
      error: null,

      loadFriends: async () => {
        const token = getToken();
        if (!token) return;

        set({ loading: true, error: null });
        try {
          const data = await api.getFriends(token);
          set({
            friends: data.friends.map(mapUser),
            incoming: data.incoming.map(mapUser),
            outgoing: data.outgoing.map(mapUser),
            loading: false,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          set({ loading: false, error: message });
          console.warn('Ошибка загрузки друзей:', message);
        }
      },

      sendRequest: async (userId: number) => {
        const token = getToken();
        if (!token) throw new Error('Нет токена');
        await api.sendFriendRequest(userId, token);
        await get().loadFriends();
      },

      acceptRequest: async (userId: number) => {
        const token = getToken();
        if (!token) throw new Error('Нет токена');
        await api.acceptFriendRequest(userId, token);
        await get().loadFriends();
      },

      rejectRequest: async (userId: number) => {
        const token = getToken();
        if (!token) throw new Error('Нет токена');
        await api.rejectFriendRequest(userId, token);
        await get().loadFriends();
      },

      removeFriend: async (userId: number) => {
        const token = getToken();
        if (!token) throw new Error('Нет токена');
        await api.removeFriend(userId, token);
        await get().loadFriends();
      },

      setActiveProfile: (id) => set({ activeProfileId: id }),

      getById: (id) => get().friends.find((f) => f.id === id),

      onlineCount: () => get().friends.filter((f) => f.status !== 'offline').length,

      startPolling: () => {
        void get().loadFriends();
        const interval = window.setInterval(() => {
          void get().loadFriends();
        }, 30000);
        return () => window.clearInterval(interval);
      },

      reset: () => set({ friends: [], incoming: [], outgoing: [], activeProfileId: null }),
    }),
    {
      name: 'valheim-rouge:friends-cache',
      version: 1,
      partialize: (state) => ({ friends: state.friends }),
    }
  )
);
