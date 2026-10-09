// Список игроков, находящихся на игровом сервере прямо сейчас.
// Отдельно от личного списка друзей.
// Пока mock, позже — запрос к API сервера.

import { create } from 'zustand';

export interface ServerPlayer {
  id: string;
  name: string;
  /** Уровень персонажа (заглушка) */
  level: number;
  /** Клан, если игрок в клане */
  clan?: string;
  /** Минут в игре за текущую сессию */
  sessionMinutes: number;
}

interface ServerPlayersState {
  players: ServerPlayer[];
  /** Максимальный слот сервера */
  maxSlots: number;
  /** Получить игрока по id */
  getById: (id: string) => ServerPlayer | undefined;
  /** Количество игроков на сервере */
  count: () => number;
}

const MOCK_PLAYERS: ServerPlayer[] = [];

export const useServerPlayersStore = create<ServerPlayersState>((_, get) => ({
  players: MOCK_PLAYERS,
  maxSlots: 20,

  getById: (id) => get().players.find((p) => p.id === id),

  count: () => get().players.length,
}));
