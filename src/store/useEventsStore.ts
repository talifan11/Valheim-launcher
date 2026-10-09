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

const MOCK_EVENTS: ServerEvent[] = [];

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
