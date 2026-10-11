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
  avatar_url?: string | null;
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
  avatar_url?: string | null;
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
  from_avatar_url?: string | null;
}

const API_BASE = 'http://62.217.178.72/api';

/** Origin для картинок (без /api) */
export const API_ORIGIN = 'http://62.217.178.72';

/** Превратить относительный /avatars/x.png в полный URL */
export function resolveAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_ORIGIN}${url}`;
}

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

/** Получить общий чат (последние 100 сообщений) */
export async function getGeneralMessages(token: string): Promise<RemoteMessage[]> {
  const res = await fetch(`${API_BASE}/general/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return res.json();
}

/** Отправить сообщение в общий чат */
export async function sendGeneralMessage(text: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/general/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Ошибка' }));
    throw new Error(data.detail || `Ошибка: ${res.status}`);
  }
}


/** Загрузить свою аватарку (multipart) — возвращает относительный URL */
export async function uploadAvatar(file: File, token: string): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/profile/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Ошибка загрузки' }));
    throw new Error(data.detail || `Ошибка: ${res.status}`);
  }
  const data = await res.json();
  return data.avatar_url as string;
}

/** Удалить свою аватарку (сбросить на SVG) */
export async function deleteAvatar(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/profile/avatar`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
}


// ============================================================
// ФОРУМ
// ============================================================

export interface ForumCategory {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  thread_count: number;
}

export interface ForumRank {
  name: string;
  rune: string;
  tier: 'jarl' | 'legend' | 'viking' | 'novice';
}

export interface ForumAuthor {
  user_id: number;
  username: string;
  avatar_url?: string | null;
  reputation: number;
  rank: ForumRank;
}

export interface ForumThreadPreview {
  id: number;
  title: string;
  body_preview: string;
  created_at: string;
  updated_at: string;
  pinned: boolean;
  locked: boolean;
  views: number;
  author: ForumAuthor;
  category: { id: number; slug: string; title: string };
  reply_count: number;
  tags: string[];
}

export interface ForumPost {
  id: number;
  body: string;
  created_at: string;
  author: ForumAuthor;
}

export interface ForumThreadFull {
  id: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  pinned: boolean;
  locked: boolean;
  views: number;
  author: ForumAuthor;
  category: { id: number; slug: string; title: string };
  posts: ForumPost[];
  tags: string[];
}

export async function getForumCategories(token: string): Promise<ForumCategory[]> {
  const res = await fetch(`${API_BASE}/forum/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Ошибка категорий: ${res.status}`);
  return res.json();
}

export async function getForumThreads(token: string, categorySlug?: string | null): Promise<ForumThreadPreview[]> {
  const q = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : '';
  const res = await fetch(`${API_BASE}/forum/threads${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Ошибка тредов: ${res.status}`);
  return res.json();
}

export async function getForumThread(token: string, threadId: number): Promise<ForumThreadFull> {
  const res = await fetch(`${API_BASE}/forum/threads/${threadId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Ошибка треда: ${res.status}`);
  return res.json();
}

export async function createForumThread(
  token: string,
  categoryId: number,
  title: string,
  body: string,
): Promise<{ status: string; thread_id: number }> {
  const res = await fetch(`${API_BASE}/forum/threads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category_id: categoryId, title, body }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Ошибка' }));
    throw new Error(data.detail || `Ошибка: ${res.status}`);
  }
  return res.json();
}

export async function createForumPost(token: string, threadId: number, body: string): Promise<void> {
  const res = await fetch(`${API_BASE}/forum/threads/${threadId}/posts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Ошибка' }));
    throw new Error(data.detail || `Ошибка: ${res.status}`);
  }
}


export interface ForumStats {
  threads: number;
  posts: number;
  users: number;
  online: number;
}

export interface ForumTopAuthor {
  user_id: number;
  username: string;
  avatar_url?: string | null;
  post_count: number;
  thread_count: number;
  reputation: number;
  rank: ForumRank;
}

export async function getForumStats(token: string): Promise<ForumStats> {
  const res = await fetch(`${API_BASE}/forum/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Ошибка статистики: ${res.status}`);
  return res.json();
}

export async function getForumTopAuthors(token: string, limit = 5): Promise<ForumTopAuthor[]> {
  const res = await fetch(`${API_BASE}/forum/authors/top?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Ошибка топ-авторов: ${res.status}`);
  return res.json();
}


// ============================================================
// НОВОСТИ (публичные)
// ============================================================

export interface ApiNewsItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  tag: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  pinned: boolean;
  author: { username: string; avatarUrl: string | null } | null;
}

export async function getNews(): Promise<ApiNewsItem[]> {
  const res = await fetch(`${API_BASE}/news`);
  if (!res.ok) throw new Error(`Ошибка новостей: ${res.status}`);
  return res.json();
}


// CHANGELOG
export interface ApiChangelogEntry {
  id: number;
  version: string | null;
  title: string;
  body: string;
  category: string;
  created_at: string;
  author: { username: string; avatar_url: string | null } | null;
}

export async function getChangelog(): Promise<ApiChangelogEntry[]> {
  const res = await fetch(`${API_BASE}/changelog`);
  if (!res.ok) throw new Error(`Ошибка changelog: ${res.status}`);
  return res.json();
}
