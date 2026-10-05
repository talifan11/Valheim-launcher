// Типы конфигурации лаунчера — зеркалят структуру Rust-структуры Config (src-tauri/src/config.rs).
// Держим их синхронно, чтобы serde корректно сериализовал JSON между бэкендом и фронтендом.

export interface LauncherConfig {
  /** Путь к папке с игрой (в ней ищем valheim.exe) */
  game_path: string;
  /** Адрес выделенного сервера, например pgsql-louisville.tun.ply.gg:21589 */
  server_address: string;
  /** Имя пользователя (заглушка авторизации) */
  username: string;
  /** Тема интерфейса: пока поддерживается только 'dark' */
  theme: 'dark';
}

/** Конфиг по умолчанию — используется, если config.json отсутствует или повреждён */
export const DEFAULT_CONFIG: LauncherConfig = {
  game_path: '',
  server_address: 'pgsql-louisville.tun.ply.gg:21589',
  username: '',
  theme: 'dark',
};
