// Стор правой панели. Только режим "поверх" (overlay).

import { create } from 'zustand';

export type RightPanelSection = 'friends' | 'server';

interface RightPanelState {
  open: boolean;
  section: RightPanelSection;

  setOpen: (open: boolean) => void;
  toggle: () => void;
  setSection: (section: RightPanelSection) => void;
  openWith: (section: RightPanelSection) => void;
}

export const useRightPanelStore = create<RightPanelState>((set, get) => ({
  open: false,
  section: 'friends',

  setOpen: (open) => set({ open }),
  toggle: () => set({ open: !get().open }),
  setSection: (section) => set({ section }),

  openWith: (section) => set({ open: true, section }),
}));
