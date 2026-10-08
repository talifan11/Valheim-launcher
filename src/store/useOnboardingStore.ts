// Онбординг: флаг прохождения + текущий шаг.

import { create } from 'zustand';

const STORAGE_KEY = 'valheim-rouge:onboarding-completed';

function loadCompleted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

interface OnboardingState {
  completed: boolean;
  active: boolean;
  step: number;
  totalSteps: number;

  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  finish: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  completed: loadCompleted(),
  active: false,
  step: 0,
  totalSteps: 6,

  start: () => set({ active: true, step: 0 }),

  next: () => {
    const { step, totalSteps } = get();
    if (step + 1 >= totalSteps) {
      get().finish();
    } else {
      set({ step: step + 1 });
    }
  },

  prev: () => set({ step: Math.max(0, get().step - 1) }),

  skip: () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // тихо
    }
    set({ completed: true, active: false });
  },

  finish: () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // тихо
    }
    set({ completed: true, active: false, step: 0 });
  },

  reset: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // тихо
    }
    set({ completed: false, active: false, step: 0 });
  },
}));
