// Состояние установки файлов игры: проверка манифеста, скачивание, распаковка.
// ZIP кешируется в downloads/ — не перекачивается при повторных запусках.

import { create } from 'zustand';
import * as api from '../lib/api';
import type { DownloadProgressPayload, FileStatus, Manifest } from '../lib/api';
import { toast } from './useToastStore';

export type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'needs-install'
  | 'needs-update'
  | 'downloading'
  | 'unpacking'
  | 'ready'
  | 'error';

export interface LogLine {
  time: string;
  text: string;
}

interface UpdateState {
  phase: UpdatePhase;
  manifest: Manifest | null;
  installedVersion: string;
  statuses: FileStatus[];
  filePercents: Record<string, number>;
  overallPercent: number;
  currentFile: string;
  speedMbps: number;
  etaSeconds: number | null;
  log: LogLine[];
  error: string | null;
  busy: boolean;

  runCheck: (force?: boolean) => Promise<void>;
  startInstall: () => Promise<void>;
  cancelInstall: () => Promise<void>;
  handleProgress: (payload: DownloadProgressPayload) => void;
  clearError: () => void;
}

let progressUnlisten: (() => void) | null = null;
let queueTotalBytes = 0;

function nowStamp(): string {
  return new Date().toLocaleTimeString('ru-RU', { hour12: false });
}

function formatEta(remainingBytes: number, speedMbps: number): number | null {
  if (speedMbps <= 0.01 || remainingBytes <= 0) return null;
  return Math.round(remainingBytes / (speedMbps * 1024 * 1024));
}

