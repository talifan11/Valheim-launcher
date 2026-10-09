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
export const UPDATE_BASE_URL = 'http://62.217.178.72';

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

/** Проверить, есть ли ZIP с правильным хешем в кеше загрузок */
export function checkCachedZip(relPath: string, expectedSha256: string): Promise<boolean> {
  return invoke<boolean>('check_cached_zip', { relPath, expectedSha256 });
}

/** Получить путь, куда качать файл из манифеста (кэш downloads/). */
export function resolveDownloadPath(relPath: string): Promise<string> {
  return invoke<string>('resolve_download_path', { relPath });
}

/** Распаковать ZIP-архив в целевую папку. Возвращает число файлов. */
export function unpackZip(zipPath: string, destDir: string): Promise<number> {
  return invoke<number>('unpack_zip', { zipPath, destDir });
}

/** Открыть папку в системном проводнике (через нативную Rust-команду). */
export function openFolder(path: string): Promise<void> {
  return invoke('open_folder', { path });
}

// === АУТЕНТИФИКАЦИЯ ===

export interface AuthResponse {
  token: string;
  user_id: number;
  email: string;
  username: string;
}

export function registerUser(
  email: string,
  password: string,
  username: string
): Promise<AuthResponse> {
  return invoke<AuthResponse>('register_user', { email, password, username });
}

export function loginUser(email: string, password: string): Promise<AuthResponse> {
  return invoke<AuthResponse>('login_user', { email, password });
}

export interface CheckProgressPayload {
  checked: number;
  total: number;
  current: string;
}

/** Подписаться на событие check-progress из Rust (проверка файлов) */
export async function listenCheckProgress(
  handler: (payload: CheckProgressPayload) => void
): Promise<() => void> {
  if (!isTauri()) return () => undefined;
  const { listen } = await import('@tauri-apps/api/event');
  const unlisten = await listen<CheckProgressPayload>('check-progress', (event) => {
    handler(event.payload);
  });
  return unlisten;
}

// ============================================================
// ДРУЗЬЯ И СООБЩЕНИЯ (через HTTP API на VPS)
// ============================================================

export interface UserSearchResult {
  user_id: number;
  username: string;
  online?: boolean;
}

export interface FriendsListResponse {
  friends: UserSearchResult[];
  incoming: UserSearchResult[];
  outgoing: UserSearchResult[];
}

export interface RemoteMessage {
  id: number;
  from_user_id: number;
  to_user_id: number;
  text: string;
  created_at: string;
  from_username: string;
  own: boolean;
}

const API_BASE = 'http://62.217.178.72/api';

/** Поиск игроков по имени */
export async function searchUsers(query: string, token: string): Promise<UserSearchResult[]> {
  const url = `${API_BASE}/users/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Ошибка поиска: ${res.status}`);
  return res.json();
}

/** Список друзей + входящие + исходящие заявки */
export async function getFriends(token: string): Promise<FriendsListResponse> {
  const res = await fetch(`${API_BASE}/friends`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Ошибка друзей: ${res.status}`);
  return res.json();
}

/** Отправить заявку в друзья */
export async function sendFriendRequest(toUserId: number, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/friends/request`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to_user_id: toUserId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Ошибка' }));
    throw new Error(data.detail || `Ошибка: ${res.status}`);
  }
}

/** Принять заявку */
export async function acceptFriendRequest(fromUserId: number, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/friends/accept`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from_user_id: fromUserId }),
  });
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
}

/** Отклонить заявку */
export async function rejectFriendRequest(fromUserId: number, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/friends/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from_user_id: fromUserId }),
  });
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
}

/** Удалить друга */
export async function removeFriend(otherUserId: number, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/friends/remove`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from_user_id: otherUserId }),
  });
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
}

/** Получить переписку с игроком */
export async function getMessages(otherUserId: number, token: string): Promise<RemoteMessage[]> {
  const res = await fetch(`${API_BASE}/messages/${otherUserId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Ошибка сообщений: ${res.status}`);
  return res.json();
}

/** Отправить сообщение */
export async function sendMessage(toUserId: number, text: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to_user_id: toUserId, text }),
  });
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
}

/** Количество непрочитанных */
export async function getUnreadCount(token: string): Promise<number> {
  const res = await fetch(`${API_BASE}/messages/unread/count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? 0;
}

/** Отправить heartbeat — сообщить серверу что мы онлайн */
export async function sendHeartbeat(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/heartbeat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.warn('Heartbeat не отправлен:', err);
  }
}

/** Получить список ID игроков, которые сейчас онлайн */
export async function getOnlineUserIds(token: string): Promise<number[]> {
  try {
    const res = await fetch(`${API_BASE}/users/online`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
