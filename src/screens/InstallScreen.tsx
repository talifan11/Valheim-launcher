import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  RefreshCw,
  XCircle,
  Loader2,
  FolderOpen,
  FileCheck,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { VRButton } from '../components/ui';
import { formatBytes, formatEtaClock, useUpdateStore } from '../store/useUpdateStore';
import { useLauncherStore } from '../store/useLauncherStore';

const PHASE_TITLE: Record<string, string> = {
  checking: 'Проверка файлов',
  'needs-install': 'Требуется установка',
  'needs-update': 'Доступно обновление',
  downloading: 'Скачивание',
  unpacking: 'Распаковка',
  ready: 'Готово к игре',
  error: 'Ошибка обновления',
  idle: 'Проверка не выполнялась',
};

export function InstallScreen() {
  const phase = useUpdateStore((s) => s.phase);
  const manifest = useUpdateStore((s) => s.manifest);
  const statuses = useUpdateStore((s) => s.statuses) ?? [];
  const filePercents = useUpdateStore((s) => s.filePercents) ?? {};
  const overallPercent = useUpdateStore((s) => s.overallPercent) ?? 0;
  const currentFile = useUpdateStore((s) => s.currentFile);
  const speedMbps = useUpdateStore((s) => s.speedMbps) ?? 0;
  const etaSeconds = useUpdateStore((s) => s.etaSeconds) ?? 0;
  const log = useUpdateStore((s) => s.log) ?? [];
  const error = useUpdateStore((s) => s.error);
  const checkProgress = useUpdateStore((s) => s.checkProgress);
  const runCheck = useUpdateStore((s) => s.runCheck);
  const startInstall = useUpdateStore((s) => s.startInstall);
  const cancelInstall = useUpdateStore((s) => s.cancelInstall);
  const clearError = useUpdateStore((s) => s.clearError);

  const setSettingsOpen = useLauncherStore((s) => s.setSettingsOpen);
  const gamePath = useLauncherStore((s) => s.config.game_path);

  useEffect(() => {
    if (phase === 'idle') void runCheck();
  }, [phase, runCheck]);

  const pendingFiles =
    manifest?.files.filter(
      (file) => statuses.find((s) => s.path === file.path)?.status !== 'OK'
    ) ?? [];

  const busyPhase = phase === 'downloading' || phase === 'unpacking';
  const checkPercent =
    checkProgress && checkProgress.total > 0
      ? (checkProgress.checked / checkProgress.total) * 100
      : 0;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/backgrounds/main.jpg)', filter: 'blur(4px) brightness(0.4)' }}
      />
      <div className="absolute inset-0 bg-abyss/70" />

      <div className="relative z-10 h-full flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[820px] glass-popover rounded-[28px] overflow-hidden shadow-glass"
        >
          <div className="px-8 py-6 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <PhaseIcon phase={phase} />
                <div>
                  <h1 className="font-display text-2xl text-white tracking-wide">
                    {PHASE_TITLE[phase] ?? phase}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    {manifest ? 'Версия ' + manifest.version : 'Манифест ещё не загружен'}
                  </p>
                </div>
              </div>

              {!busyPhase && phase !== 'checking' && (
                <button
                  type="button"
                  onClick={() => void runCheck()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] text-xs text-slate-300 hover:bg-white/5 hover:border-white/20 transition-all"
                >
                  <RefreshCw size={14} />
                  Проверить снова
                </button>
              )}
            </div>

            {phase === 'checking' && checkProgress && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2 text-[11px]">
                  <span className="text-slate-400 font-mono truncate">
                    {checkProgress.current}
                  </span>
                  <span className="text-slate-500 font-mono shrink-0 ml-3">
                    {checkProgress.checked} / {checkProgress.total}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blizzard to-[#6cc6ff] shadow-[0_0_12px_rgba(14,156,255,0.5)]"
                    animate={{ width: checkPercent + '%' }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            )}

            {phase === 'downloading' && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2 text-[11px]">
                  <span className="text-slate-400 font-mono truncate">
                    {currentFile || 'Подготовка...'}
                  </span>
                  <span className="text-slate-400 font-mono shrink-0 ml-3">
                    {speedMbps.toFixed(1)} МБ/с | {formatEtaClock(etaSeconds)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-black/40 overflow-hidden relative">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blizzard via-[#6cc6ff] to-blizzard shadow-[0_0_16px_rgba(14,156,255,0.6)]"
                    animate={{ width: overallPercent + '%' }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div
                    className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '300%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{overallPercent.toFixed(1)}%</span>
                  <span>{pendingFiles.length} файлов в очереди</span>
                </div>
              </div>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mx-8 mt-5 flex items-start gap-3 p-4 rounded-xl bg-blood/10 border border-blood/30">
                  <XCircle size={16} className="mt-0.5 shrink-0 text-blood" />
                  <p className="flex-1 text-sm text-blood break-all">{error}</p>
                  <button
                    type="button"
                    onClick={clearError}
                    className="text-xs text-slate-400 hover:text-white uppercase tracking-wider"
                  >
                    Скрыть
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!gamePath && phase !== 'ready' && (
            <div className="mx-8 mt-5 flex items-center justify-between gap-3 p-4 rounded-xl bg-gold/10 border border-gold/30">
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <FolderOpen size={16} className="shrink-0 text-gold" />
                Папка установки не задана
              </span>
              <VRButton variant="ghost" onClick={() => setSettingsOpen(true)}>
                Выбрать
              </VRButton>
            </div>
          )}

          {manifest && (
            <div className="grid grid-cols-2 gap-4 p-8">
              <section className="glass rounded-2xl p-4 min-h-0">
                <h2 className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-bold mb-3 flex items-center gap-2">
                  <Package size={12} />
                  Файлы обновления
                  {pendingFiles.length > 0 && (
                    <span className="ml-auto text-gold">{pendingFiles.length}</span>
                  )}
                </h2>
                <div className="max-h-[280px] overflow-y-auto vr-scroll space-y-2 pr-1">
                  {pendingFiles.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-emerald py-4">
                      <CheckCircle2 size={14} />
                      Все файлы актуальны
                    </div>
                  ) : (
                    pendingFiles.slice(0, 50).map((file) => {
                      const percent = filePercents[file.path] ?? 0;
                      return (
                        <div key={file.path} className="text-xs">
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <span className="truncate font-mono text-slate-300">
                              {file.path}
                            </span>
                            <span className="shrink-0 text-[10px] text-slate-500 font-mono">
                              {formatBytes(file.size)}
                            </span>
                          </div>
                          <div className="h-1 rounded-full bg-black/40 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-gold to-[#ffd479] transition-[width] duration-300"
                              style={{ width: percent + '%' }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                  {pendingFiles.length > 50 && (
                    <div className="text-[10px] text-slate-600 text-center py-2 font-mono">
                      ...и ещё {pendingFiles.length - 50} файлов
                    </div>
                  )}
                </div>
              </section>

              <section className="glass rounded-2xl p-4 min-h-0">
                <h2 className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-bold mb-3 flex items-center gap-2">
                  <FileCheck size={12} />
                  Журнал
                </h2>
                <div className="max-h-[280px] overflow-y-auto vr-scroll pr-1">
                  <ul className="space-y-0.5 font-mono text-[10px] leading-relaxed">
                    {log.slice(-50).map((line, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-slate-600 shrink-0">{'[' + line.time + ']'}</span>
                        <span
                          className={
                            line.text.startsWith('ERROR') || line.text.startsWith('FAIL')
                              ? 'text-blood'
                              : line.text.startsWith('OK')
                                ? 'text-emerald'
                                : 'text-slate-400'
                          }
                        >
                          {line.text}
                        </span>
                      </li>
                    ))}
                    {log.length === 0 && (
                      <li className="text-slate-600">Пусто</li>
                    )}
                  </ul>
                </div>
              </section>
            </div>
          )}

          {phase === 'ready' && (
            <div className="px-8 pb-8">
              <div className="flex items-center gap-3 p-5 rounded-2xl bg-emerald/10 border border-emerald/30">
                <CheckCircle2 size={24} className="text-emerald shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald">Всё готово</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Можно заходить в игру
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="px-8 pb-8 flex items-center justify-between gap-3">
            <div className="text-[10px] text-slate-600 font-mono">
              {(manifest?.files.length ?? 0) + ' файлов в манифесте'}
            </div>
            <div className="flex gap-2">
              {phase === 'downloading' && (
                <button
                  type="button"
                  onClick={() => void cancelInstall()}
                  className="px-4 py-3 rounded-xl border border-blood/40 text-blood text-xs font-bold uppercase tracking-[0.15em] hover:bg-blood/10 transition-all flex items-center gap-2"
                >
                  <XCircle size={14} />
                  Отмена
                </button>
              )}
              {(phase === 'needs-install' || phase === 'needs-update') && (
                <button
                  type="button"
                  onClick={() => void startInstall()}
                  disabled={!gamePath || !manifest}
                  className="px-6 py-3 rounded-xl bg-gold text-abyss text-xs font-bold uppercase tracking-[0.15em] hover:shadow-glow-gold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Download size={14} />
                  {phase === 'needs-install' ? 'Установить' : 'Обновить'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function PhaseIcon({ phase }: { phase: string }) {
  const baseClass =
    'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border';

  if (phase === 'checking') {
    return (
      <div className={baseClass + ' bg-blizzard/10 border-blizzard/30 text-blizzard'}>
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }
  if (phase === 'downloading') {
    return (
      <div className={baseClass + ' bg-blizzard/10 border-blizzard/30 text-blizzard'}>
        <Download size={24} />
      </div>
    );
  }
  if (phase === 'ready') {
    return (
      <div className={baseClass + ' bg-emerald/10 border-emerald/30 text-emerald'}>
        <CheckCircle2 size={24} />
      </div>
    );
  }
  if (phase === 'error') {
    return (
      <div className={baseClass + ' bg-blood/10 border-blood/30 text-blood'}>
        <XCircle size={24} />
      </div>
    );
  }
  if (phase === 'needs-update') {
    return (
      <div className={baseClass + ' bg-gold/10 border-gold/30 text-gold'}>
        <RefreshCw size={24} />
      </div>
    );
  }
  return (
    <div className={baseClass + ' bg-gold/10 border-gold/30 text-gold'}>
      <Download size={24} />
    </div>
  );
}