function baseName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} ГБ`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  return `${Math.round(bytes / 1024)} КБ`;
}

export function formatEtaClock(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function pushLine(log: LogLine[], text: string): LogLine[] {
  const next = [...log, { time: nowStamp(), text }];
  return next.length > 200 ? next.slice(next.length - 200) : next;
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

  runCheck: async (_force = false) => {
    if (get().busy || get().phase === 'downloading' || get().phase === 'unpacking') return;
    set({ busy: true, phase: 'checking', error: null });

    try {
      if (!api.isTauri()) {
        set({ phase: 'ready', busy: false });
        return;
      }

      const manifest = await api.fetchManifest(`${api.UPDATE_BASE_URL}/manifest.json`);
      const installedVersion = await api.getInstalledVersion();

      // Если версии совпадают — сразу ready, ничего не проверяем и не качаем.
      if (manifest.version === installedVersion) {
        set({
          phase: 'ready',
          manifest,
          installedVersion,
          statuses: [],
          busy: false,
          log: pushLine(get().log, `Версия ${manifest.version} актуальна`),
        });
        return;
      }

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
        phase:
          pending.length > 0
            ? installedVersion === '0.0.0'
              ? 'needs-install'
              : 'needs-update'
            : 'ready',
        overallPercent: pending.length > 0 ? 0 : 100,
      });

      if (pending.length === 0 && manifest.version !== installedVersion) {
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
    if (!manifest || busy || phase === 'downloading' || phase === 'unpacking') return;

    const config = await api.getConfig();
    const installDir = config.game_path.trim();
    if (!installDir) {
      toast.error('Сначала укажите папку установки в настройках');
      return;
    }

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

    // Проверяем кеш: что уже лежит в downloads/ и совпадает по хешу.
    const filesToDownload: typeof needDownload = [];
    const cachedFiles: typeof needDownload = [];
    for (const file of needDownload) {
      try {
        const cached = await api.checkCachedZip(file.path, file.sha256);
        if (cached) {
          cachedFiles.push(file);
        } else {
          filesToDownload.push(file);
        }
      } catch {
        filesToDownload.push(file);
      }
    }

    set({
      phase: 'downloading',
      busy: true,
      error: null,
      filePercents: {},
      overallPercent: 0,
      currentFile: filesToDownload[0]?.path ?? 'Распаковка из кеша...',
      speedMbps: 0,
      etaSeconds: null,
      log: pushLine(
        get().log,
        cachedFiles.length > 0
          ? `В кеше: ${cachedFiles.length}, скачать: ${filesToDownload.length}`
          : `Начало загрузки: ${needDownload.length} файлов`
      ),
    });

    const totalBytes = filesToDownload.reduce((sum, f) => sum + f.size, 0);
    queueTotalBytes = totalBytes;

    // Если всё уже в кеше — сразу распаковываем.
    if (filesToDownload.length === 0) {
      await runUnpack(set, get, needDownload, installDir, manifest.version);
      return;
    }

    if (!progressUnlisten) {
      progressUnlisten = await api.listenDownloadProgress((payload) =>
        get().handleProgress(payload)
      );
    }

    const items: Array<[string, string, string]> = [];
    const cachePaths: Record<string, string> = {};
    try {
      for (const file of filesToDownload) {
        const cachePath = await api.resolveDownloadPath(file.path);
        cachePaths[file.path] = cachePath;
        items.push([file.url, cachePath, file.sha256]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({
        phase: 'error',
        busy: false,
        error: message,
        log: pushLine(get().log, `ERROR: ${message}`),
      });
      toast.error('Не удалось подготовить пути загрузки');
      if (progressUnlisten) {
        progressUnlisten();
        progressUnlisten = null;
      }
      return;
    }

    try {
      const result = await api.downloadBatch(items);
      const done = result.ok >= result.total;
      if (!done) {
        set({
          phase: 'needs-update',
          busy: false,
          error: `Загрузка завершилась частично: ${result.failed.length} файлов с ошибкой`,
          log: pushLine(get().log, `FAIL: ${result.failed.join(', ')}`),
        });
        toast.error('Часть файлов не удалось скачать. Попробуйте снова.');
        return;
      }

      await runUnpack(set, get, needDownload, installDir, manifest.version);
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
    const entry = manifest.files.find(
      (f) => baseName(f.path) === fileName || f.path === payload.file
    );
    const key = entry?.path ?? fileName;

    const filePercents = { ...state.filePercents, [key]: Math.round(payload.percent) };

    const queue = manifest.files.filter((f) =>
      state.statuses.some((s) => s.path === f.path && s.status !== 'OK')
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

// Распаковка всех архивов + запись версии.
async function runUnpack(
  set: (partial: Partial<UpdateState> | ((s: UpdateState) => Partial<UpdateState>)) => void,
  get: () => UpdateState,
  files: Array<{ path: string; url: string; sha256: string; size: number }>,
  installDir: string,
  version: string
): Promise<void> {
  set({
    phase: 'unpacking',
    currentFile: 'Распаковка...',
    log: pushLine(get().log, 'Распаковка архивов...'),
  });

  let totalFiles = 0;
  try {
    for (const file of files) {
      const cachePath = await api.resolveDownloadPath(file.path);
      try {
        const count = await api.unpackZip(cachePath, installDir);
        totalFiles += count;
        set({
          log: pushLine(get().log, `OK: распакован ${file.path} (${count} файлов)`),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        set({
          phase: 'error',
          busy: false,
          error: `Ошибка распаковки ${file.path}: ${message}`,
          log: pushLine(get().log, `ERROR: распаковка ${file.path}: ${message}`),
        });
        toast.error(`Не удалось распаковать ${file.path}`);
        return;
      }
    }

    await api.setInstalledVersion(version);
    set({
      phase: 'ready',
      installedVersion: version,
      overallPercent: 100,
      busy: false,
      currentFile: '',
      log: pushLine(get().log, `Установка завершена: ${totalFiles} файлов, версия ${version}`),
    });
    toast.success(`Версия ${version} установлена`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    set({
      phase: 'error',
      busy: false,
      error: message,
      log: pushLine(get().log, `ERROR: ${message}`),
    });
  }
}
