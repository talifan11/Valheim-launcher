// Стор чата: каналы, сообщения, отправка. Сохраняется в localStorage.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  timestamp: number;
  own?: boolean;
}

export interface ChatChannel {
  id: string;
  kind: 'general' | 'dm';
  title: string;
  peerId?: string;
}

interface ChatState {
  open: boolean;
  channels: ChatChannel[];
  activeChannelId: string;
  messages: Record<string, ChatMessage[]>;
  unread: Record<string, number>;

  toggle: (open?: boolean) => void;
  setActiveChannel: (id: string) => void;
  sendMessage: (text: string) => void;
  openDmWith: (peerId: string, peerName: string) => void;
  markRead: (channelId: string) => void;
  clearChannel: (channelId: string) => void;
  deleteChannel: (channelId: string) => void;
  reset: () => void;
}

const GENERAL_CHANNEL: ChatChannel = {
  id: 'general',
  kind: 'general',
  title: 'Общий чат',
};

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  general: [],
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      open: false,
      channels: [GENERAL_CHANNEL],
      activeChannelId: 'general',
      messages: INITIAL_MESSAGES,
      unread: {},

      toggle: (open) => set({ open: open ?? !get().open }),

      setActiveChannel: (id) => {
        set({ activeChannelId: id });
        set((s) => ({ unread: { ...s.unread, [id]: 0 } }));
      },

      sendMessage: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const channelId = get().activeChannelId;
        const message: ChatMessage = {
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          authorId: 'me',
          authorName: 'Вы',
          text: trimmed,
          timestamp: Date.now(),
          own: true,
        };

        set((s) => ({
          messages: {
            ...s.messages,
            [channelId]: [...(s.messages[channelId] ?? []), message],
          },
        }));
      },

      openDmWith: (peerId, peerName) => {
        const existing = get().channels.find(
          (c) => c.kind === 'dm' && (c.peerId === peerId || c.title === peerName)
        );
        if (existing) {
          set({ activeChannelId: existing.id, open: true });
          set((s) => ({ unread: { ...s.unread, [existing.id]: 0 } }));
          return;
        }

        const newChannel: ChatChannel = {
          id: `dm-${peerId}`,
          kind: 'dm',
          title: peerName,
          peerId,
        };

        set((s) => ({
          channels: [...s.channels, newChannel],
          activeChannelId: newChannel.id,
          open: true,
          messages: { ...s.messages, [newChannel.id]: [] },
          unread: { ...s.unread, [newChannel.id]: 0 },
        }));
      },

      markRead: (channelId) => {
        set((s) => ({ unread: { ...s.unread, [channelId]: 0 } }));
      },

      clearChannel: (channelId) => {
        set((s) => ({
          messages: { ...s.messages, [channelId]: [] },
          unread: { ...s.unread, [channelId]: 0 },
        }));
      },

      deleteChannel: (channelId) => {
        const channel = get().channels.find((c) => c.id === channelId);
        if (!channel || channel.kind === 'general') return;

        set((s) => {
          const nextChannels = s.channels.filter((c) => c.id !== channelId);
          const nextMessages = { ...s.messages };
          delete nextMessages[channelId];
          const nextUnread = { ...s.unread };
          delete nextUnread[channelId];

          const nextActive =
            s.activeChannelId === channelId ? 'general' : s.activeChannelId;

          return {
            channels: nextChannels,
            messages: nextMessages,
            unread: nextUnread,
            activeChannelId: nextActive,
          };
        });
      },

      reset: () =>
        set({
          channels: [GENERAL_CHANNEL],
          activeChannelId: 'general',
          messages: INITIAL_MESSAGES,
          unread: {},
        }),
    }),
    {
      name: 'valheim-rouge:chat',
      version: 1,
      // open — UI-состояние, не сохраняем.
      partialize: (state) => ({
        channels: state.channels,
        activeChannelId: state.activeChannelId,
        messages: state.messages,
        unread: state.unread,
      }),
    }
  )
);
