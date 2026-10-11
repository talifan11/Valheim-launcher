// Форум: категории, треды, посты. Данные на VPS через API.
import { create } from 'zustand';
import * as api from '../lib/api';
import { useLauncherStore } from './useLauncherStore';

interface ForumState {
  categories: api.ForumCategory[];
  threads: api.ForumThreadPreview[];
  activeCategory: string | null; // slug или null = все
  activeThread: api.ForumThreadFull | null;
  stats: api.ForumStats | null;
  topAuthors: api.ForumTopAuthor[];

  loadingCategories: boolean;
  loadingThreads: boolean;
  loadingThread: boolean;
  error: string | null;

  loadCategories: () => Promise<void>;
  loadThreads: (categorySlug?: string | null) => Promise<void>;
  loadStats: () => Promise<void>;
  loadTopAuthors: () => Promise<void>;
  setActiveCategory: (slug: string | null) => Promise<void>;
  openThread: (threadId: number) => Promise<void>;
  closeThread: () => void;
  createThread: (categoryId: number, title: string, body: string) => Promise<number>;
  createPost: (threadId: number, body: string) => Promise<void>;
  reset: () => void;
}

function getToken(): string | null {
  return useLauncherStore.getState().authToken;
}

export const useForumStore = create<ForumState>((set, get) => ({
  categories: [],
  threads: [],
  activeCategory: null,
  activeThread: null,
  stats: null,
  topAuthors: [],

  loadingCategories: false,
  loadingThreads: false,
  loadingThread: false,
  error: null,

  loadCategories: async () => {
    const token = getToken();
    if (!token) return;
    set({ loadingCategories: true, error: null });
    try {
      const cats = await api.getForumCategories(token);
      set({ categories: cats, loadingCategories: false });
    } catch (err) {
      set({
        loadingCategories: false,
        error: err instanceof Error ? err.message : 'Ошибка загрузки категорий',
      });
    }
  },

  loadThreads: async (categorySlug) => {
    const token = getToken();
    if (!token) return;
    const slug = categorySlug === undefined ? get().activeCategory : categorySlug;
    set({ loadingThreads: true, error: null });
    try {
      const list = await api.getForumThreads(token, slug);
      set({ threads: list, loadingThreads: false });
    } catch (err) {
      set({
        loadingThreads: false,
        error: err instanceof Error ? err.message : 'Ошибка загрузки тредов',
      });
    }
  },

  loadStats: async () => {
    const token = getToken();
    if (!token) return;
    try {
      const s = await api.getForumStats(token);
      set({ stats: s });
    } catch {
      // тихо
    }
  },

  loadTopAuthors: async () => {
    const token = getToken();
    if (!token) return;
    try {
      const list = await api.getForumTopAuthors(token, 5);
      set({ topAuthors: list });
    } catch {
      // тихо
    }
  },

  setActiveCategory: async (slug) => {
    set({ activeCategory: slug });
    await get().loadThreads(slug);
  },

  openThread: async (threadId) => {
    const token = getToken();
    if (!token) return;
    set({ loadingThread: true, error: null });
    try {
      const thread = await api.getForumThread(token, threadId);
      set({ activeThread: thread, loadingThread: false });
    } catch (err) {
      set({
        loadingThread: false,
        error: err instanceof Error ? err.message : 'Ошибка загрузки треда',
      });
    }
  },

  closeThread: () => set({ activeThread: null }),

  createThread: async (categoryId, title, body) => {
    const token = getToken();
    if (!token) throw new Error('Нет токена');
    const result = await api.createForumThread(token, categoryId, title, body);
    await get().loadThreads();
    await get().loadCategories();
    await get().loadStats();
    await get().loadTopAuthors();
    return result.thread_id;
  },

  createPost: async (threadId, body) => {
    const token = getToken();
    if (!token) throw new Error('Нет токена');
    await api.createForumPost(token, threadId, body);
    const thread = await api.getForumThread(token, threadId);
    set({ activeThread: thread });
    await get().loadStats();
    await get().loadTopAuthors();
  },

  reset: () => set({
    categories: [],
    threads: [],
    activeCategory: null,
    activeThread: null,
    stats: null,
    topAuthors: [],
    error: null,
  }),
}));
