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

const MOCK_PLAYERS: ServerPlayer[] = [
  { id: 'p1', name: 'Эрик', level: 42, clan: 'Rouge', sessionMinutes: 127 },
  { id: 'p2', name: 'Бьорн', level: 51, clan: 'Rouge', sessionMinutes: 63 },
  { id: 'p3', name: 'Олаф', level: 44, sessionMinutes: 15 },
  { id: 'p4', name: 'Фрейя', level: 12, sessionMinutes: 8 },
  { id: 'p5', name: 'Ингрид', level: 19, clan: 'Вороны', sessionMinutes: 240 },
  { id: 'p6', name: 'Харальд', level: 33, sessionMinutes: 87 },
  { id: 'p7', name: 'Астрид', level: 38, clan: 'Rouge', sessionMinutes: 102 },
];

export const useServerPlayersStore = create<ServerPlayersState>((_, get) => ({
  players: MOCK_PLAYERS,
  maxSlots: 20,

  getById: (id) => get().players.find((p) => p.id === id),

  count: () => get().players.length,
}));
