// Экран установки/обновления файлов игры. Только разметка: все данные и
// действия берутся из useUpdateStore (бизнес-логика не в компонентах).
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Loader2, Package, RefreshCw, Server, XCircle } from 'lucide-react';
import { VRButton } from '../components/ui';
import { formatBytes, formatEtaClock, useUpdateStore } from '../store/useUpdateStore';
import { useLauncherStore } from '../store/useLauncherStore';

const PHASE_TITLE: Record<string, string> = {
  checking: 'Проверка файлов',
  'needs-install': 'Требуется установка',
  'needs-update': 'Доступно обновление',
  downloading: 'Скачивание',
  unpacking: 'Распаковка архивов',
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
  const runCheck = useUpdateStore((s) => s.runCheck);
  const startInstall = useUpdateStore((s) => s.startInstall);
  const cancelInstall = useUpdateStore((s) => s.cancelInstall);
  const clearError = useUpdateStore((s) => s.clearError);

  const setSettingsOpen = useLauncherStore((s) => s.setSettingsOpen);
  const gamePath = useLauncherStore((s) => s.config.game_path);

  // Автозапуск проверки при открытии экрана
  useEffect(() => {
    if (phase === 'idle') void runCheck();
  }, [phase, runCheck]);

  const pendingFiles =
    manifest?.files.filter(
      (file) => statuses.find((s) => s.path === file.path)?.status !== 'OK'
    ) ?? [];

  const busyPhase = phase === 'downloading' || phase === 'unpacking';

  return (
    <div className="flex h-full flex-col gap-4 px-8 py-6">
      {/* Заголовок фазы */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-blizzard/30 bg-blizzard/10 text-blizzard">
            <Download size={20} />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold text-white">
              {PHASE_TITLE[phase] ?? phase}
            </h1>
            <p className="text-xs text-slate-500">
              {manifest
                ? `Версия на сервере: ${manifest.version}`
                : 'Манифест ещё не загружен'}
            </p>
          </div>
        </div>
        {!busyPhase && (
          <VRButton variant="ghost" onClick={() => void runCheck(true)}>
            <RefreshCw size={15} />
            Проверить снова
          </VRButton>
        )}
      </div>

      {/* Предупреждение о непустой папке установки */}
      {!gamePath && phase !== 'ready' && (
        <div className="vr-glass flex items-center justify-between gap-3 rounded-lg p-4 text-sm text-slate-300">
          <span className="flex items-center gap-2">
            <Server size={16} className="shrink-0 text-gold" />
            Папка установки не задана — файлы скачивать некуда.
          </span>
          <VRButton variant="ghost" onClick={() => setSettingsOpen(true)}>
            Выбрать папку
          </VRButton>
        </div>
      )}

      {/* Ошибка проверки */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="vr-glass flex items-start gap-3 overflow-hidden rounded-lg border-blood/30 p-4"
          >
            <XCircle size={16} className="mt-0.5 shrink-0 text-blood" />
            <p className="min-w-0 flex-1 break-all text-sm text-blood">{error}</p>
            <button
              type="button"
              onClick={clearError}
              className="text-xs uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer"
            >
              Скрыть
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Прогресс-бар и метрики активной загрузки */}
      {phase === 'downloading' && (
        <div className="vr-glass vr-side-block">
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span className="truncate font-mono text-slate-300">
              {currentFile
                ? `Скачивание ${currentFile}… ${overallPercent.toFixed(1)}%`
                : 'Ожидание данных…'}
            </span>
            <span className="ml-3 shrink-0 font-mono text-xs text-slate-400">
              {speedMbps.toFixed(1)} МБ/с · осталось {formatEtaClock(etaSeconds)}
            </span>
          </div>
          <div className="vr-progress-track">
            <motion.div
              className="vr-progress-fill"
              animate={{ width: `${overallPercent}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <VRButton variant="ghost" onClick={() => void cancelInstall()}>
              <XCircle size={15} />
              Отмена
            </VRButton>
          </div>
        </div>
      )}

      {/* Фаза распаковки: спиннер + сообщение */}
      {phase === 'unpacking' && (
        <div className="vr-glass vr-side-block">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Loader2 size={18} className="animate-spin text-blizzard" />
            <span className="flex items-center gap-2">
              <Package size={16} className="text-gold" />
              Распаковка архивов в папку установки…
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Процесс может занять несколько минут — не закрывайте лаунчер.
          </p>
        </div>
      )}

      {/* Готово: сообщение об актуальности файлов */}
      {phase === 'ready' && (
        <div className="vr-glass vr-side-block flex items-center justify-between">
          <p className="text-sm text-emerald">Все файлы актуальны. Можно играть.</p>
        </div>
      )}

      {/* Два столбца: список файлов + лог */}
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_1fr] gap-4">
        <section className="vr-glass vr-scroll min-h-0 overflow-y-auto p-4">
          <h2 className="vr-side-label">Файлы обновления</h2>
          {pendingFiles.length === 0 ? (
            <p className="text-sm text-slate-500">Нет файлов, требующих загрузки.</p>
          ) : (
            <ul className="space-y-2">
              {pendingFiles.map((file) => {
                const percent = filePercents[file.path] ?? 0;
                return (
                  <li key={file.path} className="text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-mono text-slate-300">
                        {file.path}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {formatBytes(file.size)}
                      </span>
                    </div>
                    <div className="vr-progress-track mt-1 h-1">
                      <div
                        className="vr-progress-fill h-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="vr-glass vr-scroll min-h-0 overflow-y-auto p-4">
          <h2 className="vr-side-label">Журнал</h2>
          <ul className="vr-selectable space-y-1 font-mono text-xs leading-relaxed text-slate-400">
            {log.map((line, index) => (
              <li key={`${line.time}-${index}`}>
                <span className="text-slate-600">[{line.time}]</span>{' '}
                <span
                  className={
                    line.text.startsWith('ERROR') || line.text.startsWith('FAIL')
                      ? 'text-blood'
                      : line.text.startsWith('OK')
                        ? 'text-emerald'
                        : ''
                  }
                >
                  {line.text}
                </span>
              </li>
            ))}
            {log.length === 0 && <li className="text-slate-600">Пусто.</li>}
          </ul>
        </section>
      </div>

      {/* Нижняя панель: запустить установку/обновление */}
      {(phase === 'needs-install' ||
        phase === 'needs-update' ||
        phase === 'error') && (
        <div className="flex justify-end">
          <VRButton
            onClick={() => void startInstall()}
            disabled={!gamePath || !manifest}
          >
            <Download size={16} />
            {phase === 'needs-install' ? 'Установить' : 'Обновить'}
          </VRButton>
        </div>
      )}
    </div>
  );
}