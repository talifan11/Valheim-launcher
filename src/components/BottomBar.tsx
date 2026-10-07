// Нижняя панель управления: статус клиента, дата, «Проверить клиент» и главная кнопка.
// Текст и действие кнопки зависят от фазы обновления (useUpdateStore) и статуса запуска.
import type { LucideIcon } from 'lucide-react';
import { Download, Loader, RefreshCw, RotateCcw, Swords } from 'lucide-react';
import { useLauncherStore } from '../store/useLauncherStore';
import { useUpdateStore } from '../store/useUpdateStore';

type ActionKind = 'play' | 'install' | 'update' | 'progress' | 'retry';

interface ActionDef {
  kind: ActionKind;
  label: string;
  icon: LucideIcon;
  disabled: boolean;
}

const ACTION_COLORS: Record<ActionKind, string> = {
  play: 'bg-gradient-to-b from-gold to-[#b8941f] text-abyss shadow-[0_2px_12px_rgba(212,175,55,0.25)] hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)]',
  install: 'bg-gradient-to-b from-blizzard to-blizzard-dark text-abyss shadow-[0_2px_12px_rgba(74,158,255,0.25)] hover:shadow-[0_4px_20px_rgba(74,158,255,0.4)]',
  update: 'bg-gradient-to-b from-[#e08c3a] to-[#b06a20] text-abyss shadow-[0_2px_12px_rgba(224,140,58,0.25)] hover:shadow-[0_4px_20px_rgba(224,140,58,0.4)]',
  retry: 'border border-blood/50 bg-blood/15 text-red-300 hover:bg-blood/25',
  progress: 'border border-edge/60 bg-panel text-slate-500',
};

/** Короткая метка текущей даты, например «8 октября» */
function todayLabel(): string {
  return new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export function BottomBar() {
  const phase = useUpdateStore((s) => s.phase);
  const overallPercent = useUpdateStore((s) => s.overallPercent);
  const busy = useUpdateStore((s) => s.busy);
  const runCheck = useUpdateStore((s) => s.runCheck);
  const startInstall = useUpdateStore((s) => s.startInstall);
  const isLaunching = useLauncherStore((s) => s.isLaunching);
  const play = useLauncherStore((s) => s.play);

  let action: ActionDef;
  switch (phase) {
    case 'ready':
      action = { kind: 'play', label: isLaunching ? 'Запуск…' : 'Играть', icon: Swords, disabled: isLaunching };
      break;
    case 'needs-install':
      action = { kind: 'install', label: 'Установить', icon: Download, disabled: false };
      break;
    case 'needs-update':
      action = { kind: 'update', label: 'Обновить', icon: RefreshCw, disabled: false };
      break;
    case 'error':
      action = { kind: 'retry', label: 'Повторить', icon: RotateCcw, disabled: false };
      break;
    default:
      // idle / checking / downloading — показываем текущую операцию
      action = {
        kind: 'progress',
        label:
          phase === 'checking'
            ? 'Проверка…'
            : phase === 'downloading'
              ? `Загрузка… ${Math.round(overallPercent)}%`
              : 'Ожидание…',
        icon: Loader,
        disabled: true,
      };
  }

  const checkDisabled = busy || phase === 'downloading' || phase === 'checking';

  function onAction() {
    if (action.kind === 'play') void play();
    else if (action.kind === 'retry') void runCheck(true);
    else void startInstall();
  }

  return (
    <footer className="flex h-16 shrink-0 items-center gap-4 border-t border-white/5 bg-abyss/70 px-6 backdrop-blur-md">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs text-slate-400">
          {action.kind === 'play' ? 'Клиент актуален' : 'Требуется действие'}
        </span>
        <span className="text-[11px] text-slate-600">{todayLabel()}</span>
      </div>

      <button
        onClick={() => void runCheck(true)}
        disabled={checkDisabled}
        className="vr-btn-ghost-sm ml-auto disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw size={13} /> Проверить клиент
      </button>

      <button
        onClick={onAction}
        disabled={action.disabled}
        className={`flex h-11 w-44 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-semibold uppercase tracking-[0.08em] transition-all duration-300 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${ACTION_COLORS[action.kind]}`}
      >
        <action.icon size={16} className={action.kind === 'progress' ? 'animate-spin' : ''} />
        {action.label}
      </button>
    </footer>
  );
}
