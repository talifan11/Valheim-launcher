// ============================================================
// TitleBar — кастомная шапка окна (дефолтная рамка Windows отключена
// через "decorations": false в tauri.conf.json).
// Перетаскивание — через data-tauri-drag-region, кнопки — через window API.
// ============================================================
import { Maximize2, Minus, Settings, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauri } from '../lib/api';

interface TitleBarProps {
  /** Открыть экран настроек (колокольчик-шестерёнка справа) */
  onOpenSettings: () => void;
}

export function TitleBar({ onOpenSettings }: TitleBarProps) {
  const appWindow = getCurrentWindow();

  // В браузерной разработке кнопок управления окном нет — не падаем с ошибкой
  const safeRun = (fn: () => Promise<unknown>) => () => {
    if (isTauri()) void fn().catch(console.error);
  };

  return (
    <header
      // data-tauri-drag-region позволяет тянуть окно за любую область шапки (п. 3.1 ТЗ)
      data-tauri-drag-region
      className="relative z-40 flex h-12 shrink-0 items-center justify-between border-b border-white/5 bg-panel/70 backdrop-blur-md px-3"
    >
      {/* Логотип слева */}
      <div className="flex items-center gap-2 pl-2 select-none">
        <span className="font-display text-sm font-bold tracking-[0.25em] text-gold">
          VALHEIM
        </span>
        <span className="font-display text-sm italic tracking-[0.25em] text-blizzard">
          ROUGE
        </span>
      </div>

      {/* Кнопки справа: настройки + управление окном */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenSettings}
          title="Настройки"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={safeRun(() => appWindow.minimize())}
          title="Свернуть"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={safeRun(() => appWindow.toggleMaximize())}
          title="Развернуть"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
        >
          <Maximize2 size={15} />
        </button>
        <button
          onClick={safeRun(() => appWindow.close())}
          title="Закрыть"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-blood/80 hover:text-white cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </header>
  );
}
