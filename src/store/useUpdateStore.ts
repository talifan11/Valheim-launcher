// Состояние установки файлов игры: проверка манифеста, скачивание, прогресс.
// Вся бизнес-логика обновления живёт здесь; InstallScreen только рисует данные.
import { create } from 'zustand';
import * as api from '../lib/api';
import type { DownloadProgressPayload, FileStatus, Manifest } from '../lib/api';
import { toast } from './useToastStore';

/** Фаза жизненного цикла установки */
export type UpdatePhase =
  | 'idle' // ещё не проверяли
  | 'checking' // читаем манифест и хеши локальных файлов
  | 'needs-install' // файлы отсутствуют — нужна полная установка
  | 'needs-update' // версия на сервере новее / файлы устарели
  | 'downloading' // идёт скачивание
  | 'ready' // всё актуально, можно играть
  | 'error'; // сетевой или дисковый сбой

export interface LogLine {
  time: string;
  text: string;
}

interface UpdateState {
  phase: UpdatePhase;
  manifest: Manifest | null;
  installedVersion: string;
  statuses: FileStatus[];
  /** Процент завершения каждого файла очереди, ключ — путь из манифеста */
  filePercents: Record<string, number>;
  /** Суммарный процент по байтам всех файлов в очереди */
  overallPercent: number;
  currentFile: string;
  speedMbps: number;
  etaSeconds: number | null;
  log: LogLine[];
  error: string | null;
  /** Флаг активной операции — блокирует повторные запуски проверки */
  busy: boolean;

  /** Полная проверка: манифест -> сравнение версии -> хеши файлов */
  runCheck: (force?: boolean) => Promise<void>;
  /** Скачать недостающие/устаревшие файлы (параллельно, до 3 потоков) */
  startInstall: () => Promise<void>;
  /** Отменить активную загрузку */
  cancelInstall: () => Promise<void>;
  /** Обработчик события download-progress из Rust */
  handleProgress: (payload: DownloadProgressPayload) => void;
  clearError: () => void;
}

let progressUnlisten: (() => void) | null = null;

/** Полный размер очереди загрузки в байтах (для расчёта ETA) */
let queueTotalBytes = 0;

/** Текущее время для строк лога */
function nowStamp(): string {
  return new Date().toLocaleTimeString('ru-RU', { hour12: false });
}

/** Оценка оставшегося времени в секундах */
function formatEta(remainingBytes: number, speedMbps: number): number | null {
  if (speedMbps <= 0.01 || remainingBytes <= 0) return null;
  return Math.round(remainingBytes / (speedMbps * 1024 * 1024));
}

/** Имя файла из пути или payload для отображения */
function baseName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

