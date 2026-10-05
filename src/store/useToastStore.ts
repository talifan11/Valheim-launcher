// Глобальные уведомления (toast): успех / ошибка / информация.
// Логика живёт в Zustand-сторе, компоненты только вызывают push/dismiss —
// бизнес-логика не смешивается с разметкой (п. 5 ТЗ).
import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  /** Добавить уведомление; само исчезнет через durationMs */
  push: (kind: ToastKind, message: string, durationMs?: number) => void;
  /** Убрать уведомление по id */
  dismiss: (id: number) => void;
}

let nextToastId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  push: (kind, message, durationMs = 4000) => {
    const id = nextToastId++;
    set({ toasts: [...get().toasts, { id, kind, message }] });
    window.setTimeout(() => get().dismiss(id), durationMs);
  },

  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Короткие алиасы для вызова из кода без обращения к стору напрямую */
export const toast = {
  success: (message: string) => useToastStore.getState().push('success', message),
  error: (message: string) => useToastStore.getState().push('error', message, 6000),
  info: (message: string) => useToastStore.getState().push('info', message),
};
