// Новости: тянутся с VPS через API. Fallback на локальный массив.
import { create } from 'zustand';
import * as api from '../lib/api';
import { news as fallbackNews, type NewsItem } from '../data/news';

const CACHE_KEY = 'valheim-rouge:news-cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 минут

interface NewsState {
  items: NewsItem[];
  loading: boolean;
  error: string | null;
  lastFetched: number;
  loadedFromCache: boolean;

  loadNews: (force?: boolean) => Promise<void>;
}

// Приведём API-формат к NewsItem (тот что используется в компонентах)
function mapApiToNewsItem(n: api.ApiNewsItem): NewsItem {
  return {
    id: n.id,
    date: n.date,
    title: n.title,
    description: n.description,
    image: n.imageUrl ?? '',
    tag: n.tag ?? undefined,
    pinned: n.pinned,
  };
}

function loadCache(): { items: NewsItem[]; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.items || !Array.isArray(data.items)) return null;
    return { items: data.items, ts: data.ts ?? 0 };
  } catch {
    return null;
  }
}

function saveCache(items: NewsItem[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, ts: Date.now() }));
  } catch {
    // тихо
  }
}

// Стартовое состояние: пробуем кэш, иначе fallback
const initialCache = loadCache();
const initialItems = initialCache?.items?.length
  ? initialCache.items
  : fallbackNews;

export const useNewsStore = create<NewsState>((set, get) => ({
  items: initialItems,
  loading: false,
  error: null,
  lastFetched: initialCache?.ts ?? 0,
  loadedFromCache: !!initialCache?.items?.length,

  loadNews: async (force = false) => {
    const now = Date.now();
    const { lastFetched, loading } = get();

    // Не грузим если кэш свежий и не force
    if (!force && now - lastFetched < CACHE_TTL_MS && get().items.length > 0) {
      return;
    }
    if (loading) return;

    set({ loading: true, error: null });
    try {
      const apiItems = await api.getNews();
      if (apiItems.length === 0) {
        set({ loading: false, lastFetched: now });
        return;
      }
      const mapped = apiItems.map(mapApiToNewsItem);
      set({
        items: mapped,
        loading: false,
        error: null,
        lastFetched: now,
        loadedFromCache: false,
      });
      saveCache(mapped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки новостей';
      console.warn('Новости: не загрузились с сервера, используем кэш/fallback', msg);
      set({
        loading: false,
        error: msg,
        // items не трогаем — там уже кэш или fallback
      });
    }
  },
}));