/** Читаемый формат объёма в байтах */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} ГБ`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  return `${Math.round(bytes / 1024)} КБ`;
}

/** Секунды в "мм:сс" или "чч:мм:сс" */
export function formatEtaClock(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  phase: 'idle',
  manifest: null,
  installedVersion: '0.0.0',
  statuses: [],
  filePercents: {},
  overallPercent: 0,
  currentFile: '',
  speedMbps: 0,
  etaSeconds: null,
  log: [],
  error: null,
  busy: false,

  clearError: () => set({ error: null }),

  runCheck: async (force = false) => {
    if (get().busy || get().phase === 'downloading') return;
    set({ busy: true, phase: 'checking', error: null });

    try {
      if (!api.isTauri()) {
        // Браузерная разработка: Rust-команд нет, считаем что всё готово.
        set({ phase: 'ready', busy: false });
        return;
      }

      const manifest = await api.fetchManifest(`${api.UPDATE_BASE_URL}/manifest.json`);
      const installedVersion = await api.getInstalledVersion();
      const config = await api.getConfig();
      const installDir = config.game_path.trim();

      if (!installDir) {
        set({
          phase: 'needs-install',
          manifest,
          installedVersion,
          busy: false,
          log: pushLine(get().log, 'Папка установки не задана — укажите её в настройках'),
        });
        return;
      }

      // Совпадение версии без force — пропускаем побайтовую проверку ради скорости.
      if (manifest.version === installedVersion && !force) {
        set({
          phase: 'ready',
          manifest,
          installedVersion,
          statuses: [],
          busy: false,
          log: pushLine(get().log, `Версия ${manifest.version} актуальна, побайтовая проверка пропущена`),
        });
        return;
      }

      const statuses = await api.checkFiles(manifest, installDir);
      const pending = statuses.filter((s) => s.status !== 'OK');
      let nextLog = get().log;
      for (const item of statuses) {
        if (item.status === 'OK') continue;
        nextLog = pushLine(nextLog, `${item.status}: ${item.path}`);
      }

      set({
        manifest,
        installedVersion,
        statuses,
        busy: false,
        log: nextLog,
        phase: pending.length > 0 ? (installedVersion === '0.0.0' ? 'needs-install' : 'needs-update') : 'ready',
        overallPercent: pending.length > 0 ? 0 : 100,
      });

      if (pending.length === 0 && manifest.version !== installedVersion) {
        // Файлы на диске уже соответствуют манифесту — просто обновим метку версии.
        await api.setInstalledVersion(manifest.version);
        set({ installedVersion: manifest.version });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({
        phase: 'error',
        busy: false,
        error: message,
        log: pushLine(get().log, `ERROR: ${message}`),
      });
    }
  },

  startInstall: async () => {
    const { manifest, statuses, phase, busy } = get();
    if (!manifest || busy || phase === 'downloading') return;

    const config = await api.getConfig();
    const installDir = config.game_path.trim();
    if (!installDir) {
      toast.error('Сначала укажите папку установки в настройках');
      return;
    }

    // Качаем MISSING/OUTDATED/ERROR; OK пропускаем.
    const needDownload = manifest.files.filter((file) => {
      const status = statuses.find((s) => s.path === file.path)?.status ?? 'MISSING';
      return status !== 'OK';
    });

    if (needDownload.length === 0) {
      await api.setInstalledVersion(manifest.version);
      set({ installedVersion: manifest.version, phase: 'ready', overallPercent: 100 });
      toast.success('Все файлы уже актуальны');
      return;
    }

    const totalBytes = needDownload.reduce((sum, f) => sum + f.size, 0);
    set({
      phase: 'downloading',
      busy: true,
      error: null,
      filePercents: {},
      overallPercent: 0,
      currentFile: needDownload[0].path,
      speedMbps: 0,
      etaSeconds: null,
      log: pushLine(get().log, `Начало загрузки: ${needDownload.length} файлов`),
    });
    // Общий объём очереди нужен для оценки оставшегося времени в обработчике прогресса.
    queueTotalBytes = totalBytes;

    // Подписка на прогресс один раз на сессию загрузки.
    if (!progressUnlisten) {
      progressUnlisten = await api.listenDownloadProgress((payload) => get().handleProgress(payload));
    }

    const items: Array<[string, string, string]> = needDownload.map((file) => [
      file.url,
      `${installDir}/${file.path}`,
      file.sha256,
    ]);

    try {
      const result = await api.downloadBatch(items);
      const done = result.ok >= result.total;
      if (done) {
        await api.setInstalledVersion(manifest.version);
        set({
          phase: 'ready',
          installedVersion: manifest.version,
          overallPercent: 100,
          busy: false,
          log: pushLine(get().log, `Установка завершена: версия ${manifest.version}`),
        });
        toast.success(`Версия ${manifest.version} установлена`);
      } else {
        set({
          phase: 'needs-update',
          busy: false,
          error: `Загрузка завершилась частично: ${result.failed.length} файлов с ошибкой`,
          log: pushLine(get().log, `FAIL: ${result.failed.join(', ')}`),
        });
        toast.error('Часть файлов не удалось скачать. Попробуйте снова.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({
        phase: 'error',
        busy: false,
        error: message,
        log: pushLine(get().log, `ERROR: ${message}`),
      });
      toast.error('Скачивание прервано');
    } finally {
      if (progressUnlisten) {
        progressUnlisten();
        progressUnlisten = null;
      }
    }
  },

  cancelInstall: async () => {
    try {
      await api.cancelDownload();
      set({
        phase: 'needs-update',
        busy: false,
        currentFile: '',
        speedMbps: 0,
        etaSeconds: null,
        log: pushLine(get().log, 'Загрузка отменена пользователем'),
      });
    } catch (err) {
      console.error('Не удалось отменить загрузку:', err);
    }
  },

  handleProgress: (payload) => {
    const state = get();
    const manifest = state.manifest;
    if (!manifest) return;

    const fileName = baseName(payload.file);
    // Ищем путь файла в манифесте по имени — payload приносит только dest.
    const entry = manifest.files.find((f) => baseName(f.path) === fileName || f.path === payload.file);
    const key = entry?.path ?? fileName;

    // Копируем карту процентов, чтобы zustand увидел изменение ссылки.
    const filePercents = { ...state.filePercents, [key]: Math.round(payload.percent) };

    // Общий процент: средневзвешенное по байтам всех файлов очереди.
    const queue = manifest.files.filter(
      (f) => state.statuses.some((s) => s.path === f.path && s.status !== 'OK')
    );
    let weighted = 0;
    for (const file of queue) {
      weighted += file.size * (filePercents[file.path] ?? 0);
    }
    const overall = queueTotalBytes > 0 ? weighted / queueTotalBytes : payload.percent;

    set({
      filePercents,
      currentFile: payload.done ? '' : fileName,
      speedMbps: payload.speed_mbps,
      overallPercent: payload.done && overall >= 99 ? 100 : Math.min(99.9, overall),
      etaSeconds: payload.done
        ? null
        : formatEta(queueTotalBytes * (1 - overall / 100), payload.speed_mbps),
      log: payload.done
        ? pushLine(
            state.log,
            payload.error ? `ERROR: ${fileName} (${payload.error})` : `OK: ${fileName}`
          )
        : state.log,
    });
  },
}));

/** Добавить строку в лог (максимум 200, старые отсекаются) */
function pushLine(log: LogLine[], text: string): LogLine[] {
  const next = [...log, { time: nowStamp(), text }];
  return next.length > 200 ? next.slice(next.length - 200) : next;
}
