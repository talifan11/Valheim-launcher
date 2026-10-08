// Личный список друзей. Сохраняется в localStorage.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FriendStatus = 'online' | 'in-game' | 'offline';

export interface Friend {
  id: string;
  name: string;
  status: FriendStatus;
  activity?: string;
  lastSeenMinutes?: number;
  level?: number;
}

interface FriendsState {
  friends: Friend[];
  activeProfileId: string | null;
  setActiveProfile: (id: string | null) => void;
  getById: (id: string) => Friend | undefined;
  onlineCount: () => number;
  removeFriend: (id: string) => void;
  addFriend: (friend: Friend) => void;
  hasFriend: (id: string) => boolean;
  reset: () => void;
}

const MOCK_FRIENDS: Friend[] = [
  { id: 'f1', name: 'Эрик', status: 'in-game', activity: 'Valheim Rouge', level: 42 },
  { id: 'f2', name: 'Астрид', status: 'online', level: 38 },
  { id: 'f3', name: 'Бьорн', status: 'in-game', activity: 'Valheim Rouge', level: 51 },
  { id: 'f4', name: 'Сигрид', status: 'offline', lastSeenMinutes: 45, level: 27 },
];

export const useFriendsStore = create<FriendsState>()(
  persist(
    (set, get) => ({
      friends: MOCK_FRIENDS,
      activeProfileId: null,

      setActiveProfile: (id) => set({ activeProfileId: id }),

      getById: (id) => get().friends.find((f) => f.id === id),

      onlineCount: () => get().friends.filter((f) => f.status !== 'offline').length,

      removeFriend: (id) => {
        set((s) => ({
          friends: s.friends.filter((f) => f.id !== id),
          activeProfileId: s.activeProfileId === id ? null : s.activeProfileId,
        }));
      },

      addFriend: (friend) => {
        if (get().hasFriend(friend.id)) return;
        set((s) => ({ friends: [...s.friends, friend] }));
      },

      hasFriend: (id) => get().friends.some((f) => f.id === id),

      reset: () => set({ friends: MOCK_FRIENDS, activeProfileId: null }),
    }),
    {
      name: 'valheim-rouge:friends',
      version: 1,
      // activeProfileId — это UI, не сохраняем.
      partialize: (state) => ({ friends: state.friends }),
    }
  )
);
