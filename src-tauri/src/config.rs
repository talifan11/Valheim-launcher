//! ============================================================
//! Работа с конфигурацией: %APPDATA%/ValheimRouge/config.json (п. 3.5 ТЗ)
//! Никаких unwrap() в путях и IO — всё через Result<String>, чтобы
//! фронтенд получал человекочитаемое сообщение об ошибке.
//! ============================================================

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Структура конфига. Поля snake_case — синхронно с TS-интерфейсом
/// LauncherConfig во фронтенде (src/types.ts).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Путь к папке с игрой
    #[serde(default)]
    pub game_path: String,
    /// Адрес выделенного сервера host:port
    #[serde(default = "default_server_address")]
    pub server_address: String,
    /// Имя пользователя (заглушка авторизации)
    #[serde(default)]
    pub username: String,
    /// Тема интерфейса ('dark')
    #[serde(default = "default_theme")]
    pub theme: String,
}

/// Значение сервера по умолчанию — наш playit.gg туннель
fn default_server_address() -> String {
    "pgsql-louisville.tun.ply.gg:21589".to_string()
}

fn default_theme() -> String {
    "dark".to_string()
}

impl Default for Config {
    fn default() -> Self {
        Self {
            game_path: String::new(),
            server_address: default_server_address(),
            username: String::new(),
            theme: default_theme(),
        }
    }
}

/// Каталог %APPDATA%/ValheimRouge (Windows) — ровно как требует п. 3.5 ТЗ.
/// В Tauri v2 app_data_dir() указывает на %APPDATA%\\<identifier>, поэтому
/// базовую %APPDATA% берём из config_dir(), а последним сегментом ставим имя
/// «ValheimRouge». На Linux/macOS получается ~/.config/ValheimRouge.
#[allow(dead_code)]
fn config_dir(_app: &tauri::AppHandle) -> Result<PathBuf, String> {
    use tauri::Manager;
    // path().config_dir() возвращает Result — корректно прокидываем ошибку вверх
    let base = _app
        .path()
        .config_dir()
        .map_err(|e| format!("Не удалось определить папку данных приложения: {e}"))?;
    // На Windows config_dir() == %APPDATA%\<identifier>; поднимаемся на уровень
    // %APPDATA% и собираем нужный нам каталог ValheimRouge.
    let roaming = base
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or(base);
    Ok(roaming.join("ValheimRouge"))
}

/// Полный путь к config.json
fn config_file(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(config_dir(app)?.join("config.json"))
}

/// Прочитать конфиг с диска. Если файла нет или он повреждён —
/// отдаём дефолтный конфиг (лаунчер должен запускаться «из коробки»).
pub fn read_config(app: &tauri::AppHandle) -> Result<Config, String> {
    let path = config_file(app)?;
    if !path.exists() {
        return Ok(Config::default());
    }
    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("Не удалось прочитать {}: {e}", path.display()))?;
    // Повреждённый JSON не должен ронять лаунчер — молча возвращаем дефолт,
    // но пишем предупреждение в логи сборки.
    match serde_json::from_str::<Config>(&raw) {
        Ok(cfg) => Ok(cfg),
        Err(e) => {
            eprintln!("config.json повреждён ({e}), использую значения по умолчанию");
            Ok(Config::default())
        }
    }
}

/// Сохранить конфиг на диск, при необходимости создав директорию.
/// Пишем pretty-JSON — чтобы человеку было удобно править файл руками.
pub fn write_config(app: &tauri::AppHandle, config: &Config) -> Result<(), String> {
    let dir = config_dir(app)?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Не удалось создать папку {}: {e}", dir.display()))?;
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Не удалось сериализовать конфиг: {e}"))?;
    let path = dir.join("config.json");
    fs::write(&path, json).map_err(|e| format!("Не удалось записать {}: {e}", path.display()))
}
