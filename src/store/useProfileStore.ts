// Профиль пользователя: имя, аватар, статистика.
// Аватар хранится как id (avatar-1 ... avatar-8).

import { create } from 'zustand';

export const AVATARS = [
  'avatar-1',
  'avatar-2',
  'avatar-3',
  'avatar-4',
  'avatar-5',
  'avatar-6',
  'avatar-7',
  'avatar-8',
] as const;

export type AvatarId = (typeof AVATARS)[number];

interface ProfileState {
  avatarId: AvatarId;
  setAvatar: (id: AvatarId) => void;
}

const STORAGE_KEY = 'valheim-rouge:avatar';

function loadAvatar(): AvatarId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (AVATARS as readonly string[]).includes(saved)) {
      return saved as AvatarId;
    }
  } catch {
    // localStorage может быть недоступен
  }
  return 'avatar-1';
}

function persistAvatar(id: AvatarId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // тихо
  }
}

export const useProfileStore = create<ProfileState>((set) => ({
  avatarId: loadAvatar(),

  setAvatar: (id) => {
    set({ avatarId: id });
    persistAvatar(id);
  },
}));

// Получить аватар для друга по его id (стабильное распределение).
export function getFriendAvatar(friendId: string): AvatarId {
  let hash = 0;
  for (let i = 0; i < friendId.length; i++) {
    hash = (hash * 31 + friendId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % AVATARS.length;
  return AVATARS[index];
}
