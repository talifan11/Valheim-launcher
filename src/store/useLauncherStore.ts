// Глобальное состояние лаунчера на Zustand (по ТЗ — легче Context API).
// Храним: конфиг, факт авторизации и статус запуска игры.
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
  /** Открыт ли экран настроек (управляется из стора, чтобы кнопка в правой колонке работала без пропсов) */
  settingsOpen: boolean;

  /** Загрузить конфиг из Rust-бэкенда при старте приложения */
  loadConfig: () => Promise<void>;
  /** Открыть / закрыть модалку настроек */
  setSettingsOpen: (open: boolean) => void;
  /** Логин-заглушка: непустые поля -> главный экран + сохранение username */
  login: (username: string) => Promise<void>;
  /** Реальная авторизация через API */
  loginWithApi: (email: string, password: string) => Promise<void>;
  /** Регистрация через API */
  registerWithApi: (email: string, password: string, username: string) => Promise<void>;
  /** Текущий JWT-токен (если авторизован через API) */
  authToken: string | null;
  /** Email авторизованного пользователя */
  userEmail: string | null;
  /** Выход: возврат к экрану входа */
  logout: () => void;
  /** Изменить кусок конфига и сразу сохранить на диск */
  updateConfig: (patch: Partial<LauncherConfig>) => Promise<void>;
  /** Нажатие «ИГРАТЬ»: проверка пути -> запуск -> сворачивание окна */
  play: () => Promise<void>;
  /** Закрыть модалку ошибки */
  dismissError: () => void;
}

export const useLauncherStore = create<LauncherState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isAuthenticated: false,
  authToken: null,
  userEmail: null,
  isLaunching: false,
  errorMessage: null,
  settingsOpen: false,

  setSettingsOpen: (open: boolean) => set({ settingsOpen: open }),

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
        // Файлов нет — запускаем полную проверку и переключаемся на InstallScreen
        set({
          isLaunching: false,
          errorMessage: 'Файлы игры повреждены или удалены. Запускаю проверку...',
        });
        const { useUpdateStore } = await import('./useUpdateStore');
        const runCheck = useUpdateStore.getState().runCheck;
        await runCheck(true);
        return;
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
  loginWithApi: async (email: string, password: string) => {
    const result = await api.loginUser(email, password);
    set({
      isAuthenticated: true,
      authToken: result.token,
      userEmail: result.email,
      config: { ...get().config, username: result.username },
    });
    await get().updateConfig({ username: result.username });
  },

  registerWithApi: async (email: string, password: string, username: string) => {
    const result = await api.registerUser(email, password, username);
    set({
      isAuthenticated: true,
      authToken: result.token,
      userEmail: result.email,
      config: { ...get().config, username: result.username },
    });
    await get().updateConfig({ username: result.username });
  },

}));
