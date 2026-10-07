// API-слой: тонкая обёртка над Tauri invoke().
// Все вызовы Rust-команд идут только отсюда — компонентам удобнее
// работать с типизированными функциями, чем с «сырым» invoke.
import { invoke } from '@tauri-apps/api/core';
import type { LauncherConfig } from '../types';

/** Прочитать конфигурацию лаунчера (Rust-команда get_config) */
export function getConfig(): Promise<LauncherConfig> {
  return invoke<LauncherConfig>('get_config');
}

/** Сохранить конфигурацию целиком (Rust-команда set_config) */
export function setConfig(config: LauncherConfig): Promise<void> {
  return invoke('set_config', { config });
}

/** Проверить, существует ли valheim.exe по указанному пути (Rust-команда check_game_path) */
export function checkGamePath(gamePath: string): Promise<boolean> {
  return invoke<boolean>('check_game_path', { gamePath });
}

/** Запустить игру; бэкенд сам сворачивает окно лаунчера (Rust-команда launch_game) */
export function launchGame(gamePath: string): Promise<string> {
  return invoke<string>('launch_game', { gamePath });
}

/** Открыть системный диалог выбора папки с игрой (plugin: dialog) */
export async function pickFolder(): Promise<string | null> {
  // Диалог доступен только внутри Tauri; в браузерной разработке его нет.
  if (!isTauri()) return null;
  const { open } = await import('@tauri-apps/plugin-dialog');
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Выберите папку с Valheim',
  });
  return typeof selected === 'string' ? selected : null;
}

// Слой установки и обновления файлов игры (Rust-модуль network.rs).
// Базовый URL раздачи — статика на сервере владельца.

/** Базовый URL каталога раздачи (совпадает с BASE_URL в Rust) */
export const UPDATE_BASE_URL = 'http://62.217.178.72/valheim';

/** Описание файла в манифесте версии */
export interface ManifestFile {
  path: string;
  sha256: string;
  size: number;
  url: string;
}

/** Манифест: версия, дата, файлы и список изменений */
export interface Manifest {
  version: string;
  updated: string;
  files: ManifestFile[];
  changelog: string[];
}

/** Статус локальной копии файла: OK / MISSING / OUTDATED / ERROR */
export type FileStatusKind = 'OK' | 'MISSING' | 'OUTDATED' | 'ERROR';

export interface FileStatus {
  path: string;
  status: FileStatusKind;
  size: number;
}

/** Payload события download-progress из Rust */
export interface DownloadProgressPayload {
  file: string;
  percent: number;
  speed_mbps: number;
  done: boolean;
  error: string | null;
}

/** Итог пакетного скачивания */
export interface BatchResult {
  ok: number;
  failed: string[];
  total: number;
}

/** Скачать и распарсить manifest.json с сервера обновлений */
export function fetchManifest(url: string): Promise<Manifest> {
  return invoke<Manifest>('fetch_manifest', { url });
}

/** Проверить наличие/размер/SHA-256 файлов манифеста в папке установки */
export function checkFiles(manifest: Manifest, installDir: string): Promise<FileStatus[]> {
  return invoke<FileStatus[]>('check_files', { manifest, installDir });
}

/** Пакетное скачивание: не более трёх файлов одновременно, прогресс через события */
export function downloadBatch(items: Array<[string, string, string]>): Promise<BatchResult> {
  return invoke<BatchResult>('download_batch', { items });
}

/** Отменить активную загрузку */
export function cancelDownload(): Promise<void> {
  return invoke('cancel_download');
}

/** Версия, установленная локально (из installed.json); "0.0.0" если файла нет */
export function getInstalledVersion(): Promise<string> {
  return invoke<string>('get_installed_version');
}

/** Запомнить установленную версию в installed.json */
export function setInstalledVersion(version: string): Promise<void> {
  return invoke('set_installed_version', { version });
}

/** Подписаться на событие download-progress; возвращает функцию отписки */
export async function listenDownloadProgress(
  handler: (payload: DownloadProgressPayload) => void
): Promise<() => void> {
  if (!isTauri()) return () => undefined;
  const { listen } = await import('@tauri-apps/api/event');
  const unlisten = await listen<DownloadProgressPayload>('download-progress', (event) => {
    handler(event.payload);
  });
  return unlisten;
}

/** Открыть папку/ссылку системным способом (shell plugin, разрешён shell:allow-open) */
export async function openInShell(target: string): Promise<void> {
  if (!isTauri()) return;
  const { open } = await import('@tauri-apps/plugin-shell');
  await open(target);
}

/** Копирование в буфер обмена: через Clipboard API браузера/WebView */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/** Мини-хелпер: определяем, запущено ли приложение внутри Tauri */
export function isTauri(): boolean {
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
}
