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

/** Копирование в буфер обмена: через Clipboard API браузера/WebView */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/** Мини-хелпер: определяем, запущено ли приложение внутри Tauri */
export function isTauri(): boolean {
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
}
