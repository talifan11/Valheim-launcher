// ============================================================
// Глобальное состояние лаунчера на Zustand (по ТЗ — легче Context API).
// Храним: конфиг, факт авторизации и статус запуска игры.
// ============================================================
import { create } from 'zustand';
import type { LauncherConfig } from '../types';
import { DEFAULT_CONFIG } from '../types';
import * as api from '../lib/api';

interface LauncherState {
  /** Текущая конфигурация из config.json */
  config: LauncherConfig;
  /** Авторизован ли пользователь (заглушка: просто флаг экрана) */
  isAuthenticated: boolean;
  /** Идёт ли сейчас запуск игры (блокирует кнопку PLAY) */
  isLaunching: boolean;
  /** Текст ошибки для модалки (null — ошибок нет) */
  errorMessage: string | null;

  /** Загрузить конфиг из Rust-бэкенда при старте приложения */
  loadConfig: () => Promise<void>;
  /** Логин-заглушка: непустые поля → главный экран + сохранение username */
  login: (username: string) => Promise<void>;
  /** Выход: возврат к экрану входа */
  logout: () => void;
  /** Изменить кусок конфига и сразу сохранить на диск */
  updateConfig: (patch: Partial<LauncherConfig>) => Promise<void>;
  /** Нажатие «ИГРАТЬ»: проверка пути → запуск → сворачивание окна */
  play: () => Promise<void>;
  /** Закрыть модалку ошибки */
  dismissError: () => void;
}

export const useLauncherStore = create<LauncherState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isAuthenticated: false,
  isLaunching: false,
  errorMessage: null,

  loadConfig: async () => {
    try {
      // В режиме браузерной разработки (npm run dev без Tauri) invoke недоступен —
      // тихо оставляем дефолтный конфиг, чтобы UI можно было смотреть в Chrome.
      if (!api.isTauri()) return;
      const config = await api.getConfig();
      set({ config });
    } catch (err) {
      console.error('Не удалось прочитать конфиг:', err);
    }
  },

  login: async (username: string) => {
    set({ isAuthenticated: true });
    // Сохраняем имя пользователя в config.json (пункт 3.5 ТЗ)
    await get().updateConfig({ username });
  },

  logout: () => set({ isAuthenticated: false }),

  updateConfig: async (patch: Partial<LauncherConfig>) => {
    const next: LauncherConfig = { ...get().config, ...patch };
    set({ config: next });
    if (api.isTauri()) {
      try {
        await api.setConfig(next);
      } catch (err) {
        set({ errorMessage: `Не удалось сохранить настройки: ${String(err)}` });
      }
    }
  },

  play: async () => {
    const { config } = get();
    set({ isLaunching: true, errorMessage: null });
    try {
      if (!api.isTauri()) {
        throw new Error('Запуск игры доступен только в собранном приложении (Tauri).');
      }
      // 1. Проверяем, что valheim.exe реально лежит по пути из настроек
      const exists = await api.checkGamePath(config.game_path);
      if (!exists) {
        throw new Error(
          'valheim.exe не найден по указанному пути. Откройте настройки и выберите папку с игрой.'
        );
      }
      // 2. Запускаем процесс; Rust-сторона сворачивает окно лаунчера
      await api.launchGame(config.game_path);
    } catch (err) {
      set({ errorMessage: err instanceof Error ? err.message : String(err) });
    } finally {
      set({ isLaunching: false });
    }
  },

  dismissError: () => set({ errorMessage: null }),
}));
