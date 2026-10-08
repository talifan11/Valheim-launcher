// Единый источник адресов и констант для всего фронтенда.

export const APP_NAME = 'Valheim Rouge';
export const LAUNCHER_VERSION = '0.1.0';

// Если true — проверка обновлений пропускается (для дизайн-разработки).
// Перед релизом поставить false.
export const DEV_SKIP_UPDATE = false;

// Игровой сервер (UDP через WireGuard-туннель VPS -> домашний ПК).
export const GAME_SERVER_ADDRESS = '85.198.70.143:2456';

// Статический сервер раздачи файлов игры и манифестов.
export const UPDATE_BASE_URL = 'http://62.217.178.72';
export const MANIFEST_URL = `${UPDATE_BASE_URL}/manifest.json`;

// Интервал автообновления статуса сервера (мс).
export const CONNECTION_REFRESH_MS = 15000;

// Ссылки сообщества.
export const COMMUNITY_LINKS = {
  discord: 'https://discord.gg/valheimrouge',
  telegram: 'https://t.me/valheimrouge',
  github: 'https://github.com/talifan11/Valheim-launcher',
};
