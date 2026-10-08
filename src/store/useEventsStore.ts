// События сервера. Сохраняется участие пользователя.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EventKind = 'raid' | 'tournament' | 'meetup' | 'quest';
export type EventStatus = 'upcoming' | 'live' | 'past';

export interface ServerEvent {
  id: string;
  kind: EventKind;
  title: string;
  description: string;
  startsAt: number;
  durationMinutes: number;
  participants: number;
  maxParticipants: number;
  joined: boolean;
  reward?: string;
}

interface EventsState {
  events: ServerEvent[];
  join: (id: string) => void;
  leave: (id: string) => void;
  countLive: () => number;
  countUpcoming: () => number;
  reset: () => void;
}

const now = Date.now();
const HOUR = 3600_000;

const MOCK_EVENTS: ServerEvent[] = [
  {
    id: 'e1',
    kind: 'raid',
    title: 'Ночной рейд на Чёрный форт',
    description:
      'Усиленный босс появляется на севере карты. Урон проходит только группой от 4 человек. Длительность 2 часа.',
    startsAt: now + 2 * HOUR,
    durationMinutes: 120,
    participants: 8,
    maxParticipants: 16,
    joined: true,
    reward: 'Уникальный плащ + 500 опыта',
  },
  {
    id: 'e2',
    kind: 'tournament',
    title: 'Турнир корабелов',
    description:
      'Строим лучший дракар за неделю. Победители получают префикс и место в зале славы на спавне.',
    startsAt: now + 26 * HOUR,
    durationMinutes: 60 * 24 * 7,
    participants: 12,
    maxParticipants: 32,
    joined: false,
    reward: 'Префикс «Корабел» + место в зале славы',
  },
  {
    id: 'e3',
    kind: 'meetup',
    title: 'Сбор клана в главном лагере',
    description:
      'Обсуждаем план на неделю, делим ресурсы, готовимся к рейду на Ётуна.',
    startsAt: now + 5 * HOUR,
    durationMinutes: 60,
    participants: 4,
    maxParticipants: 20,
    joined: false,
    reward: 'Общий сундук ресурсов',
  },
  {
    id: 'e4',
    kind: 'quest',
    title: 'Охота на духов',
    description:
      'Ночная охота на духов в туманных болотах. Нужны лучники и лекари. Добыча делится поровну.',
    startsAt: now + 12 * HOUR,
    durationMinutes: 180,
    participants: 6,
    maxParticipants: 8,
    joined: false,
    reward: 'Духовный амулет',
  },
  {
    id: 'e5',
    kind: 'raid',
    title: 'Битва с Ётуном',
    description:
      'Прошлый рейд на Ётуна. Запись для истории — можно посмотреть кто участвовал.',
    startsAt: now - 2 * HOUR,
    durationMinutes: 120,
    participants: 14,
    maxParticipants: 16,
    joined: true,
    reward: 'Сундук Ётуна',
  },
];

export const useEventsStore = create<EventsState>()(
  persist(
    (set, get) => ({
      events: MOCK_EVENTS,

      join: (id) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id
              ? {
                  ...e,
                  joined: true,
                  participants: Math.min(
                    e.participants + 1,
                    e.maxParticipants || e.participants + 1
                  ),
                }
              : e
          ),
        })),

      leave: (id) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id
              ? { ...e, joined: false, participants: Math.max(0, e.participants - 1) }
              : e
          ),
        })),

      countLive: () =>
        get().events.filter(
          (e) => now >= e.startsAt && now < e.startsAt + e.durationMinutes * 60_000
        ).length,

      countUpcoming: () => get().events.filter((e) => e.startsAt > now).length,

      reset: () => set({ events: MOCK_EVENTS }),
    }),
    {
      name: 'valheim-rouge:events',
      version: 1,
      // Сохраняем только события + статус join, чтобы таймеры обновлялись.
      partialize: (state) => ({ events: state.events }),
    }
  )
);
