// Просмотр профилей: своего и друзей. Открывается как overlay.
import { create } from 'zustand';

interface ProfileViewState {
  open: boolean;
  userId: number | null; // null = свой профиль
  openProfile: (userId: number | null) => void;
  close: () => void;
}

export const useProfileViewStore = create<ProfileViewState>((set) => ({
  open: false,
  userId: null,
  openProfile: (userId) => set({ open: true, userId }),
  close: () => set({ open: false }),
}));
