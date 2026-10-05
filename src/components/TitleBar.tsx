// Кастомная шапка окна: дефолтная рамка Windows отключена через
// "decorations": false в tauri.conf.json.
// Перетаскивание — data-tauri-drag-region, кнопки — через window API.
// Логотип — SVG-щит; слева от кнопок окна — индикатор подключения к серверу.
import { LogOut, Maximize2, Minus, Settings, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauri } from '../lib/api';
import { ShieldLogo } from './ShieldLogo';

export type ConnectionState = 'checking' | 'online' | 'offline';

interface TitleBarProps {
  /** Открыть экран настроек (иконка шестерёнки справа) */
  onOpenSettings: () => void;
  /** Выйти из аккаунта (иконка LogOut рядом с шестерёнкой) */
  onLogout: () => void;
  /** Статус пинга игрового сервера — приходит из ServerPanel */
  connection: ConnectionState;
}

const CONNECTION_LABEL: Record<ConnectionState, string> = {
  checking: 'Проверка соединения',
  online: 'Сервер доступен',
  offline: 'Сервер недоступен',
};

export function TitleBar({ onOpenSettings, onLogout, connection }: TitleBarProps) {
  const appWindow = getCurrentWindow();

  // В браузерной разработке кнопок управления окном нет — не падаем с ошибкой
  const safeRun = (fn: () => Promise<unknown>) => () => {
    if (isTauri()) void fn().catch(console.error);
  };

  return (
    <header
      // data-tauri-drag-region позволяет тянуть окно за любую область шапки (п. 3.1 ТЗ)
      data-tauri-drag-region
      className="relative z-40 flex h-12 shrink-0 items-center justify-between border-b bg-panel/70 backdrop-blur-md px-3 vr-titlebar-line"
    >
      {/* Логотип: щит + название */}
      <div className="flex items-center gap-2.5 pl-2 select-none">
        <span className="text-gold">
          <ShieldLogo size={20} />
        </span>
        <span className="font-display text-sm font-bold tracking-[0.25em] text-gold">
          VALHEIM
        </span>
        <span className="font-display text-sm italic tracking-[0.25em] text-blizzard">
          ROUGE
        </span>
      </div>

      {/* Индикатор соединения + кнопки выхода, настроек и управления окном */}
      <div className="flex items-center gap-1">
        <span
          title={CONNECTION_LABEL[connection]}
          className="mr-2 flex items-center gap-1.5 rounded-md px-2 py-1"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
              connection === 'online'
                ? 'bg-emerald shadow-[0_0_8px_#2fbf71]'
                : connection === 'offline'
                  ? 'bg-blood shadow-[0_0_8px_#ff5566]'
                  : 'bg-slate-400 animate-pulse'
            }`}
          />
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            {connection === 'online' ? 'ONLINE' : connection === 'offline' ? 'OFFLINE' : '…'}
          </span>
        </span>
        <button
          onClick={onLogout}
          title="Выйти"
          className="vr-titlebar-btn"
        >
          <LogOut size={18} />
        </button>
        <button
          onClick={onOpenSettings}
          title="Настройки"
          className="vr-titlebar-btn"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={safeRun(() => appWindow.minimize())}
          title="Свернуть"
          className="vr-titlebar-btn"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={safeRun(() => appWindow.toggleMaximize())}
          title="Развернуть"
          className="vr-titlebar-btn"
        >
          <Maximize2 size={15} />
        </button>
        <button
          onClick={safeRun(() => appWindow.close())}
          title="Закрыть"
          className="vr-titlebar-btn vr-titlebar-btn-close"
        >
          <X size={16} />
        </button>
      </div>
    </header>
  );
}
