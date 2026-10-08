import { useEffect, useState } from 'react';
import { Play, Download, RefreshCw, X, Loader2 } from 'lucide-react';
import { useUpdateStore } from '../../store/useUpdateStore';
import { useLauncherStore } from '../../store/useLauncherStore';

export function FloatingStatusBar() {
  const phase = useUpdateStore((s) => s.phase);
  const overallPercent = useUpdateStore((s) => s.overallPercent);
  const currentFile = useUpdateStore((s) => s.currentFile);
  const startInstall = useUpdateStore((s) => s.startInstall);
  const cancelInstall = useUpdateStore((s) => s.cancelInstall);
  const runCheck = useUpdateStore((s) => s.runCheck);

  const play = useLauncherStore((s) => s.play);
  const isLaunching = useLauncherStore((s) => s.isLaunching);

  const [localBusy, setLocalBusy] = useState(false);

  useEffect(() => {
    if (phase !== 'downloading' && phase !== 'unpacking') {
      setLocalBusy(false);
    }
  }, [phase]);

  type View = {
    dot: string;
    text: string;
    label: string;
    icon: 'play' | 'download' | 'refresh' | 'x' | 'spinner';
    action: () => void;
    disabled: boolean;
    color: string;
    pulse: boolean;
    phaseColor: string;
    phaseGlow: string;
  };

  let view: View = {
    dot: 'bg-slate-400',
    text: 'Не проверено',
    label: 'ПРОВЕРИТЬ',
    icon: 'refresh',
    action: () => void runCheck(true),
    disabled: false,
    color: 'bg-white/5 text-white hover:bg-white/10 border border-white/15',
    pulse: false,
    phaseColor: 'rgba(148, 163, 184, 0.4)',
    phaseGlow: 'rgba(148, 163, 184, 0.08)',
  };

  if (phase === 'checking') {
    view = {
      dot: 'bg-blizzard animate-pulse-dot',
      text: 'Проверка файлов...',
      label: 'ПРОВЕРКА...',
      icon: 'spinner',
      action: () => {},
      disabled: true,
      color: 'bg-white/5 text-slate-400 border border-white/10',
      pulse: false,
      phaseColor: 'rgba(14, 156, 255, 0.6)',
      phaseGlow: 'rgba(14, 156, 255, 0.10)',
    };
  } else if (phase === 'needs-install') {
    view = {
      dot: 'bg-blizzard shadow-[0_0_10px_#0e9cff]',
      text: 'Игра не установлена',
      label: 'УСТАНОВИТЬ',
      icon: 'download',
      action: () => void startInstall(),
      disabled: false,
      color: 'bg-blizzard text-white hover:shadow-[0_0_28px_rgba(14,156,255,0.55)]',
      pulse: true,
      phaseColor: 'rgba(14, 156, 255, 0.7)',
      phaseGlow: 'rgba(14, 156, 255, 0.14)',
    };
  } else if (phase === 'needs-update') {
    view = {
      dot: 'bg-gold shadow-[0_0_10px_#ffc24b]',
      text: 'Доступно обновление',
      label: 'ОБНОВИТЬ',
      icon: 'download',
      action: () => void startInstall(),
      disabled: false,
      color: 'bg-blizzard text-white hover:shadow-[0_0_28px_rgba(14,156,255,0.55)]',
      pulse: true,
      phaseColor: 'rgba(255, 194, 75, 0.7)',
      phaseGlow: 'rgba(255, 194, 75, 0.14)',
    };
  } else if (phase === 'downloading') {
    view = {
      dot: 'bg-blizzard shadow-[0_0_10px_#0e9cff]',
      text: currentFile ? `Скачивание ${currentFile}` : 'Загрузка...',
      label: 'ОТМЕНА',
      icon: 'x',
      action: () => void cancelInstall(),
      disabled: false,
      color: 'bg-blood/90 text-white hover:bg-blood',
      pulse: false,
      phaseColor: 'rgba(14, 156, 255, 0.8)',
      phaseGlow: 'rgba(14, 156, 255, 0.18)',
    };
  } else if (phase === 'unpacking') {
    view = {
      dot: 'bg-gold shadow-[0_0_10px_#ffc24b]',
      text: 'Распаковка архива...',
      label: 'РАСПАКОВКА...',
      icon: 'spinner',
      action: () => {},
      disabled: true,
      color: 'bg-white/5 text-slate-400 border border-white/10',
      pulse: false,
      phaseColor: 'rgba(255, 194, 75, 0.8)',
      phaseGlow: 'rgba(255, 194, 75, 0.18)',
    };
  } else if (phase === 'ready') {
    view = {
      dot: 'bg-emerald shadow-[0_0_10px_#2fbf71]',
      text: 'Готово к игре',
      label: isLaunching ? 'ЗАПУСК...' : 'ИГРАТЬ',
      icon: 'play',
      action: () => void play(),
      disabled: isLaunching,
      color: 'bg-gold text-abyss hover:shadow-[0_0_28px_rgba(255,194,75,0.6)]',
      pulse: true,
      phaseColor: 'rgba(47, 191, 113, 0.8)',
      phaseGlow: 'rgba(47, 191, 113, 0.16)',
    };
  } else if (phase === 'error') {
    view = {
      dot: 'bg-blood shadow-[0_0_10px_#ff5566]',
      text: 'Ошибка обновления',
      label: 'ПОВТОРИТЬ',
      icon: 'refresh',
      action: () => void runCheck(true),
      disabled: false,
      color: 'bg-blood text-white hover:shadow-[0_0_28px_rgba(255,85,102,0.5)]',
      pulse: false,
      phaseColor: 'rgba(255, 85, 102, 0.8)',
      phaseGlow: 'rgba(255, 85, 102, 0.16)',
    };
  }

  const isDownloading = phase === 'downloading';

  const handleClick = () => {
    if (view.disabled || localBusy) return;
    setLocalBusy(true);
    view.action();
    setTimeout(() => setLocalBusy(false), 800);
  };

  const renderIcon = () => {
    if (view.icon === 'play') return <Play size={16} fill="currentColor" />;
    if (view.icon === 'download') return <Download size={16} />;
    if (view.icon === 'refresh') return <RefreshCw size={16} />;
    if (view.icon === 'x') return <X size={16} />;
    return <Loader2 size={16} className="animate-spin" />;
  };

  return (
    <div className="float-bottombar-wrap animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
      <div
        className="float-bottombar glass-solid relative flex items-center gap-3 h-16 px-5 rounded-[32px]"
        style={{
          ['--phase-color' as string]: view.phaseColor,
          ['--phase-glow' as string]: view.phaseGlow,
        }}
      >
        {/* Статус */}
        <div className="flex items-center gap-2.5 shrink-0 min-w-0 z-10">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${view.dot}`} />
          <span className="text-xs text-slate-200 font-semibold whitespace-nowrap tracking-wide">
            {view.text}
          </span>
        </div>

        {/* Прогресс-бар при скачивании */}
        {isDownloading && (
          <>
            <div className="w-px h-8 bg-white/10 shrink-0 z-10" />
            <div className="flex-1 min-w-[80px] flex items-center gap-3 z-10">
              <div className="progress-track relative flex-1 h-2">
                <div
                  className="progress-fill absolute inset-y-0 left-0"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-slate-300 shrink-0 tabular-nums font-semibold">
                {overallPercent.toFixed(0)}%
              </span>
            </div>
          </>
        )}

        {/* CTA-кнопка */}
        <div className="ml-auto shrink-0 z-10">
          <button
            type="button"
            onClick={handleClick}
            disabled={view.disabled || localBusy}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-[0.12em] transition-all duration-300 disabled:opacity-50 ${view.color} ${
              view.pulse && !view.disabled ? 'animate-pulse-gold' : ''
            }`}
          >
            {renderIcon()}
            <span className="whitespace-nowrap">{view.label}</span>
          </button>
        </div>

        {/* Цветная полоска-индикатор снизу */}
        <span className="phase-strip" aria-hidden="true" />
      </div>
    </div>
  );
}
