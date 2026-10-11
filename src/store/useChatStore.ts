// Чат: общий канал + личные сообщения через API на VPS.
// Без persist — все данные живут на сервере.

import { create } from 'zustand';
import * as api from '../lib/api';
import { useLauncherStore } from './useLauncherStore';

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
  peerUserId?: number;
}

interface ChatState {
  open: boolean;
  channels: ChatChannel[];
  activeChannelId: string;
  messages: Record<string, ChatMessage[]>;
  unread: Record<string, number>;
  loading: boolean;

  toggle: (open?: boolean) => void;
  setActiveChannel: (id: string) => void;
  sendMessage: (text: string) => Promise<void>;
  openDmWith: (peerUserId: number, peerName: string) => Promise<void>;
  markRead: (channelId: string) => void;
  clearChannel: (channelId: string) => void;
  deleteChannel: (channelId: string) => void;
  loadMessages: (channelId: string) => Promise<void>;
  pollActiveChannel: () => Promise<void>;
  reset: () => void;
}

const GENERAL_CHANNEL: ChatChannel = {
  id: 'general',
  kind: 'general',
  title: 'Общий чат',
};

function getToken(): string | null {
  return useLauncherStore.getState().authToken;
}

function mapRemoteMessage(m: api.RemoteMessage): ChatMessage {
  return {
    id: String(m.id),
    authorId: String(m.from_user_id),
    authorName: m.from_username,
    text: m.text,
    timestamp: new Date(m.created_at).getTime(),
    own: m.own,
  };
}

// Гарантирует что general всегда в списке каналов
function ensureGeneral(channels: ChatChannel[]): ChatChannel[] {
  if (channels.find((c) => c.id === 'general')) return channels;
  return [GENERAL_CHANNEL, ...channels];
}

export const useChatStore = create<ChatState>((set, get) => ({
  open: false,
  channels: [GENERAL_CHANNEL],
  activeChannelId: 'general',
  messages: { general: [] },
  unread: {},
  loading: false,

  toggle: (open) => {
    const nextOpen = open ?? !get().open;
    // При открытии чата всегда возвращаемся на общий канал
    if (nextOpen) {
      set({
        open: true,
        channels: ensureGeneral(get().channels),
        activeChannelId: 'general',
      });
      void get().loadMessages('general');
    } else {
      set({ open: false });
    }
  },

  setActiveChannel: (id) => {
    set({ activeChannelId: id });
    set((s) => ({ unread: { ...s.unread, [id]: 0 } }));
    void get().loadMessages(id);
  },

  sendMessage: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const channelId = get().activeChannelId;
    const channel = get().channels.find((c) => c.id === channelId);
    if (!channel) return;

    const token = getToken();
    if (!token) {
      console.warn('Нет токена для отправки');
      return;
    }

    try {
      if (channel.kind === 'general') {
        await api.sendGeneralMessage(trimmed, token);
      } else if (channel.peerUserId) {
        await api.sendMessage(channel.peerUserId, trimmed, token);
      }
      await get().loadMessages(channelId);
    } catch (err) {
      console.error('Ошибка отправки:', err);
    }
  },

  openDmWith: async (peerUserId, peerName) => {
    const existing = get().channels.find(
      (c) => c.kind === 'dm' && c.peerUserId === peerUserId
    );

    if (existing) {
      set({ activeChannelId: existing.id, open: true });
      set((s) => ({ unread: { ...s.unread, [existing.id]: 0 } }));
      await get().loadMessages(existing.id);
      return;
    }

    const newChannel: ChatChannel = {
      id: `dm-${peerUserId}`,
      kind: 'dm',
      title: peerName,
      peerUserId,
    };

    set((s) => ({
      channels: ensureGeneral([...s.channels, newChannel]),
      activeChannelId: newChannel.id,
      open: true,
      messages: { ...s.messages, [newChannel.id]: [] },
      unread: { ...s.unread, [newChannel.id]: 0 },
    }));

    await get().loadMessages(newChannel.id);
  },

  loadMessages: async (channelId) => {
    const channel = get().channels.find((c) => c.id === channelId);
    if (!channel) return;

    const token = getToken();
    if (!token) return;

    set({ loading: true });
    try {
      let remote: api.RemoteMessage[] = [];
      if (channel.kind === 'general') {
        remote = await api.getGeneralMessages(token);
      } else if (channel.peerUserId) {
        remote = await api.getMessages(channel.peerUserId, token);
      }
      const mapped = remote.map(mapRemoteMessage);
      set((s) => ({
        messages: { ...s.messages, [channelId]: mapped },
        loading: false,
      }));
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err);
      set({ loading: false });
    }
  },

  pollActiveChannel: async () => {
    const channelId = get().activeChannelId;
    const channel = get().channels.find((c) => c.id === channelId);
    if (!channel) return;
    await get().loadMessages(channelId);
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
      messages: { general: [] },
      unread: {},
    }),
}));
