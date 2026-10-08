import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X } from 'lucide-react';

export function WindowControls() {
  const appWindow = getCurrentWindow();

  const btn = 'w-11 h-9 flex items-center justify-center text-slate-400 hover:text-white transition-colors duration-200';

  return (
    <div className="absolute top-0 right-0 z-[100] flex pointer-events-auto">
      <button className={btn} onClick={() => void appWindow.minimize()} title="Свернуть">
        <Minus size={14} />
      </button>
      <button className={btn} onClick={() => void appWindow.toggleMaximize()} title="Развернуть">
        <Square size={12} />
      </button>
      <button className={`${btn} hover:bg-blood`} onClick={() => void appWindow.close()} title="Закрыть">
        <X size={15} />
      </button>
    </div>
  );
}
